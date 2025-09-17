'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { LoadingSpinner, downloadImageWithBanner, shareImageWithBanner } from '@roast-me/ui';
import { ImageWithBanner } from '../../components/ImageWithBanner';
import { ProgressiveImageWithBanner } from '../../components/ProgressiveImageWithBanner';
import { getCharacterData } from './actions';
import { retryCharacterGenerationAction } from '../../actions/retry-generation';
import { useAuth } from '@/contexts/AuthContext';

interface Character {
  id: string;
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
  model_url?: string;
  thumbnail_url?: string;
  medium_url?: string;
  view_count?: number;
  likes?: number;
  created_at: string;
  generation_params?: {
    status?: 'generating' | 'completed' | 'failed' | 'retrying' | 'retry_failed';
    style?: string;
    color?: string;
    personality?: string[];
    og_image_alt?: string;
    attempt?: number;
    error?: string;
    roast_content?: {
      title: string;
      roast_text: string;
      punchline: string;
      figurine_name: string;
    };
  };
  image?: {
    file_url: string;
  };
  features?: Array<{
    feature_name: string;
  }>;
}

interface CharacterPageClientProps {
  slug: string;
}

export default function CharacterPageClient({ slug }: CharacterPageClientProps) {
  const { user, userProfile, signInWithGoogle } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  // Fetch character data
  const fetchCharacter = async () => {
    if (!slug) return;
    
    try {
      const result = await getCharacterData(slug);
      
      if ('error' in result) {
        setError(result.error || 'Unknown error occurred');
        setLoading(false);
        return;
      }
      
      setCharacter(result.character);
      
      // Check if still generating or retrying
      const status = result.character?.generation_params?.status;
      if (status === 'generating' || status === 'retrying') {
        setIsGenerating(true);
        // Poll for updates every 3 seconds
        setTimeout(fetchCharacter, 3000);
      } else {
        setIsGenerating(false);
      }
      
      setLoading(false);
    } catch (err) {
      setError('Failed to load character');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacter();
  }, [slug]);

  // Retry character generation
  const handleRetry = async () => {
    if (!character?.id) return;
    
    setIsRetrying(true);
    setRetryError(null);
    
    try {
      const result = await retryCharacterGenerationAction(character.id);
      
      if (result.error) {
        setRetryError(result.error);
      } else {
        // Refresh character data after successful retry
        await fetchCharacter();
      }
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : 'Failed to retry generation');
    } finally {
      setIsRetrying(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <LoadingSpinner size="lg" />
            <h1 className="text-2xl font-semibold mt-4 text-gray-700">Loading Character...</h1>
            <p className="text-gray-500 mt-2">Please wait while we fetch your character</p>
          </div>
        </div>
      </main>
    );
  }

  if (error || !character) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Character Not Found</h1>
            <p className="text-xl text-gray-600 mb-8">{error || 'The character you are looking for could not be found.'}</p>
            <a 
              href="/"
              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              ← Create New Character
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Canva-style Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <a href="/" className="text-xl font-bold text-gray-900 hover:text-purple-600 transition-colors">
                Roast Me
              </a>
              <nav className="hidden md:flex items-center space-x-6">
                <a href="/" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Create</a>
                <a href="#" className="text-gray-600 hover:text-gray-900 text-sm font-medium">Gallery</a>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => shareImageWithBanner(
                  character.model_url || character.medium_url || '',
                  character.og_title || 'Check out my AI Roast Character!',
                  character.og_description || 'Created at roastme.tocld.com'
                )}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
                Share
              </button>
              <button 
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 transition-colors"
                onClick={() => (character.model_url || character.medium_url) && downloadImageWithBanner(
                  character.model_url || character.medium_url || '',
                  character.generation_params?.roast_content?.figurine_name 
                    ? `${character.generation_params.roast_content.figurine_name.replace(/[^a-zA-Z0-9]/g, '-')}.png`
                    : 'roast-character.png'
                )}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Canva-style layout */}
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Title and Status */}
          <div className="text-center mb-8">
          
            
            {/* Generation Status */}
            {isGenerating && (
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-blue-800 text-sm font-medium">
                  {character?.generation_params?.status === 'retrying' 
                    ? `AI is retrying your roast${character.generation_params?.attempt ? ` (Attempt ${character.generation_params.attempt})` : ''}...`
                    : 'AI is roasting your features...'}
                </span>
              </div>
            )}
          </div>

          {/* Main Canvas Area - Canva-style */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            
            {/* Canvas Header */}
            <div className="border-b border-gray-100 px-4 sm:px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                  <h2 className="text-lg font-semibold text-gray-900 truncate">Roast Figurine Preview</h2>
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {character.view_count || 0} views
                    </span>
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-1 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,21.35L10.55,20.03C5.4,15.36 2,12.27 2,8.5 2,5.41 4.42,3 7.5,3C9.24,3 10.91,3.81 12,5.08C13.09,3.81 14.76,3 16.5,3C19.58,3 22,5.41 22,8.5C22,12.27 18.6,15.36 13.45,20.03L12,21.35Z" />
                      </svg>
                      {character.likes || 0}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Canvas Content */}
            <div className="p-8">
              <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
                
                {/* AI Generated Character - Shows first on mobile, second on desktop */}
                <div className="space-y-4 lg:order-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Roast Caricature</h3>
                    <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                      isGenerating || character.generation_params?.status === 'retrying' 
                        ? 'text-blue-600 bg-blue-100' 
                        : character.generation_params?.status === 'completed' 
                        ? 'text-green-600 bg-green-100'
                        : character.generation_params?.status === 'failed' || character.generation_params?.status === 'retry_failed'
                        ? 'text-red-600 bg-red-100'
                        : 'text-purple-600 bg-purple-100'
                    }`}>
                      {isGenerating || character.generation_params?.status === 'retrying' 
                        ? `Processing${character.generation_params?.attempt ? ` (Attempt ${character.generation_params.attempt})` : ''}` 
                        : character.generation_params?.status === 'completed' 
                        ? 'Completed' 
                        : character.generation_params?.status === 'failed' || character.generation_params?.status === 'retry_failed'
                        ? 'Failed' 
                        : 'Ready'}
                    </div>
                  </div>
                  <div className="relative bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl overflow-hidden aspect-square border-2 border-purple-200">
                    {isGenerating ? (
                      // Loading state - Canva style
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="relative mb-6">
                          <div className="w-16 h-16 border-4 border-purple-200 rounded-full animate-spin">
                            <div className="absolute top-0 left-0 w-4 h-4 bg-purple-600 rounded-full"></div>
                          </div>
                        </div>
                        <div className="text-center space-y-2">
                          <p className="text-purple-700 font-medium">
                            {character.generation_params?.status === 'retrying' 
                              ? `Retrying roast${character.generation_params?.attempt ? ` (Attempt ${character.generation_params.attempt})` : ''}`
                              : 'Creating your roast'}
                          </p>
                          <p className="text-sm text-purple-600">
                            {character.generation_params?.status === 'retrying' 
                              ? 'Using enhanced AI prompts for maximum hilarity'
                              : 'Exaggerating your features for comedic effect'}
                          </p>
                        </div>
                      </div>
                    ) : character.model_url ? (
                      <div className="relative w-full h-full group">
                        <ProgressiveImageWithBanner
                          lowResSrc={character.thumbnail_url}
                          highResSrc={character.model_url || character.medium_url || ''}
                          alt={character.generation_params?.roast_content 
                            ? `${character.generation_params.roast_content.title} - ${character.generation_params.roast_content.roast_text}`
                            : character.generation_params?.og_image_alt || 'Hilarious roast caricature figurine'}
                          fill
                          showBanner={true}
                          bannerText="roastme.tocld.com"
                          priority={true}
                        />
                        
                        {/* Original Image Overlay - Bottom Left, 1/8 size */}
                        {character.image?.file_url && (
                          <div className="absolute bottom-3 left-3 w-1/4 aspect-square bg-white rounded-lg overflow-hidden shadow-lg border-2 border-white/90 backdrop-blur-sm">
                            <Image
                              src={character.image.file_url}
                              alt="Original image"
                              fill
                              className="object-cover"
                            />
                            <div className="absolute inset-0 bg-black/10"></div>
                          </div>
                        )}
                        
                        {/* Roast Text Overlay - Desktop: hover to show, Mobile: always visible at bottom */}
                        {character.generation_params?.roast_content && (
                          <>
                            {/* Desktop Hover Overlay */}
                            <div className="hidden md:block absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="absolute inset-4 flex items-center justify-center p-2">
                                <div className="bg-black/90 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-white shadow-2xl border border-white/20 max-w-xs lg:max-w-md max-h-full overflow-y-auto">
                                  <div className="text-center space-y-2">
                                    <h4 className="text-lg lg:text-xl font-bold text-orange-300 break-words">
                                      🔥 {character.generation_params.roast_content.title}
                                    </h4>
                                    <p className="text-xs sm:text-sm leading-relaxed break-words">
                                      {character.generation_params.roast_content.roast_text}
                                    </p>
                                    <p className="text-xs font-medium italic text-orange-200 break-words">
                                      "{character.generation_params.roast_content.punchline}"
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Mobile Always-Visible Bottom Overlay */}
                            <div className="md:hidden absolute inset-x-0 bottom-0">
                              <div className="bg-gradient-to-t from-black/90 via-black/70 to-transparent p-2 sm:p-3 text-white">
                                <div className="text-center space-y-1">
                                  <p className="text-xs sm:text-sm font-bold text-orange-300 break-words line-clamp-2">
                                    🔥 {character.generation_params.roast_content.title}
                                  </p>
                                  <p className="text-xs italic break-words line-clamp-2">
                                    "{character.generation_params.roast_content.punchline}"
                                  </p>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ) : character.generation_params?.status === 'failed' || character.generation_params?.status === 'retry_failed' ? (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
                        <div className="text-center space-y-4">
                          <div className="text-red-500">
                            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-sm font-medium mb-1">Generation failed</p>
                            {character.generation_params?.attempt && (
                              <p className="text-xs text-red-400">Failed on attempt {character.generation_params.attempt}</p>
                            )}
                          </div>
                          
                          {retryError && (
                            <div className="text-xs text-red-600 bg-red-50 p-2 rounded border">
                              {retryError}
                            </div>
                          )}
                          
                          <button 
                            onClick={handleRetry}
                            disabled={isRetrying}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed transition-colors"
                          >
                            {isRetrying ? (
                              <>
                                <LoadingSpinner size="sm" />
                                <span className="ml-2">Retrying...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Try Again
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <p className="text-sm">Roast Caricature</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Roast Content Display */}
                  {character.generation_params?.roast_content && character.model_url && (
                    <div className="mt-4 p-3 sm:p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200 max-h-80 sm:max-h-96 overflow-y-auto">
                      <div className="text-center space-y-2 sm:space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-center mb-2">
                          <span className="text-lg sm:text-xl md:text-2xl mr-0 sm:mr-2 mb-1 sm:mb-0">🔥</span>
                          <h4 className="text-sm sm:text-base md:text-lg font-bold text-orange-800 break-words leading-tight">
                            {character.generation_params.roast_content.title}
                          </h4>
                        </div>
                        
                        <div className="text-xs sm:text-sm text-orange-700 space-y-1 sm:space-y-2">
                          <p className="leading-relaxed break-words hyphens-auto">
                            {character.generation_params.roast_content.roast_text}
                          </p>
                          <p className="font-medium italic text-orange-800 break-words leading-tight">
                            "{character.generation_params.roast_content.punchline}"
                          </p>
                        </div>
                        
                        <div className="pt-2 sm:pt-3 md:pt-4 border-t border-orange-200">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                            <p className="text-xs text-orange-600 font-medium break-words leading-tight">
                              Figurine Name: "{character.generation_params.roast_content.figurine_name}"
                            </p>
                            <button 
                              className="inline-flex items-center justify-center px-3 py-2 text-xs sm:text-sm font-medium text-orange-700 bg-orange-100 border border-orange-300 rounded-lg hover:bg-orange-200 transition-colors whitespace-nowrap flex-shrink-0"
                              onClick={() => shareImageWithBanner(
                                character.model_url || character.medium_url || '',
                                character.og_title || 'Check out my AI Roast Character!',
                                character.og_description || 'Created at roastme.tocld.com'
                              )}
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                              </svg>
                              Share
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Share Button Below AI Generated Character */}
                  {character.model_url && (
                    <div className="mt-4">
                      <button 
                        className="w-full inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                        onClick={() => shareImageWithBanner(
                          character.model_url || character.medium_url || '',
                          character.og_title || 'Check out my AI Roast Character!',
                          character.og_description || 'Created at roastme.tocld.com'
                        )}
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        Share This Roast 🔥
                      </button>
                    </div>
                  )}
                </div>

                {/* Original Image - Shows second on mobile, first on desktop */}
                <div className="space-y-4 lg:order-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wide">Original</h3>
                    <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">Input</div>
                  </div>
                  <div className="relative bg-gray-50 rounded-xl overflow-hidden aspect-square border-2 border-dashed border-gray-200">
                    {character.image?.file_url ? (
                      <Image
                        src={character.image.file_url}
                        alt="Original uploaded image"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-gray-400">
                          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm">Original Image</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Credits/Login Section */}
            <div className="border-t border-gray-100 px-4 sm:px-6 py-6 bg-gradient-to-r from-purple-50 to-orange-50">
              <div className="max-w-4xl mx-auto">
                {userProfile ? (
                  // Authenticated user - show credits
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-bold">🔥</span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Your Credits</p>
                          <p className="text-xl font-bold text-purple-600">{userProfile.credits}</p>
                        </div>
                      </div>
                      {userProfile.is_anonymous && (
                        <div className="flex items-start space-x-3 bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                          <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div>
                            <p className="text-blue-900 font-medium text-sm">Save your progress</p>
                            <button
                              onClick={() => signInWithGoogle()}
                              className="text-blue-700 hover:text-blue-800 text-sm font-medium"
                            >
                              Sign in to keep credits
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                      {userProfile.credits <= 1 && (
                        <a 
                          href="/credits"
                          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Get More Credits
                        </a>
                      )}
                      <a 
                        href="/"
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-purple-700 bg-white border border-purple-300 rounded-lg hover:bg-purple-50 transition-colors"
                      >
                        Create Another Roast
                      </a>
                    </div>
                  </div>
                ) : (
                  // Non-authenticated - show login prompt
                  <div className="text-center">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Want to create your own roast characters?</h3>
                      <p className="text-gray-600">Sign in to get started with free credits and save your creations!</p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                      <button
                        onClick={() => signInWithGoogle()}
                        className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-orange-500 hover:from-purple-700 hover:to-orange-600 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span className="truncate">Sign in with Google - Get 10 Free Credits</span>
                      </button>
                      <a 
                        href="/"
                        className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Browse Gallery
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Canvas Footer */}
            <div className="border-t border-gray-100 px-4 sm:px-6 py-4 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-4">
                  <a 
                    href="/"
                    className="text-sm text-gray-600 hover:text-gray-900 font-medium flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Create another
                  </a>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    Create Similar
                  </button>
                  <button 
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
                    onClick={() => (character.model_url || character.medium_url) && downloadImageWithBanner(
                      character.model_url || character.medium_url || '',
                      character.generation_params?.roast_content?.figurine_name 
                        ? `${character.generation_params.roast_content.figurine_name.replace(/[^a-zA-Z0-9]/g, '-')}.png`
                        : 'roast-character.png'
                    )}
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}