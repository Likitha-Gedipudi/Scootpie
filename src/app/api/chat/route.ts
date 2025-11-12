import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { conversations, messages, users } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { generateOutfitTryOn, type OutfitItem } from '@/services/tryon';
import { GoogleGenAI } from '@google/genai';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  outfitImage?: string;
  products?: OutfitItem[];
  timestamp: string;
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    console.log('[CHAT] Incoming request');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('[CHAT] ===== NEW REQUEST =====');
    console.log('[CHAT] Raw body keys:', Object.keys(body));
    console.log('[CHAT] Raw body:', JSON.stringify(body).slice(0, 200));
    
    const { message, conversationId, priorItems, priorOutfitImage } = body as { message: string; conversationId?: string; priorItems?: OutfitItem[]; priorOutfitImage?: string };
    console.log('[CHAT] userId:', userId);
    console.log('[CHAT] message:', message);
    console.log('[CHAT] priorItems type:', typeof priorItems, 'isArray:', Array.isArray(priorItems));
    console.log('[CHAT] priorItems:', Array.isArray(priorItems) ? `${priorItems.length} items: ${priorItems.map(i => i.name).join(', ')}` : JSON.stringify(priorItems));
    console.log('[CHAT] priorOutfitImage type:', typeof priorOutfitImage);
    console.log('[CHAT] priorOutfitImage:', priorOutfitImage ? `exists (${priorOutfitImage.slice(0, 60)}...)` : 'none');

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get user and primary photo
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
      with: { photos: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const primaryPhoto = user.photos.find(p => p.isPrimary) || user.photos[0];
    if (!primaryPhoto) {
      return NextResponse.json({
        error: 'No photos found. Please upload a photo first.',
        needsPhoto: true,
      }, { status: 400 });
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId),
        with: { messages: { orderBy: [desc(messages.createdAt)] } },
      });
    } else {
      const [newConv] = await db.insert(conversations).values({
        userId: user.id,
      }).returning();
      conversation = newConv;
    }

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Save user message
    await db.insert(messages).values({
      conversationId: conversation.id,
      role: 'user',
      content: message,
    });
    // Touch conversation's lastMessageAt as soon as we get a user message
    await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conversation.id));

    // Parse user message for product requests - handle MULTIPLE items in one message
    let productRequests: Array<{query: string; brand?: string; color?: string; category?: string}> = [];
    
    // Try to detect multiple items using conjunctions
    const multiItemPatterns = /\band\b|,|\bthen\b|\balso\b|\bplus\b/i;
    const hasMulitpleItems = multiItemPatterns.test(message);
    
    if (hasMulitpleItems) {
      console.log('[CHAT] Detected multiple items in message');
      // Split by conjunctions and process each part
      const parts = message.split(/\band\b|,|\bthen\b|\balso\b|\bplus\b/i).map(p => p.trim()).filter(Boolean);
      console.log('[CHAT] Split into parts:', parts);
      
      for (const part of parts) {
        const parsed = parseUserQuery(part);
        if (parsed.category || parsed.brand || parsed.color) {
          const q = [parsed.brand, parsed.color, parsed.category].filter(Boolean).join(' ').trim();
          if (q) {
            productRequests.push({ query: q, ...parsed });
            console.log('[CHAT] Added request from part:', q, parsed);
          }
        }
      }
    }
    
    // If no multiple items detected or parsing failed, try Gemini
    if (productRequests.length === 0) {
      const geminiParsed = await extractQueryWithGemini(message).catch((err) => {
        console.warn('[CHAT] Gemini parse failed:', err instanceof Error ? err.message : err);
        return null;
      });
      if (geminiParsed) {
        console.log('[CHAT] Gemini parsed:', geminiParsed);
        
        // Check if Gemini returned multiple items
        if (geminiParsed.items && Array.isArray(geminiParsed.items)) {
          console.log('[CHAT] Gemini detected', geminiParsed.items.length, 'items');
          for (const item of geminiParsed.items) {
            const q = [item.brand, item.color, item.category, ...(item.style || [])]
              .filter(Boolean)
              .join(' ')
              .trim();
            if (q) {
              productRequests.push({ query: q, brand: item.brand, color: item.color, category: item.category });
              console.log('[CHAT] Added Gemini item query:', q);
            }
          }
        } else {
          // Single item
          const q = [geminiParsed.brand, geminiParsed.color, geminiParsed.category, ...(geminiParsed.style || [])]
            .filter(Boolean)
            .join(' ')
            .trim();
          if (q) {
            productRequests.push({ query: q, brand: geminiParsed.brand, color: geminiParsed.color, category: geminiParsed.category });
            console.log('[CHAT] Using Gemini query:', q);
          }
        }
      }
    }
    
    if (productRequests.length === 0) {
      const fallbackParsed = parseUserQuery(message);
      console.log('[CHAT] Local parsed:', fallbackParsed);
      const fallbackQ = [fallbackParsed.brand, fallbackParsed.color, fallbackParsed.category]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (fallbackQ) {
        productRequests.push({ query: fallbackQ, ...fallbackParsed });
        console.log('[CHAT] Using fallback query:', fallbackQ);
      }
    }
    console.log('[CHAT] Final productRequests:', productRequests.map(r => r.query));
    
    let outfitItems: OutfitItem[] = [];
    let responseText = '';

    if (productRequests.length === 0) {
      // Fallback: try the whole message as a search query
      const wholeMsg = message.trim().slice(0, 80);
      productRequests.push({ query: wholeMsg });
      console.log('[CHAT] No parsed query, using whole message:', wholeMsg);
    }

    if (productRequests.length > 0) {
      // Search for products using SerpAPI (fallback to internal products if missing key)
      const serpKey = process.env.SERPAPI_API_KEY;
      console.log('[CHAT] SERPAPI_API_KEY present:', !!serpKey);

      // Helper: run a single search query string through /api/search/products
      const runSearch = async (q: string): Promise<any[]> => {
        let products: any[] = [];
        if (serpKey) {
          // Call SerpAPI directly from server side
          try {
            console.log('[CHAT] Searching SerpAPI directly with q="' + q + '"');
            const serpUrl = new URL('https://serpapi.com/search.json');
            serpUrl.searchParams.set('engine', 'google_shopping_light');
            serpUrl.searchParams.set('q', q);
            serpUrl.searchParams.set('api_key', serpKey);
            
            const serpRes = await fetch(serpUrl.toString());
            console.log('[CHAT] SerpAPI direct response status:', serpRes.status);
            if (serpRes.ok) {
              const serpData = await serpRes.json();
              const results = Array.isArray(serpData?.shopping_results) ? serpData.shopping_results : [];
              console.log(`[CHAT] SerpAPI raw results: ${results.length}`);
              
              // Transform SerpAPI results to our product format
              products = results.slice(0, 10).map((r: any, idx: number) => {
                let price = 0;
                let currency = 'USD';
                if (typeof r.price === 'string') {
                  const m = r.price.match(/([A-Z$£€₹]{0,3})\s*([0-9,.]+)/);
                  if (m) {
                    const symbol = m[1] || '';
                    const amount = m[2]?.replace(/,/g, '') || '0';
                    price = parseFloat(amount);
                    if (symbol.includes('$')) currency = 'USD';
                    else if (symbol.includes('€')) currency = 'EUR';
                    else if (symbol.includes('£')) currency = 'GBP';
                    else if (symbol.includes('₹')) currency = 'INR';
                  }
                }
                
                return {
                  id: `serp-${r.product_id || idx}-${Math.random().toString(36).slice(2, 8)}`,
                  name: r.title || 'Product',
                  brand: r.source || r.store || 'Unknown',
                  price: isFinite(price) ? price : 0,
                  currency,
                  retailer: r.source || r.store || 'Unknown',
                  category: 'search',
                  imageUrl: r.thumbnail || r.image || '',
                  productUrl: r.link || r.product_link || '#',
                  isExternal: true,
                };
              });
              
              console.log(`[CHAT] Transformed to ${products.length} products`);
              if (products.length > 0) {
                console.log('[CHAT] Top 3:', products.slice(0,3).map((p:any)=>({name:p.name, brand:p.brand, hasImage: !!p.imageUrl})));
              }
            } else {
              const text = await serpRes.text();
              console.error('[CHAT] SerpAPI direct call failed:', serpRes.status, text.slice(0, 200));
            }
          } catch (err) {
            console.error('[CHAT] SerpAPI request error:', err instanceof Error ? err.message : err);
          }
        } else {
          console.warn('[CHAT] No SERPAPI_API_KEY found');
        }
        
        // If no products from SerpAPI, fallback to internal
        if (products.length === 0) {
          console.log('[CHAT] Falling back to internal products');
          // Direct database query would be better, but for now we import the logic inline
          // For simplicity, return empty array - the user will get the "no matches" message
        }
        return products;
      };

      // For each initial request, try progressive relaxation if needed
      for (const request of productRequests) {
        let products: any[] = await runSearch(request.query);

        if (products.length === 0) {
          // Progressive fallback: drop style words, then brand, then color
          const parsed = request.brand || request.color || request.category ? request : parseUserQuery(request.query);
          const parts = {
            brand: parsed.brand,
            color: parsed.color,
            category: parsed.category,
          };
          const candidates: string[] = [];
          // brand+color+category
          candidates.push([parts.brand, parts.color, parts.category].filter(Boolean).join(' '));
          // brand+category
          candidates.push([parts.brand, parts.category].filter(Boolean).join(' '));
          // color+category
          candidates.push([parts.color, parts.category].filter(Boolean).join(' '));
          // category only
          candidates.push([parts.category].filter(Boolean).join(' '));

          for (const q of candidates.filter(Boolean)) {
            if (products.length > 0) break;
            products = await runSearch(q);
          }
        }

        if (products.length > 0) {
          // Re-rank by brand/color/category relevance
          const parsed = parseUserQuery(message);
          const product = pickBestProduct(products, parsed);
          if (product) {
            // Infer category from parsed query or product name
            // ALWAYS infer from name, don't trust product.category from SERP
            const name = (product.name || '').toLowerCase();
            const queryLower = message.toLowerCase();
            
            let category = parsed.category; // Start with parsed category from user query
            
            // If no category from query, infer from product name
            if (!category || category === 'search') {
              if (['jacket', 'coat', 'puffer', 'parka', 'blazer', 'cardigan'].some(k => name.includes(k))) {
                category = 'jacket';
              } else if (['jean', 'pants', 'trouser', 'chino', 'jogger'].some(k => name.includes(k))) {
                category = 'jeans';
              } else if (['top', 't-shirt', 'tshirt', 'tee', 'blouse', 'shirt', 'cami'].some(k => name.includes(k) || queryLower.includes(k))) {
                category = 'top';
              } else if (['dress', 'gown'].some(k => name.includes(k))) {
                category = 'dress';
              } else if (['skirt'].some(k => name.includes(k))) {
                category = 'skirt';
              } else if (['shoe', 'sneaker', 'boot', 'sandal', 'heel'].some(k => name.includes(k))) {
                category = 'shoes';
              } else if (['sweater', 'hoodie', 'sweatshirt', 'pullover'].some(k => name.includes(k))) {
                category = 'sweater';
              } else {
                category = 'other';
              }
            }
            
            console.log('[CHAT] Chosen product:', { name: product.name, category, normalizedCategory: normalizeCategory(category), brand: product.brand || product.retailer, hasImage: !!product.imageUrl });
            outfitItems.push({
              name: product.name || 'Item',
              imageUrl: product.imageUrl || '',
              productUrl: product.productUrl || '#',
              price: product.price,
              currency: product.currency,
              brand: product.brand,
              retailer: product.retailer,
              category: category || 'other',
            });
          } else {
            console.warn('[CHAT] pickBestProduct returned null despite having products');
          }
        } else {
          console.warn('[CHAT] No products found for request:', request.query);
        }
      }
    }

    // Generate outfit image if items found
    let outfitImageUrl: string | undefined;
    // Merge prior context items, but REPLACE items in same category
    const mergedItems: OutfitItem[] = mergeOutfitItems(
      Array.isArray(priorItems) ? priorItems : [],
      outfitItems
    );
    console.log('[CHAT] mergedItems after category merge:', mergedItems.map(i => ({name:i.name, category:i.category, brand:i.brand})));

    // Only send items that have an image to the try-on pipeline
    const itemsForTryOn = mergedItems.filter(i => !!i.imageUrl);

    if (itemsForTryOn.length > 0) {
      console.log('[CHAT] ===== GENERATING TRY-ON =====');
      console.log('[CHAT] Prior items count:', Array.isArray(priorItems) ? priorItems.length : 0);
      console.log('[CHAT] New items count:', outfitItems.length);
      console.log('[CHAT] Merged items count:', mergedItems.length);
      console.log('[CHAT] Items for try-on:', itemsForTryOn.map(i => ({name: i.name, category: i.category})));
      
      // Determine if we replaced any items (category overlap)
      const newCategories = new Set(outfitItems.map(i => normalizeCategory(i.category)));
      const hasPriorContext = Array.isArray(priorItems) && priorItems.length > 0;
      const hadReplacement = hasPriorContext && priorItems.some(i => newCategories.has(normalizeCategory(i.category)));
      
      console.log('[CHAT] ===== CONTEXT DECISION =====');
      console.log('[CHAT] Has prior context?', hasPriorContext);
      console.log('[CHAT] Has prior outfit image?', !!priorOutfitImage);
      console.log('[CHAT] New categories:', Array.from(newCategories));
      if (hasPriorContext) {
        console.log('[CHAT] Prior categories:', priorItems.map(i => normalizeCategory(i.category)));
      }
      console.log('[CHAT] Had replacement?', hadReplacement);
      
      let baseImage: string;
      let itemsToApply: OutfitItem[];
      
      if (hadReplacement) {
        // REPLACEMENT: Regenerate from scratch with all merged items
        // Because the prior outfit image contains the OLD item we're replacing
        console.log('[CHAT] DECISION: Category replacement - regenerating from original photo with all merged items');
        baseImage = primaryPhoto.url;
        itemsToApply = itemsForTryOn; // All merged items
      } else if (priorOutfitImage && hasPriorContext) {
        // ADDITION: Use prior outfit as base and only apply NEW items
        // This is incremental - we build on top of existing outfit
        console.log('[CHAT] DECISION: Addition - building on prior outfit with new items only');
        baseImage = priorOutfitImage;
        itemsToApply = outfitItems; // Only the new items
      } else {
        // FIRST TIME: Use original user photo
        console.log('[CHAT] DECISION: First outfit - using original user photo');
        baseImage = primaryPhoto.url;
        itemsToApply = itemsForTryOn;
      }
      
      console.log('[CHAT] Base image:', baseImage === primaryPhoto.url ? 'original user photo' : 'prior outfit');
      console.log('[CHAT] Items to apply:', itemsToApply.map(i => i.name));
      console.log('[CHAT] Base image preview:', baseImage.slice(0, 50));
      
      const outfitResult = await generateOutfitTryOn(baseImage, itemsToApply);
      
      console.log('[CHAT] Try-on result:', { 
        success: outfitResult.success, 
        hasImage: !!outfitResult.imageUrl, 
        imagePreview: outfitResult.imageUrl?.slice(0, 100),
        error: outfitResult.error 
      });
      console.log('[CHAT] ===== TRY-ON COMPLETE =====');
      
      if (outfitResult.success && outfitResult.imageUrl) {
        outfitImageUrl = outfitResult.imageUrl;
      }
    } else {
      console.log('[CHAT] Skipping try-on: no items with imageUrl');
    }

    // Generate AI response
    if (mergedItems.length > 0) {
      const itemsList = mergedItems.map(item => {
        const cat = normalizeCategory(item.category);
        return `${item.name} (${cat})`;
      }).join(', ');
      
      if (outfitItems.length > 0 && Array.isArray(priorItems) && priorItems.length > 0) {
        // Check if we replaced anything
        const newCats = new Set(outfitItems.map(i => normalizeCategory(i.category)));
        const hadReplacement = priorItems.some(i => newCats.has(normalizeCategory(i.category)));
        
        if (hadReplacement) {
          responseText = `Updated your outfit! Now wearing: ${itemsList}. Want to add or replace anything else?`;
        } else {
          responseText = `Added to your outfit! Now wearing: ${itemsList}. Keep building your look by adding more items!`;
        }
      } else {
        responseText = `Here's your look with: ${itemsList}. Add more items to complete your outfit (e.g., 'black jeans', 'white sneakers')!`;
      }
    } else {
      responseText = `I couldn't find good matches for "${message}". Try something like 'red crop top from Zara', 'black jeans from H&M', or include specific brands and colors.`;
    }

    // Save assistant message
    const [assistantMessage] = await db.insert(messages).values({
      conversationId: conversation.id,
      role: 'assistant',
      content: responseText,
      productRecommendations: mergedItems.length > 0 ? mergedItems.map(i => i.name) : undefined,
      outfitImageUrl: outfitImageUrl,
      outfitProducts: mergedItems.length > 0 ? mergedItems : undefined,
    }).returning();

    // Update conversation lastMessageAt based on assistant message timestamp
    await db.update(conversations)
      .set({ lastMessageAt: assistantMessage.createdAt })
      .where(eq(conversations.id, conversation.id));

    return NextResponse.json({
      success: true,
      message: {
        id: assistantMessage.id,
        role: 'assistant',
        content: responseText,
        outfitImage: outfitImageUrl,
        products: mergedItems,
        timestamp: assistantMessage.createdAt.toISOString(),
      },
      conversationId: conversation.id,
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Failed to process chat message' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const conversationId = searchParams.get('conversationId');
    const all = searchParams.get('all') === 'true';

    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (all) {
      const convs = await db.query.conversations.findMany({
        where: eq(conversations.userId, user.id),
        orderBy: [desc(conversations.lastMessageAt)],
      });
      return NextResponse.json({ success: true, conversations: convs });
    }

    let conversation;
    if (conversationId) {
      conversation = await db.query.conversations.findFirst({
        where: eq(conversations.id, conversationId),
        with: { messages: { orderBy: [desc(messages.createdAt)] } },
      });
    } else {
      // Get latest conversation
      conversation = await db.query.conversations.findFirst({
        where: eq(conversations.userId, user.id),
        orderBy: [desc(conversations.lastMessageAt)],
        with: { messages: { orderBy: [desc(messages.createdAt)] } },
      });
    }

    return NextResponse.json({
      success: true,
      conversation,
      messages: conversation?.messages?.reverse() || [],
    });

  } catch (error) {
    console.error('Get chat error:', error);
    return NextResponse.json({ error: 'Failed to fetch chat' }, { status: 500 });
  }
}

