#!/bin/bash

# Stripe Setup Script
# This script helps you configure Stripe for the Roast Me Characters app

echo "🎯 Stripe Setup for Roast Me Characters"
echo "========================================"
echo ""
echo "This script will help you configure Stripe payments."
echo ""
echo "Prerequisites:"
echo "1. A Stripe account (sign up at https://stripe.com)"
echo "2. Access to your Stripe Dashboard"
echo ""
echo "Press Enter to continue..."
read

echo ""
echo "📝 Step 1: Create Products in Stripe"
echo "-------------------------------------"
echo "1. Go to: https://dashboard.stripe.com/test/products"
echo "2. Create three products with these exact prices:"
echo "   - 20 Credits: \$5.00"
echo "   - 50 Credits: \$10.00"
echo "   - 100 Credits: \$15.00"
echo ""
echo "Press Enter when you've created the products..."
read

echo ""
echo "📝 Step 2: Enter your Stripe configuration"
echo "------------------------------------------"
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Creating .env.local file..."
    touch .env.local
fi

# Function to update or add environment variable
update_env() {
    local key=$1
    local value=$2
    if grep -q "^${key}=" .env.local; then
        # Update existing
        sed -i.bak "s|^${key}=.*|${key}=${value}|" .env.local
    else
        # Add new
        echo "${key}=${value}" >> .env.local
    fi
}

# Payment Provider
echo "Setting payment provider to Stripe..."
update_env "PAYMENT_PROVIDER" "stripe"

# Get API Keys
echo ""
echo "📌 Get your API keys from: https://dashboard.stripe.com/test/apikeys"
echo ""
read -p "Enter your Stripe TEST Secret Key (sk_test_...): " STRIPE_SECRET_KEY
update_env "STRIPE_SECRET_KEY" "$STRIPE_SECRET_KEY"

read -p "Enter your Stripe TEST Publishable Key (pk_test_...): " STRIPE_PUB_KEY
update_env "NEXT_PUBLIC_STRIPE_TEST_PUBLISHABLE_KEY" "$STRIPE_PUB_KEY"
update_env "NEXT_PUBLIC_STRIPE_MODE" "test"

echo ""
echo "📝 Step 3: Enter Price IDs"
echo "--------------------------"
echo "Go to your products in Stripe Dashboard and copy the PRICE IDs (not product IDs)"
echo "Price IDs start with 'price_'"
echo ""

read -p "Enter Price ID for 20 Credits (\$5.00): " PRICE_20
update_env "STRIPE_TEST_PRODUCT_ID_20_CREDITS" "$PRICE_20"

read -p "Enter Price ID for 50 Credits (\$10.00): " PRICE_50
update_env "STRIPE_TEST_PRODUCT_ID_50_CREDITS" "$PRICE_50"

read -p "Enter Price ID for 100 Credits (\$15.00): " PRICE_100
update_env "STRIPE_TEST_PRODUCT_ID_100_CREDITS" "$PRICE_100"

echo ""
echo "📝 Step 4: Set up Webhook"
echo "-------------------------"
echo "1. Go to: https://dashboard.stripe.com/test/webhooks"
echo "2. Click 'Add endpoint'"
echo "3. Enter endpoint URL: https://yourdomain.com/api/webhooks/stripe"
echo "   (For local testing, use Stripe CLI instead)"
echo "4. Select events: checkout.session.completed"
echo "5. Copy the signing secret (whsec_...)"
echo ""

read -p "Enter your Webhook Signing Secret (whsec_...): " WEBHOOK_SECRET
update_env "STRIPE_WEBHOOK_SECRET" "$WEBHOOK_SECRET"

echo ""
echo "✅ Stripe configuration complete!"
echo ""
echo "📋 Configuration saved to .env.local:"
echo "-------------------------------------"
grep -E "PAYMENT_PROVIDER|STRIPE_|NEXT_PUBLIC_STRIPE_" .env.local | sed 's/=.*/=.../'

echo ""
echo "🚀 Next Steps:"
echo "-------------"
echo "1. For local webhook testing, install Stripe CLI:"
echo "   brew install stripe/stripe-cli/stripe"
echo ""
echo "2. Login to Stripe CLI:"
echo "   stripe login"
echo ""
echo "3. Forward webhooks to localhost:"
echo "   stripe listen --forward-to localhost:3000/api/webhooks/stripe"
echo ""
echo "4. Start the development server:"
echo "   pnpm dev"
echo ""
echo "5. Test a purchase at:"
echo "   http://localhost:3000/credits"
echo ""
echo "Happy testing! 🎉"