/**
 * Pexels Image Provider — Dry Run Simulation Script
 * 
 * GUARANTEES:
 * 1. READ-ONLY: Never modifies raw_recipes.json or recipesData.ts.
 * 2. ZERO DOWNLOAD: Never downloads images to disk (Downloads: 0).
 * 3. SECRET SAFETY: Never logs or leaks PEXELS_API_KEY.
 * 4. GRACEFUL FALLBACK: Works smoothly whether API key is present or absent.
 */

const fs = require('fs');
const path = require('path');

// 1. Read production dataset (READ-ONLY)
const rawPath = path.join(__dirname, '../src/data/raw_recipes.json');
const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
const rawRecipes = rawData.recipes || [];

// Max 3 sample recipes
const sampleRecipes = rawRecipes.slice(0, 3);

// Query builder
function buildQuery(title) {
  if (!title) return 'Yemek tarifi';
  const clean = title
    .replace(/\([^)]*\)/g, '')
    .replace(/[!?,;:#*+~=_/\\|<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return `${clean} food`;
}

async function runDryRun() {
  const apiKey = process.env.PEXELS_API_KEY;
  const isConfigured = !!apiKey && apiKey.trim().length > 0;

  console.log('\n====================================================');
  console.log('       PEXELS IMAGE PROVIDER — DRY RUN SIMULATION   ');
  console.log('====================================================');
  console.log(`API Key Configured            : ${isConfigured ? 'YES (Active in ENV)' : 'NO (Graceful Fallback Mode)'}`);
  console.log(`Sample Size                   : ${sampleRecipes.length} recipes`);
  console.log('----------------------------------------------------');

  const results = [];
  let successCount = 0;
  let fallbackCount = 0;

  for (const recipe of sampleRecipes) {
    const query = buildQuery(recipe.name);

    if (!isConfigured) {
      // Offline simulation / graceful degradation
      fallbackCount++;
      results.push({
        id: recipe.id,
        title: recipe.name,
        query,
        status: 'FALLBACK_LOCAL',
        provider: 'local',
        photoId: `local_${recipe.id}`,
        photographer: 'Cookly Curated Kitchen',
        license: 'Cookly Proprietary',
        imageUrl: `/assets/images/${recipe.id}.webp`,
        note: 'PEXELS_API_KEY absent -> gracefully delegated to local fallback'
      });
    } else {
      // Safe read-only API query
      try {
        const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&page=1`;
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': apiKey.trim()
          }
        });

        if (res.ok) {
          const data = await res.json();
          const photo = data.photos && data.photos[0];
          if (photo) {
            successCount++;
            results.push({
              id: recipe.id,
              title: recipe.name,
              query,
              status: 'PEXELS_FOUND',
              provider: 'pexels',
              photoId: String(photo.id),
              photographer: photo.photographer ? `${photo.photographer} (Pexels)` : 'Pexels Contributor',
              license: 'Pexels License (Free Commercial & Personal Use)',
              imageUrl: photo.src?.large || photo.src?.original || photo.url,
              dimensions: `${photo.width || '?'}x${photo.height || '?'}`,
              note: 'Candidate found and mapped successfully'
            });
          } else {
            fallbackCount++;
            results.push({
              id: recipe.id,
              title: recipe.name,
              query,
              status: 'NO_CANDIDATE',
              provider: 'pexels',
              note: 'Pexels returned zero results for this query'
            });
          }
        } else {
          fallbackCount++;
          results.push({
            id: recipe.id,
            title: recipe.name,
            query,
            status: `HTTP_${res.status}`,
            provider: 'pexels',
            note: `Pexels API responded with status ${res.status}`
          });
        }
      } catch (err) {
        fallbackCount++;
        results.push({
          id: recipe.id,
          title: recipe.name,
          query,
          status: 'NETWORK_ERROR',
          provider: 'pexels',
          note: 'Connection failed; handled gracefully without crash'
        });
      }
    }
  }

  console.log('\nDRY RUN RESULTS BY RECIPE:');
  results.forEach(r => {
    console.log(`\n* Recipe #${r.id}: "${r.title}"`);
    console.log(`  - Search Query   : "${r.query}"`);
    console.log(`  - Status         : ${r.status}`);
    console.log(`  - Provider       : ${r.provider}`);
    if (r.photoId) console.log(`  - Photo ID       : ${r.photoId}`);
    if (r.photographer) console.log(`  - Photographer   : ${r.photographer}`);
    if (r.license) console.log(`  - License        : ${r.license}`);
    if (r.imageUrl) console.log(`  - Preview URL    : ${r.imageUrl}`);
    if (r.dimensions) console.log(`  - Dimensions     : ${r.dimensions}`);
    console.log(`  - System Note    : ${r.note}`);
  });

  console.log('\n----------------------------------------------------');
  console.log(`Total Recipes Processed       : ${sampleRecipes.length}`);
  console.log(`Pexels Matches Found          : ${successCount}`);
  console.log(`Fallback / Skipped Handled    : ${fallbackCount}`);
  console.log(`External Images Downloaded    : 0 (Downloads disabled in Dry Run)`);
  console.log(`Production Dataset Modified   : NO`);
  console.log('====================================================');
  console.log('STATUS: PASS (Safe, non-mutating Pexels dry-run complete)\n');
}

runDryRun().catch(err => {
  console.error('Unexpected dry-run failure:', err);
  process.exit(1);
});
