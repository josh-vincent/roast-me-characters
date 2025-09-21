# Quick Start Guide - Stripe Integration

## 🚀 Quick Setup (5 minutes)

### 1. Get Stripe Test Keys
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copy your test keys

### 2. Create Test Products
1. Go to [Products Page](https://dashboard.stripe.com/test/products)
2. Create 3 products:
   - 20 Credits - $5.00 → Copy the **price ID** (starts with `price_`)
   - 50 Credits - $10.00 → Copy the **price ID**
   - 100 Credits - $15.00 → Copy the **price ID**

### 3. Update .env.local
```bash
# Switch to Stripe
PAYMENT_PROVIDER=stripe

# Stripe Keys
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
NEXT_PUBLIC_STRIPE_MODE=test
NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE

# Product Price IDs (from step 2)
STRIPE_TEST_PRODUCT_ID_20_CREDITS=price_YOUR_20_CREDITS_ID
STRIPE_TEST_PRODUCT_ID_50_CREDITS=price_YOUR_50_CREDITS_ID
STRIPE_TEST_PRODUCT_ID_100_CREDITS=price_YOUR_100_CREDITS_ID

# Webhook (for testing)
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET
```

### 4. Test Locally

#### Option A: Without Webhook (Quick Test)
```bash
pnpm dev
# Visit http://localhost:3000/test-stripe
```

#### Option B: With Webhook (Full Test)
```bash
# Terminal 1: Install and run Stripe CLI
brew install stripe/stripe-cli/stripe
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy the webhook secret shown and add to .env.local
# STRIPE_WEBHOOK_SECRET=whsec_...

# Terminal 2: Run the app
pnpm dev

# Visit http://localhost:3000/credits
```

### 5. Test Payment
- Use test card: `4242 4242 4242 4242`
- Any future expiry date
- Any CVC

## 🔄 Switch Back to Polar
```bash
# In .env.local
PAYMENT_PROVIDER=polar
```

## 📋 Verify Configuration
```bash
node test-stripe-config.js
```

## 🧪 Test Page
Visit [http://localhost:3000/test-stripe](http://localhost:3000/test-stripe) to:
- Check current payment provider
- View configured products
- Test checkout flow

## ❓ Troubleshooting

### "Product not found" error
→ Check that your price IDs in .env.local match Stripe Dashboard

### Webhook not working
→ Ensure Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

### Credits not updating
→ Check webhook is configured and database migration is applied

## 📚 Full Documentation
See [STRIPE_SETUP.md](./STRIPE_SETUP.md) for detailed configuration instructions.