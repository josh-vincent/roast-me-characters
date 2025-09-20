'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImageUploadWithUrl } from '@roast-me/ui';
import { generateCharacter } from '../actions/character-actions';
import { useAuth } from '@/contexts/AuthContext';
import { SignupPrompt } from '@/components/SignupPrompt';

type WorkflowStep = 'upload' | 'generate';

export function CharacterUploadSection() {
  const router = useRouter();
  const { user, signInWithGoogle, loading, getCredits } = useAuth();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  
  const handleUpload = async (source: File | string) => {
    // Check credits before starting for authenticated users
    if (user) {
      const credits = await getCredits();
      if (credits <= 0) {
        setError('No credits remaining. Purchase more credits to continue.');
        return;
      }
    }

    setCurrentStep('generate');
    setIsProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      
      if (source instanceof File) {
        formData.append('image', source);
      } else {
        // For URL, we need to fetch and convert to File
        const response = await fetch(source);
        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: blob.type });
        formData.append('image', file);
      }
      
      const result = await generateCharacter(formData);
      
      if (!result.success) {
        setError(result.error || 'Character generation failed');
        if (result.requiresAuth) {
          setShowSignupPrompt(true);
        }
        setCurrentStep('upload');
      } else if (result.characterId) {
        // Show signup prompt for anonymous users
        if (!user) {
          setShowSignupPrompt(true);
        }
        
        // Redirect to generation tracking page
        router.push(`/generate/${result.characterId}`);
        return;
      } else {
        setError('Character generation failed');
        setCurrentStep('upload');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate character');
      setCurrentStep('upload');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      {currentStep === 'upload' ? (
        <div className="max-w-4xl mx-auto">
          {/* Upload Card */}
          <div className="bg-gradient-to-br from-purple-50 via-white to-blue-50 rounded-3xl border border-gray-200 overflow-hidden">
            <div className="p-12">
              <div className="text-center mb-8">
                
                
                {/* Credits Display - Always visible */}
                <div className="inline-flex items-center bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-xs">🔥</span>
                    </div>
                    <span className="text-gray-700 text-sm font-medium">
                      {loading ? (
                        <>Credits: <span className="text-purple-600 font-bold">Loading...</span></>
                      ) : user ? (
                        <>Credits: <span className="text-purple-600 font-bold">Available</span></>
                      ) : (
                        <>Free Trial: <span className="text-purple-600 font-bold">3 Images</span></>
                      )}
                    </span>
                    {/* Show appropriate action button */}
                    {!user ? (
                      <button
                        onClick={() => signInWithGoogle()}
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium ml-2 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-full transition-colors flex items-center space-x-1"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span>Sign in</span>
                      </button>
                    ) : user && (
                      <a 
                        href="/credits" 
                        className="text-xs text-purple-600 hover:text-purple-700 font-medium ml-2 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded-full transition-colors"
                      >
                        Get more
                      </a>
                    )}
                  </div>
                </div>
              </div>
              
              <ImageUploadWithUrl onUpload={handleUpload} isLoading={isProcessing} />
              
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800 font-medium">{error}</p>
                      <button 
                        onClick={() => setError(null)}
                        className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
                      >
                        Try again →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : currentStep === 'generate' ? (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden">
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-purple-100 via-purple-50 to-blue-50 rounded-full mb-8">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-purple-200 rounded-full animate-spin">
                    <div className="absolute top-0 left-0 w-4 h-4 bg-purple-600 rounded-full"></div>
                  </div>
                </div>
              </div>
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Creating your roast</h2>
              <p className="text-xl text-gray-600 mb-6">Our AI is hilariously exaggerating your features</p>
              
              <div className="max-w-md mx-auto mb-8">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Progress</span>
                  <span className="text-sm text-purple-600 font-medium">Working...</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full animate-pulse w-3/4"></div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
                <div className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Analyzing</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mb-2 animate-pulse">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Generating</span>
                </div>
                <div className="flex flex-col items-center p-4 bg-gray-50 rounded-xl opacity-50">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-500">Complete</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-500">This usually takes 15-30 seconds</p>
            </div>
          </div>
        </div>
      ) : null}
      
      {/* Signup Prompt Modal */}
      {showSignupPrompt && (
        <SignupPrompt 
          onClose={() => setShowSignupPrompt(false)}
          onSignup={() => {
            setShowSignupPrompt(false);
            // User profile will be refreshed via auth state change
          }}
        />
      )}
    </div>
  );
}