import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/types';

export async function POST(request: NextRequest) {
  try {
    const { email, source = 'web' } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      );
    }

    // Use service role client for server-side operations that bypass RLS
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Try to use waitlist table first, fallback to storing in users table with a waitlist flag
    let { data, error } = await (supabase as any)
      .from('roast_me_ai_waitlist')
      .insert({
        email: email.toLowerCase().trim(),
        source: source as 'web' | 'mobile' | 'social',
      })
      .select()
      .single();

    // If waitlist table doesn't exist, use the users table as fallback
    if (error && error.code === '42P01') { // Table doesn't exist
      console.log('Waitlist table not found, using users table fallback');
      
      // Create a waitlist entry in the users table
      const waitlistUserId = `waitlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const { data: userData, error: userError } = await (supabase as any)
        .from('roast_me_ai_users')
        .insert({
          id: waitlistUserId,
          email: email.toLowerCase().trim(),
          is_anonymous: false,
          credits: 0,
          images_created: 0,
          plan: 'free' // Use free plan for compatibility
        })
        .select()
        .single();
      
      if (userError) {
        if (userError.code === '23505') { // Email already exists
          return NextResponse.json(
            { error: 'This email is already on the waitlist' },
            { status: 409 }
          );
        }
        throw userError;
      }
      
      data = userData;
      error = null;
    }

    if (error) {
      console.error('Waitlist signup error:', error);
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'This email is already on the waitlist' },
          { status: 409 }
        );
      }
      // Return more specific error information for debugging
      return NextResponse.json(
        { 
          error: 'Failed to join waitlist. Please try again.',
          details: error.message,
          code: error.code 
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Successfully joined waitlist', id: data.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}