import { NextResponse } from 'next/server';
import { CREDIT_PACKAGES } from '@/lib/polar';

export async function GET() {
  try {
    return NextResponse.json({ packages: CREDIT_PACKAGES });
  } catch (error) {
    console.error('Error fetching credit packages:', error);
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}