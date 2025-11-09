import { GoogleGenAI } from '@google/genai';
import { readFile } from 'fs/promises';
import { join } from 'path';

// Lazy initialization function - ensures ai is created with proper env vars
function getGeminiAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }
  
  return new GoogleGenAI({
    apiKey: apiKey,
  });
}

export interface TryOnRequest {
  userPhotoUrl: string;
  productImageUrl: string;
  productName: string;
  productDescription?: string;
}

export interface TryOnResult {
  success: boolean;
  imageData?: string;
  imageUrl?: string;
  error?: string;
}

async function imageToBase64(url: string): Promise<{ mimeType: string; data: string }> {
  try {
    // Handle data URLs (base64 encoded images) directly
    if (url.startsWith('data:')) {
      const matches = url.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches) {
        throw new Error('Invalid data URL format');
      }
      const mimeType = matches[1];
      const base64Data = matches[2];
      
      // Validate it's an image MIME type
      if (!mimeType.startsWith('image/')) {
        throw new Error(`Invalid data URL MIME type: ${mimeType}. Expected image/*`);
      }
      
      return {
        mimeType: mimeType,
        data: base64Data,
      };
    }
    
    // Handle local file paths (from Next.js public folder)
    if (url.startsWith('/')) {
      // Remove leading slash and construct path to public folder
      const filePath = join(process.cwd(), 'public', url);
      
      // Read the file
      const fileBuffer = await readFile(filePath);
      
      // Determine MIME type from file extension
      const ext = url.toLowerCase().split('.').pop();
      let mimeType = 'image/jpeg'; // default
      
      switch (ext) {
        case 'jpg':
        case 'jpeg':
          mimeType = 'image/jpeg';
          break;
        case 'png':
          mimeType = 'image/png';
          break;
        case 'gif':
          mimeType = 'image/gif';
          break;
        case 'webp':
          mimeType = 'image/webp';
          break;
        default:
          // Try to detect from magic bytes
          if (fileBuffer[0] === 0xFF && fileBuffer[1] === 0xD8) {
            mimeType = 'image/jpeg';
          } else if (fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50) {
            mimeType = 'image/png';
          } else if (fileBuffer[0] === 0x47 && fileBuffer[1] === 0x49) {
            mimeType = 'image/gif';
          } else if (fileBuffer[8] === 0x57 && fileBuffer[9] === 0x45) {
            mimeType = 'image/webp';
          }
      }
      
      return {
        mimeType,
        data: fileBuffer.toString('base64'),
      };
    }
    
    // Handle HTTP/HTTPS URLs - fetch the image
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error(`Invalid URL format: ${url}`);
    }
    
    // Special handling for Unsplash URLs
    let fetchUrl = url;
    const headers: HeadersInit = {
      'Accept': 'image/*',
    };
    
    // If it's an Unsplash URL, add proper parameters
    if (url.includes('images.unsplash.com')) {
      // Add quality and format parameters if not present
      const urlObj = new URL(url);
      if (!urlObj.searchParams.has('fm')) {
        urlObj.searchParams.set('fm', 'jpg'); // Force JPEG format
      }
      if (!urlObj.searchParams.has('q')) {
        urlObj.searchParams.set('q', '80'); // Quality 80
      }
      // Ensure width is reasonable
      if (!urlObj.searchParams.has('w') && !urlObj.searchParams.has('h')) {
        urlObj.searchParams.set('w', '800');
      }
      fetchUrl = urlObj.toString();
    }
    
    const response = await fetch(fetchUrl, { headers });
    
    // Check if response is OK
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    // Read the response buffer once
    const buffer = await response.arrayBuffer();
    
    // Additional check: ensure we actually got data
    if (buffer.byteLength === 0) {
      throw new Error('Received empty image data');
    }
    
    // Validate content type is actually an image
    const contentType = response.headers.get('content-type') || '';
    const validImageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const normalizedContentType = contentType.toLowerCase().split(';')[0].trim();
    
    // Validate it's actually an image by checking magic bytes (more reliable than content-type)
    const firstBytes = new Uint8Array(buffer.slice(0, 12));
    const isJPEG = firstBytes[0] === 0xFF && firstBytes[1] === 0xD8;
    const isPNG = firstBytes[0] === 0x89 && firstBytes[1] === 0x50 && firstBytes[2] === 0x4E && firstBytes[3] === 0x47;
    const isGIF = firstBytes[0] === 0x47 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46 && firstBytes[3] === 0x38;
    const isWebP = buffer.byteLength >= 12 && 
                   firstBytes[0] === 0x52 && firstBytes[1] === 0x49 && 
                   firstBytes[2] === 0x46 && firstBytes[3] === 0x46 &&
                   firstBytes[8] === 0x57 && firstBytes[9] === 0x45 && 
                   firstBytes[10] === 0x42 && firstBytes[11] === 0x50;
    
    // Check if it's HTML (common HTML tags or DOCTYPE)
    if (!isJPEG && !isPNG && !isGIF && !isWebP) {
      const textDecoder = new TextDecoder();
      const preview = textDecoder.decode(buffer.slice(0, Math.min(200, buffer.byteLength)));
      
      if (preview.trimStart().startsWith('<') || preview.includes('<!DOCTYPE') || preview.includes('<html') || preview.includes('<body')) {
        throw new Error(`URL returned HTML content instead of image (likely 404 page): ${url}`);
      }
      
      // If content-type says it's an image but magic bytes don't match, still reject it
      if (normalizedContentType.startsWith('image/')) {
        throw new Error(`Content-Type claims image (${contentType}) but file format doesn't match (magic bytes invalid)`);
      }
      
      throw new Error(`Invalid image format. Expected JPEG, PNG, GIF, or WebP. Content-Type: ${contentType || 'unknown'}`);
    }
    
    // If magic bytes are valid but content-type is wrong, use the detected type
    let finalMimeType = normalizedContentType;
    if (!validImageMimeTypes.includes(normalizedContentType)) {
      if (isJPEG) finalMimeType = 'image/jpeg';
      else if (isPNG) finalMimeType = 'image/png';
      else if (isGIF) finalMimeType = 'image/gif';
      else if (isWebP) finalMimeType = 'image/webp';
    }
    
    const base64 = Buffer.from(buffer).toString('base64');
    
    return {
      mimeType: finalMimeType,
      data: base64,
    };
  } catch (error) {
    console.error(`Error converting image to base64 (${url.substring(0, 50)}...):`, error);
    throw error;
  }
}

