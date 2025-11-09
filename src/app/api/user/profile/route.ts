import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, photos, collections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    const clerkUser = await currentUser();
    
    if (!userId || !clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, preferences, photoUrls, primaryPhotoIndex } = body;

    // Check if user already exists
    // Using select instead of query API for better error handling
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    let dbUser;

    if (existingUser) {
      // Update existing user
      await db
        .update(users)
        .set({
          name: name || existingUser.name,
          preferences: preferences || existingUser.preferences,
        })
        .where(eq(users.id, existingUser.id));
      
      dbUser = existingUser;
    } else {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: name || clerkUser.fullName || clerkUser.firstName || 'User',
          preferences,
        })
        .returning();
      
      dbUser = newUser;

      // Create default "Likes" collection
      await db.insert(collections).values({
        userId: newUser.id,
        name: 'Likes',
        isDefault: true,
      });
    }

    // Save photos if provided (limit to max 5)
    if (photoUrls && photoUrls.length > 0) {
      const limited = photoUrls.slice(0, 5);
      for (let i = 0; i < limited.length; i++) {
        const [photo] = await db
          .insert(photos)
          .values({
            userId: dbUser.id,
            url: limited[i],
            isPrimary: i === (typeof primaryPhotoIndex === 'number' ? primaryPhotoIndex : 0),
          })
          .returning();

        // Set primary photo ID
        if (i === (typeof primaryPhotoIndex === 'number' ? primaryPhotoIndex : 0)) {
          await db
            .update(users)
            .set({ primaryPhotoId: photo.id })
            .where(eq(users.id, dbUser.id));
        }
      }
    }

    return NextResponse.json({
      success: true,
      user: dbUser,
      message: 'Profile created successfully',
    });
  } catch (error) {
    console.error('Error creating profile:', error);
    
    // Extract more detailed error information
    let errorMessage = 'Unknown error';
    let errorDetails: any = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        message: error.message,
        name: error.name,
        stack: error.stack,
      };
      
      // Check if it's a database error
      if ('code' in error) {
        errorDetails.code = (error as any).code;
      }
      if ('severity' in error) {
        errorDetails.severity = (error as any).severity;
      }
      if ('detail' in error) {
        errorDetails.detail = (error as any).detail;
      }
      if ('hint' in error) {
        errorDetails.hint = (error as any).hint;
      }
    }
    
    // Log the full error object for debugging
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error('Error details:', errorDetails);
    
    return NextResponse.json(
      { 
        error: 'Failed to create profile',
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { errorDetails }),
      },
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

    // Get user with photos
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's photos separately
    const userPhotos = await db
      .select()
      .from(photos)
      .where(eq(photos.userId, user.id));

    const userWithPhotos = {
      ...user,
      photos: userPhotos,
    };

    return NextResponse.json({ user: userWithPhotos });
  } catch (error) {
    console.error('Error fetching profile:', error);
    
    // Extract more detailed error information
    let errorMessage = 'Unknown error';
    let errorDetails: any = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = {
        message: error.message,
        name: error.name,
        stack: error.stack,
      };
      
      // Check if it's a database error
      if ('code' in error) {
        errorDetails.code = (error as any).code;
      }
      if ('severity' in error) {
        errorDetails.severity = (error as any).severity;
      }
      if ('detail' in error) {
        errorDetails.detail = (error as any).detail;
      }
      if ('hint' in error) {
        errorDetails.hint = (error as any).hint;
      }
    }
    
    console.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error('Error details:', errorDetails);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch profile',
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { errorDetails }),
      },
      { status: 500 }
    );
  }
}
