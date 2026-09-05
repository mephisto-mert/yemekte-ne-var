/**
 * Pexels Image Provider — Manual Integration Test Script
 * 
 * Verifies live connectivity with official Pexels API v1.
 * Skips safely (Exit code 0) if PEXELS_API_KEY is not present in the environment.
 */

async function runIntegrationTest() {
  console.log('\n====================================================');
  console.log('       PEXELS API LIVE INTEGRATION TEST             ');
  console.log('====================================================');

  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    console.log('[SKIPPED] PEXELS_API_KEY is not set in environment.');
    console.log('Skipping live integration test safely without failure.');
    console.log('To run this test with real API credentials:');
    console.log('  $env:PEXELS_API_KEY="your_key"; npm run image:pexels:test');
    console.log('====================================================\n');
    process.exit(0);
  }

  console.log('API Key Detected: [PRESENT]');
  console.log('Sending live test query: "lentil soup" (per_page: 1)...');

  try {
    const url = 'https://api.pexels.com/v1/search?query=lentil%20soup&per_page=1&page=1';
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': apiKey.trim()
      }
    });

    console.log(`HTTP Status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      console.error(`[FAIL] Pexels API returned status ${response.status}`);
      process.exit(1);
    }

    const data = await response.json();
    if (!data.photos || data.photos.length === 0) {
      console.log('[WARN] Pexels API returned 0 photos for test query.');
    } else {
      const photo = data.photos[0];
      console.log('\n[SUCCESS] Photo retrieved successfully:');
      console.log(` - Photo ID     : ${photo.id}`);
      console.log(` - Photographer : ${photo.photographer}`);
      console.log(` - Dimensions   : ${photo.width}x${photo.height}`);
      console.log(` - Preview URL  : ${photo.src?.large || photo.url}`);
      console.log(` - License      : Pexels Commercial & Personal Free License`);
    }

    console.log('\n====================================================');
    console.log('STATUS: PASS (Live Pexels integration verified)');
    console.log('====================================================\n');
  } catch (err) {
    console.error('[ERROR] Live integration test failed with exception:', err.message);
    process.exit(1);
  }
}

runIntegrationTest();
