'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LoadingSpinner } from '@roast-me/ui';
import { retryCharacterGeneration } from '../../actions/character-actions';
import { GenerationProgress } from '@/components/GenerationProgress';

interface Character {
  id: string;
  seo_slug?: string;
  generation_params?: {
    status?: string;
    attempt?: number;
    error?: string;
    roast_content?: {
      title: string;
      roast_text: string;
      punchline: string;
      figurine_name: string;
    };
    original_image_url?: string;
    features?: Array<{
      feature_name: string;
      feature_value: string;
      exaggeration_factor: number;
    }>;
  };
  image?: {
    file_url: string;
  };
  model_url?: string;
  thumbnail_url?: string;
  medium_url?: string;
}

interface GenerationTrackerProps {
  characterId: string;
  initialCharacter: Character;
}

export default function GenerationTracker({ characterId, initialCharacter }: GenerationTrackerProps) {
  const router = useRouter();
  const [character, setCharacter] = useState(initialCharacter);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const [generationStartTime] = useState(Date.now());
  
  // Since roast is already generated when we get here, start at 'roasting' and show it immediately
  const hasRoastContent = initialCharacter.generation_params?.roast_content;
  const [generationStep, setGenerationStep] = useState<'analyzing' | 'roasting' | 'creating' | 'finalizing'>(
    hasRoastContent ? 'roasting' : 'analyzing'
  );
  const [showRoast, setShowRoast] = useState(!!hasRoastContent);
  
  // Update generation steps based on data
  useEffect(() => {
    // If we have roast content already (which we should), show it and move to creating
    if (character.generation_params?.roast_content && generationStep === 'roasting') {
      // After a brief moment showing the roast, move to creating
      setTimeout(() => {
        setGenerationStep('creating');
      }, 2000);
    }
    
    // When model URL arrives, we're finalizing
    if (character.model_url) {
      setGenerationStep('finalizing');
    }
  }, [character.generation_params?.roast_content, character.model_url, generationStep]);

  // Poll for updates while generating with 30-second timeout
  useEffect(() => {
    const status = character.generation_params?.status;
    
    if (status === 'completed' && character.seo_slug) {
      // Redirect to the static character page
      router.push(`/character/${character.seo_slug}`);
      return;
    }
    
    // Don't poll if failed - user needs to click retry
    if (status === 'failed' || status === 'retry_failed') {
      return;
    }
    
    // Check if we've exceeded 30 seconds
    const checkTimeout = () => {
      const elapsed = Date.now() - generationStartTime;
      // Increased timeout to 60 seconds for slower generation times
      if (elapsed > 60000 && !hasTimedOut) {
        setHasTimedOut(true);
        // Only auto-redirect if we have a valid seo_slug
        if (character.seo_slug) {
          setTimeout(() => {
            router.push(`/character/${character.seo_slug}`);
          }, 3000); // Show timeout message for 3 seconds
        }
      }
    };
    
    // Poll for any non-failed status (including 'pending' which is the initial status)
    if ((status === 'pending' || status === 'generating' || status === 'retrying' || !status) && !hasTimedOut) {
      const timer = setInterval(async () => {
        // Check timeout on each poll
        checkTimeout();
        
        if (hasTimedOut) {
          clearInterval(timer);
          return;
        }
        
        try {
          const response = await fetch(`/api/character-status/${characterId}`);
          if (response.ok) {
            const data = await response.json();
            setCharacter(data.character);
            
            // Update generation step based on new data
            // Since roast is already done, we're mainly waiting for the image
            if (data.character.model_url && generationStep !== 'finalizing') {
              setGenerationStep('finalizing');
            }
            
            // Check if completed
            if (data.character.generation_params?.status === 'completed' && data.character.seo_slug) {
              clearInterval(timer);
              // Small delay to show final state
              setTimeout(() => {
                router.push(`/character/${data.character.seo_slug}`);
              }, 1000);
            }
          }
        } catch (error) {
          console.error('Error polling status:', error);
        }
      }, 2000); // Poll every 2 seconds for faster updates
      
      return () => clearInterval(timer);
    }
  }, [character.generation_params?.status, character.seo_slug, characterId, router, generationStep, hasTimedOut, generationStartTime]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryError(null);
    setHasTimedOut(false); // Reset timeout when retrying
    
    try {
      const result = await retryCharacterGeneration(characterId);
      
      if (!result.success) {
        setRetryError(result.error || 'Failed to retry generation');
      } else {
        // Update local state to show we're generating again
        setCharacter(prev => ({
          ...prev,
          generation_params: {
            ...prev.generation_params,
            status: 'generating'
          }
        }));
        setGenerationStep('creating'); // Reset to creating step
        // The polling will resume automatically due to status change
      }
    } catch (err) {
      setRetryError('Failed to retry generation');
    } finally {
      setIsRetrying(false);
    }
  };

  const status = character.generation_params?.status;
  const isFailed = status === 'failed' || status === 'retry_failed';
  const isGenerating = status === 'generating' || status === 'retrying';

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 flex items-center justify-center py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Simplified Single Step Display */}
          <div className="p-12 text-center">
            {/* Current Step Icon */}
            <div className="text-6xl mb-6 animate-pulse">
              {generationStep === 'analyzing' ? '🔍' :
               generationStep === 'roasting' ? '🔥' :
               generationStep === 'creating' ? '🎨' :
               generationStep === 'finalizing' ? '✨' :
               isFailed ? '❌' : 
               '⏳'}
            </div>
            
            {/* Current Step Title */}
            <h1 className="text-2xl font-bold mb-3 text-gray-900">
              {hasTimedOut ? 'Taking longer than expected...' :
               generationStep === 'analyzing' ? 'Analyzing Your Photo' :
               generationStep === 'roasting' ? 'Writing Your Roast' :
               generationStep === 'creating' ? 'Creating Your Character' :
               generationStep === 'finalizing' ? 'Almost Done!' :
               isFailed ? 'Oops! Something went wrong' : 
               'Preparing...'}
            </h1>
            
            {/* Current Step Description */}
            <p className="text-gray-600 mb-8">
              {hasTimedOut ? 'Your character is still being created. Redirecting you to the character page...' :
               generationStep === 'analyzing' ? 'Detecting features...' :
               generationStep === 'roasting' ? 'Cooking up savage jokes...' :
               generationStep === 'creating' ? 'Generating your caricature...' :
               generationStep === 'finalizing' ? 'Adding finishing touches...' :
               isFailed ? 'The generation failed, but you can try again.' :
               'Getting everything ready...'}
            </p>

            {/* Show roast content when available, but in a simpler way */}
            {showRoast && character.generation_params?.roast_content && !isFailed && !hasTimedOut && (
              <div className="mb-6 p-6 bg-orange-50 rounded-lg text-left animate-fade-in">
                <p className="text-lg font-semibold text-orange-900 mb-2">
                  {character.generation_params.roast_content.title}
                </p>
                <p className="text-gray-700 italic">
                  "{character.generation_params.roast_content.punchline}"
                </p>
              </div>
            )}

            {/* Progress bar */}
            {!isFailed && !hasTimedOut && (
              <div className="mb-8">
                <GenerationProgress 
                  status={generationStep} 
                  hasTimedOut={hasTimedOut}
                />
              </div>
            )}

            {/* Progress Indicator or Action */}
            {hasTimedOut ? (
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <p className="text-orange-800 text-sm mb-2">Generation is taking longer than expected.</p>
                  <p className="text-xs text-gray-600">
                    {character.seo_slug ? 'You\'ll be redirected shortly...' : 'The image is still being generated in the background.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Force navigation by using window.location for reliability
                    const slug = character.seo_slug || characterId;
                    window.location.href = `/character/${slug}`;
                  }}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 px-6 rounded-lg transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  View Character Page
                </button>
                <p className="text-xs text-gray-500">
                  Your roast is ready! The image will appear when it's done generating.
                </p>
              </div>
            ) : isFailed ? (
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800 text-sm">
                    {character.generation_params?.error || 'Image generation failed. This can happen due to high demand or temporary issues.'}
                  </p>
                </div>
                <button
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-8 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                >
                  {isRetrying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white rounded-full animate-spin border-t-transparent"></div>
                      Retrying...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Try Again
                    </>
                  )}
                </button>
                {retryError && (
                  <p className="text-red-600 text-sm mt-4">{retryError}</p>
                )}
                <p className="text-gray-500 text-xs mt-4">
                  Or <button 
                    onClick={() => window.location.href = `/character/${character.seo_slug || characterId}`}
                    className="text-purple-600 hover:underline"
                  >view your character</button> with the roast text
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}