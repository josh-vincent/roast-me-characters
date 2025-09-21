import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { verifyStripeWebhookSignature } from '@/lib/stripe';
import type { Database } from '@/lib/supabase/types';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 401 });
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = await verifyStripeWebhookSignature(body, signature);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
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

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, credits } = session.metadata || {};
        
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

            // Log the credit transaction (if table exists)
            try {
              const { error: transactionError } = await supabase
                .from('credit_transactions')
                .insert({
                  user_id: userId,
                  amount: parseInt(credits),
                  type: 'purchase',
                  description: `Purchased ${credits} credits`,
                  stripe_session_id: session.id,
                  payment_status: 'completed'
                });

              if (transactionError) {
                console.error('Error logging credit transaction:', transactionError);
                // Don't fail the webhook if transaction logging fails
              }
            } catch (e) {
              // Table might not exist yet, that's okay
              console.log('Could not log transaction (table may not exist):', e);
            }

            console.log(`Successfully added ${credits} credits to user ${userId}. New total: ${newCredits}`);
          } else {
            console.log(`User not found in database: ${userId}. The user may need to be created first.`);
            
            // For anonymous users or users that don't exist yet, create them
            const { error: createError } = await supabase
              .from('roast_me_ai_users')
              .insert({
                id: userId,
                credits: parseInt(credits),
                images_created: 0,
                plan: 'free',
                is_anonymous: !session.customer_email,
                email: session.customer_email || null
              });
              
            if (createError) {
              console.error('Error creating user:', createError);
            } else {
              console.log(`Created new user ${userId} with ${credits} credits`);
            }
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment intent succeeded: ${paymentIntent.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`Payment failed for intent: ${paymentIntent.id}`);
        
        // Log failed payment attempts
        if (paymentIntent.metadata?.userId) {
          try {
            const { error } = await supabase
              .from('credit_transactions')
              .insert({
                user_id: paymentIntent.metadata.userId,
                amount: 0,
                type: 'purchase',
                description: 'Payment failed',
                payment_status: 'failed'
              });

            if (error) {
              console.error('Error logging failed payment:', error);
            }
          } catch (e) {
            // Table might not exist yet
            console.log('Could not log failed transaction:', e);
          }
        }
        break;
      }

      case 'customer.subscription.created': {
        // Handle subscription creation if you add subscription plans later
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        console.log(`Subscription created for customer: ${customerId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        // Handle subscription cancellation
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        
        console.log(`Subscription cancelled for customer: ${customerId}`);
        break;
      }

      default:
        console.log(`Unhandled Stripe webhook event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Stripe webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}