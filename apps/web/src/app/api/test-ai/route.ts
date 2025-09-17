import { NextResponse } from 'next/server';
import { gateway } from '@ai-sdk/gateway';
import { generateText } from 'ai';

export async function GET() {
  try {
    // Simple test using AI Gateway
    const { text } = await generateText({
      model: gateway('openai/gpt-3.5-turbo'),
      prompt: 'Say "AI Gateway is working!" if you can read this.',
    });

    return NextResponse.json({
      success: true,
      message: text,
      gateway: 'Vercel AI Gateway',
    });
  } catch (error) {
    console.error('AI Gateway Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}