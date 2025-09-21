'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '../components/Header';
import { toast } from 'sonner';

interface CreditPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
}

export default function CreditsPage() {
  const { signInWithGoogle, user, getCredits, getCreditBalance } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [creditBalance, setCreditBalance] = useState<any>(null);
  const [paymentProvider, setPaymentProvider] = useState<string>('');

  useEffect(() => {
    // Fetch available packages
    const fetchPackages = async () => {
      try {
        const response = await fetch('/api/credits/packages');
        const data = await response.json();
        setPackages(data.packages || []);
        setPaymentProvider(data.provider || 'stripe');
      } catch (error) {
        console.error('Error fetching packages:', error);
      } finally {
        setPackagesLoading(false);
      }
    };

    fetchPackages();
  }, []);

  useEffect(() => {
    // Fetch user credit balance if logged in
    const fetchCredits = async () => {
      if (user) {
        if (getCreditBalance) {
          const balance = await getCreditBalance();
          setCreditBalance(balance);
        } else {
          // Fallback to old getCredits for backward compatibility
          const credits = await getCredits();
          setCreditBalance({ totalAvailable: credits });
        }
      }
    };

    fetchCredits();
  }, [user, getCredits, getCreditBalance]);

  const handlePurchase = async (productId: string) => {
    if (!user) {
      toast('Sign in required', {
        description: 'Please sign in with Google to purchase credits',
        action: {
          label: 'Sign in',
          onClick: () => signInWithGoogle('credits')
        },
      });
      return;
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
        toast.success('Redirecting to checkout...');
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error purchasing credits:', error);
      toast.error('Purchase failed', {
        description: 'Unable to start purchase. Please try again.',
        action: {
          label: 'Retry',
          onClick: () => handlePurchase(productId)
        }
      });
    } finally {
      setLoading(null);
    }
  };

  if (packagesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <Header />
      
      <div className="bg-gradient-to-b from-gray-50 to-gray-100 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Page Header */}
          <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-orange-500 bg-clip-text text-transparent">
              Get More Credits
            </h1>
            <p className="text-gray-600 text-lg mb-6">
              Create more hilarious roast characters with our credit packages
            </p>
            
            {/* Current Credits Display */}
            {user && creditBalance && (
              <div className="inline-flex flex-col items-center space-y-2">
                <div className="inline-flex items-center bg-white rounded-full px-6 py-3 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-bold">🔥</span>
                    </div>
                    <div>
                      <span className="text-gray-700 font-medium">Total Credits: </span>
                      <span className="text-purple-600 font-bold text-xl">{creditBalance.totalAvailable || 0}</span>
                    </div>
                  </div>
                </div>
                {creditBalance.dailyAvailable !== undefined && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Daily: {creditBalance.dailyAvailable}/3</span>
                    {creditBalance.purchasedCredits > 0 && (
                      <span className="ml-3">Purchased: {creditBalance.purchasedCredits}</span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Credit Packages */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
          {packages.map((pkg) => (
            <div 
              key={pkg.id} 
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden border border-gray-200"
            >
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {pkg.name}
                </h3>
                <p className="text-gray-600 mb-6">
                  {pkg.description}
                </p>
                
                <div className="mb-6">
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    ${(pkg.price / 100).toFixed(2)}
                  </div>
                  <div className="text-gray-500">
                    {pkg.credits} credits
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    ${((pkg.price / 100) / pkg.credits).toFixed(2)} per roast
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(pkg.id)}
                  disabled={loading !== null}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                    loading === pkg.id
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white'
                  }`}
                >
                  {loading === pkg.id ? 'Processing...' : 'Purchase'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How do credits work?</h3>
              <p className="text-gray-600">
                Each roast character generation costs 1 credit. You get 3 free daily credits that reset every 24 hours. Need more? Purchase credit packages that never expire!
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">When do daily credits reset?</h3>
              <p className="text-gray-600">
                Your 3 daily credits reset automatically at midnight UTC. The app will always use your daily credits first before using purchased credits.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Do purchased credits expire?</h3>
              <p className="text-gray-600">
                No! Purchased credits never expire. Use them at your own pace. Daily credits reset every 24 hours.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards, debit cards, and digital wallets through our secure payment processor.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Is my payment information secure?</h3>
              <p className="text-gray-600">
                Yes! We use industry-standard encryption and never store your payment details. All transactions are processed securely through {paymentProvider === 'stripe' ? 'Stripe' : 'our payment processor'}.
              </p>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}