'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ImageUploadWithUrl } from '@roast-me/ui';
import { generateCharacter } from '../actions/character-actions';
import { useAuth } from '@/contexts/AuthContext';
import { SignupPrompt } from '@/components/SignupPrompt';
import { useAnonymousSession } from '@/hooks/useAnonymousSession';
import { toast } from 'sonner';
import { getErrorInfo, isRecoverableError, formatErrorForToast } from '@/lib/error-messages';

type WorkflowStep = 'upload' | 'generate';

export function CharacterUploadSection() {
  const router = useRouter();
  const { user, signInWithGoogle, loading, getCredits, getCreditBalance } = useAuth();
  const { getSessionId } = useAnonymousSession();
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignupPrompt, setShowSignupPrompt] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [creditBalance, setCreditBalance] = useState<{
    dailyAvailable: number;
    purchasedCredits: number;
    totalAvailable: number;
  } | null>(null);
  const [canUpload, setCanUpload] = useState(true);
  
  // Pre-fetch credits when component mounts or user changes
  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const balance = await getCreditBalance();
        if (balance) {
          setCreditBalance({
            dailyAvailable: balance.dailyAvailable,
            purchasedCredits: balance.purchasedCredits,
            totalAvailable: balance.totalAvailable
          });
          setUserCredits(balance.totalAvailable);
          setCanUpload(balance.totalAvailable > 0);
          
          // Proactive warnings based on credit type
          if (user) {
            if (balance.totalAvailable === 1 && balance.purchasedCredits === 0) {
              toast.info('Last daily credit!', {
                description: 'This is your last free credit for today',
                action: {
                  label: 'Get More',
                  onClick: () => router.push('/credits')
                }
              });
            } else if (balance.totalAvailable === 0) {
              toast.warning('No credits remaining', {
                description: balance.dailyAvailable === 0 ? 
                  'Daily credits used. Purchase more or wait until tomorrow.' : 
                  'Purchase credits to continue creating',
                action: {
                  label: 'Get Credits',
                  onClick: () => router.push('/credits')
                }
              });
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch credits:', err);
        // Default for anonymous users
        if (!user) {
          setCreditBalance({
            dailyAvailable: 3,
            purchasedCredits: 0,
            totalAvailable: 3
          });
          setCanUpload(true);
        }
      }
    };
    
    fetchCredits();
  }, [user, getCreditBalance, router]);
  
  const handleUpload = async (source: File) => {
    // Pre-flight credit check for authenticated users
    if (user && !canUpload) {
      toast.error('No credits remaining', {
        description: 'Purchase more credits to continue creating characters',
        action: {
          label: 'Get Credits',
          onClick: () => router.push('/credits')
        },
        duration: 5000
      });
      return;
    }
    
    // Double-check credits just before upload for authenticated users
    if (user) {
      const currentCredits = await getCredits();
      if (currentCredits <= 0) {
        setCanUpload(false);
        toast.error('No credits remaining', {
          description: 'Your credits have been used. Purchase more to continue.',
          action: {
            label: 'Get Credits',
            onClick: () => router.push('/credits')
          }
        });
        return;
      }
      setUserCredits(currentCredits);
    }

    setCurrentStep('generate');
    setIsProcessing(true);
    setError(null);
    toast.info('🎨 Starting character generation...', {
      description: 'This usually takes 30-60 seconds'
    });
    
    try {
      const formData = new FormData();
      
      // Add the file to form data
      formData.append('image', source);
      
      // Add anonymous session ID if user is not authenticated
      if (!user) {
        const sessionId = getSessionId();
        if (sessionId) {
          formData.append('anonSessionId', sessionId);
        }
      }
      
      const result = await generateCharacter(formData);
      
      if (!result || !result.success) {
        const errorInfo = getErrorInfo(result?.error || 'generation_failed');
        const toastConfig = formatErrorForToast(result?.error);
        
        toast.error(toastConfig.title, {
          description: toastConfig.description,
          duration: toastConfig.duration,
          action: result?.requiresAuth ? {
            label: 'Sign in',
            onClick: () => signInWithGoogle()
          } : toastConfig.recoverable ? {
            label: 'Try again',
            onClick: () => handleUpload(source)
          } : undefined
        });
        
        if (result?.requiresAuth) {
          setShowSignupPrompt(true);
        }
        setCurrentStep('upload');
      } else if (result?.characterId) {
        // Show signup prompt for anonymous users
        if (!user) {
          setShowSignupPrompt(true);
        }
        
        toast.success('Character created!', {
          description: 'Redirecting to your character page...'
        });
        
        // Redirect to generation tracking page
        router.push(`/generate/${result.characterId}`);
        return;
      } else {
        toast.error('Unexpected error', {
          description: 'Character generation failed. Please try again.'
        });
        setCurrentStep('upload');
      }
    } catch (err) {
      const toastConfig = formatErrorForToast(err);
      
      toast.error(toastConfig.title, {
        description: toastConfig.description,
        duration: toastConfig.duration,
        action: toastConfig.recoverable ? {
          label: 'Try again',
          onClick: () => handleUpload(source)
        } : undefined
      });
      
      setCurrentStep('upload');
      setError(toastConfig.title);
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
            <div className="p-8">
              {/* Credits Display - Above upload */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-xs">🔥</span>
                    </div>
                    <span className="text-gray-700 text-sm font-medium">
                      {loading ? (
                        <>Credits: <span className="text-purple-600 font-bold">Loading...</span></>
                      ) : creditBalance ? (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            {creditBalance.dailyAvailable > 0 && (
                              <span className="text-xs">
                                Daily: <span className="text-purple-600 font-bold">{creditBalance.dailyAvailable}/3</span>
                              </span>
                            )}
                            {creditBalance.purchasedCredits > 0 && (
                              <span className="text-xs">
                                Purchased: <span className="text-blue-600 font-bold">{creditBalance.purchasedCredits}</span>
                              </span>
                            )}
                            {creditBalance.totalAvailable === 0 && (
                              <span className="text-xs text-red-600">No credits</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <>Free Trial: <span className="text-purple-600 font-bold">3 Daily</span></>
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
              
              {/* Upload Area */}
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
              {/* Simple Loading Animation */}
              <div className="text-6xl mb-6 animate-pulse">
                🔍
              </div>
              
              <h2 className="text-2xl font-bold mb-3 text-gray-900">
                Analyzing Your Photo
              </h2>
              
              <p className="text-gray-600 mb-8">
                Detecting features...
              </p>
              
              {/* Simple spinner */}
              <div className="flex justify-center">
                <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin border-t-purple-600"></div>
              </div>
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