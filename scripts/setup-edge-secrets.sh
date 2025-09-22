#!/bin/bash

# Setup Supabase Edge Function Secrets
# This script sets up the required secrets for the Edge Functions

echo "Setting up Supabase Edge Function secrets..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "Error: .env.local file not found!"
    exit 1
fi

# Source the environment variables
export $(cat .env.local | grep -v '^#' | xargs)

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI is not installed. Please install it first:"
    echo "brew install supabase/tap/supabase"
    exit 1
fi

echo "Using Supabase project: iwazmzjqbdnxvzqvuimt"

# Set the secrets using Supabase CLI
echo "Setting GOOGLE_GENERATIVE_AI_API_KEY..."
npx supabase secrets set GOOGLE_GENERATIVE_AI_API_KEY="$GOOGLE_GENERATIVE_AI_API_KEY" --project-ref iwazmzjqbdnxvzqvuimt

echo "Setting XAI_API_KEY..."
npx supabase secrets set XAI_API_KEY="$XAI_API_KEY" --project-ref iwazmzjqbdnxvzqvuimt

echo "Setting AI_GATEWAY_API_KEY..."
npx supabase secrets set AI_GATEWAY_API_KEY="$AI_GATEWAY_API_KEY" --project-ref iwazmzjqbdnxvzqvuimt

echo ""
echo "Secrets have been set up successfully!"
echo "The Edge Functions will now use these secrets instead of hardcoded values."
echo ""
echo "To verify secrets are set, run:"
echo "npx supabase secrets list --project-ref iwazmzjqbdnxvzqvuimt"