import { Polar } from '@polar-sh/sdk';

const serverType = (process.env.POLAR_SERVER as "production" | "sandbox") || 'production';
const accessToken = serverType === 'sandbox' 
  ? process.env.POLAR_SANDBOX_ACCESS_TOKEN 
  : process.env.POLAR_ACCESS_TOKEN;

// Debug logging for development (server-side only)
if (process.env.NODE_ENV === 'development' && typeof window === 'undefined') {
  const productIds = getProductIds();
  console.log('Polar configuration:', {
    server: serverType,
    hasAccessToken: !!accessToken,
    tokenLength: accessToken?.length || 0,
    productIds: {
      '20_credits': productIds.product20,
      '50_credits': productIds.product50,
      '100_credits': productIds.product250  // Note: variable name kept for env compatibility
    }
  });
}

const polar = new Polar({
  accessToken: accessToken,
  server: serverType,
});

export interface PolarProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
}

// Get environment-specific product IDs
function getProductIds() {
  const serverType = process.env.POLAR_SERVER as "production" | "sandbox" || 'production';
  
  if (serverType === 'sandbox') {
    return {
      product20: process.env.POLAR_SANDBOX_PRODUCT_ID_20_CREDITS!,
      product50: process.env.POLAR_SANDBOX_PRODUCT_ID_50_CREDITS!,
      product250: process.env.POLAR_SANDBOX_PRODUCT_ID_250_CREDITS!, // Now 100 credits, but env var name kept for compatibility
    };
  } else {
    return {
      product20: process.env.POLAR_PRODUCTION_PRODUCT_ID_20_CREDITS!,
      product50: process.env.POLAR_PRODUCTION_PRODUCT_ID_50_CREDITS!,
      product250: process.env.POLAR_PRODUCTION_PRODUCT_ID_250_CREDITS!, // Now 100 credits, but env var name kept for compatibility
    };
  }
}

// Define our credit packages with environment-specific Polar product IDs
export const CREDIT_PACKAGES: PolarProduct[] = (() => {
  const productIds = getProductIds();
  
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
      id: productIds.product250,
      name: '100 Roast Credits', 
      description: 'Generate 100 hilarious roast characters - Pro Pack!',
      price: 1500, // $15.00 in cents (25% savings)
      credits: 100
    }
  ];
})();

export async function createCheckoutSession(
  productId: string,
  userId: string,
  userEmail?: string
) {
  try {
    const product = CREDIT_PACKAGES.find(p => p.id === productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Create a checkout session with Polar using real product IDs
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? `http://localhost:3002`  // Use localhost for development
      : process.env.NEXT_PUBLIC_APP_URL;  // Already includes https://
      
    const checkoutSession = await polar.checkouts.create({
      products: [product.id],
      successUrl: `${baseUrl}/credits/success`,
      metadata: {
        userId,
        credits: product.credits.toString(),
        productId: product.id
      }
    });

    console.log('Created checkout session:', {
      id: checkoutSession.id,
      url: checkoutSession.url,
      productId: product.id,
      credits: product.credits
    });
    
    return checkoutSession;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

export async function handlePolarWebhook(
  event: any
) {
  try {
    switch (event.type) {
      case 'checkout.completed':
        const { userId, credits } = event.data.metadata;
        
        if (userId && credits) {
          // Add credits to user account
          await addCreditsToUser(userId, parseInt(credits));
        }
        break;
      
      case 'subscription.created':
        // Handle subscription creation if we add subscription plans later
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error('Error handling Polar webhook:', error);
    throw error;
  }
}

async function addCreditsToUser(userId: string, credits: number) {
  // This would use Supabase to add credits
  // We'll implement this in the webhook route
  console.log(`Adding ${credits} credits to user ${userId}`);
}

export { polar };