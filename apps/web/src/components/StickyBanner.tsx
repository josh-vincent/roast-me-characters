'use client';

import Link from 'next/link';

export function StickyBanner() {
  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-orange-500 to-purple-600 text-white shadow-lg">
      <Link href="/" className="block">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center space-x-2">
            <span className="text-2xl">🔥</span>
            <span className="font-bold text-lg tracking-wide">roastme.tocld.com</span>
            <span className="hidden sm:inline text-sm opacity-90 ml-2">| Click to Generate Your Roast</span>
          </div>
        </div>
      </Link>
    </div>
  );
}