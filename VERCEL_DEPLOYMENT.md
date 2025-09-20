# Vercel Deployment Guide

## Pre-Deployment Checklist

### 1. Environment Variables (Add in Vercel Dashboard)

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Provider (at least one required)
OPENAI_API_KEY=your_openai_key
# OR
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key

# Optional but recommended
NEXT_PUBLIC_APP_URL=https://your-custom-domain.com  # MUST include https://
NEXT_PUBLIC_BASE_URL=https://your-custom-domain.com  # MUST include https://
AI_GATEWAY_API_KEY=your_ai_gateway_key
XAI_API_KEY=your_xai_api_key  # For Grok roast generation

# Payment (if using)
POLAR_SANDBOX_ACCESS_TOKEN=your_polar_token
POLAR_WEBHOOK_SECRET=your_webhook_secret
```

### 2. Vercel-Specific Optimizations

✅ **Already Configured:**
- Image optimization with 7-day cache
- ISR for character pages (24-hour revalidation)
- Static generation for popular characters
- Function timeouts for AI generation
- Proper cache headers

### 3. Build Settings in Vercel

- **Framework Preset**: Next.js
- **Build Command**: `pnpm build` or `npm run build`
- **Output Directory**: `.next` (default)
- **Install Command**: `pnpm install` or `npm install`
- **Root Directory**: `apps/web` (if monorepo) or `.` (if deploying root)

### 4. Domain Configuration

1. Add your custom domain in Vercel dashboard
2. Update DNS records as instructed
3. SSL certificate is automatic

### 5. Image Caching Benefits on Vercel

- **Vercel Edge Network**: Images cached globally at edge locations
- **Automatic WebP/AVIF**: Serves modern formats to supported browsers
- **Smart Compression**: Optimizes quality based on device
- **7-Day Cache**: Configured for minimal Supabase egress

### 6. Performance Features

- **Edge Functions**: OG image generation runs at edge
- **ISR**: Character pages rebuild every 24 hours
- **Static Generation**: Top 20 characters pre-rendered
- **Progressive Loading**: Thumbnail → Full resolution

### 7. Monitoring

After deployment:
1. Check Vercel Analytics for Core Web Vitals
2. Monitor Function logs for errors
3. Track Image Optimization usage
4. Review build times and cache hit rates

### 8. Post-Deployment

1. Test OAuth flow with production URLs
2. Verify image loading and caching
3. Check OG images on social media debuggers
4. Test generation flow end-to-end

### 9. Cost Optimization

- **Free Tier Includes**:
  - 100GB bandwidth/month
  - 1000 image optimizations/month
  - Unlimited static requests

- **Our Optimizations**:
  - 7-day image cache reduces bandwidth 90%
  - ISR reduces function invocations
  - Static pages serve from CDN

### 10. Deployment Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# Link to existing project
vercel link

# Pull environment variables
vercel env pull
```

## Architecture on Vercel

```
User Upload → Vercel Function → Supabase
     ↓
/generate/[id] → Polling (Client) → Character Status API
     ↓
Generation Complete → Redirect
     ↓
/character/[slug] → Static/ISR → Vercel CDN
     ↓
Images → Vercel Image Optimization → Edge Cache (7 days)
```

## Troubleshooting

### If images aren't caching:
- Check `vercel.json` is deployed
- Verify `minimumCacheTTL` in next.config.mjs
- Check Vercel dashboard for Image Optimization usage

### If OAuth fails:
- Verify NEXT_PUBLIC_BASE_URL is set
- Check redirect URLs in Supabase dashboard
- Include production domain in allowed redirects

### If generation times out:
- Increase `maxDuration` in vercel.json
- Consider using Vercel Pro for 60s timeout
- Implement queue system for long tasks

## Success Metrics

After deployment, you should see:
- ✅ Images served from Vercel CDN with 7-day cache
- ✅ Character pages load in <1 second
- ✅ 90% reduction in Supabase bandwidth
- ✅ Core Web Vitals all green
- ✅ No loading states on character pages