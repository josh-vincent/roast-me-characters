'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface CreditPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
}

export default function CreditsPage() {
  const { userProfile, signInWithGoogle, user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch('/api/credits/packages');
        const data = await response.json();
        setPackages(data.packages || []);
      } catch (error) {
        console.error('Error fetching packages:', error);
      } finally {
        setPackagesLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const handlePurchase = async (productId: string) => {
    if (!userProfile) return;

    // If user is anonymous, prompt them to sign in first
    if (userProfile.is_anonymous) {
      const shouldSignIn = confirm(
        'To purchase credits and keep them safe, you need to sign in with Google first. Would you like to sign in now?'
      );
      if (shouldSignIn) {
        await signInWithGoogle('credits');
        return; // Exit here, user will be redirected to Google OAuth
      } else {
        return; // User declined to sign in
      }
    }

    setLoading(productId);
    
    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      const data = await response.json();
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error purchasing credits:', error);
      alert('Failed to start purchase. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  if (!userProfile || packagesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Get More Roast Credits</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create more hilarious caricature roasts! Each credit lets you generate one unique roast character.
          </p>
          
          {/* Current Credits Display */}
          <div className="mt-8 inline-flex items-center bg-white rounded-full px-6 py-3 shadow-sm border border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm">🔥</span>
              </div>
              <span className="text-gray-700 font-medium">Your Credits:</span>
              <span className="text-purple-600 font-bold text-lg">{userProfile.credits}</span>
            </div>
          </div>
        </div>

        {/* Auth Notice for Anonymous Users */}
        {userProfile.is_anonymous && (
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-blue-900 font-semibold mb-1">Sign in to save your credits</h3>
                <p className="text-blue-700 text-sm mb-3">
                  Create an account to keep track of your credits and roast history across devices.
                </p>
                <button
                  onClick={() => signInWithGoogle('credits')}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Credit Packages */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {packages.map((pkg, index) => (
            <div
              key={pkg.id}
              className={`relative bg-white rounded-2xl shadow-sm border-2 overflow-hidden ${
                index === 1 ? 'border-purple-300 scale-105' : 'border-gray-200'
              }`}
            >
              {/* Best Value Badge */}
              {index === 1 && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="bg-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold">
                    BEST VALUE
                  </div>
                </div>
              )}

              <div className="p-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                  <p className="text-gray-600 text-sm mb-6">{pkg.description}</p>
                  
                  <div className="mb-6">
                    <div className="text-4xl font-bold text-gray-900 mb-1">
                      ${(pkg.price / 100).toFixed(2)}
                    </div>
                    <div className="text-purple-600 font-medium">
                      ${((pkg.price / 100) / pkg.credits).toFixed(2)} per roast
                    </div>
                  </div>

                  <button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={loading === pkg.id}
                    className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                      index === 1
                        ? 'bg-purple-600 text-white hover:bg-purple-700 disabled:bg-purple-400'
                        : 'bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-400'
                    }`}
                  >
                    {loading === pkg.id ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Processing...
                      </div>
                    ) : (
                      userProfile?.is_anonymous ? `Sign In & Get ${pkg.credits} Credits` : `Get ${pkg.credits} Credits`
                    )}
                  </button>
                </div>

                {/* Features List */}
                <div className="mt-6 space-y-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Generate {pkg.credits} roast characters
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    High-resolution downloads
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Commercial license included
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Credits never expire
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">How do credits work?</h3>
              <p className="text-gray-600 text-sm">
                Each credit allows you to generate one unique roast character. Credits are consumed when your character generation completes successfully.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Do credits expire?</h3>
              <p className="text-gray-600 text-sm">
                No! Your credits never expire. Use them whenever you want to create more hilarious roast characters.
              </p>
            </div>
            
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-2">Can I use the images commercially?</h3>
              <p className="text-gray-600 text-sm">
                Yes! All generated roast characters come with a commercial license, so you can use them for personal or business purposes.
              </p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-12">
          <a
            href="/"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Create Characters
          </a>
        </div>
      </div>
    </div>
  );
}