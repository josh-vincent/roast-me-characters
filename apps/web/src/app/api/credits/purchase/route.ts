import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createCheckoutSession } from '@/lib/payment-provider';
import type { Database } from '@/lib/supabase/types';

export async function POST(request: NextRequest) {
  try {
    const { productId } = await request.json();
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const cookieStore = await cookies();
    
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );
    
    // Get current user (either authenticated or anonymous)
    const { data: { user } } = await supabase.auth.getUser();
    let userId: string | null = null;
    let userEmail: string | undefined;

    if (user) {
      // Authenticated user
      userId = user.id;
      userEmail = user.email || undefined;
    } else {
      // Anonymous user - get from cookie
      const anonUserId = cookieStore.get('anon_user_id')?.value;
      if (anonUserId) {
        userId = anonUserId;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Ensure user profile exists in database before creating checkout
    if (user) {
      // For authenticated users, ensure their profile exists
      const { data: profile } = await supabase
        .from('roast_me_ai_users')
        .select('id')
        .eq('id', userId)
        .single();

      if (!profile) {
        // Create profile for authenticated user
        const { error } = await supabase
          .from('roast_me_ai_users')
          .insert({
            id: userId,
            email: user.email,
            google_id: user.user_metadata?.sub,
            is_anonymous: false,
            credits: 10, // Authenticated users get more credits
            images_created: 0,
            plan: 'free'
          });

        if (error) {
          console.error('Error creating user profile:', error);
          return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
        }
      }
    }

    // Create checkout session with payment provider (Stripe or Polar)
    const checkoutSession = await createCheckoutSession(productId, userId, userEmail);
    
    return NextResponse.json({ 
      checkoutUrl: checkoutSession.url,
      sessionId: checkoutSession.id 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}