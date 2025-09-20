'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Suspense } from 'react';
import { Header } from '../../components/Header';

function CreditsSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, getCredits } = useAuth();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCredits, setCurrentCredits] = useState<number>(0);

  useEffect(() => {
    const processPayment = async () => {
      try {
        const customerSessionToken = searchParams.get('customer_session_token');
        
        if (customerSessionToken) {
          // Process the payment confirmation
          console.log('Processing payment with token:', customerSessionToken);
          
          // Wait a moment for the webhook to process
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Fetch updated credits
          if (user) {
            const credits = await getCredits();
            setCurrentCredits(credits);
          }
        } else {
          // No token, just show success
          if (user) {
            const credits = await getCredits();
            setCurrentCredits(credits);
          }
        }
        
        setIsProcessing(false);
      } catch (err) {
        console.error('Error processing payment:', err);
        setError('There was an issue confirming your payment. Please contact support if your credits are not updated.');
        setIsProcessing(false);
      }
    };

    processPayment();
  }, [searchParams, user, getCredits]);

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600 mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Your Purchase...</h1>
          <p className="text-gray-600">Please wait while we confirm your payment.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Processing Issue</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <a 
            href="/credits"
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
          >
            Return to Credits Page
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <Header />
      
      <div className="bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center max-w-md">
          {/* Success Icon */}
          <div className="text-6xl mb-6 animate-bounce">🎉</div>
          
          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Payment Successful!
          </h1>
          
          <p className="text-gray-600 mb-8">
            Thank you for your purchase! Your credits have been added to your account.
          </p>
          
          {/* Credits Display */}
          {user && (
          <div className="inline-flex items-center bg-white rounded-full px-6 py-3 shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold">🔥</span>
              </div>
              <div>
                <span className="text-gray-700 font-medium">Your Credits: </span>
                <span className="text-purple-600 font-bold text-xl">{currentCredits}</span>
              </div>
            </div>
          </div>
          )}
          
          {/* Action Buttons */}
          <div className="space-y-3">
          <a 
            href="/"
            className="block w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Create a Roast Character
          </a>
          
          <a 
            href="/credits"
            className="block w-full px-6 py-3 bg-white text-purple-600 border-2 border-purple-600 hover:bg-purple-50 font-medium rounded-lg transition-colors"
          >
            View Credit Packages
          </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreditsSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-600 mx-auto mb-6"></div>
          <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
        </div>
      </div>
    }>
      <CreditsSuccessContent />
    </Suspense>
  );
}