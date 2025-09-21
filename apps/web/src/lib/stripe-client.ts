import { loadStripe } from '@stripe/stripe-js';

// Get Stripe publishable key based on mode
const getStripePublishableKey = () => {
  const isTestMode = process.env.NEXT_PUBLIC_STRIPE_MODE === 'test';
  
  if (isTestMode) {
    return process.env.NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY;
  }
  
  return process.env.NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY;
};

// Initialize Stripe.js
const stripePublishableKey = getStripePublishableKey();

export const stripePromise = stripePublishableKey 
  ? loadStripe(stripePublishableKey)
  : null;

// Helper to check if Stripe is configured
export const isStripeConfigured = () => {
  return !!stripePublishableKey;
};