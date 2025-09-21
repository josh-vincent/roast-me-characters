import { NextResponse } from 'next/server';
import { getCreditPackages, getProviderConfig } from '@/lib/payment-provider';

export async function GET() {
  try {
    const packages = getCreditPackages();
    const config = getProviderConfig();
    
    return NextResponse.json({ 
      packages,
      provider: config.provider 
    });
  } catch (error) {
    console.error('Error fetching credit packages:', error);
    return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 });
  }
}