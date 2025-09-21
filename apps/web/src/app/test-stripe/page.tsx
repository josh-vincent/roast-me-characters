'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function TestStripePage() {
  const [provider, setProvider] = useState('');
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/credits/packages');
      const data = await response.json();
      setProvider(data.provider || 'unknown');
      setPackages(data.packages || []);
    } catch (err) {
      setError('Failed to fetch configuration');
    } finally {
      setLoading(false);
    }
  };

  const testCheckout = async (productId: string) => {
    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      
      const data = await response.json();
      
      if (data.checkoutUrl) {
        console.log('Checkout URL:', data.checkoutUrl);
        toast.success('Redirecting to checkout...');
        window.location.href = data.checkoutUrl;
      } else {
        toast.error('Failed to create checkout session');
      }
    } catch (err) {
      toast.error('Error: ' + err);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Stripe Integration Test</h1>
      
      <div className="bg-gray-100 p-4 rounded-lg mb-8">
        <h2 className="text-xl font-semibold mb-4">Current Configuration</h2>
        <p><strong>Payment Provider:</strong> {provider}</p>
        <p className="text-sm text-gray-600 mt-2">
          {provider === 'stripe' 
            ? '✅ Stripe is configured and active' 
            : '⚠️ Stripe is not active. Set PAYMENT_PROVIDER=stripe in .env.local'}
        </p>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Available Packages</h2>
        
        {packages.length === 0 ? (
          <p className="text-gray-600">No packages available</p>
        ) : (
          <div className="grid gap-4">
            {packages.map((pkg) => (
              <div key={pkg.id} className="border p-4 rounded-lg">
                <h3 className="font-semibold">{pkg.name}</h3>
                <p className="text-gray-600">{pkg.description}</p>
                <p className="text-lg font-bold mt-2">${(pkg.price / 100).toFixed(2)}</p>
                <p className="text-sm text-gray-500">Product ID: {pkg.id}</p>
                <button
                  onClick={() => testCheckout(pkg.id)}
                  className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Test Checkout
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Test Instructions</h3>
        <ol className="list-decimal list-inside space-y-2 text-sm">
          <li>Ensure PAYMENT_PROVIDER=stripe in .env.local</li>
          <li>Set up your Stripe test keys (see STRIPE_SETUP.md)</li>
          <li>Use test card: 4242 4242 4242 4242</li>
          <li>Run webhook listener: stripe listen --forward-to localhost:3000/api/webhooks/stripe</li>
          <li>Click "Test Checkout" to test the payment flow</li>
        </ol>
      </div>
    </div>
  );
}