import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { characterId } = await request.json();
    
    if (!characterId) {
      return NextResponse.json(
        { success: false, error: 'Character ID is required' },
        { status: 400 }
      );
    }

    // Call Supabase Edge Function directly
    const edgeFunctionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-character-image`;
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ characterId })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Edge Function error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to trigger image generation' },
        { status: 500 }
      );
    }

    const result = await response.json();
    
    return NextResponse.json({ 
      success: true,
      imageUrl: result.imageUrl,
      message: 'Image generation started successfully'
    });
  } catch (error) {
    console.error('Retry generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retry generation' },
      { status: 500 }
    );
  }
}