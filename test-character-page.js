// Test script to check if character page loads without loading state
const fetch = require('node-fetch');

async function testCharacterPage() {
  try {
    console.log('Testing character page load time...\n');
    
    // Test a character page
    const start = Date.now();
    const response = await fetch('http://localhost:3002/character/test-character');
    const html = await response.text();
    const loadTime = Date.now() - start;
    
    // Check cache headers
    const cacheControl = response.headers.get('cache-control');
    const nextjsCache = response.headers.get('x-nextjs-cache');
    
    console.log(`Load time: ${loadTime}ms`);
    console.log(`Cache-Control: ${cacheControl}`);
    console.log(`X-NextJS-Cache: ${nextjsCache}`);
    
    // Check if the page contains loading indicators
    const hasLoadingSpinner = html.includes('animate-spin');
    const hasLoadingText = html.includes('Loading character...');
    const hasCharacterData = html.includes('generation_params');
    
    console.log(`\nPage Analysis:`);
    console.log(`- Has loading spinner in HTML: ${hasLoadingSpinner}`);
    console.log(`- Has loading text: ${hasLoadingText}`);
    console.log(`- Has character data: ${hasCharacterData}`);
    
    if (!hasLoadingSpinner && !hasLoadingText && hasCharacterData) {
      console.log('\n✅ SUCCESS: Page loads instantly without loading state!');
    } else {
      console.log('\n⚠️  WARNING: Page still shows loading state');
    }
    
  } catch (error) {
    console.error('Error testing page:', error.message);
  }
}

testCharacterPage();