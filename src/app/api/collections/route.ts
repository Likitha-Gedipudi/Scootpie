import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, collections, collectionItems, tryOnCache } from '@/lib/db/schema';
import { eq, and, inArray, gte } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database (with photos to find primary photo)
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
      with: { photos: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const primaryPhoto = user.photos.find(p => p.isPrimary) || user.photos[0] || null;

    // Fetch user's collections with items and products
    const userCollections = await db.query.collections.findMany({
      where: eq(collections.userId, user.id),
      with: {
        items: {
          with: {
            product: true,
          },
        },
      },
      orderBy: (collections, { desc }) => [desc(collections.createdAt)],
    });

    // If we have a primary photo, try to attach cached try-on images per product
    if (primaryPhoto) {
      const allProductIds = userCollections.flatMap(c => c.items.map(i => i.productId));
      if (allProductIds.length > 0) {
        const uniqueProductIds = Array.from(new Set(allProductIds));
        // Fetch all cached try-ons for these products
        const cached = await db.select().from(tryOnCache).where(
          and(
            eq(tryOnCache.userId, user.id),
            eq(tryOnCache.photoId, primaryPhoto.id),
            inArray(tryOnCache.productId, uniqueProductIds),
            gte(tryOnCache.expiresAt, new Date())
          )
        );

        const cacheMap = new Map(cached.map(c => [c.productId, c.generatedImageUrl] as const));

        // Attach tryOnImageUrl to items (prefer persisted item.tryOnImageUrl if present)
        for (const col of userCollections) {
          for (const item of col.items) {
            const cachedUrl = cacheMap.get(item.productId);
            // @ts-ignore - extend shape at runtime
            (item as any).tryOnImageUrl = item.tryOnImageUrl || cachedUrl || null;
          }
        }
      }
    }

    // Ensure product links are valid external retailer URLs; if missing/invalid, try resolve via SerpAPI
    const serpKey = process.env.SERPAPI_API_KEY;
    const isValidExternal = (u?: string) => {
      if (!u || typeof u !== 'string') return false;
      try {
        const h = new URL(u.startsWith('http') ? u : `https://${u}`).hostname.toLowerCase();
        if (!h) return false;
        return !(h.includes('google.') || h.includes('serpapi.com'));
      } catch { return false; }
    };

    if (serpKey) {
      // Collect products needing resolution (limit to 12 to keep response fast)
      const needs: Array<{ item: any; q: string }> = [];
      for (const col of userCollections) {
        for (const item of col.items) {
          const p = item.product as any;
          if (!isValidExternal(p?.productUrl)) {
            const q = [p?.brand, p?.name].filter(Boolean).join(' ').slice(0, 120);
            if (q) needs.push({ item, q });
          }
        }
      }
      const toResolve = needs.slice(0, 12);

      const pickRetailerUrl = (r: any): string | null => {
        const candidates = [r.link, r.product_link, r.product_page_url, r.offer?.link, r.offer?.product_link];
        for (const c of candidates) {
          if (isValidExternal(c)) return c as string;
        }
        return null;
      };

      // Resolve in series to be gentle on API
      for (const { item, q } of toResolve) {
        try {
          const u = new URL('https://serpapi.com/search.json');
          u.searchParams.set('engine', 'google_shopping_light');
          u.searchParams.set('q', q);
          u.searchParams.set('api_key', serpKey);
          const r = await fetch(u.toString());
          if (!r.ok) continue;
          const data: any = await r.json();
          const first = Array.isArray(data?.shopping_results) ? data.shopping_results[0] : null;
          const resolved = first ? pickRetailerUrl(first) : null;
          if (resolved) {
            // Override outgoing productUrl in response
            (item.product as any).productUrl = resolved;
          }
        } catch {}
      }
    }

    return NextResponse.json({
      collections: userCollections,
      message: 'Collections retrieved',
    });
  } catch (error) {
    console.error('Error fetching collections:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collections' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Collection name is required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create collection
    const [collection] = await db.insert(collections).values({
      userId: user.id,
      name,
      isDefault: false,
    }).returning();

    return NextResponse.json({
      success: true,
      collection,
    });
  } catch (error) {
    console.error('Error creating collection:', error);
    return NextResponse.json(
      { error: 'Failed to create collection' },
      { status: 500 }
    );
  }
}
