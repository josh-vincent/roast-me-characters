import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/lib/supabase/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('polar-signature');
    
    // Verify webhook signature (implement signature verification based on Polar's docs)
    // const isValid = verifyPolarSignature(body, signature, process.env.POLAR_WEBHOOK_SECRET);
    // if (!isValid) {
    //   return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    // }

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

    switch (body.type) {
      case 'checkout.completed':
        const { userId, credits } = body.data.metadata || {};
        
        if (userId && credits) {
          // Get current user credits first, then add new credits
          const { data: user } = await supabase
            .from('roast_me_ai_users')
            .select('credits')
            .eq('id', userId)
            .single();
            
          if (user) {
            const newCredits = user.credits + parseInt(credits);
            const { error } = await supabase
              .from('roast_me_ai_users')
              .update({ 
                credits: newCredits,
                updated_at: new Date().toISOString()
              })
              .eq('id', userId);

            if (error) {
              console.error('Error adding credits to user:', error);
              return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
            }

            console.log(`Successfully added ${credits} credits to user ${userId}. New total: ${newCredits}`);
          } else {
            console.log(`User not found in database: ${userId}. The user may need to be created first.`);
          }
        }
        break;

      case 'subscription.created':
        // Handle subscription creation for future subscription plans
        const { userId: subUserId } = body.data.metadata || {};
        
        if (subUserId) {
          const { error } = await supabase
            .from('roast_me_ai_users')
            .update({ 
              plan: 'pro',
              updated_at: new Date().toISOString()
            })
            .eq('id', subUserId);

          if (error) {
            console.error('Error updating user subscription:', error);
          }
        }
        break;

      case 'subscription.cancelled':
        // Handle subscription cancellation
        const { userId: cancelUserId } = body.data.metadata || {};
        
        if (cancelUserId) {
          const { error } = await supabase
            .from('roast_me_ai_users')
            .update({ 
              plan: 'free',
              updated_at: new Date().toISOString()
            })
            .eq('id', cancelUserId);

          if (error) {
            console.error('Error cancelling user subscription:', error);
          }
        }
        break;

      default:
        console.log(`Unhandled Polar webhook event: ${body.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Polar webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Helper function to verify Polar webhook signature (implement based on Polar's documentation)
function verifyPolarSignature(payload: any, signature: string | null, secret: string | undefined): boolean {
  if (!signature || !secret) return false;
  
  // Implement signature verification logic here based on Polar's webhook documentation
  // This is a placeholder
  return true;
}