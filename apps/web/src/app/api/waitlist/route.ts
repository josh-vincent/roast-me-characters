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

    // Handle specific error codes
    if (error) {
      console.error('Waitlist signup error:', error);
      
      // Check for duplicate email error
      if (error.code === '23505') { // Unique violation
        return NextResponse.json(
          { error: 'This email is already on the waitlist' },
          { status: 409 }
        );
      }
      
      // Check if table doesn't exist
      if (error.code === '42P01') { // Table doesn't exist
        console.log('Waitlist table not found, creating fallback entry');
        
        // Try to create the waitlist table first
        try {
          await (supabase as any).rpc('create_waitlist_table').single();
        } catch (createError) {
          console.log('Could not create waitlist table:', createError);
        }
        
        // Retry the insert after potentially creating the table
        const retryResult = await (supabase as any)
          .from('roast_me_ai_waitlist')
          .insert({
            email: email.toLowerCase().trim(),
            source: source as 'web' | 'mobile' | 'social',
          })
          .select()
          .single();
        
        if (!retryResult.error) {
          data = retryResult.data;
          error = null;
        } else {
          // If still fails, return a generic error
          return NextResponse.json(
            { error: 'Unable to join waitlist at this time. Please try again later.' },
            { status: 500 }
          );
        }
      } else {
        // Return generic error without exposing details
        return NextResponse.json(
          { error: 'Failed to join waitlist. Please try again.' },
          { status: 500 }
        );
      }
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