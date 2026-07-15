import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY || '' });

export async function POST(req: Request) {
  try {
    const { viewportSnapshot, stylePrompt, sceneNodes } = await req.json();

    const formattedPrompt = `
      Task: Translate this structural 3D clay CAD layout into a photorealistic architectural interior photograph.
      Aesthetic Style: ${stylePrompt}
      
      Structural Locking Principle: Keep every wall alignment, door position, and furniture coordinate exactly in place as shown in the snapshot. Zero layout drift or sliding.
      
      Active Pascal Scene Graph:
      ${JSON.stringify(sceneNodes, null, 2)}
    `;

    // Prompt Nano Banana Pro to drape realistic textures over our layout
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: [
        {
          inlineData: {
            mimeType: 'image/png',
            data: viewportSnapshot.replace(/^data:image\/\w+;base64,/, '')
          }
        },
        formattedPrompt
      ],
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: { aspectRatio: '16:9', imageSize: '4K' }
      }
    });

    const part = response.candidates?.[0]?.content?.parts?.find(p => 'inlineData' in p);
    if (!part || !part.inlineData) throw new Error('Render failed: No image data returned');

    return NextResponse.json({
      success: true,
      renderUrl: `data:image/png;base64,${part.inlineData.data}`
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
