'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (errorParam) {
      setError(errorDescription || errorParam);
    } else {
      setError('An authentication error occurred');
    }
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Error</h1>
          
          <div className="text-gray-600 mb-6">
            <p className="mb-2">We encountered an issue signing you in:</p>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
          
          <div className="space-y-3">
            <Link 
              href="/"
              className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Try Again
            </Link>
            
            <Link 
              href="/"
              className="block w-full text-gray-600 hover:text-gray-900 font-medium py-2 transition-colors"
            >
              Return to Home
            </Link>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              If this problem persists, please contact support.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
        <div className="container mx-auto px-4 max-w-md">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
          </div>
        </div>
      </main>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}