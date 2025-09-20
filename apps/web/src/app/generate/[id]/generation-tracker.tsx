'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { LoadingSpinner } from '@roast-me/ui';
import { retryCharacterGeneration } from '../../actions/character-actions';

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
  const [generationStep, setGenerationStep] = useState<'analyzing' | 'roasting' | 'creating' | 'finalizing'>('analyzing');
  const [showRoast, setShowRoast] = useState(false);
  
  // Update generation steps based on data
  useEffect(() => {
    if (character.generation_params?.features && character.generation_params?.features.length > 0) {
      setGenerationStep('roasting');
    }
    if (character.generation_params?.roast_content && !showRoast) {
      setTimeout(() => {
        setShowRoast(true);
        setGenerationStep('creating');
      }, 500);
    }
    if (character.model_url) {
      setGenerationStep('finalizing');
    }
  }, [character.generation_params?.features, character.generation_params?.roast_content, character.model_url, showRoast]);

  // Poll for updates while generating
  useEffect(() => {
    const status = character.generation_params?.status;
    
    if (status === 'completed' && character.seo_slug) {
      // Redirect to the static character page
      router.push(`/character/${character.seo_slug}`);
      return;
    }
    
    if (status === 'generating' || status === 'retrying') {
      const timer = setInterval(async () => {
        try {
          const response = await fetch(`/api/character-status/${characterId}`);
          if (response.ok) {
            const data = await response.json();
            setCharacter(data.character);
            
            // Check if completed
            if (data.character.generation_params?.status === 'completed' && data.character.seo_slug) {
              clearInterval(timer);
              router.push(`/character/${data.character.seo_slug}`);
            }
          }
        } catch (error) {
          console.error('Error polling status:', error);
        }
      }, 3000); // Poll every 3 seconds
      
      return () => clearInterval(timer);
    }
  }, [character.generation_params?.status, character.seo_slug, characterId, router]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryError(null);
    
    try {
      const result = await retryCharacterGeneration(characterId);
      
      if (!result.success) {
        setRetryError(result.error || 'Failed to retry generation');
      } else {
        // Update local state to show retrying
        setCharacter(prev => ({
          ...prev,
          generation_params: {
            ...prev.generation_params,
            status: 'retrying'
          }
        }));
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
    <main className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-6 text-white">
            <h1 className="text-3xl font-bold mb-2">
              {isGenerating ? '🎨 Creating Your Roast Character' : 
               isFailed ? '❌ Generation Failed' : 
               '⏳ Processing'}
            </h1>
            <p className="text-purple-100">
              {isGenerating ? 'Our AI is crafting your hilarious caricature...' :
               isFailed ? 'Something went wrong, but you can try again!' :
               'Preparing your character...'}
            </p>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Roast Content - Show at top when available */}
            {showRoast && character.generation_params?.roast_content && (
              <div className="mb-8 p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg border-2 border-orange-200 animate-fade-in">
                <h3 className="text-xl font-bold text-orange-900 mb-3">
                  🔥 {character.generation_params.roast_content.title}
                </h3>
                <p className="text-gray-800 mb-3 leading-relaxed">
                  {character.generation_params.roast_content.roast_text}
                </p>
                <p className="text-orange-700 font-medium italic">
                  "{character.generation_params.roast_content.punchline}"
                </p>
                <div className="mt-4 pt-4 border-t border-orange-200">
                  <span className="text-sm text-orange-600">Figurine Name: </span>
                  <span className="text-sm font-bold text-orange-800">
                    {character.generation_params.roast_content.figurine_name}
                  </span>
                </div>
              </div>
            )}

            {/* Images Grid */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Original Image */}
              {(character.generation_params?.original_image_url || character.image?.file_url) && (
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Original Image</h3>
                  <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-200">
                    <Image
                      src={character.generation_params?.original_image_url || character.image?.file_url || ''}
                      alt="Original uploaded image"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                </div>
              )}

              {/* Generation Status */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">AI Character</h3>
                <div className="relative aspect-square bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl overflow-hidden border-2 border-purple-200 flex items-center justify-center">
                  {character.model_url || character.thumbnail_url || character.medium_url ? (
                    <Image
                      src={character.model_url || character.medium_url || character.thumbnail_url || ''}
                      alt="Generated character"
                      fill
                      className="object-cover"
                      key={character.model_url} // Force re-render when URL changes
                    />
                  ) : isGenerating ? (
                    <div className="text-center">
                      <div className="mb-6">
                        <LoadingSpinner size="lg" />
                      </div>
                      <p className="text-purple-700 font-medium mb-2">
                        {status === 'retrying' 
                          ? `Retrying (Attempt ${character.generation_params?.attempt || 2})`
                          : 'Generating your roast...'}
                      </p>
                      <p className="text-purple-600 text-sm">This usually takes 15-30 seconds</p>
                      
                      {/* Progress indicators */}
                      <div className="mt-6 space-y-2">
                        <div className={`flex items-center justify-center space-x-2 text-sm ${
                          generationStep === 'analyzing' ? 'text-purple-700 font-medium' : 
                          character.generation_params?.features ? 'text-green-600' : 'text-purple-500'
                        }`}>
                          <span className={generationStep === 'analyzing' ? 'animate-pulse' : ''}>🔍</span>
                          <span>Analyzing features</span>
                          {character.generation_params?.features && <span className="text-green-500">✓</span>}
                        </div>
                        <div className={`flex items-center justify-center space-x-2 text-sm ${
                          generationStep === 'roasting' ? 'text-purple-700 font-medium' : 
                          character.generation_params?.roast_content ? 'text-green-600' : 'text-purple-500'
                        }`}>
                          <span className={generationStep === 'roasting' ? 'animate-pulse' : ''}>🔥</span>
                          <span>Writing savage roast</span>
                          {character.generation_params?.roast_content && <span className="text-green-500">✓</span>}
                        </div>
                        <div className={`flex items-center justify-center space-x-2 text-sm ${
                          generationStep === 'creating' || generationStep === 'finalizing' ? 'text-purple-700 font-medium' : 
                          character.model_url ? 'text-green-600' : 'text-purple-500'
                        }`}>
                          <span className={generationStep === 'creating' || generationStep === 'finalizing' ? 'animate-pulse' : ''}>🎨</span>
                          <span>Creating character</span>
                          {character.model_url && <span className="text-green-500">✓</span>}
                        </div>
                      </div>
                    </div>
                  ) : isFailed ? (
                    <div className="text-center">
                      <div className="text-6xl mb-4">😔</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Generation Failed</h3>
                      <p className="text-gray-600 mb-6 px-4">
                        {character.generation_params?.error || 'The AI had trouble creating your character.'}
                      </p>
                      <button
                        onClick={handleRetry}
                        disabled={isRetrying}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRetrying ? 'Retrying...' : 'Try Again'}
                      </button>
                      {retryError && (
                        <p className="text-red-600 text-sm mt-4">{retryError}</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-6xl mb-4">⏳</div>
                      <p className="text-gray-600">Preparing...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            
            {/* Instructions */}
            <div className="mt-8 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2">What's happening?</h4>
              <ul className="space-y-1 text-sm text-purple-700">
                <li>• AI analyzes your photo to identify unique features</li>
                <li>• Creates a hilarious caricature with exaggerated traits</li>
                <li>• Writes a personalized roast just for you</li>
                <li>• Generates a collectible figurine-style character</li>
              </ul>
            </div>

            {/* Tips */}
            {isGenerating && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700">
                  💡 <strong>Tip:</strong> This page will automatically redirect when your character is ready. 
                  Feel free to leave and come back - your character will be saved!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}