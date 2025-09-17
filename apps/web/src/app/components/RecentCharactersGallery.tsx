'use client';

import { CharacterCard } from './CharacterCard';

interface Character {
  id: string;
  seo_slug: string;
  og_title?: string;
  model_url?: string;
  view_count?: number;
  likes?: number;
  created_at: string;
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

interface RecentCharactersGalleryProps {
  initialCharacters: Character[];
}

export function RecentCharactersGallery({ initialCharacters }: RecentCharactersGalleryProps) {
  if (!initialCharacters || initialCharacters.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Recent Roast Characters</h2>
            <p className="text-gray-600 mb-8">Check back soon to see the latest character creations!</p>
            <div className="text-6xl text-gray-300">🎭</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Recent Roast Characters</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            See what hilarious roast figurines our community has been creating! Get inspired for your own character.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {initialCharacters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </div>

        {initialCharacters.length >= 12 && (
          <div className="text-center mt-12">
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-colors">
              View All Characters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}