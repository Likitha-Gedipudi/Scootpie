import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, photos, products, tryOnCache } from '@/lib/db/schema';
import { eq, and, gte, inArray } from 'drizzle-orm';
import { generateVirtualTryOn } from '@/services/tryon';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { productId, photoId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
      with: {
        photos: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get photo (use provided photoId or primary photo)
    const userPhoto = photoId 
      ? user.photos.find(p => p.id === photoId)
      : user.photos.find(p => p.isPrimary) || user.photos[0];

    if (!userPhoto) {
      return NextResponse.json(
        { error: 'No user photo found. Please upload a photo first.' },
        { status: 404 }
      );
    }

    // Get product
    const product = await db.query.products.findFirst({
      where: eq(products.id, productId),
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check cache first
    const cached = await db.query.tryOnCache.findFirst({
      where: and(
        eq(tryOnCache.userId, user.id),
        eq(tryOnCache.photoId, userPhoto.id),
        eq(tryOnCache.productId, productId),
        gte(tryOnCache.expiresAt, new Date())
      ),
    });

    if (cached) {
      return NextResponse.json({
        success: true,
        imageUrl: cached.generatedImageUrl,
        cached: true,
      });
    }

    // Generate new try-on image
    console.log(`Generating try-on for product ${product.name} (${product.id})`);
    console.log(`  Product image: ${product.imageUrl}`);
    console.log(`  User photo: ${userPhoto.url.substring(0, 50)}... (${userPhoto.url.startsWith('data:') ? 'data URL' : 'HTTP URL'})`);
    
    let result: Awaited<ReturnType<typeof generateVirtualTryOn>>;
    
    try {
      result = await generateVirtualTryOn({
        userPhotoUrl: userPhoto.url,
        productImageUrl: product.imageUrl,
        productName: product.name,
        productDescription: product.description || undefined,
      });

      if (!result.success || !result.imageUrl) {
        console.error(`Try-on generation failed for product ${product.id}:`, result.error);
        return NextResponse.json(
          { 
            success: false,
            error: result.error || 'Try-on generation failed',
            productId: product.id,
            productImageUrl: product.imageUrl,
            details: 'The product image may be invalid or the API refused to generate the try-on.',
          },
          { status: 200 }
        );
      }
    } catch (error) {
      console.error(`Error in try-on generation for product ${product.id}:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Check if it's an image validation error
      if (errorMessage.includes('HTML') || errorMessage.includes('404') || errorMessage.includes('Invalid image')) {
        return NextResponse.json(
          { 
            error: `Invalid product image: ${errorMessage}`,
            productId: product.id,
            productImageUrl: product.imageUrl,
            details: 'The product image URL appears to be broken or invalid. Please check the product image.',
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { 
          success: false,
          error: `Try-on generation failed: ${errorMessage}`,
          productId: product.id,
          productImageUrl: product.imageUrl,
        },
        { status: 200 }
      );
    }

    // Save to cache (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Insert into cache or update if exists (upsert)
    // Check if cache entry exists
    const existingCache = await db.query.tryOnCache.findFirst({
      where: and(
        eq(tryOnCache.userId, user.id),
        eq(tryOnCache.photoId, userPhoto.id),
        eq(tryOnCache.productId, productId)
      ),
    });

    if (existingCache) {
      // Update existing cache entry
      await db.update(tryOnCache)
        .set({
          generatedImageUrl: result.imageUrl!,
          expiresAt,
          createdAt: new Date(),
        })
        .where(eq(tryOnCache.id, existingCache.id));
    } else {
      // Insert new cache entry
      try {
        await db.insert(tryOnCache).values({
          userId: user.id,
          photoId: userPhoto.id,
          productId: productId,
          generatedImageUrl: result.imageUrl!,
          expiresAt,
        });
      } catch (error) {
        // Handle race condition - another request might have inserted it
        console.error('Error inserting into cache:', error);
      }
    }

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl!,
      cached: false,
    });
  } catch (error) {
    console.error('Error generating try-on:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate try-on' },
      { status: 200 }
    );
  }
}

// Batch generate try-ons for multiple products
export async function PUT(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { productIds, photoId } = body;

    if (!productIds || !Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      );
    }

    // Get user and primary photo
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
      with: {
        photos: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userPhoto = photoId 
      ? user.photos.find(p => p.id === photoId)
      : user.photos.find(p => p.isPrimary) || user.photos[0];

    if (!userPhoto) {
      return NextResponse.json(
        { error: 'No user photo found' },
        { status: 404 }
      );
    }

    // Get products - fetch all at once
    const allProducts = await db.select().from(products).where(inArray(products.id, productIds));

    // Check cache for all products at once
    const cachedResults = await db.select().from(tryOnCache).where(
      and(
        eq(tryOnCache.userId, user.id),
        eq(tryOnCache.photoId, userPhoto.id),
        inArray(tryOnCache.productId, productIds),
        gte(tryOnCache.expiresAt, new Date())
      )
    );

    // Build results map from cache
    const results: Record<string, string> = {};
    const cachedProductIds = new Set(cachedResults.map(c => c.productId));
    
    for (const cached of cachedResults) {
      results[cached.productId] = cached.generatedImageUrl;
    }

    // Find products that need generation
    const productsToGenerate = allProducts.filter(p => !cachedProductIds.has(p.id));

    // Generate missing try-ons
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    for (const product of productsToGenerate) {
      try {
        console.log(`Batch generating try-on for product ${product.name} (${product.id})`);
        console.log(`  Product image: ${product.imageUrl}`);
        
        const result = await generateVirtualTryOn({
          userPhotoUrl: userPhoto.url,
          productImageUrl: product.imageUrl,
          productName: product.name,
          productDescription: product.description || undefined,
        });

        if (result.success && result.imageUrl) {
          results[product.id] = result.imageUrl;
          console.log(`✅ Successfully generated try-on for product ${product.id}`);

          // Save to cache (upsert)
          const existingCache = await db.query.tryOnCache.findFirst({
            where: and(
              eq(tryOnCache.userId, user.id),
              eq(tryOnCache.photoId, userPhoto.id),
              eq(tryOnCache.productId, product.id)
            ),
          });

          if (existingCache) {
            // Update existing cache entry
            await db.update(tryOnCache)
              .set({
                generatedImageUrl: result.imageUrl,
                expiresAt,
                createdAt: new Date(),
              })
              .where(eq(tryOnCache.id, existingCache.id));
          } else {
            // Insert new cache entry
            try {
              await db.insert(tryOnCache).values({
                userId: user.id,
                photoId: userPhoto.id,
                productId: product.id,
                generatedImageUrl: result.imageUrl,
                expiresAt,
              });
            } catch (error) {
              console.error(`Error inserting cache for product ${product.id}:`, error);
            }
          }
        } else {
          const errorMsg = result.error || 'Unknown error';
          console.warn(`❌ Failed to generate try-on for product ${product.id} (${product.imageUrl}): ${errorMsg}`);
          
          // If it's an image validation error, log it but continue
          if (errorMsg.includes('HTML') || errorMsg.includes('404') || errorMsg.includes('Invalid image')) {
            console.warn(`  → Product image is invalid/broken, skipping this product`);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Error generating try-on for product ${product.id} (${product.imageUrl}): ${errorMessage}`);
        
        // If it's an image validation error, continue with other products
        if (errorMessage.includes('HTML') || errorMessage.includes('404') || errorMessage.includes('Invalid image')) {
          console.warn(`  → Product image is invalid/broken, skipping this product`);
          continue;
        }
      }
    }

    return NextResponse.json({
      success: true,
      tryOnImages: results,
    });
  } catch (error) {
    console.error('Error batch generating try-ons:', error);
    return NextResponse.json(
      { error: 'Failed to batch generate try-ons' },
      { status: 500 }
    );
  }
}
