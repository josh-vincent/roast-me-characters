# OAuth Production Error Analysis

## Identified Error Points in OAuth Flow

### 1. **Client-Side Redirect URL Generation** ❌ CRITICAL
**Location**: `/apps/web/src/contexts/AuthContext.tsx:186-203`

```typescript
const origin = typeof window !== 'undefined' ? window.location.origin : 'https://roastme.tocld.com';
const baseUrl = process.env.NODE_ENV === 'production' ? 'https://roastme.tocld.com' : origin;
```

**Issues**:
- In production Kubernetes, `window.location.origin` might be the container's internal URL
- `process.env.NODE_ENV` might not be set correctly in the container
- The fallback is hardcoded to `https://roastme.tocld.com`

**Fix Required**:
```typescript
// Use environment variable first, then fallback
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                (typeof window !== 'undefined' ? window.location.origin : 'https://roastme.tocld.com');
```

### 2. **Callback Route Hardcoded URLs** ⚠️ WARNING
**Location**: `/apps/web/src/app/auth/callback/route.ts`

Multiple places with hardcoded production URL:
```typescript
const baseUrl = process.env.NODE_ENV === 'production' ? 'https://roastme.tocld.com' : requestUrl.origin
```

**Issues**:
- Relies on NODE_ENV being set correctly
- No environment variable fallback
- Inconsistent with client-side URL generation

### 3. **Supabase Redirect URL Configuration** ❌ CRITICAL
**External Configuration Required**:

The OAuth flow requires these URLs to be configured in **THREE** places:

1. **Google Cloud Console** (OAuth 2.0 Client IDs):
   - Authorized redirect URIs must include:
     - `https://roastme.tocld.com/auth/callback`
     - `https://xpndmfhitpkbzhinfprf.supabase.co/auth/v1/callback`

2. **Supabase Dashboard** (Authentication > URL Configuration):
   - Site URL: `https://roastme.tocld.com`
   - Redirect URLs:
     - `https://roastme.tocld.com/auth/callback`
     - `https://roastme.tocld.com/auth/callback-simple`

3. **Kubernetes Secrets**: ✅ Already configured
   - `NEXT_PUBLIC_BASE_URL`: "https://roastme.tocld.com"
   - `NEXT_PUBLIC_APP_URL`: "https://roastme.tocld.com"

### 4. **Gateway Timeout During Callback** ⚠️ FIXED
**Location**: `/apps/web/src/app/auth/callback/route.ts:44-60`

Already fixed with:
- 8-second timeout on session exchange
- Async profile operations
- Fallback simple callback route

### 5. **Environment Variable Usage** ❌ ISSUE
**Problem**: `NEXT_PUBLIC_APP_URL` is defined but not used

The code checks for `process.env.NEXT_PUBLIC_APP_URL` but doesn't use it:
```typescript
console.log('🌐 NEXT_PUBLIC_APP_URL env var:', process.env.NEXT_PUBLIC_APP_URL);
```

But then doesn't use it for the actual redirect URL.

## OAuth Flow Sequence & Error Points

```mermaid
graph TD
    A[User Clicks Sign In] -->|1| B[AuthContext.signInWithGoogle]
    B -->|2| C{Generate Redirect URL}
    C -->|ERROR: Wrong URL| D[Supabase OAuth]
    D -->|3| E[Google OAuth Screen]
    E -->|4| F[Google Redirects to Callback]
    F -->|ERROR: URL Mismatch| G[/auth/callback Route]
    G -->|5| H{Exchange Code}
    H -->|ERROR: Timeout| I[Create Profile]
    I -->|6| J[Redirect to App]
```

## Required Actions to Fix

### 1. Update AuthContext.tsx
```typescript
const signInWithGoogle = async (returnTo?: string) => {
  // Use environment variable as primary source
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                  process.env.NEXT_PUBLIC_APP_URL ||
                  (typeof window !== 'undefined' ? window.location.origin : 'https://roastme.tocld.com');
  
  const callbackUrl = returnTo 
    ? `${baseUrl}/auth/callback?returnTo=${returnTo}`
    : `${baseUrl}/auth/callback`;
    
  console.log('OAuth using baseUrl:', baseUrl);
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    }
  });
```

### 2. Update Callback Routes
Use environment variable consistently:
```typescript
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                process.env.NODE_ENV === 'production' 
                  ? 'https://roastme.tocld.com' 
                  : requestUrl.origin;
```

### 3. External Configuration Checklist

#### Google Cloud Console
1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your OAuth 2.0 Client ID
3. Add to "Authorized redirect URIs":
   ```
   https://roastme.tocld.com/auth/callback
   https://roastme.tocld.com/auth/callback-simple
   https://xpndmfhitpkbzhinfprf.supabase.co/auth/v1/callback
   ```

#### Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/xpndmfhitpkbzhinfprf/auth/url-configuration
2. Set Site URL: `https://roastme.tocld.com`
3. Add to Redirect URLs:
   ```
   https://roastme.tocld.com/auth/callback
   https://roastme.tocld.com/auth/callback-simple
   https://roastme.tocld.com
   ```

### 4. Debug in Production
Use these endpoints to verify configuration:
```bash
# Check environment variables
curl https://roastme.tocld.com/api/auth-debug

# Test OAuth readiness
curl https://roastme.tocld.com/api/test-auth-callback

# Monitor callback timing
curl https://roastme.tocld.com/api/test-auth-exchange?test=true
```

## Most Likely Cause of Current Error

The bad gateway error is most likely caused by:

1. **Redirect URL Mismatch**: The client is generating a redirect URL that doesn't match what's configured in Google/Supabase
2. **Missing External Configuration**: Google Cloud Console and/or Supabase Dashboard don't have the correct callback URLs
3. **Environment Variable Not Available**: `NEXT_PUBLIC_BASE_URL` might not be available at build time in Kubernetes

## Immediate Fix Steps

1. **Verify External Services**:
   - Check Google Cloud Console OAuth redirect URIs
   - Check Supabase URL Configuration

2. **Deploy Code Fix**:
   ```bash
   # Update AuthContext.tsx to use NEXT_PUBLIC_BASE_URL
   # Build and deploy to Kubernetes
   ```

3. **Test with Debug Logging**:
   - The code already has console.log statements
   - Check browser console for the actual redirect URL being used
   - Check Kubernetes logs for callback attempts

4. **Use Fallback Route if Needed**:
   - Temporarily configure Google/Supabase to use `/auth/callback-simple`
   - This bypasses profile creation and should work immediately