function extractProductRequests(message: string): string[] {
  const { brand, color, category } = parseUserQuery(message);
  const q = [brand, color, category].filter(Boolean).join(' ').trim();
  return q ? [q] : [];
}

// Parse brand, color and category (very lightweight NLP)
function parseUserQuery(message: string): { brand?: string; color?: string; category?: string } {
  const text = message.toLowerCase().replace(/[^a-z0-9&\s]/g, ' ').replace(/\s+/g, ' ').trim();

  const brandAliases: Record<string, string> = {
    'h&m': 'H&M', 'h & m': 'H&M', 'hm': 'H&M',
    'zara': 'Zara', 'uniqlo': 'UNIQLO', 'nike': 'Nike', 'adidas': 'Adidas',
    'patagonia': 'Patagonia', 'gap': 'GAP', 'hollister': 'Hollister', 'h and m': 'H&M'
  };

  const colors = ['black','blue','red','white','green','pink','purple','yellow','orange','brown','grey','gray','navy','beige','cream','tan'];

  // Map of category synonyms -> canonical
  const catMap: Record<string, string> = {
    'jacket': 'jacket', 'coat': 'jacket', 'puffer': 'jacket', 'parka': 'jacket',
    'top': 'top', 't shirt': 'top', 'tshirt': 'top', 'tee': 'top', 'blouse': 'top', 'shirt': 'top',
    'jeans': 'jeans', 'denim': 'jeans', 'trousers': 'pants', 'pants': 'pants',
    'dress': 'dress', 'skirt': 'skirt', 'hoodie': 'hoodie', 'sweater': 'sweater'
  };

  // Brand detection
  let brand: string | undefined;
  for (const alias in brandAliases) {
    const pattern = new RegExp(`(^|\s)${alias}($|\s)`);
    if (pattern.test(text)) { brand = brandAliases[alias]; break; }
  }

  // Color detection
  let color: string | undefined;
  for (const c of colors) {
    const pattern = new RegExp(`(^|\s)${c}($|\s)`);
    if (pattern.test(text)) { color = c; break; }
  }

  // Category detection (prefer more specific words first)
  const catKeys = Object.keys(catMap).sort((a,b)=>b.length-a.length);
  let category: string | undefined;
  for (const key of catKeys) {
    const pattern = new RegExp(`(^|\s)${key}($|\s)`);
    if (pattern.test(text)) { category = catMap[key]; break; }
  }

  return { brand, color, category };
}

