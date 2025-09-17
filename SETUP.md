# Setup Instructions for Roast Me Characters

This guide will help you set up the project with all necessary services and configurations.

## Prerequisites

- Node.js 20+ and pnpm 9+
- Supabase account (free tier works)
- OpenAI API key (for AI features)
- Git

## Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/roast-me-characters.git
cd roast-me-characters

# Install dependencies
pnpm install
```

## Step 2: Supabase Setup

### 2.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Fill in:
   - Project name: `roast-me-characters`
   - Database password: (save this securely)
   - Region: Choose closest to your users

### 2.2 Run Database Schema

1. In Supabase Dashboard, go to SQL Editor
2. Click "New Query"
3. Copy the entire contents of `supabase/schema.sql`
4. Paste and click "Run"

### 2.3 Enable Storage

1. Go to Storage in Supabase Dashboard
2. Click "Create Bucket"
3. Name it `uploads`
4. Set it to "Public" (for image serving)
5. Add these MIME types to allowed:
   - image/jpeg
   - image/png
   - image/webp
   - model/gltf+json
   - model/gltf-binary

### 2.4 Get API Keys

1. Go to Settings > API
2. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon/Public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service role key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret!)

## Step 3: OpenAI Setup

1. Go to [OpenAI Platform](https://platform.openai.com)
2. Create an API key
3. Copy the key for `OPENAI_API_KEY`

## Step 4: Environment Configuration

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-key

# OpenAI Configuration
OPENAI_API_KEY=sk-...your-openai-key

# Optional: If you have AI Gateway
AI_GATEWAY_API_KEY=your_gateway_key
```

## Step 5: Run the Application

### Development Mode

```bash
# Run all apps
pnpm dev

# Or run specific apps
pnpm web      # Web app only
pnpm mobile   # Mobile app only
```

Access the web app at: http://localhost:3000

### Production Build

```bash
# Build all apps
pnpm build

# Test production build
pnpm start
```

## Step 6: Mobile App Setup (Optional)

### For iOS (Mac only)

```bash
cd apps/mobile
pnpm ios
```

### For Android

```bash
cd apps/mobile
pnpm android
```

### Using Expo Go

1. Install Expo Go on your phone
2. Run `pnpm mobile`
3. Scan the QR code with Expo Go

## Troubleshooting

### Common Issues

1. **"Cannot find module" errors**
   ```bash
   pnpm install
   pnpm clean
   ```

2. **Supabase connection failed**
   - Check your `.env` file has correct URLs
   - Ensure Supabase project is active
   - Check network/firewall settings

3. **OpenAI API errors**
   - Verify API key is active
   - Check you have credits/billing set up
   - Ensure GPT-4 Vision access is enabled

4. **3D rendering issues**
   - Update graphics drivers
   - Try different browser (Chrome/Edge recommended)
   - Check WebGL support: https://get.webgl.org

### Database Reset

If you need to reset the database:

```sql
-- Run in Supabase SQL Editor
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Then re-run schema.sql
```

## Next Steps

1. **Authentication**: Set up Supabase Auth providers
2. **Custom Domain**: Configure for production
3. **Monitoring**: Add error tracking (Sentry)
4. **Analytics**: Add usage tracking
5. **CDN**: Configure for assets

## Support

- GitHub Issues: [Report bugs](https://github.com/yourusername/roast-me-characters/issues)
- Documentation: See `/docs` folder
- PRD: Read `PRD.md` for full specifications

## Development Tips

- Use `pnpm dev` for hot-reloading
- Check `turbo.json` for build pipeline
- Shared packages are in `/packages`
- Type safety: Run `pnpm type-check`
- Linting: Run `pnpm lint`

Happy coding! 🎨🤖