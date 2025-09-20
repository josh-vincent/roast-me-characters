'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ImageWithBanner } from './ImageWithBanner';
import { FullScreenImageModal } from './FullScreenImageModal';

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
  is_public?: boolean;
  generation_params?: {
    status?: 'generating' | 'completed' | 'failed';
    style?: string;
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

interface CharacterCardProps {
  character: Character;
  showPrivacyBadge?: boolean;
}

export function CharacterCard({ character, showPrivacyBadge = false }: CharacterCardProps) {
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const isGenerating = character.generation_params?.status === 'generating';
  const isFailed = character.generation_params?.status === 'failed';
  
  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFullScreenOpen(true);
  };

  return (
    <>
      <div className="group block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 relative">
        
        {/* Privacy Badge */}
        {showPrivacyBadge && (
          <div className="absolute top-2 right-2 z-10">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              character.is_public 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-700'
            }`}>
              {character.is_public ? '🌍 Public' : '🔒 Private'}
            </div>
          </div>
        )}
        
        {/* Character Image */}
        <div 
          className="aspect-square bg-gradient-to-b from-purple-50 to-blue-50 relative overflow-hidden cursor-pointer"
          onClick={character.model_url ? handleImageClick : undefined}
        >
          {isGenerating ? (
            // Generating state
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-purple-200 rounded-full animate-spin mb-4">
                  <div className="absolute top-0 left-0 w-3 h-3 bg-purple-600 rounded-full"></div>
                </div>
                <p className="text-sm font-medium text-purple-600">Generating...</p>
              </div>
            </div>
          ) : isFailed ? (
            // Failed state
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-red-500">
                <div className="text-3xl mb-2">❌</div>
                <p className="text-xs font-medium">Generation Failed</p>
              </div>
            </div>
          ) : character.model_url ? (
            // Completed with image - show generated image as main, original as overlay
            <div className="relative w-full h-full">
              <ImageWithBanner
                src={character.thumbnail_url || character.medium_url || character.model_url}
                alt={character.generation_params?.roast_content 
                  ? `${character.generation_params.roast_content.title} - ${character.generation_params.roast_content.figurine_name}`
                  : character.og_title || 'Generated character'}
                fill
                className="transition-transform duration-200 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                showBanner={true}
                bannerText="roastme.tocld.com"
                priority={false}
              />
              
              {/* Original Image Overlay - Bottom Left, smaller size for cards */}
              {character.image?.file_url && (
                <div className="absolute bottom-2 left-2 w-1/5 aspect-square bg-white rounded-md overflow-hidden shadow-lg border border-white/90">
                  <Image
                    src={character.image.file_url}
                    alt="Original image"
                    fill
                    className="object-cover"
                    sizes="20vw"
                  />
                  <div className="absolute inset-0 bg-black/5"></div>
                </div>
              )}
              
              {/* Gallery Card Roast Overlay - Always visible on mobile, hover on desktop */}
              {character.generation_params?.roast_content && (
                <>
                  {/* Desktop Hover Overlay */}
                  <div className="hidden md:block absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-2 flex items-center justify-center">
                      <div className="bg-black/90 backdrop-blur-sm rounded-md p-3 text-white shadow-xl border border-white/20">
                        <div className="text-center space-y-1">
                          <h5 className="text-sm font-bold text-orange-300">
                            🔥 {character.generation_params.roast_content.title}
                          </h5>
                          <p className="text-xs italic text-orange-200">
                            "{character.generation_params.roast_content.punchline}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Mobile Always-Visible Overlay */}
                  <div className="md:hidden absolute inset-x-0 bottom-0">
                    <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent p-2 text-white">
                      <div className="text-center">
                        <p className="text-xs font-bold text-orange-300">
                          🔥 {character.generation_params.roast_content.title}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            // Fallback placeholder
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <div className="text-3xl mb-2">🎭</div>
                <p className="text-xs font-medium">Character</p>
              </div>
            </div>
          )}
        </div>

        {/* Character Info - Instagram Style */}
        <Link href={`/character/${character.seo_slug}`}>
          <div className="p-3">
            {/* Title and Figurine Name */}
            <h3 className="font-bold text-gray-900 text-sm mb-1 group-hover:text-purple-600 transition-colors">
              {character.generation_params?.roast_content?.title || character.og_title || `Roast Character`}
            </h3>
            
            {/* Roast Content - Full text, no orange box */}
            {character.generation_params?.roast_content && (
              <div className="mb-2">
                <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
                  {character.generation_params.roast_content.roast_text}
                </p>
                <p className="text-xs text-gray-500 italic mt-1">
                  "{character.generation_params.roast_content.punchline}"
                </p>
              </div>
            )}
            
            {/* Bottom Stats Bar - Fixed to bottom */}
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100">
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-1 text-gray-600 hover:text-red-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-sm font-medium">{character.likes || 0}</span>
                </button>
                <div className="flex items-center gap-1 text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-sm font-medium">{character.view_count || 0}</span>
                </div>
              </div>
              <span className="text-xs text-gray-400">
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

      {/* Full Screen Image Modal - Use composite with before/after */}
      {character.model_url && (
        <FullScreenImageModal
          isOpen={isFullScreenOpen}
          onClose={() => setIsFullScreenOpen(false)}
          imageSrc={character.model_url} // Always use full resolution for modal
          imageAlt={character.generation_params?.roast_content 
            ? `${character.generation_params.roast_content.title} - ${character.generation_params.roast_content.punchline}`
            : character.og_title || 'Generated character'}
          title={character.generation_params?.roast_content?.title || character.og_title}
          originalImageSrc={character.image?.file_url || (character.generation_params as any)?.original_image_url}
          figurineName={character.generation_params?.roast_content?.figurine_name}
          showBanner={true}
        />
      )}
    </>
  );
}