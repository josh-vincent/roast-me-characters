'use client';

import Image from 'next/image';
import { ImageWithBanner } from '../../components/ImageWithBanner';
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
  // Helper to get the original image URL
  const getOriginalImageUrl = () => {
    // First, check if it's explicitly stored in generation_params
    if (character.generation_params?.original_image_url) {
      return character.generation_params.original_image_url;
    }
    
    // Second, check the image object
    if (character.image?.file_url) {
      return character.image.file_url;
    }
    
    // Third, try to construct it from the storage bucket pattern
    // The original images are stored as {characterId}/uploaded-original.png
    // But for anonymous users, it might be anon-TIMESTAMP-{characterId}/TIMESTAMP.webp
    const supabaseUrl = 'https://iwazmzjqbdnxvzqvuimt.supabase.co';
    
    // Try the standard pattern first
    return `${supabaseUrl}/storage/v1/object/public/roast-me-ai/${character.id}/uploaded-original.png`;
  };

  const originalImageUrl = getOriginalImageUrl();

  const handleShare = async () => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://roastme.tocld.com'}/character/${character.seo_slug}`;
    await shareCharacterUrl(url, character.generation_params?.roast_content?.title || 'Check out this roast!');
  };

  const handleDownload = () => {
    if (character.model_url) {
      downloadImageWithBanner(
        character.model_url,
        character.generation_params?.roast_content?.figurine_name 
          ? `${character.generation_params.roast_content.figurine_name.replace(/[^a-zA-Z0-9]/g, '-')}.png`
          : 'roast-character.png'
      );
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            
            {/* Stats Bar */}
            <div className="border-b border-gray-100 px-6 py-4">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  👁 {character.view_count || 0} views
                </span>
                <span className="flex items-center">
                  ❤️ {character.likes || 0} likes
                </span>
                <span>
                  {new Date(character.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Content Grid */}
            <div className="p-8">
              {/* Roast Title */}
              {character.generation_params?.roast_content && (
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    🔥 {character.generation_params.roast_content.title}
                  </h1>
                  <p className="text-lg text-gray-600">
                    {character.generation_params.roast_content.figurine_name}
                  </p>
                </div>
              )}
              
              {/* Before/After Images */}
              <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto mb-8">
                
                {/* Original Image */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 uppercase text-center">Before</h3>
                  <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-200">
                    <Image
                      src={originalImageUrl}
                      alt="Original photo"
                      fill
                      className="object-cover"
                      priority={true}
                      sizes="(max-width: 768px) 100vw, 50vw"
                      onError={(e) => {
                        // If the image fails to load, show a placeholder
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
                
                {/* Generated Character */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 uppercase text-center">After (AI Roast)</h3>
                  <div className="relative aspect-square bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl overflow-hidden border-2 border-purple-200">
                    {character.model_url ? (
                      <ImageWithBanner
                        src={character.medium_url || character.model_url}
                        alt={character.generation_params?.roast_content?.title || 'Roast character'}
                        fill
                        showBanner={true}
                        priority={true}
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-purple-600">
                          <div className="text-4xl mb-2">🎭</div>
                          <p className="text-sm">AI Character</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Roast Content Box */}
              {character.generation_params?.roast_content && (
                <div className="max-w-3xl mx-auto">
                  <div className="p-6 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-200">
                    <h2 className="text-xl font-bold text-orange-900 mb-3">
                      The Roast
                    </h2>
                    <p className="text-gray-800 mb-3 leading-relaxed">
                      {character.generation_params.roast_content.roast_text}
                    </p>
                    <p className="text-lg font-medium italic text-orange-800 text-center py-3 border-t border-orange-200">
                      "{character.generation_params.roast_content.punchline}"
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <a 
                  href="/"
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  ← Create another
                </a>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={handleShare}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Share Roast
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                  >
                    Download Image
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