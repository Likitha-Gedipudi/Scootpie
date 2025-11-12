import { GoogleGenAI } from '@google/genai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testGeminiAPI() {
  console.log('🔍 Testing Gemini API...\n');

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Error: GEMINI_API_KEY not found in environment variables');
    console.log('   Please check your .env.local file');
    process.exit(1);
  }

  console.log('✓ API key found:', apiKey.substring(0, 10) + '...');

  try {
    // Initialize Gemini AI (exactly as used in route.ts)
    const ai = new GoogleGenAI({ apiKey });
    console.log('✓ GoogleGenAI client initialized\n');

    // Test with a simple prompt
    console.log('📤 Sending test request to Gemini API...');
    
    const res = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [
        { role: 'user', parts: [{ text: 'Reply with just "Hello, I am working!" if you can read this message.' }] },
      ],
    });

    // Extract text from response - the API returns candidates with content parts
    const text = (res as any)?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (text) {
      console.log('✅ API Response received:');
      console.log('   Response:', text.trim());
      console.log('\n✅ Gemini API is working correctly!\n');
    } else {
      console.log('⚠️  Got response but could not extract text');
      console.log('   Response structure:', JSON.stringify(res, null, 2));
      process.exit(1);
    }
    
    // Test with a fashion-related query (exactly as used in extractQueryWithGemini)
    console.log('📤 Testing fashion query parsing...');
    
    const system = `You are a fashion shopping assistant. Extract structured search terms from the user's message.

If the message mentions ONE item, return:
{"brand":string, "color":string, "category":string, "style":string[]}

Fields:
- brand: retail brand if mentioned (H&M, Zara, UNIQLO, Nike, Adidas, etc.)
- color: main color (lowercase)
- category: jacket, top, jeans, pants, dress, skirt, hoodie, sweater, shoes
- style: extra terms like puffer, cropped, oversized, slim

Return ONLY valid JSON. No prose.`;

    const fashionRes = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: [
        { role: 'user', parts: [{ text: system }, { text: `User: Show me a black Nike hoodie` }] },
      ],
    });

    const fashionText = (fashionRes as any)?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    if (fashionText) {
      console.log('   Fashion parsing response:', fashionText.trim());
      
      try {
        const jsonStr = fashionText.trim().replace(/^```(json)?/i, '').replace(/```$/,'').trim();
        const parsed = JSON.parse(jsonStr);
        console.log('   Parsed JSON:', JSON.stringify(parsed, null, 2));
        console.log('\n✅ Fashion query parsing is working!\n');
      } catch (parseError) {
        console.log('⚠️  Response received but JSON parsing needs adjustment');
        console.log('   Raw response:', fashionText);
      }
    } else {
      console.log('⚠️  Got fashion response but could not extract text');
      console.log('   Full response:', JSON.stringify(fashionRes, null, 2));
    }

  } catch (error: any) {
    console.error('\n❌ Error testing Gemini API:');
    
    if (error.message?.includes('API key')) {
      console.error('   Invalid API key. Please check your GEMINI_API_KEY in .env.local');
    } else if (error.message?.includes('quota') || error.message?.includes('429')) {
      console.error('   API quota exceeded. Please check your Google Cloud quota limits.');
    } else if (error.message?.includes('network') || error.message?.includes('ENOTFOUND')) {
      console.error('   Network error. Please check your internet connection.');
    } else {
      console.error('   Error details:', error.message);
      if (error.response) {
        console.error('   Response:', error.response);
      }
    }
    
    console.log('\n💡 Troubleshooting steps:');
    console.log('   1. Verify your API key at https://aistudio.google.com/apikey');
    console.log('   2. Check if the API key has proper permissions');
    console.log('   3. Verify your Google Cloud project has Gemini API enabled');
    console.log('   4. Check quota limits at https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas\n');
    
    process.exit(1);
  }
}

testGeminiAPI();
