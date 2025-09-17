/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@roast-me/ui", "@roast-me/database", "@roast-me/types", "@roast-me/ai"],
  images: {
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
    minimumCacheTTL: 60,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb'
    }
  }
};

export default nextConfig;