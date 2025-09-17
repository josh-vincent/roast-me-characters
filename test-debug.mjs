import { getCharacterBySlug } from './packages/database/src/queries.js';

async function debugCharacter() {
  try {
    const slug = 'cartoon-character-beard-smile-mfmk9rqq';
    console.log(`🔍 Investigating character with slug: ${slug}`);
    
    const character = await getCharacterBySlug(slug);
    
    if (!character) {
      console.log('❌ Character not found with slug:', slug);
      return;
    }
    
    console.log('✅ Character found!');
    console.log('📄 Character Details:');
    console.log(`  - ID: ${character.id}`);
    console.log(`  - Created: ${character.created_at}`);
    console.log(`  - User ID: ${character.user_id}`);
    console.log(`  - Model URL: ${character.model_url || 'NULL'}`);
    console.log(`  - OG Image URL: ${character.og_image_url || 'NULL'}`);
    console.log(`  - Is Public: ${character.is_public}`);
    
    console.log('\n🎯 Generation Parameters:');
    if (character.generation_params) {
      console.log(JSON.stringify(character.generation_params, null, 2));
    } else {
      console.log('  - No generation parameters stored');
    }
    
    console.log('\n🤖 AI Features (JSON):');
    if (character.ai_features_json) {
      console.log(JSON.stringify(character.ai_features_json, null, 2));
    } else {
      console.log('  - No AI features stored');
    }
    
    console.log('\n📸 Associated Image:');
    if (character.image) {
      console.log(`  - Image ID: ${character.image.id}`);
      console.log(`  - Original URL: ${character.image.original_url}`);
      console.log(`  - Upload Path: ${character.image.upload_path}`);
    } else {
      console.log('  - No associated image found');
    }
    
    // Check the generation status
    const status = character.generation_params?.status;
    console.log(`\n🔄 Generation Status: ${status || 'Unknown'}`);
    
    if (status === 'failed') {
      console.log('❌ Generation failed with error:');
      console.log(`  - Error: ${character.generation_params?.error || 'No error details'}`);
      console.log(`  - Failed at: ${character.generation_params?.failedAt || 'Unknown time'}`);
    } else if (status === 'generating') {
      console.log('⏳ Still in generating state - background process may have failed');
    } else if (status === 'completed') {
      console.log('✅ Generation completed successfully');
    }
    
  } catch (error) {
    console.error('💥 Investigation failed:', error);
  }
}

debugCharacter().then(() => {
  console.log('\n🏁 Investigation complete');
  process.exit(0);
}).catch(console.error);