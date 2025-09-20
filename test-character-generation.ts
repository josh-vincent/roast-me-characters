#!/usr/bin/env tsx

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, 'apps/web/.env.local') });

async function testCharacterGeneration() {
  console.log('🧪 Testing Character Generation Flow\n');
  console.log('='.repeat(50));
  
  const appUrl = 'http://localhost:3003';
  
  // Test image URL (a public domain portrait)
  const testImageUrl = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400';
  
  console.log('📸 Test Image URL:', testImageUrl);
  console.log('🌐 App URL:', appUrl);
  
  try {
    // Test 1: Check if app is running
    console.log('\n1️⃣ Checking if app is running...');
    const homeResponse = await fetch(appUrl);
    if (homeResponse.ok) {
      console.log('   ✅ App is running');
    } else {
      console.log('   ❌ App is not responding');
      return;
    }
    
    // Test 2: Submit image URL via API
    console.log('\n2️⃣ Submitting image URL for analysis...');
    const analyzeResponse = await fetch(`${appUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageUrl: testImageUrl,
        sessionId: 'test-session-' + Date.now()
      })
    });
    
    if (analyzeResponse.ok) {
      const result = await analyzeResponse.json();
      console.log('   ✅ Analysis successful');
      console.log('   Character ID:', result.characterId);
      console.log('   Features detected:', result.features?.length || 0);
      
      // Test 3: Check character page
      if (result.seoSlug) {
        console.log('\n3️⃣ Checking character page...');
        const characterUrl = `${appUrl}/character/${result.seoSlug}`;
        console.log('   URL:', characterUrl);
        
        const characterResponse = await fetch(characterUrl);
        if (characterResponse.ok) {
          console.log('   ✅ Character page accessible');
        } else {
          console.log('   ⚠️ Character page returned:', characterResponse.status);
        }
      }
    } else {
      const errorText = await analyzeResponse.text();
      console.log('   ❌ Analysis failed:', analyzeResponse.status);
      console.log('   Error:', errorText.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('💡 To manually test:');
  console.log(`1. Open: ${appUrl}`);
  console.log('2. Click "Image URL" tab');
  console.log(`3. Paste: ${testImageUrl}`);
  console.log('4. Click "Generate Roast Character"');
}

testCharacterGeneration()
  .then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Test failed:', err);
    process.exit(1);
  });