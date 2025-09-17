import { NextRequest, NextResponse } from 'next/server';
import { getShortUrl, incrementShortUrlClicks } from '@roast-me/database';

interface RouteParams {
  params: Promise<{
    shortCode: string;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const resolvedParams = await params;
  const { shortCode } = resolvedParams;
  
  try {
    // Get the short URL record
    const shortUrl = await getShortUrl(shortCode);
    
    if (!shortUrl) {
      // Short URL not found
      return NextResponse.redirect(new URL('/', request.url), 404);
    }
    
    // Check if expired
    if (shortUrl.expires_at && new Date(shortUrl.expires_at) < new Date()) {
      return NextResponse.redirect(new URL('/', request.url), 410);
    }
    
    // Increment click count (fire and forget)
    incrementShortUrlClicks(shortCode).catch(console.error);
    
    // Redirect to the original URL
    return NextResponse.redirect(new URL(shortUrl.original_url, request.url), 302);
    
  } catch (error) {
    console.error('Error handling short URL redirect:', error);
    return NextResponse.redirect(new URL('/', request.url), 500);
  }
}