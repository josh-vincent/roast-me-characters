/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove 'standalone' for Vercel (it handles this automatically)
  // output: 'standalone',
  transpilePackages: ["@roast-me/ui", "@roast-me/database", "@roast-me/types", "@roast-me/ai"],
  async headers() {
    return [
      {
        // Apply aggressive caching to Next.js Image API endpoints
        source: '/_next/image',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400', // 7 days cache, 1 day stale
          },
        ],
      },
      {
        // Apply caching to static assets
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 year for static assets
          },
        ],
      },
      {
        // Apply caching to font files
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 year for fonts
          },
        ],
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'], // Enable modern image formats
    deviceSizes: [320, 420, 768, 1024, 1200], // Optimize for common device sizes
    imageSizes: [16, 32, 48, 64, 96, 128, 256], // Optimize for common image sizes
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com'
      },
      {
        protocol: 'https',
        hostname: '*.redd.it'
      },
      {
        protocol: 'https',
        hostname: '*.media-amazon.com'
      },
      {
        protocol: 'https',
        hostname: '*.tocld.com'
      }
    ],
    minimumCacheTTL: 604800, // 7 days in seconds
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  }
};

export default nextConfig;