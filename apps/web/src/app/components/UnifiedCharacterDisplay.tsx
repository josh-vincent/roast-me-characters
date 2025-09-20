'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ImageWithBanner } from './ImageWithBanner';
import { FullScreenImageModal } from './FullScreenImageModal';
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
  shares?: number;
  created_at: string;
  is_public?: boolean;
  generation_params?: any;
  image?: {
    file_url: string;
  };
}

interface UnifiedCharacterDisplayProps {
  character: Character;
  variant?: 'card' | 'full' | 'gallery';
  showActions?: boolean;
  className?: string;
}

export function UnifiedCharacterDisplay({ 
  character, 
  variant = 'card',
  showActions = true,
  className = ''
}: UnifiedCharacterDisplayProps) {
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  
  // Get the display image URL (prioritize thumbnail for cards, full for pages)
  const displayImageUrl = variant === 'card' 
    ? (character.thumbnail_url || character.medium_url || character.model_url)
    : (character.model_url || character.medium_url || character.thumbnail_url);
    
  // Get original image URL - only use explicitly stored URLs
  const originalImageUrl = character.generation_params?.original_image_url || 
                           character.image?.file_url || 
                           '';
  
  // Get roast content
  const roastContent = character.generation_params?.roast_content;
  
  // Handle share
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/character/${character.seo_slug}`;
    await shareCharacterUrl(shareUrl, roastContent?.title || 'Check out my roast character!');
  };
  
  // Handle download
  const handleDownload = async () => {
    if (character.model_url && originalImageUrl) {
      const compositeUrl = new URL('/api/composite-image', window.location.origin);
      compositeUrl.searchParams.set('main', character.model_url);
      compositeUrl.searchParams.set('original', originalImageUrl);
      if (roastContent?.title) {
        compositeUrl.searchParams.set('title', roastContent.title);
      }
      if (roastContent?.figurine_name) {
        compositeUrl.searchParams.set('figurine', roastContent.figurine_name);
      }
      
      await downloadImageWithBanner(
        compositeUrl.toString(),
        `roast-character-${character.id.slice(0, 8)}.png`
      );
    }
  };
  
  // Card variant - Instagram style
  if (variant === 'card') {
    return (
      <>
        <div className={`bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow ${className}`}>
          {/* Image - Click to open full screen */}
          <div 
            className="aspect-square bg-gradient-to-b from-purple-50 to-blue-50 relative overflow-hidden cursor-pointer"
            onClick={() => displayImageUrl && setIsFullScreenOpen(true)}
          >
            {displayImageUrl ? (
              <ImageWithBanner
                src={displayImageUrl}
                alt={roastContent?.title || character.og_title || 'Roast character'}
                fill
                className="object-cover transition-transform hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                showBanner={true}
                bannerText="roastme.tocld.com"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-3xl mb-2">🎭</div>
                  <p className="text-xs font-medium">Character</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Content */}
          <Link href={`/character/${character.seo_slug}`}>
            <div className="p-3">
              <h3 className="font-bold text-gray-900 text-sm mb-1 hover:text-purple-600 transition-colors">
                {roastContent?.title || character.og_title || 'Roast Character'}
              </h3>
              
              {roastContent && (
                <p className="text-xs text-gray-500 italic">
                  "{roastContent.punchline}"
                </p>
              )}
              
              {/* Stats Bar */}
              <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <span className="flex items-center text-xs text-gray-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {character.likes || 0}
                  </span>
                  <span className="flex items-center text-xs text-gray-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {character.view_count || 0}
                  </span>
                </div>
                <span className="text-xs text-gray-400" suppressHydrationWarning>
                  {new Date(character.created_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    timeZone: 'UTC'
                  })}
                </span>
              </div>
            </div>
          </Link>
        </div>
        
        {/* Full Screen Modal */}
        {character.model_url && (
          <FullScreenImageModal
            isOpen={isFullScreenOpen}
            onClose={() => setIsFullScreenOpen(false)}
            imageSrc={character.model_url}
            imageAlt={roastContent?.title || character.og_title || 'Roast character'}
            title={roastContent?.title}
            originalImageSrc={originalImageUrl}
            figurineName={roastContent?.figurine_name}
            onDownload={showActions ? handleDownload : undefined}
            onShare={showActions ? handleShare : undefined}
            showBanner={true}
          />
        )}
      </>
    );
  }
  
  // Full page variant
  if (variant === 'full') {
    return (
      <>
        <div className={`bg-white rounded-2xl shadow-xl overflow-hidden ${className}`}>
          {/* Main Image with Overlay */}
          <div 
            className="relative aspect-square bg-gradient-to-br from-purple-50 to-blue-50 cursor-pointer"
            onClick={() => setIsFullScreenOpen(true)}
          >
            {displayImageUrl ? (
              <>
                <ImageWithBanner
                  src={displayImageUrl}
                  alt={roastContent?.title || 'Roast character'}
                  fill
                  showBanner={true}
                  priority={true}
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                
                {/* Original Image Overlay */}
                {originalImageUrl && (
                  <div className="absolute bottom-4 left-4 w-1/6 aspect-square bg-white rounded-lg overflow-hidden shadow-lg border-2 border-white">
                    <Image
                      src={originalImageUrl}
                      alt="Original photo"
                      fill
                      className="object-cover"
                      sizes="100px"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-0.5 text-center">
                      Original
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-purple-600">
                  <div className="text-6xl mb-2">🎭</div>
                  <p className="text-lg">AI Character</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Actions */}
          {showActions && (
            <div className="px-6 py-4">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={handleShare}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Share
                </button>
                <button 
                  onClick={handleDownload}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                >
                  Download
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Full Screen Modal */}
        {character.model_url && (
          <FullScreenImageModal
            isOpen={isFullScreenOpen}
            onClose={() => setIsFullScreenOpen(false)}
            imageSrc={character.model_url}
            imageAlt={roastContent?.title || 'Roast character'}
            title={roastContent?.title}
            originalImageSrc={originalImageUrl}
            figurineName={roastContent?.figurine_name}
            onDownload={showActions ? handleDownload : undefined}
            onShare={showActions ? handleShare : undefined}
            showBanner={true}
          />
        )}
      </>
    );
  }
  
  // Default to card
  return null;
}