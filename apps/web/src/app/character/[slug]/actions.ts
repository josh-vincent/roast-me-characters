'use server';

import { getCharacterBySlug, incrementViewCount } from '@roast-me/database';

export async function getCharacterData(slug: string) {
  try {
    const character = await getCharacterBySlug(slug);
    
    if (!character) {
      return { error: 'Character not found' };
    }

    // Increment view count (fire and forget)
    incrementViewCount(character.id).catch(console.error);

    return { character };
  } catch (error) {
    console.error('Error fetching character:', error);
    return { error: 'Failed to load character' };
  }
}