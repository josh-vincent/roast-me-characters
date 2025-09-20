import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '🔥 Roast Me Characters - AI Roast Figurine Generator',
  description: 'Transform your selfies into hilarious collectible figurines! Our AI creates brutally funny roast characters with exaggerated features. Upload a photo and get roasted in 3D!',
  keywords: 'AI roast generator, funny figurines, caricature maker, roast me, AI art generator, 3D character creator, humor, comedy, collectibles',
  authors: [{ name: 'Roast Me Characters' }],
  creator: 'Roast Me Characters',
  publisher: 'Roast Me Characters',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://roastme.tocld.com'),
  openGraph: {
    title: '🔥 Roast Me Characters - Turn Your Photo Into a Hilarious Figurine',
    description: 'Get roasted! Our AI transforms your photos into brutally funny collectible figurines with exaggerated features. Join thousands getting their hilarious 3D roast characters!',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://roastme.tocld.com',
    siteName: '🔥 Roast Me Characters',
    images: [
      {
        url: '/api/og',
        width: 1200,
        height: 630,
        alt: 'Roast Me Characters - AI Roast Figurine Generator',
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '🔥 Roast Me Characters',
    description: 'Turn your selfie into a hilarious roast figurine! AI-powered caricature generator that creates brutally funny collectibles.',
    site: '@roastme_chars',
    creator: '@roastme_chars',
    images: ['/api/og'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '🔥',
    shortcut: '🔥',
    apple: '🔥',
  },
  manifest: '/manifest.json',
  other: {
    'og:image:width': '1200',
    'og:image:height': '630',
    'fb:app_id': process.env.NEXT_PUBLIC_FB_APP_ID || '',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}