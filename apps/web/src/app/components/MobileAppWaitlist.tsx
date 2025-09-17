'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function MobileAppWaitlist() {
  const { user, userProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  // Auto-populate email for authenticated users
  useEffect(() => {
    if (user?.email && !userProfile?.is_anonymous) {
      setEmail(user.email);
    }
  }, [user?.email, userProfile?.is_anonymous]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, source: 'web' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join waitlist');
      }

      setIsSubmitted(true);
      setEmail('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <section className="bg-gradient-to-br from-purple-50 to-orange-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-purple-100">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              You're on the list!
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Thanks for signing up! We'll notify you as soon as the mobile app is ready.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="text-purple-600 hover:text-purple-700 font-medium"
            >
              Sign up another email
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gradient-to-br from-purple-50 to-orange-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-purple-100">
          <div className="text-6xl mb-6">📱</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Mobile App Coming Soon!
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Get ready to create hilarious roast figurines on the go! Be the first to know when our mobile app launches.
          </p>
          
          {user?.email && !userProfile?.is_anonymous ? (
            // Authenticated user - show full-width button without input
            <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  Get notified at: <span className="font-medium text-gray-900">{user.email}</span>
                </p>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white px-8 py-4 rounded-lg font-medium text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Joining Waitlist...
                    </div>
                  ) : (
                    'Notify Me When the App is Ready 📱'
                  )}
                </button>
              </div>
              {error && (
                <p className="text-red-600 text-sm mt-4 text-center">{error}</p>
              )}
            </form>
          ) : (
            // Anonymous user - show email input form
            <form onSubmit={handleSubmit} className="max-w-md mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Joining...
                    </div>
                  ) : (
                    'Join Waitlist'
                  )}
                </button>
              </div>
              {error && (
                <p className="text-red-600 text-sm mt-3">{error}</p>
              )}
            </form>
          )}
          
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>No spam, ever</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Early access</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Special launch offers</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}