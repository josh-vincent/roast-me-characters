# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Key Commands

### Development
```bash
# Install dependencies (use pnpm, not npm or yarn)
pnpm install

# Run development server (from project root or apps/web)
pnpm dev              # All apps
pnpm web              # Web app only (Next.js on port 3000)
pnpm mobile           # Mobile app only (Expo)

# Build commands
pnpm build            # Build all packages
pnpm type-check       # TypeScript type checking
pnpm lint             # Run ESLint

# Kubernetes deployment (from project root)
cd k8s
./deploy-production.sh    # Deploy to production
./deploy-sandbox.sh       # Deploy to sandbox
```

### Docker & Kubernetes
```bash
# Build Docker image for production (from project root)
docker build -f Dockerfile.standalone -t roastme:v[VERSION] .

# Check Kubernetes status
kubectl get pods -n production
kubectl logs [POD_NAME] -n production
```

## Architecture Overview

### Monorepo Structure
This is a Turborepo monorepo using pnpm workspaces with the following key packages:

- **apps/web**: Next.js 15 app with App Router, handles all web functionality
- **apps/mobile**: Expo/React Native app (SDK 52)
- **packages/ui**: Shared UI components and utilities
- **packages/ai**: AI integration with Gemini and xAI models
- **packages/database**: Supabase client (currently minimal)
- **packages/types**: Shared TypeScript types

### Authentication Flow
- Uses Supabase Auth with Google OAuth provider
- Server-side auth handled via `@supabase/ssr` (NOT the deprecated auth-helpers)
- Key files:
  - `apps/web/src/lib/supabase/server.ts`: Server-side Supabase client
  - `apps/web/src/lib/supabase/client.ts`: Client-side Supabase client
  - `apps/web/src/app/auth/callback/route.ts`: OAuth callback handler
  - `apps/web/src/middleware.ts`: Session refresh and protected routes
  - `apps/web/src/contexts/AuthContext.tsx`: Client auth state management

### AI Character Generation Pipeline
1. **Image Analysis**: `analyzeImageFeatures()` in `packages/ai/src/index.ts` uses Gemini to detect features
2. **Roast Generation**: `generateRoast()` uses xAI's Grok model to create humorous content
3. **Image Generation**: `generateCharacterImage()` uses Gemini 2.5 Flash Image API
4. **Storage**: Images stored in Supabase Storage bucket `roast-me-ai`

### Server Actions Pattern
The app uses Next.js Server Actions for all mutations:
- `apps/web/src/app/actions/character-actions.ts`: Character generation logic
- `apps/web/src/app/actions/auth-actions.ts`: Authentication operations
- These replace traditional API routes for better type safety

### Database Schema
Supabase PostgreSQL with key tables:
- `characters`: Stores character data including generation params
- `profiles`: User profiles with credits system
- `credit_transactions`: Credit purchase/usage history

## Environment Variables

Required in `.env.local`:
```bash
# Supabase (all required)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI Services
GOOGLE_GENERATIVE_AI_API_KEY=  # For Gemini image analysis/generation
XAI_API_KEY=                   # For Grok roast generation (optional)
AI_GATEWAY_API_KEY=            # For AI gateway routing (optional)

# App URLs (MUST include https:// protocol)
NEXT_PUBLIC_APP_URL=https://roastme.tocld.com  # Production URL (MUST include https://)
NEXT_PUBLIC_BASE_URL=           # Optional, defaults to APP_URL (MUST include https:// if set)

# Payment (Polar.sh)
POLAR_SECRET_KEY=               # For credit purchases
POLAR_WEBHOOK_SECRET=           # For payment webhooks
```

## Important Implementation Notes

### OAuth/Auth Issues
- The OAuth flow requires proper PKCE cookie handling
- Middleware MUST call `supabase.auth.getUser()` to refresh sessions
- Never use the deprecated `@supabase/auth-helpers-nextjs` package
- Always use `@supabase/ssr` for server-side auth

### AI Model Configuration
- Gemini 2.5 Flash is used for image analysis (structured output)
- Gemini 2.5 Flash Image Preview is used for character image generation
- xAI Grok is used for roast content generation (can fallback to Gemini)
- The AI SDK v5 requires specific model version compatibility

### Production Deployment
- Deployed on Kubernetes using the configs in `/k8s`
- Uses Nginx ingress with 60-second timeout for long-running AI operations
- Docker image built with `Dockerfile.standalone` includes all env vars at build time
- Current production URL: https://roastme.tocld.com

### Credits System
- Users start with free credits for testing
- Credits are deducted when generating characters
- Polar.sh integration for purchasing credit packages
- Anonymous users can generate up to 3 characters before requiring sign-in

### Common Gotchas
1. **TypeScript Errors**: The AuthContext was recently simplified - no more `userProfile` or `refreshUserProfile`
2. **Build Errors**: Ensure all imports reference the new consolidated action files
3. **OAuth Errors**: Check middleware is properly handling cookies and session refresh
4. **AI Generation Failures**: Gemini API has rate limits and may need retry logic
5. **Docker Builds**: Environment variables must be present at build time for standalone deployment