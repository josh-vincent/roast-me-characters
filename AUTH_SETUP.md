# Authentication & Credits Setup Guide

This guide explains how to set up the authentication system with anonymous users, Google OAuth, and Polar payment integration.

## 🔧 **System Overview**

The authentication system supports:
- **Anonymous users**: Get 3 free credits, stored in browser cookies
- **Google OAuth**: Authenticated users get 10 credits, data persists across devices
- **Credit system**: Purchase more credits via Polar integration
- **Signup prompts**: Show after 3 images for anonymous users

## 📋 **Setup Steps**

### 1. Supabase Configuration

1. **Run the database migration**:
   ```bash
   # Apply the user table migration
   npx supabase db push
   ```

2. **Enable Google OAuth in Supabase Dashboard**:
   - Go to Authentication > Providers
   - Enable Google provider
   - Add your Google OAuth credentials
   - Set redirect URL: `https://yourdomain.com/auth/callback`

3. **Configure authentication settings**:
   - Enable "Allow users to sign up"
   - Set session timeout as needed
   - Configure email templates if desired

### 2. Environment Variables

Copy and update your environment variables:

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"

# App URLs
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_API_URL="https://yourdomain.com"

# Polar Payment Integration
POLAR_ACCESS_TOKEN="your_polar_access_token"
POLAR_SERVER="production"  # or "sandbox" for testing
POLAR_WEBHOOK_SECRET="your_polar_webhook_secret"
```

### 3. Polar Setup

1. **Create a Polar account** at [polar.sh](https://polar.sh)

2. **Create products** for credit packages:
   - 10 Credits: $2.99
   - 25 Credits: $5.99 
   - 50 Credits: $9.99

3. **Set up webhook endpoint**:
   - URL: `https://yourdomain.com/api/webhooks/polar`
   - Events: `checkout.completed`, `subscription.created`, `subscription.cancelled`

4. **Get your API keys**:
   - Access Token (for API calls)
   - Webhook Secret (for verifying webhooks)

### 4. Google OAuth Setup

1. **Create Google OAuth Application**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials

2. **Configure OAuth consent screen**:
   - Add your domain
   - Add necessary scopes (email, profile)
   - Set up privacy policy and terms of service URLs

3. **Add authorized redirect URIs**:
   - `https://yourdomain.com/auth/callback`
   - For Supabase: `https://your-project.supabase.co/auth/v1/callback`

## 🎯 **How It Works**

### Anonymous Users
1. User visits site → automatic anonymous account created
2. Gets 3 free credits stored in `anon_user_id` cookie
3. Can generate 3 characters before being prompted to sign up
4. After 3rd image → signup prompt appears

### Authenticated Users  
1. User signs in with Google → profile created/updated
2. Gets 10 credits automatically
3. Anonymous data can be migrated to authenticated account
4. Credits and history persist across devices

### Credit System
1. **Free tier**: 3 credits (anonymous) or 10 credits (authenticated)
2. **Paid credits**: Purchase via Polar checkout
3. **Credit consumption**: 1 credit per generated character
4. **Pro/Unlimited plans**: Future subscription tiers

### Purchase Flow
1. User clicks "Buy Credits" → redirects to Polar checkout
2. After payment → webhook updates user credits
3. User can continue generating characters

## 📁 **File Structure**

```
apps/web/src/
├── contexts/
│   └── AuthContext.tsx           # Main auth context provider
├── lib/
│   ├── supabase/
│   │   ├── client.ts            # Client-side Supabase setup
│   │   ├── server.ts            # Server-side Supabase setup
│   │   └── types.ts             # Database type definitions
│   └── polar.ts                 # Polar payment integration
├── components/
│   └── SignupPrompt.tsx         # Modal for anonymous users
├── app/
│   ├── auth/
│   │   └── callback/route.ts    # OAuth callback handler
│   ├── api/
│   │   ├── credits/
│   │   │   └── purchase/route.ts # Credit purchase endpoint
│   │   └── webhooks/
│   │       └── polar/route.ts   # Polar webhook handler
│   ├── credits/
│   │   └── page.tsx             # Credits purchase page
│   └── actions/
│       └── generate-with-auth.ts # Auth-aware generation
```

## 🔒 **Security Features**

- **Row Level Security**: Users can only access their own data
- **Anonymous session isolation**: Cookie-based anonymous users
- **Webhook signature verification**: Validates Polar webhooks
- **Credit validation**: Server-side credit checking before generation
- **Rate limiting**: Built into credit system

## 🧪 **Testing**

### Test Anonymous Flow
1. Open incognito/private browser
2. Generate 3 characters 
3. Verify signup prompt appears after 3rd
4. Check credits are consumed correctly

### Test Authentication Flow  
1. Sign in with Google
2. Verify profile creation and 10 credit allocation
3. Test credit consumption
4. Test cross-device persistence

### Test Payment Flow
1. Purchase credits on credits page
2. Verify Polar webhook receives payment
3. Check credits are added to account
4. Test continued generation

## 🚀 **Deployment**

1. **Deploy to production**
2. **Update OAuth redirect URLs** to production domain
3. **Configure Polar webhooks** with production URL
4. **Test complete flow** in production environment

## 📊 **Monitoring**

- Monitor Supabase auth logs
- Track Polar payment webhooks
- Monitor credit usage patterns
- Set up alerts for failed payments

## 🎉 **Ready!**

Your authentication system is now set up with:
- ✅ Anonymous users with 3 free credits
- ✅ Google OAuth with 10 credits bonus  
- ✅ Credit purchase via Polar
- ✅ Signup prompts after 3 images
- ✅ Cross-device data persistence