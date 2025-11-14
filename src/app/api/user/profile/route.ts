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
    
    console.log('[PROFILE API] POST request received:', {
      hasName: !!name,
      hasPreferences: !!preferences,
      preferences: JSON.stringify(preferences, null, 2),
      photoUrlsCount: photoUrls?.length || 0,
      primaryPhotoIndex,
    });

    // Check if user already exists
    // Using select instead of query API for better error handling
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, userId))
      .limit(1);

    let dbUser;

    if (existingUser) {
      // Merge preferences if updating existing user
      console.log('[PROFILE API] Incoming preferences:', JSON.stringify(preferences, null, 2));
      console.log('[PROFILE API] Existing preferences:', JSON.stringify(existingUser.preferences, null, 2));
      
      // Clean preferences: remove empty strings and undefined values
      type UserPreferences = {
        sizes?: { top?: string; bottom?: string; shoes?: string };
        budgetRange?: [number, number];
        styleQuizResponses?: Record<string, any>;
        gender?: 'men' | 'women' | 'unisex' | 'non-binary' | 'prefer-not-to-say';
      };
      
      const cleanPreferences: Partial<UserPreferences> = preferences ? {
        ...(preferences.gender && preferences.gender.trim() !== '' && ['men', 'women', 'unisex', 'non-binary', 'prefer-not-to-say'].includes(preferences.gender.trim()) ? { gender: preferences.gender.trim() as UserPreferences['gender'] } : {}),
        sizes: preferences.sizes ? {
          ...(preferences.sizes.top && preferences.sizes.top.trim() !== '' ? { top: preferences.sizes.top.trim() } : {}),
          ...(preferences.sizes.bottom && preferences.sizes.bottom.trim() !== '' ? { bottom: preferences.sizes.bottom.trim() } : {}),
          ...(preferences.sizes.shoes && preferences.sizes.shoes.trim() !== '' ? { shoes: preferences.sizes.shoes.trim() } : {}),
        } : undefined,
        ...(preferences.budgetRange ? { budgetRange: preferences.budgetRange } : {}),
      } : {};
      
      // Remove empty sizes object if it has no properties
      if (cleanPreferences.sizes && Object.keys(cleanPreferences.sizes).length === 0) {
        delete cleanPreferences.sizes;
      }
      
      let mergedPreferences: Partial<UserPreferences> = existingUser.preferences || {};
      if (Object.keys(cleanPreferences).length > 0) {
        mergedPreferences = {
          ...mergedPreferences,
          ...cleanPreferences,
          sizes: {
            ...(mergedPreferences as any)?.sizes,
            ...cleanPreferences.sizes,
          },
        };
        
        // Clean up merged sizes - remove empty strings
        if (mergedPreferences.sizes) {
          const sizes = mergedPreferences.sizes;
          if (sizes.top && sizes.top === '') {
            delete sizes.top;
          }
          if (sizes.bottom && sizes.bottom === '') {
            delete sizes.bottom;
          }
          if (sizes.shoes && sizes.shoes === '') {
            delete sizes.shoes;
          }
          // Remove sizes object if empty
          if (Object.keys(sizes).length === 0) {
            delete mergedPreferences.sizes;
          }
        }
      }
      
      console.log('[PROFILE API] Updating existing user. Clean preferences:', JSON.stringify(cleanPreferences, null, 2));
      console.log('[PROFILE API] Merged preferences:', JSON.stringify(mergedPreferences, null, 2));
      
      // Update existing user
      await db
        .update(users)
        .set({
          name: name || existingUser.name,
          preferences: mergedPreferences,
        })
        .where(eq(users.id, existingUser.id));
      
      // Fetch updated user
      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, existingUser.id))
        .limit(1);
      
      dbUser = updatedUser || existingUser;
    } else {
      // Create new user
      console.log('[PROFILE API] Creating new user with preferences:', JSON.stringify(preferences, null, 2));
      
      // Clean preferences: remove empty strings and undefined values
      type UserPreferences = {
        sizes?: { top?: string; bottom?: string; shoes?: string };
        budgetRange?: [number, number];
        styleQuizResponses?: Record<string, any>;
        gender?: 'men' | 'women' | 'unisex' | 'non-binary' | 'prefer-not-to-say';
      };
      
      const cleanPreferences: Partial<UserPreferences> = preferences ? {
        ...(preferences.gender && preferences.gender.trim() !== '' && ['men', 'women', 'unisex', 'non-binary', 'prefer-not-to-say'].includes(preferences.gender.trim()) ? { gender: preferences.gender.trim() as UserPreferences['gender'] } : {}),
        sizes: preferences.sizes ? {
          ...(preferences.sizes.top && preferences.sizes.top.trim() !== '' ? { top: preferences.sizes.top.trim() } : {}),
          ...(preferences.sizes.bottom && preferences.sizes.bottom.trim() !== '' ? { bottom: preferences.sizes.bottom.trim() } : {}),
          ...(preferences.sizes.shoes && preferences.sizes.shoes.trim() !== '' ? { shoes: preferences.sizes.shoes.trim() } : {}),
        } : undefined,
        ...(preferences.budgetRange ? { budgetRange: preferences.budgetRange } : {}),
      } : {};
      
      // Remove empty sizes object if it has no properties
      if (cleanPreferences.sizes && Object.keys(cleanPreferences.sizes).length === 0) {
        delete cleanPreferences.sizes;
      }
      
      console.log('[PROFILE API] Creating new user. Clean preferences:', JSON.stringify(cleanPreferences, null, 2));
      
      const [newUser] = await db
        .insert(users)
        .values({
          clerkId: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: name || clerkUser.fullName || clerkUser.firstName || 'User',
          preferences: Object.keys(cleanPreferences).length > 0 ? cleanPreferences : undefined,
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
    // Most recently uploaded photo becomes primary by default
    if (photoUrls && photoUrls.length > 0) {
      // Check if user already has photos
      const existingPhotos = await db
        .select()
        .from(photos)
        .where(eq(photos.userId, dbUser.id));
      
      console.log('[PROFILE API] Photo handling:', {
        photoUrlsCount: photoUrls.length,
        existingPhotosCount: existingPhotos.length,
        isExistingUser: !!existingUser,
        incomingPhotos: photoUrls.map((url: string) => url.substring(0, 100)),
        existingPhotos: existingPhotos.map(p => ({ id: p.id, isPrimary: p.isPrimary, url: p.url.substring(0, 100) })),
      });
      
      // Check for duplicates by comparing URLs (for base64 data URLs, use longer signature for better accuracy)
      const existingUrls = new Set(existingPhotos.map(p => {
        // For data URLs, use first 1000 chars as signature to detect duplicates more accurately
        // This includes more of the image data while still being efficient
        return p.url.startsWith('data:') ? p.url.substring(0, 1000) : p.url;
      }));
      
      const newPhotoUrls = photoUrls.filter((url: string) => {
        const signature = url.startsWith('data:') ? url.substring(0, 1000) : url;
        const isDuplicate = existingUrls.has(signature);
        if (isDuplicate) {
          console.log('[PROFILE API] Skipping duplicate photo (matched first 1000 chars)');
        }
        return !isDuplicate;
      });
      
      console.log('[PROFILE API] After duplicate check:', {
        newPhotoUrlsCount: newPhotoUrls.length,
        skipped: photoUrls.length - newPhotoUrls.length,
      });
      
      if (newPhotoUrls.length > 0) {
        const limited = newPhotoUrls.slice(0, 5 - existingPhotos.length);
        const primaryIndex = typeof primaryPhotoIndex === 'number' 
          ? primaryPhotoIndex 
          : limited.length - 1; // Default to last photo (most recent)
        
        let primaryPhotoId: string | null = null;
        
        // First, set all existing photos to non-primary
        if (existingPhotos.length > 0) {
          await db.update(photos)
            .set({ isPrimary: false })
            .where(eq(photos.userId, dbUser.id));
        }
        
        for (let i = 0; i < limited.length; i++) {
          const [photo] = await db
            .insert(photos)
            .values({
              userId: dbUser.id,
              url: limited[i],
              isPrimary: i === primaryIndex,
            })
            .returning();

          // Track primary photo ID
          if (i === primaryIndex) {
            primaryPhotoId = photo.id;
          }
        }
        
        // Set primary photo ID in users table
        if (primaryPhotoId) {
          await db
            .update(users)
            .set({ primaryPhotoId })
            .where(eq(users.id, dbUser.id));
          
          console.log('[PROFILE API] Set primary photo:', primaryPhotoId);
        }
        
        console.log('[PROFILE API] Photos added successfully:', limited.length);
      } else {
        console.log('[PROFILE API] All photos already exist, skipping duplicate addition');
        
        // Even if no new photos, ensure only one primary exists
        const primaryPhotos = existingPhotos.filter(p => p.isPrimary);
        if (primaryPhotos.length !== 1) {
          console.log('[PROFILE API] WARNING: Found', primaryPhotos.length, 'primary photos. Fixing...');
          
          // Set all to non-primary first
          await db.update(photos)
            .set({ isPrimary: false })
            .where(eq(photos.userId, dbUser.id));
          
          // Set the first photo as primary (or most recent if available)
          const photoToSetPrimary = existingPhotos[existingPhotos.length - 1] || existingPhotos[0];
          if (photoToSetPrimary) {
            await db.update(photos)
              .set({ isPrimary: true })
              .where(eq(photos.id, photoToSetPrimary.id));
            
            await db.update(users)
              .set({ primaryPhotoId: photoToSetPrimary.id })
              .where(eq(users.id, dbUser.id));
            
            console.log('[PROFILE API] Fixed: Set', photoToSetPrimary.id, 'as primary');
          }
        }
      }
    }

    // Fetch user with photos for response
    const userPhotos = await db
      .select()
      .from(photos)
      .where(eq(photos.userId, dbUser.id));
    
    const userWithPhotos = {
      ...dbUser,
      photos: userPhotos,
    };
    
    console.log('[PROFILE API] Returning user with', userPhotos.length, 'photos');
    console.log('[PROFILE API] Photo URLs:', userPhotos.map(p => p.url.substring(0, 50) + '...'));
    console.log('[PROFILE API] Preferences:', JSON.stringify(dbUser.preferences, null, 2));
    
    return NextResponse.json({
      success: true,
      user: userWithPhotos,
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

    console.log('[PROFILE API] GET - User preferences from DB:', JSON.stringify(user.preferences, null, 2));

    // Get user's photos separately
    const userPhotos = await db
      .select()
      .from(photos)
      .where(eq(photos.userId, user.id));

    const userWithPhotos = {
      ...user,
      photos: userPhotos,
    };

    console.log('[PROFILE API] GET - Returning user with', userPhotos.length, 'photos');

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
