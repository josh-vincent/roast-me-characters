'use client';

import { useState } from 'react';
import { debugCharacter } from './actions';

export default function DebugPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleDebug = async () => {
    setLoading(true);
    try {
      const slug = 'cartoon-character-beard-smile-mfmk9rqq';
      const debugResult = await debugCharacter(slug);
      setResult(debugResult);
    } catch (error) {
      setResult({ error: 'Debug failed', details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Character Debug</h1>
      
      <button 
        onClick={handleDebug}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? 'Debugging...' : 'Debug Character: cartoon-character-beard-smile-mfmk9rqq'}
      </button>
      
      {result && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Debug Results:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}