import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const config = {
      hasAIGatewayKey: !!process.env.AI_GATEWAY_API_KEY,
      hasSupabaseURL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseService: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV,
      // Show first few chars of API key to verify it's loaded
      aiKeyPrefix: process.env.AI_GATEWAY_API_KEY ? 
        process.env.AI_GATEWAY_API_KEY.substring(0, 10) + '...' : 
        'Not set'
    };

    return NextResponse.json({
      success: true,
      config,
      message: 'Environment check complete'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}