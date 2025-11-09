import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { users, photos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Find primary photo
    const primaryPhoto = user.photos.find(p => p.isPrimary) || user.photos[0];

    if (!primaryPhoto) {
      return NextResponse.json({ 
        error: 'No photos found. Please upload a photo first.',
        hasPhoto: false 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      photo: {
        id: primaryPhoto.id,
        url: primaryPhoto.url,
        isPrimary: primaryPhoto.isPrimary,
      },
    });
  } catch (error) {
    console.error('Error fetching primary photo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch primary photo' },
      { status: 500 }
    );
  }
}
