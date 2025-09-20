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
              <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
                
                {/* Generated Character */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 uppercase">AI Roast Character</h3>
                  <div className="relative aspect-square bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl overflow-hidden border-2 border-purple-200">
                    <ImageWithBanner
                      src={character.medium_url || character.model_url || ''}
                      alt={character.generation_params?.roast_content?.title || 'Roast character'}
                      fill
                      showBanner={true}
                      priority={true}
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    
                    {/* Original Image Overlay */}
                    {character.image?.file_url && (
                      <div className="absolute bottom-3 left-3 w-1/4 aspect-square bg-white rounded-lg overflow-hidden shadow-lg border-2 border-white">
                        <Image
                          src={character.image.file_url}
                          alt="Original"
                          fill
                          className="object-cover"
                          sizes="25vw"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Roast Content */}
                  {character.generation_params?.roast_content && (
                    <div className="p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200">
                      <h4 className="text-lg font-bold text-orange-800 mb-2">
                        🔥 {character.generation_params.roast_content.title}
                      </h4>
                      <p className="text-sm text-orange-700 mb-2">
                        {character.generation_params.roast_content.roast_text}
                      </p>
                      <p className="text-sm italic text-orange-800">
                        "{character.generation_params.roast_content.punchline}"
                      </p>
                      <p className="text-xs text-orange-600 mt-2">
                        Figurine: "{character.generation_params.roast_content.figurine_name}"
                      </p>
                    </div>
                  )}
                </div>

                {/* Original Image */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-700 uppercase">Original Photo</h3>
                  <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-200">
                    {character.image?.file_url && (
                      <Image
                        src={character.image.file_url}
                        alt="Original uploaded image"
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    )}
                  </div>
                  
                  {/* Features */}
                  {character.features && character.features.length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Exaggerated Features</h4>
                      <div className="flex flex-wrap gap-2">
                        {character.features.map((feature, index) => (
                          <span 
                            key={index}
                            className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full"
                          >
                            {feature.feature_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
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