// Score and pick best product from SerpAPI/internal results
function pickBestProduct(products: any[], query: { brand?: string; color?: string; category?: string }) {
  const brand = (query.brand || '').toLowerCase();
  const color = (query.color || '').toLowerCase();
  const category = (query.category || '').toLowerCase();

  let best: any | null = null;
  let bestScore = -1;
  for (const p of products || []) {
    const name = (p.name || '').toLowerCase();
    const retailer = (p.retailer || '').toLowerCase();
    const score = (
      (brand && (name.includes(brand) || retailer.includes(brand)) ? 3 : 0) +
      (color && name.includes(color) ? 2 : 0) +
      (category && name.includes(category) ? 2 : 0) +
      (p.imageUrl ? 1 : 0)
    );
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return best || (products && products[0]);
}

async function extractQueryWithGemini(message: string): Promise<{ items?: Array<{ brand?: string; color?: string; category?: string; style?: string[] }>; brand?: string; color?: string; category?: string; style?: string[] }> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return Promise.reject(new Error('Missing GEMINI_API_KEY'));
    const ai = new GoogleGenAI({ apiKey });

    const system = `You are a fashion shopping assistant. Extract structured search terms from the user's message.

If the message mentions MULTIPLE clothing items (e.g., "jacket and jeans"), return:
{"items": [{"brand":string, "color":string, "category":string, "style":string[]}, ...]}

If the message mentions ONE item, return:
{"brand":string, "color":string, "category":string, "style":string[]}

Fields:
- brand: retail brand if mentioned (H&M, Zara, UNIQLO, etc.)
- color: main color (lowercase)
- category: jacket, top, jeans, pants, dress, skirt, hoodie, sweater, shoes
- style: extra terms like puffer, cropped, oversized, slim

Return ONLY valid JSON. No prose.`;

    const res = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [
        { role: 'user', parts: [{ text: system }, { text: `User: ${message}` }] },
      ],
    });

    // Extract text from candidates -> content.parts[0].text per @google/genai response shape
    const text = (res as any)?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const jsonStr = (typeof text === 'string' ? text : '').trim().replace(/^```(json)?/i, '').replace(/```$/,'').trim();
    const parsed = JSON.parse(jsonStr);
    return parsed;
  } catch (err) {
    return Promise.reject(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const searchParams = req.nextUrl.searchParams;
    const conversationId = searchParams.get('conversationId');
    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
    }

    // Ensure the conversation belongs to the user
    const user = await db.query.users.findFirst({ where: eq(users.clerkId, userId) });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const conv = await db.query.conversations.findFirst({
      where: and(eq(conversations.id, conversationId), eq(conversations.userId, user.id)),
    });
    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    await db.delete(conversations).where(eq(conversations.id, conversationId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete chat error:', error);
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}

// Normalize category names to standard types for replacement logic
function normalizeCategory(category?: string): string {
  if (!category) return 'other';
  const cat = category.toLowerCase();
  
  // Group similar items together
  if (['jacket', 'coat', 'puffer', 'parka', 'blazer', 'cardigan'].some(k => cat.includes(k))) return 'outerwear';
  if (['top', 't-shirt', 'tshirt', 'tee', 'blouse', 'shirt', 'sweater', 'hoodie'].some(k => cat.includes(k))) return 'top';
  if (['jeans', 'pants', 'trousers', 'chinos', 'joggers'].some(k => cat.includes(k))) return 'bottom';
  if (['dress', 'gown'].some(k => cat.includes(k))) return 'dress';
  if (['skirt'].some(k => cat.includes(k))) return 'skirt';
  if (['shoes', 'sneakers', 'boots', 'sandals', 'heels'].some(k => cat.includes(k))) return 'footwear';
  if (['bag', 'purse', 'backpack', 'tote'].some(k => cat.includes(k))) return 'bag';
  if (['hat', 'cap', 'beanie'].some(k => cat.includes(k))) return 'headwear';
  if (['necklace', 'bracelet', 'earrings', 'ring', 'watch', 'jewelry'].some(k => cat.includes(k))) return 'accessories';
  
  return 'other';
}

// Merge outfit items: new items REPLACE items in the same category
function mergeOutfitItems(priorItems: OutfitItem[], newItems: OutfitItem[]): OutfitItem[] {
  if (newItems.length === 0) return priorItems;
  
  // Get categories of new items
  const newCategories = new Set(newItems.map(item => normalizeCategory(item.category)));
  console.log('[CHAT] New item categories:', Array.from(newCategories));
  
  // Keep only prior items that are NOT in the new categories
  const retained = priorItems.filter(item => {
    const cat = normalizeCategory(item.category);
    const keep = !newCategories.has(cat);
    if (!keep) {
      console.log('[CHAT] Replacing prior item:', item.name, 'category:', cat);
    }
    return keep;
  });
  
  console.log('[CHAT] Retained prior items:', retained.map(i => ({name:i.name, category:normalizeCategory(i.category)})));
  
  // Return retained + new items
  return [...retained, ...newItems];
}

function generateStylistResponse(userMessage: string): string {
  const responses = [
    "I'd love to help you put together a great outfit! What type of clothing item are you looking for?",
    "Tell me more about what you're shopping for - a top, bottom, shoes, or accessories?",
    "What's the occasion? I can suggest some perfect pieces for your style!",
    "Let me know what colors or styles you prefer, and I'll find some great options for you!",
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}
