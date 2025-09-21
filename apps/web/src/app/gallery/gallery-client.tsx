'use client';

import { useState, useEffect } from 'react';
import { CharacterCard } from '../components/CharacterCard';
import { createClient } from '@/lib/supabase/client';

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
  generation_params?: any;
  image?: {
    file_url: string;
  };
  features?: Array<{
    feature_name: string;
  }>;
}

interface GalleryClientProps {
  initialCharacters: Character[];
  isUserGallery: boolean;
  userId?: string;
}

export function GalleryClient({ initialCharacters, isUserGallery, userId }: GalleryClientProps) {
  const [characters, setCharacters] = useState<Character[]>(initialCharacters);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialCharacters.length >= 100); // Check if we have max initial load
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');

  const supabase = createClient();

  const loadMore = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('roast_me_ai_characters')
        .select('id,seo_slug,og_title,og_description,model_url,thumbnail_url,medium_url,view_count,likes,created_at,is_public,generation_params,image:image_id(file_url)')
        .order('created_at', { ascending: false })
        .range(characters.length, characters.length + 23);

      if (isUserGallery && userId) {
        query = query.eq('user_id', userId);
        if (filter === 'public') {
          query = query.eq('is_public', true);
        } else if (filter === 'private') {
          query = query.eq('is_public', false);
        }
      } else {
        query = query.eq('is_public', true).not('model_url', 'is', null);
      }

      const { data: newCharacters, error } = await query;

      if (error) {
        console.error('Error loading more characters:', error);
        return;
      }

      if (newCharacters && newCharacters.length > 0) {
        // Transform the new characters
        const transformed = newCharacters.map(char => {
          let originalImageUrl = null;
          if (char.generation_params?.composite_og_url) {
            try {
              const url = new URL(char.generation_params.composite_og_url);
              const originalParam = url.searchParams.get('original');
              if (originalParam) {
                originalImageUrl = decodeURIComponent(originalParam);
              }
            } catch (error) {
              console.warn('Failed to parse composite_og_url:', error);
            }
          }

          return {
            ...char,
            image: Array.isArray(char.image) ? char.image[0] : char.image || (originalImageUrl ? { file_url: originalImageUrl } : undefined),
            features: char.generation_params?.features || []
          } as Character;
        });

        setCharacters(prev => [...prev, ...transformed]);
        setHasMore(newCharacters.length === 24);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = async (newFilter: 'all' | 'public' | 'private') => {
    if (!isUserGallery || newFilter === filter) return;
    
    setFilter(newFilter);
    setLoading(true);
    
    try {
      let query = supabase
        .from('roast_me_ai_characters')
        .select('id,seo_slug,og_title,og_description,model_url,thumbnail_url,medium_url,view_count,likes,created_at,is_public,generation_params,image:image_id(file_url)')
        .eq('user_id', userId!)
        .order('created_at', { ascending: false })
        .limit(24);

      if (newFilter === 'public') {
        query = query.eq('is_public', true);
      } else if (newFilter === 'private') {
        query = query.eq('is_public', false);
      }

      const { data: filteredCharacters, error } = await query;

      if (error) {
        console.error('Error applying filter:', error);
        return;
      }

      // Transform the characters
      const transformed = (filteredCharacters || []).map(char => {
        let originalImageUrl = null;
        if (char.generation_params?.composite_og_url) {
          try {
            const url = new URL(char.generation_params.composite_og_url);
            const originalParam = url.searchParams.get('original');
            if (originalParam) {
              originalImageUrl = decodeURIComponent(originalParam);
            }
          } catch (error) {
            console.warn('Failed to parse composite_og_url:', error);
          }
        }

        return {
          ...char,
          image: Array.isArray(char.image) ? char.image[0] : char.image || (originalImageUrl ? { file_url: originalImageUrl } : undefined),
          features: char.generation_params?.features || []
        } as Character;
      });

      setCharacters(transformed);
      setHasMore(transformed.length === 24);
    } catch (error) {
      console.error('Error filtering:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Filter buttons for user gallery */}
      {isUserGallery && characters.length > 0 && (
        <div className="flex justify-center mb-8 space-x-2">
          <button
            onClick={() => applyFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            All Characters
          </button>
          <button
            onClick={() => applyFilter('public')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'public'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Public
          </button>
          <button
            onClick={() => applyFilter('private')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'private'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
            }`}
          >
            Private
          </button>
        </div>
      )}

      {/* Character grid */}
      {characters.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {characters.map((character) => (
              <CharacterCard 
                key={character.id} 
                character={character}
                showPrivacyBadge={isUserGallery}
              />
            ))}
          </div>

          {/* Load more button */}
          {hasMore && (
            <div className="text-center mt-12">
              <button
                onClick={loadMore}
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {loading ? 'Loading...' : 'Load More Characters'}
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="text-6xl text-gray-300 mb-4">🎭</div>
          <p className="text-gray-500">
            {isUserGallery 
              ? 'No characters found. Start creating your first roast character!'
              : 'No public characters available yet.'}
          </p>
        </div>
      )}
    </>
  );
}