export async function generateVirtualTryOn(
  request: TryOnRequest
): Promise<TryOnResult> {
  try {
    // Initialize Gemini AI client (lazy initialization)
    const ai = getGeminiAI();

    // Convert images to base64
    const productImage = await imageToBase64(request.productImageUrl);
    const userImage = await imageToBase64(request.userPhotoUrl);

    // Validate images before sending to Gemini
    if (!productImage.data || productImage.data.length === 0) {
      throw new Error('Product image data is empty');
    }
    if (!userImage.data || userImage.data.length === 0) {
      throw new Error('User photo data is empty');
    }
    
    // Build prompt following official Google documentation format
    // First image: Product/clothing item
    // Second image: User/model photo
    const prompt = [
      {
        inlineData: {
          mimeType: productImage.mimeType,
          data: productImage.data,
        },
      },
      {
        inlineData: {
          mimeType: userImage.mimeType,
          data: userImage.data,
        },
      },
      {
        text: `You are a professional virtual try-on system. The first image contains a clothing item (${request.productName}${request.productDescription ? `: ${request.productDescription}` : ''}). The second image contains a person (model/user). 

Task: Generate a realistic virtual try-on image where the person from the second image is wearing the clothing item from the first image.

Requirements:
- Extract the person's face and body from the second image
- Apply the clothing item from the first image onto the person
- Maintain the person's facial features, body proportions, and pose
- Adjust lighting and shadows to match naturally
- Ensure the clothing fits realistically with proper draping and fit
- Generate a high-quality, professional e-commerce style photo
- The output should be a full-body or appropriate crop showing the person wearing the item

Generate the virtual try-on image now.`,
      },
    ];

    // Use the official API structure from Google docs
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: prompt,
    });

    // Parse response - structure is response.candidates[0].content.parts
    if (!response.candidates || response.candidates.length === 0) {
      console.error('No candidates in response:', response);
      return {
        success: false,
        error: 'No candidates received from Gemini API',
      };
    }

    const candidate = response.candidates[0];
    if (!candidate.content || !candidate.content.parts) {
      console.error('No content parts in candidate:', candidate);
      return {
        success: false,
        error: 'No content parts in response candidate',
      };
    }

    const parts = candidate.content.parts;
    
    if (parts.length === 0) {
      console.error('Parts array is empty');
      return {
        success: false,
        error: 'Empty parts array in response',
      };
    }
    
    // Iterate through parts to find image data
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      
      // Check for text response (Gemini sometimes refuses or provides text instead of image)
      if ('text' in part && (part as any).text) {
        const textResponse = (part as any).text;
        console.warn(`Gemini returned text instead of image: ${textResponse.substring(0, 150)}...`);
        // Continue checking other parts in case there's also an image
      }
      
      // Check for image data - try different possible structures
      if ('inlineData' in part && (part as any).inlineData) {
        const inlineData = (part as any).inlineData;
        const base64Image = inlineData.data;
        const mimeType = inlineData.mimeType || 'image/png';
        const dataUrl = `data:${mimeType};base64,${base64Image}`;
        
        return {
          success: true,
          imageData: base64Image,
          imageUrl: dataUrl,
        };
      }
      
      // Also check if the part itself might be the data
      if ('data' in part && (part as any).data) {
        const base64Image = (part as any).data;
        const mimeType = (part as any).mimeType || 'image/png';
        const dataUrl = `data:${mimeType};base64,${base64Image}`;
        
        return {
          success: true,
          imageData: base64Image,
          imageUrl: dataUrl,
        };
      }
    }
    
    // If we get here, no image was found in the parts
    console.error('No image data found in response. Gemini may have refused to generate the image or returned only text.');

    return {
      success: false,
      error: 'No image generated in response. The model returned text or an unexpected format.',
    };
  } catch (error) {
    console.error('Virtual try-on generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

export async function batchGenerateTryOns(
  requests: TryOnRequest[]
): Promise<TryOnResult[]> {
  const results = await Promise.all(
    requests.map((request) => generateVirtualTryOn(request))
  );
  return results;
}
