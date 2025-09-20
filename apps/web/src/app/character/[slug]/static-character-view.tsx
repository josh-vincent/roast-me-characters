'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ImageWithBanner } from '../../components/ImageWithBanner';
import { FullScreenImageModal } from '../../components/FullScreenImageModal';
import { downloadImageWithBanner, shareCharacterUrl } from '@roast-me/ui';

interface Character {
  id: string;
  seo_slug: string;
  og_title?: string;
  model_url?: string;
  thumbnail_url?: string;
  medium_url?: string;
  view_count?: number;
  likes?: number;
  created_at: string;
  generation_params?: {
    roast_content?: {
      title: string;
      roast_text: string;
      punchline: string;
      figurine_name: string;
    };
    style?: string;
    original_image_url?: string;
  };
  image?: {
    file_url: string;
  };
  features?: Array<{
    feature_name: string;
  }>;
}

interface StaticCharacterViewProps {
  character: Character;
}

export default function StaticCharacterView({ character }: StaticCharacterViewProps) {
  const [showFullScreen, setShowFullScreen] = useState(false);
  
  // Helper to get the original image URL
  const getOriginalImageUrl = () => {
    // Only return URLs that are explicitly stored, don't construct them
    // This prevents 500 errors from non-existent URLs
    
    // First, check if it's explicitly stored in generation_params
    if (character.generation_params?.original_image_url) {
      return character.generation_params.original_image_url;
    }
    
    // Second, check the image object
    if (character.image?.file_url) {
      return character.image.file_url;
    }
    
    // Return empty string if no original image is found
    // This will prevent the composite API from being called
    return '';
  };

  const originalImageUrl = getOriginalImageUrl();

  const handleShare = async () => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://roastme.tocld.com'}/character/${character.seo_slug}`;
    await shareCharacterUrl(url, character.generation_params?.roast_content?.title || 'Check out this roast!');
  };

  const handleDownload = async () => {
    if (character.model_url) {
      // Generate composite image URL with original overlay
      const compositeUrl = new URL('/api/composite-image', window.location.origin);
      compositeUrl.searchParams.set('main', character.model_url);
      compositeUrl.searchParams.set('original', originalImageUrl);
      if (character.generation_params?.roast_content?.title) {
        compositeUrl.searchParams.set('title', character.generation_params.roast_content.title);
      }
      if (character.generation_params?.roast_content?.figurine_name) {
        compositeUrl.searchParams.set('figurine', character.generation_params.roast_content.figurine_name);
      }
      
      try {
        // Fetch the composite image
        const response = await fetch(compositeUrl.toString());
        const blob = await response.blob();
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = character.generation_params?.roast_content?.figurine_name 
          ? `${character.generation_params.roast_content.figurine_name.replace(/[^a-zA-Z0-9]/g, '-')}.png`
          : 'roast-character.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Failed to download composite image:', error);
        // Fallback to original download
        downloadImageWithBanner(
          character.model_url,
          character.generation_params?.roast_content?.figurine_name 
            ? `${character.generation_params.roast_content.figurine_name.replace(/[^a-zA-Z0-9]/g, '-')}.png`
            : 'roast-character.png'
        );
      }
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="text-xl font-bold text-gray-900 hover:text-purple-600 transition-colors">
              Roast Me
            </a>
            <div className="flex items-center space-x-3">
              <button 
                onClick={handleShare}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Share
              </button>
              <button 
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Character Display */}
      <div className="bg-gray-50 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Main Content Card - Instagram Feed Style */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            
            {/* Roast Content at Top */}
            {character.generation_params?.roast_content && (
              <div className="px-6 pt-6 pb-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  🔥 {character.generation_params.roast_content.title}
                </h1>
                <p className="text-gray-800 leading-relaxed mb-2">
                  {character.generation_params.roast_content.roast_text}
                </p>
                <p className="text-gray-600 font-medium italic">
                  "{character.generation_params.roast_content.punchline}"
                </p>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Figurine: </span>
                  <span className="text-sm font-bold text-gray-700">
                    {character.generation_params.roast_content.figurine_name}
                  </span>
                </div>
              </div>
            )}

            {/* Main AI Generated Image with Original Overlay */}
            <div className="relative">
              {/* AI Generated Character - Full Size */}
              <div 
                className="relative aspect-square bg-gradient-to-br from-purple-50 to-blue-50 cursor-pointer"
                onClick={() => setShowFullScreen(true)}
              >
                {character.model_url ? (
                  <ImageWithBanner
                    src={character.model_url}
                    alt={character.generation_params?.roast_content?.title || 'Roast character'}
                    fill
                    showBanner={true}
                    priority={true}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-purple-600">
                      <div className="text-6xl mb-2">🎭</div>
                      <p className="text-lg">AI Character</p>
                    </div>
                  </div>
                )}
                
                {/* Original Image Overlay - Bottom Left Corner (1/6 size) */}
                <div className="absolute bottom-4 left-4 w-1/6 aspect-square bg-white rounded-lg overflow-hidden shadow-lg border-2 border-white">
                  <Image
                    src={originalImageUrl}
                    alt="Original photo"
                    fill
                    className="object-cover"
                    sizes="100px"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-0.5 text-center">
                    Original
                  </div>
                </div>
              </div>
            </div>

            {/* Stats and Actions */}
            <div className="px-6 py-4">
              {/* Stats */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center text-sm text-gray-600">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {character.view_count || 0}
                  </span>
                  <span className="flex items-center text-sm text-gray-600">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {character.likes || 0}
                  </span>
                </div>
                <span className="text-xs text-gray-500" suppressHydrationWarning>
                  {new Date(character.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    timeZone: 'UTC'
                  })}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button 
                  onClick={handleShare}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Share Roast
                </button>
                <button 
                  onClick={handleDownload}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Download
                </button>
                <a 
                  href="/"
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Create New
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Screen Image Modal - Use composite with before/after */}
      {character.model_url && (
        <FullScreenImageModal
          isOpen={showFullScreen}
          onClose={() => setShowFullScreen(false)}
          imageSrc={character.model_url}
          imageAlt={character.generation_params?.roast_content?.title || 'Roast character'}
          title={character.generation_params?.roast_content?.title}
          originalImageSrc={originalImageUrl}
          figurineName={character.generation_params?.roast_content?.figurine_name}
          onDownload={handleDownload}
          onShare={handleShare}
          showBanner={true}
        />
      )}
    </main>
  );
}