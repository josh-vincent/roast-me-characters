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
          // Ensure profile exists and get current credits
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, credits')
            .eq('id', userId)
            .single();
            
          if (!profile) {
            // Create profile if it doesn't exist
            const { error: createError } = await supabase
              .from('profiles')
              .insert({ 
                id: userId,
                credits: parseInt(credits),
                daily_credits_used: 0,
                daily_credits_reset_at: new Date().toISOString()
              });
              
            if (createError) {
              console.error('Error creating profile:', createError);
              return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
            }
            
            console.log(`Created profile and added ${credits} credits for user ${userId}`);
          } else {
            // Add purchased credits to existing profile
            const newCredits = (profile.credits || 0) + parseInt(credits);
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ 
                credits: newCredits
              })
              .eq('id', userId);

            if (updateError) {
              console.error('Error adding credits to profile:', updateError);
              return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
            }

            // Log the transaction
            const { error: transactionError } = await supabase
              .from('credit_transactions')
              .insert({
                user_id: userId,
                amount: parseInt(credits),
                transaction_type: 'purchase',
                description: `Purchased ${credits} credits via Polar`,
                balance_after: newCredits
              });
              
            if (transactionError) {
              console.error('Error logging transaction:', transactionError);
              // Don't fail the webhook if transaction logging fails
            }

            console.log(`Successfully added ${credits} purchased credits to user ${userId}. New total: ${newCredits}`);
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