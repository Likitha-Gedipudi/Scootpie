import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, swipes, collectionItems, collections, products } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { productId, direction, sessionId, cardPosition, product: payloadProduct, tryOnImageUrl } = body as {
      productId: string;
      direction: 'left' | 'right' | 'up';
      sessionId?: string;
      cardPosition: number;
      tryOnImageUrl?: string;
      product?: {
        id?: string;
        externalId?: string;
        name: string;
        brand: string;
        price: number;
        currency: string;
        retailer: string;
        category: string;
        subcategory?: string;
        imageUrl: string;
        productUrl: string;
        description?: string;
        availableSizes?: string[];
        colors?: string[];
        inStock?: boolean;
        trending?: boolean;
        isNew?: boolean;
        isEditorial?: boolean;
        isExternal?: boolean;
      };
    };

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Validate sessionId is a valid UUID format, generate new one if invalid
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let validSessionId: string;
    
    if (!sessionId || !uuidRegex.test(sessionId)) {
      // Generate a new UUID if the provided one is invalid
      const { randomUUID } = await import('crypto');
      validSessionId = randomUUID();
      console.warn(`Invalid sessionId provided: ${sessionId}. Generated new UUID: ${validSessionId}`);
    } else {
      validSessionId = sessionId;
    }

    // Ensure product is a DB product; if external id (non-UUID), upsert into products
    const uuidRegex2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let ensuredProductId: string = productId;

    if (!uuidRegex2.test(productId)) {
      // Attempt to find by externalId if provided
      let dbProduct = null as any;
      if (payloadProduct?.externalId) {
        dbProduct = await db.query.products.findFirst({
          where: eq(products.externalId, payloadProduct.externalId),
        });
      }
      if (!dbProduct && payloadProduct) {
        // Insert new DB product from payload
        const [inserted] = await db.insert(products).values({
          externalId: payloadProduct.externalId,
          name: payloadProduct.name,
          brand: payloadProduct.brand,
          price: String(isFinite(payloadProduct.price as any) ? payloadProduct.price : 0),
          currency: payloadProduct.currency || 'USD',
          retailer: payloadProduct.retailer,
          category: payloadProduct.category || 'search',
          subcategory: payloadProduct.subcategory,
          imageUrl: payloadProduct.imageUrl,
          productUrl: payloadProduct.productUrl,
          description: payloadProduct.description,
          availableSizes: payloadProduct.availableSizes as any,
          colors: payloadProduct.colors as any,
          inStock: payloadProduct.inStock ?? true,
          trending: payloadProduct.trending ?? false,
          isNew: payloadProduct.isNew ?? false,
          isEditorial: payloadProduct.isEditorial ?? false,
        }).returning();
        dbProduct = inserted;
      }
      if (dbProduct) {
        ensuredProductId = dbProduct.id;
      } else {
        // Fallback to original productId if no DB product could be found/created
        ensuredProductId = productId;
      }
    }

    // Save swipe to database (using ensuredProductId)
    await db.insert(swipes).values({
      userId: user.id,
      productId: ensuredProductId,
      direction: direction as 'left' | 'right' | 'up',
      sessionId: validSessionId,
      cardPosition,
    });

    // If swipe right (like), add to default collection (create if missing)
    if (direction === 'right') {
      let defaultCollection = await db.query.collections.findFirst({
        where: and(
          eq(collections.userId, user.id),
          eq(collections.isDefault, true)
        ),
      });

      if (!defaultCollection) {
        const [created] = await db.insert(collections).values({
          userId: user.id,
          name: 'Likes',
          isDefault: true,
        }).returning();
        defaultCollection = created;
      }

      if (defaultCollection) {
        // Check if item already exists in collection
        const existing = await db.query.collectionItems.findFirst({
          where: and(
            eq(collectionItems.collectionId, defaultCollection.id),
            eq(collectionItems.productId, ensuredProductId)
          ),
        });

        if (!existing) {
          await db.insert(collectionItems).values({
            collectionId: defaultCollection.id,
            productId: ensuredProductId,
            tryOnImageUrl: tryOnImageUrl,
          });
        } else if (tryOnImageUrl && !existing.tryOnImageUrl) {
          await db.update(collectionItems)
            .set({ tryOnImageUrl })
            .where(eq(collectionItems.id, existing.id));
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Swipe recorded successfully',
    });
  } catch (error) {
    console.error('Error recording swipe:', error);
    return NextResponse.json(
      { error: 'Failed to record swipe' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkId, userId),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch user's swipes
    const userSwipes = await db.query.swipes.findMany({
      where: eq(swipes.userId, user.id),
      with: {
        product: true,
      },
      orderBy: (swipes, { desc }) => [desc(swipes.swipedAt)],
    });

    return NextResponse.json({
      swipes: userSwipes,
      message: 'Swipe history retrieved',
    });
  } catch (error) {
    console.error('Error fetching swipes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch swipes' },
      { status: 500 }
    );
  }
}
