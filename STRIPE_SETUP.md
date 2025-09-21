# Stripe Payment Integration Setup

This document explains how to set up and configure Stripe for payment processing in the Roast Me Characters application.

## Overview

The application now supports both Stripe and Polar as payment providers. You can switch between them using the `PAYMENT_PROVIDER` environment variable.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Access to your Stripe Dashboard

## Setup Instructions

### 1. Create Products in Stripe Dashboard

1. Go to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Products** > **Add Product**
3. Create three products:
   - **20 Credits**: $5.00
   - **50 Credits**: $10.00
   - **100 Credits**: $15.00
4. For each product, create a one-time price

### 2. Get Your API Keys

1. In Stripe Dashboard, go to **Developers** > **API keys**
2. Copy your keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

### 3. Set Up Webhook

1. Go to **Developers** > **Webhooks**
2. Click **Add endpoint**
3. Enter your webhook URL:
   - Development: `http://localhost:3000/api/webhooks/stripe`
   - Production: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)

### 4. Configure Environment Variables

Add these to your `.env.local` file:

```env
# Payment Provider (set to 'stripe' or 'polar')
PAYMENT_PROVIDER=stripe

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
NEXT_PUBLIC_STRIPE_MODE=test  # Use 'live' for production
NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY=pk_test_your_publishable_key
NEXT_PUBLIC_STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_your_publishable_key  # For production

# Stripe Price IDs (from your Stripe Dashboard)
# Test Environment
STRIPE_TEST_PRODUCT_ID_20_CREDITS=price_1ABC...  # Your actual price ID
STRIPE_TEST_PRODUCT_ID_50_CREDITS=price_1DEF...
STRIPE_TEST_PRODUCT_ID_100_CREDITS=price_1GHI...

# Live Environment (for production)
STRIPE_LIVE_PRODUCT_ID_20_CREDITS=price_1JKL...
STRIPE_LIVE_PRODUCT_ID_50_CREDITS=price_1MNO...
STRIPE_LIVE_PRODUCT_ID_100_CREDITS=price_1PQR...
```

### 5. Run Database Migration

Apply the credit transactions table migration:

```bash
# Using Supabase CLI
supabase db push

# Or apply manually through Supabase Dashboard
# Copy contents of supabase/migrations/20250121_create_credit_transactions.sql
```

## Testing

### Test Mode

1. Use Stripe test keys (starting with `sk_test_` and `pk_test_`)
2. Use test credit cards: https://stripe.com/docs/testing
3. Common test card: `4242 4242 4242 4242` (any future date, any CVC)

### Test Webhook Locally

Use Stripe CLI to forward webhooks to your local server:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# This will show your webhook signing secret for local testing
```

## Switching Between Providers

To switch between Stripe and Polar:

1. Change `PAYMENT_PROVIDER` in your `.env.local`:
   - `PAYMENT_PROVIDER=stripe` for Stripe
   - `PAYMENT_PROVIDER=polar` for Polar

2. Restart your development server

## Production Deployment

1. Use live Stripe keys in production
2. Set `NEXT_PUBLIC_STRIPE_MODE=live`
3. Update webhook URL in Stripe Dashboard to production URL
4. Ensure all price IDs are correctly set for live products

## Troubleshooting

### Webhook Not Working

- Verify the webhook signing secret is correct
- Check that the webhook URL is accessible
- Review webhook logs in Stripe Dashboard

### Payment Not Processing

- Check browser console for errors
- Verify all environment variables are set
- Ensure price IDs match your Stripe products

### Credits Not Added

- Check webhook endpoint is receiving events
- Verify database connection and permissions
- Review server logs for errors

## Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive data
- Validate webhook signatures to prevent fraud
- Use HTTPS in production