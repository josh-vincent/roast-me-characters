import { createCheckoutSession as createPolarCheckout, CREDIT_PACKAGES as POLAR_PACKAGES } from './polar';

export type PaymentProvider = 'polar';

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
  // Always use Polar as the payment provider
  return 'polar';
}

// Get credit packages based on the active provider
export function getCreditPackages(): PaymentProduct[] {
  return POLAR_PACKAGES;
}

// Create a checkout session with the active provider
export async function createCheckoutSession(
  productId: string,
  userId: string,
  userEmail?: string
): Promise<CheckoutSession> {
  console.log(`Creating checkout session with Polar for user ${userId}`);
  
  const session = await createPolarCheckout(productId, userId, userEmail);
  return {
    id: session.id,
    url: session.url!
  };
}

// Helper function to get provider-specific configuration
export function getProviderConfig() {
  return {
    provider: 'polar' as PaymentProvider,
    isStripe: false,
    isPolar: true,
    webhookEndpoint: '/api/webhooks/polar',
    successUrl: '/credits/success',
    cancelUrl: '/credits'
  };
}