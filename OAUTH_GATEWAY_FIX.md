# OAuth Cloudflare Bad Gateway Fix

## Problem
During the OAuth callback flow at `/auth/callback?code=...`, Cloudflare was returning a bad gateway error (502/504). This typically occurs when:
1. The backend takes too long to respond (>30 seconds for Cloudflare)
2. Database operations block the response
3. The backend crashes or doesn't respond properly

## Root Causes Identified

1. **Synchronous Database Operations**: The callback handler was performing multiple database operations sequentially:
   - Checking if user profile exists
   - Fetching anonymous user data
   - Transferring character ownership
   - Creating new user profile
   - Deleting anonymous user records

2. **No Timeout Protection**: The `exchangeCodeForSession` call had no timeout wrapper, which could hang if Supabase is slow

3. **Blocking Profile Creation**: The handler waited for all profile operations to complete before redirecting

## Solutions Implemented

### 1. Timeout Protection (auth/callback/route.ts)
Added a race condition with 8-second timeout for session exchange:
```typescript
const exchangePromise = supabase.auth.exchangeCodeForSession(code)
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Session exchange timeout')), 8000)
)
```

### 2. Non-blocking Profile Operations
Made profile creation and migration asynchronous - the redirect happens immediately while profile operations continue in background:
```typescript
// Don't wait for profile operations to complete
void profileCheckPromise.then(async (result) => {
  // Profile creation happens asynchronously
})
```

### 3. Simplified Fallback Route (auth/callback-simple/route.ts)
Created a minimal callback handler that only exchanges the code and redirects, skipping all profile operations. This can be used as an emergency fallback.

## Testing the Fix

1. **Local Testing**:
   ```bash
   pnpm dev
   # Try logging in with Google OAuth
   ```

2. **Production Testing**:
   - Deploy the changes to your Kubernetes cluster
   - Monitor the logs for any timeout messages
   - Check if users can successfully authenticate

## Configuration Updates Needed

1. **Google Cloud Console**: Update OAuth redirect URIs if using callback-simple
2. **Supabase Dashboard**: Add the new callback URLs if needed
3. **Environment Variables**: Ensure `NEXT_PUBLIC_BASE_URL` is set correctly

## Monitoring

Look for these log messages:
- `[Simple Callback] Auth callback hit` - Using simplified route
- `Session exchange timeout` - Timeout protection triggered
- `Migrating anonymous user` - Background migration happening

## If Issues Persist

1. Use the simplified callback route temporarily: `/auth/callback-simple`
2. Check Supabase status page for any outages
3. Review Cloudflare settings for timeout configurations
4. Consider implementing a queue system for heavy profile operations