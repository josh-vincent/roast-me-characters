#!/usr/bin/env node

/**
 * Test script to verify Stripe configuration
 * Run with: node test-stripe-config.js
 */

require('dotenv').config({ path: '.env.local' });

const REQUIRED_ENV_VARS = {
  stripe: [
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'NEXT_PUBLIC_STRIPE_MODE',
    'NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY',
    'STRIPE_TEST_PRODUCT_ID_20_CREDITS',
    'STRIPE_TEST_PRODUCT_ID_50_CREDITS',
    'STRIPE_TEST_PRODUCT_ID_100_CREDITS',
  ],
  polar: [
    'POLAR_SERVER',
    'POLAR_SANDBOX_ACCESS_TOKEN',
    'POLAR_SANDBOX_PRODUCT_ID_20_CREDITS',
    'POLAR_SANDBOX_PRODUCT_ID_50_CREDITS',
    'POLAR_SANDBOX_PRODUCT_ID_250_CREDITS',
  ]
};

console.log('🔍 Stripe Configuration Test\n');
console.log('================================\n');

// Check payment provider
const provider = process.env.PAYMENT_PROVIDER || 'polar';
console.log(`✓ Payment Provider: ${provider}\n`);

if (provider === 'stripe') {
  console.log('📋 Checking Stripe Environment Variables:\n');
  
  let allValid = true;
  for (const envVar of REQUIRED_ENV_VARS.stripe) {
    const value = process.env[envVar];
    if (value) {
      // Mask sensitive values
      let displayValue = value;
      if (envVar.includes('SECRET') || envVar.includes('KEY')) {
        displayValue = value.substring(0, 10) + '...' + value.substring(value.length - 4);
      }
      console.log(`✅ ${envVar}: ${displayValue}`);
    } else {
      console.log(`❌ ${envVar}: NOT SET`);
      allValid = false;
    }
  }
  
  console.log('\n================================\n');
  
  if (allValid) {
    console.log('✅ All required Stripe environment variables are set!');
    console.log('\n📝 Next steps:');
    console.log('1. Ensure your Stripe price IDs are correct');
    console.log('2. Test webhook locally with: stripe listen --forward-to localhost:3000/api/webhooks/stripe');
    console.log('3. Try a test purchase at: http://localhost:3000/credits');
  } else {
    console.log('⚠️  Some Stripe environment variables are missing!');
    console.log('\nRefer to STRIPE_SETUP.md for configuration instructions.');
  }
  
} else if (provider === 'polar') {
  console.log('📋 Checking Polar Environment Variables:\n');
  
  let allValid = true;
  for (const envVar of REQUIRED_ENV_VARS.polar) {
    const value = process.env[envVar];
    if (value) {
      // Mask sensitive values
      let displayValue = value;
      if (envVar.includes('TOKEN') || envVar.includes('SECRET')) {
        displayValue = value.substring(0, 10) + '...' + value.substring(value.length - 4);
      }
      console.log(`✅ ${envVar}: ${displayValue}`);
    } else {
      console.log(`❌ ${envVar}: NOT SET`);
      allValid = false;
    }
  }
  
  console.log('\n================================\n');
  
  if (allValid) {
    console.log('✅ All required Polar environment variables are set!');
  } else {
    console.log('⚠️  Some Polar environment variables are missing!');
  }
} else {
  console.log('❌ Invalid PAYMENT_PROVIDER value. Must be "stripe" or "polar".');
}

console.log('\n');