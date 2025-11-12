import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateVirtualTryOn } from '@/services/tryon';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userPhotoUrl, productImageUrl, productName, productDescription } = body;

    if (!userPhotoUrl || !productImageUrl || !productName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await generateVirtualTryOn({
      userPhotoUrl,
      productImageUrl,
      productName,
      productDescription,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Try-on generation failed' },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      imageData: result.imageData,
    });
  } catch (error) {
    console.error('Error generating try-on:', error);
    return NextResponse.json(
      { error: 'Failed to generate try-on' },
      { status: 500 }
    );
  }
}
