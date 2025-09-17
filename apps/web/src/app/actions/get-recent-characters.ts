'use server';

import { getRecentCharacters } from '@roast-me/database';

export async function getRecentCharactersAction() {
  try {
    console.log('Fetching recent characters...');
    const characters = await getRecentCharacters(12); // Get 12 most recent characters
    
    console.log(`Fetched ${characters.length} characters from database`);
    
    const filteredCharacters = characters.filter(char => 
      char.is_public && 
      (char.model_url || char.generation_params?.status === 'generating')
    );
    
    console.log(`Filtered to ${filteredCharacters.length} public characters`);
    
    return {
      success: true,
      characters: filteredCharacters
    };
  } catch (error) {
    console.error('Error in getRecentCharactersAction:', error);
    return {
      success: false,
      error: 'Failed to load recent characters',
      characters: []
    };
  }
}