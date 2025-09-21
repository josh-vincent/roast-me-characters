import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export interface StripeProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
}

// Get Stripe product IDs from environment variables
function getStripeProductIds() {
  const isTestMode = process.env.NEXT_PUBLIC_STRIPE_MODE === 'test';
  
  if (isTestMode) {
    return {
      product20: process.env.STRIPE_TEST_PRODUCT_ID_20_CREDITS!,
      product50: process.env.STRIPE_TEST_PRODUCT_ID_50_CREDITS!,
      product100: process.env.STRIPE_TEST_PRODUCT_ID_100_CREDITS!,
    };
  } else {
    return {
      product20: process.env.STRIPE_LIVE_PRODUCT_ID_20_CREDITS!,
      product50: process.env.STRIPE_LIVE_PRODUCT_ID_50_CREDITS!,
      product100: process.env.STRIPE_LIVE_PRODUCT_ID_100_CREDITS!,
    };
  }
}

// Define our credit packages with Stripe product IDs
export const STRIPE_CREDIT_PACKAGES: StripeProduct[] = (() => {
  const productIds = getStripeProductIds();
  
  return [
    {
      id: productIds.product20,
      name: '20 Roast Credits',
      description: 'Generate 20 hilarious roast characters',
      price: 500, // $5.00 in cents
      credits: 20
    },
    {
      id: productIds.product50,
      name: '50 Roast Credits',
      description: 'Generate 50 hilarious roast characters - Best Value!',
      price: 1000, // $10.00 in cents (20% savings)
      credits: 50
    },
    {
      id: productIds.product100,
      name: '100 Roast Credits', 
      description: 'Generate 100 hilarious roast characters - Pro Pack!',
      price: 1500, // $15.00 in cents (25% savings)
      credits: 100
    }
  ];
})();

export async function createStripeCheckoutSession(
  productId: string,
  userId: string,
  userEmail?: string
) {
  try {
    const product = STRIPE_CREDIT_PACKAGES.find(p => p.id === productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const baseUrl = process.env.NODE_ENV === 'development' 
      ? `http://localhost:3000`
      : process.env.NEXT_PUBLIC_APP_URL;

    // Create a Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: product.id, // Using the price ID from Stripe
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/credits`,
      customer_email: userEmail,
      metadata: {
        userId,
        credits: product.credits.toString(),
        productId: product.id,
      },
      allow_promotion_codes: true,
    });

    console.log('Created Stripe checkout session:', {
      id: session.id,
      url: session.url,
      productId: product.id,
      credits: product.credits
    });
    
    return session;
  } catch (error) {
    console.error('Error creating Stripe checkout session:', error);
    throw error;
  }
}

export async function verifyStripeWebhookSignature(
  payload: string | Buffer,
  signature: string
): Promise<Stripe.Event> {
  try {
    return stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    throw new Error('Invalid webhook signature');
  }
}

export { stripe };