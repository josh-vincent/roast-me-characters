'use client';

import { useEffect } from 'react';

export function useAnonymousSession() {
  useEffect(() => {
    // Check if user already has a session ID
    let sessionId = localStorage.getItem('anonSessionId');
    
    if (!sessionId) {
      // Generate a new session ID for anonymous users
      sessionId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('anonSessionId', sessionId);
    }
  }, []);

  const getSessionId = () => {
    return localStorage.getItem('anonSessionId');
  };

  const clearSessionId = () => {
    localStorage.removeItem('anonSessionId');
  };

  return {
    getSessionId,
    clearSessionId
  };
}