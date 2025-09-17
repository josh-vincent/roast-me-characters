'use client';

import { useState } from 'react';
import { Button, LoadingSpinner } from '@roast-me/ui';

export default function TestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAIGateway = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-ai');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Failed to test' });
    } finally {
      setLoading(false);
    }
  };

  const testSupabase = async () => {
    setLoading(true);
    try {
      // Test if Supabase is configured
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      setResult({
        supabase: {
          configured: !!supabaseUrl,
          url: supabaseUrl ? 'Configured' : 'Not configured'
        }
      });
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Failed to test' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8">System Test Page</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration Status</h2>
          
          <div className="space-y-2 mb-6">
            <div className="flex items-center">
              <span className="font-medium w-48">Supabase URL:</span>
              <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configured' : '❌ Not configured'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-48">Supabase Anon Key:</span>
              <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}>
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configured' : '❌ Not configured'}
              </span>
            </div>
            <div className="flex items-center">
              <span className="font-medium w-48">AI Gateway (server-side):</span>
              <span className="text-gray-600">Check via API test</span>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button onClick={testAIGateway} isLoading={loading}>
              Test AI Gateway
            </Button>
            <Button onClick={testSupabase} isLoading={loading} variant="secondary">
              Test Supabase
            </Button>
          </div>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-3">Test Result:</h3>
            <pre className="bg-gray-100 p-4 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {loading && (
          <div className="flex justify-center mt-8">
            <LoadingSpinner size="lg" />
          </div>
        )}
      </div>
    </div>
  );
}