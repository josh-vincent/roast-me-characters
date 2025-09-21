import { createCheckoutSession as createPolarCheckout, CREDIT_PACKAGES as POLAR_PACKAGES } from './polar';
import { createStripeCheckoutSession, STRIPE_CREDIT_PACKAGES } from './stripe';

export type PaymentProvider = 'stripe' | 'polar';

export interface PaymentProduct {
  id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
}

export interface CheckoutSession {
  id: string;
  url: string;
}

// Get the current payment provider from environment variable
export function getPaymentProvider(): PaymentProvider {
  const provider = process.env.PAYMENT_PROVIDER?.toLowerCase();
  
  // Default to Polar if not specified or invalid
  if (provider !== 'polar' && provider !== 'stripe') {
    return 'polar';
  }
  
  return provider as PaymentProvider;
}

// Get credit packages based on the active provider
export function getCreditPackages(): PaymentProduct[] {
  const provider = getPaymentProvider();
  
  if (provider === 'stripe') {
    return STRIPE_CREDIT_PACKAGES;
  }
  
  return POLAR_PACKAGES;
}

// Create a checkout session with the active provider
export async function createCheckoutSession(
  productId: string,
  userId: string,
  userEmail?: string
): Promise<CheckoutSession> {
  const provider = getPaymentProvider();
  
  console.log(`Creating checkout session with ${provider} for user ${userId}`);
  
  if (provider === 'stripe') {
    const session = await createStripeCheckoutSession(productId, userId, userEmail);
    return {
      id: session.id,
      url: session.url!
    };
  }
  
  // Use Polar
  const session = await createPolarCheckout(productId, userId, userEmail);
  return {
    id: session.id,
    url: session.url!
  };
}

// Helper function to get provider-specific configuration
export function getProviderConfig() {
  const provider = getPaymentProvider();
  
  return {
    provider,
    isStripe: provider === 'stripe',
    isPolar: provider === 'polar',
    webhookEndpoint: provider === 'stripe' 
      ? '/api/webhooks/stripe' 
      : '/api/webhooks/polar',
    successUrl: '/credits/success',
    cancelUrl: '/credits'
  };
}