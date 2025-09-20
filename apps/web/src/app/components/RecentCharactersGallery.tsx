'use client';

import Link from 'next/link';
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
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Recent Creations</h2>
            <p className="text-gray-600 text-sm sm:text-base mb-8">Be the first to create a roast character!</p>
            <div className="text-6xl text-gray-300">🎭</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Recent Creations</h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Explore the latest roast characters from our community
          </p>
        </div>

        {/* Instagram-style grid: 1 column on mobile, 2 on sm, 3 on md, 4 on lg */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {initialCharacters.map((character) => (
            <CharacterCard key={character.id} character={character} />
          ))}
        </div>

        {initialCharacters.length >= 8 && (
          <div className="text-center mt-10">
            <Link href="/gallery" className="inline-block text-purple-600 hover:text-purple-700 font-semibold text-sm transition-colors">
              View all creations →
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}