'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Suspense } from 'react';

function CreditsSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { userProfile, refreshUserProfile } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      try {
        const customerSessionToken = searchParams.get('customer_session_token');
        
        if (customerSessionToken) {
          // Give Polar webhooks a moment to process
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Refresh user profile to get updated credits
          await refreshUserProfile();
        }
        
        setIsProcessing(false);
      } catch (err) {
        console.error('Error processing payment:', err);
        setError('There was an issue processing your payment. Please contact support.');
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [searchParams, refreshUserProfile]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-100 via-purple-50 to-blue-50 rounded-full mb-6">
            <div className="relative">
              <div className="w-8 h-8 border-4 border-purple-200 rounded-full animate-spin">
                <div className="absolute top-0 left-0 w-2 h-2 bg-purple-600 rounded-full"></div>
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Processing Payment</h1>
          <p className="text-gray-600">Please wait while we confirm your purchase...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/credits')}
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful! 🎉</h1>
        <p className="text-gray-600 mb-6">
          Your credits have been added to your account and you're ready to create more amazing roast characters!
        </p>

        {/* Credits Display */}
        {userProfile && (
          <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">🔥</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">
                {userProfile.plan === 'free' ? (
                  <>Current Credits: <span className="text-purple-600">{userProfile.credits}</span></>
                ) : (
                  <span className="text-purple-600">Unlimited Credits</span>
                )}
              </span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => router.push('/')}
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors"
          >
            Start Creating Characters
          </button>
          
          <button
            onClick={() => router.push('/credits')}
            className="w-full inline-flex items-center justify-center px-6 py-3 bg-white text-purple-600 font-medium rounded-xl border border-purple-200 hover:bg-purple-50 transition-colors"
          >
            Buy More Credits
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CreditsSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-200 rounded-full animate-spin mx-auto mb-4">
            <div className="absolute top-0 left-0 w-2 h-2 bg-purple-600 rounded-full"></div>
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <CreditsSuccessContent />
    </Suspense>
  );
}