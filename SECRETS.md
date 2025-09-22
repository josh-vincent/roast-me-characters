# Secret Management Guide

## Overview
This guide explains how to manage API keys and secrets for the Roast Me Characters application.

## Environment Variables

### Local Development (.env.local)
Create a `.env.local` file with the following variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# AI API Keys
GOOGLE_GENERATIVE_AI_API_KEY="your_gemini_api_key"
XAI_API_KEY="your_xai_api_key" # Optional - for Grok roast generation
AI_GATEWAY_API_KEY="your_ai_gateway_key" # Optional

# Payment Configuration (Polar.sh)
POLAR_SECRET_KEY="your_polar_secret_key"
POLAR_WEBHOOK_SECRET="your_polar_webhook_secret"
```

## Supabase Edge Function Secrets

The Edge Function for image generation requires the Gemini API key to be set as a secret.

### Setting Secrets via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to "Edge Functions" → "Secrets"
3. Add the following secret:
   - Name: `GOOGLE_GENERATIVE_AI_API_KEY`
   - Value: Your Gemini API key

### Setting Secrets via Supabase CLI

```bash
# First, login to Supabase
npx supabase login

# Set the secret
npx supabase secrets set GOOGLE_GENERATIVE_AI_API_KEY="your_key" --project-ref your-project-ref

# List all secrets (values are hidden)
npx supabase secrets list --project-ref your-project-ref

# Unset a secret if needed
npx supabase secrets unset GOOGLE_GENERATIVE_AI_API_KEY --project-ref your-project-ref
```

## Security Best Practices

1. **Never commit secrets to git**
   - `.env.local` is gitignored
   - Never hardcode API keys in code

2. **Use environment variables**
   - Local: `.env.local`
   - Vercel: Set in project settings
   - Edge Functions: Use Supabase secrets

3. **Rotate keys regularly**
   - Update keys every 3-6 months
   - Immediately rotate if exposed

4. **Principle of least privilege**
   - Use read-only keys where possible
   - Service role keys only for server-side operations

## Deployment Environments

### Vercel
Set environment variables in Vercel project settings:
1. Go to Project Settings → Environment Variables
2. Add all variables from `.env.local`
3. Select appropriate environments (Production, Preview, Development)

### Kubernetes (if applicable)
Use the provided secret manifests in `/k8s/` directory:
```bash
kubectl apply -f k8s/secrets-production.yaml
```

## Edge Function Configuration

The Edge Function (`generate-character-image`) automatically has access to:
- `SUPABASE_URL` - Automatically provided
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically provided
- `GOOGLE_GENERATIVE_AI_API_KEY` - Must be set manually as a secret

## Troubleshooting

### Edge Function returns "API key not configured"
- Ensure `GOOGLE_GENERATIVE_AI_API_KEY` is set in Edge Function secrets
- Redeploy the Edge Function after setting secrets

### Local development issues
- Check `.env.local` exists and has all required variables
- Restart the development server after changing environment variables

### Production issues
- Verify all environment variables are set in Vercel
- Check Edge Function logs in Supabase dashboard

## Important Notes

- The Edge Function no longer has hardcoded API keys (as of version 5)
- Always use `Deno.env.get()` in Edge Functions, not hardcoded values
- For local testing of Edge Functions, you can use the Supabase CLI with local secrets