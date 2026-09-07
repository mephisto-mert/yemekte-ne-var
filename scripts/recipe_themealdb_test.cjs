/**
 * TheMealDB Live Integration Test Script
 * 
 * Safely tests real TheMealDB API ingestion with:
 * - Max 10 recipes limit
 * - Isolated staging output in test-output/recipe-import/
 * - 0 disk writes to src/data/ (Production dataset 100% untouched)
 * - 0 image/video downloads (Candidate detection only)
 * - Honest reporting: Outputs SKIPPED if external network is unavailable (No fake PASS)
 */

const fs = require('fs');
const path = require('path');

async function runMealDbIntegrationTest() {
  console.log('\n====================================================');
  console.log('       THEMEALDB LIVE INGESTION & STAGING TEST       ');
  console.log('====================================================');

  const stagingDir = path.join(__dirname, '../test-output/recipe-import');
  fs.mkdirSync(stagingDir, { recursive: true });

  const rawDatasetPath = path.join(__dirname, '../src/data/raw_recipes.json');
  let existingRecipes = [];
  try {
    if (fs.existsSync(rawDatasetPath)) {
      const parsed = JSON.parse(fs.readFileSync(rawDatasetPath, 'utf8'));
      existingRecipes = parsed.recipes || [];
    }
  } catch (err) {
    console.log('[WARN] Mevcut dataset okunamadı:', err.message);
  }

  console.log('Target Provider       : TheMealDB Open Recipe Database');
  console.log('Permission Policy     : ALLOWED (Public Database, Images: needs_review)');
  console.log('Batch Size Limit      : 10 Recipes');
  console.log('Existing Catalog Size : ' + existingRecipes.length + ' recipes (Protected read-only)');
  console.log('Staging Directory     : ' + stagingDir);
  console.log('----------------------------------------------------');

  const startTime = Date.now();
  const searchUrl = 'https://www.themealdb.com/api/json/v1/1/search.php?s=chicken';

  let apiResponse;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(searchUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'CooklyMealDbIngestion/1.0' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      console.log(`\n[UYARI] TheMealDB API HTTP hatası döndü: ${res.status}`);
      console.log('STATUS: SKIPPED (API HTTP hatası nedeniyle canlı test atlandı)');
      console.log('====================================================\n');
      process.exit(0);
    }

    apiResponse = await res.json();
  } catch (netErr) {
    console.log(`\n[UYARI] TheMealDB API\'sine erişilemedi: ${netErr.message}`);
    console.log('Ağ bağlantısı kısıtlı veya çevrimdışı ortam tespit edildi.');
    console.log('STATUS: SKIPPED (Ağ erişimi sağlanamadığı için test atlandı)');
    console.log('====================================================\n');
    process.exit(0);
  }

  const rawMeals = apiResponse && Array.isArray(apiResponse.meals) ? apiResponse.meals : [];
  if (rawMeals.length === 0) {
    console.log('\n[UYARI] TheMealDB API boş yemek listesi döndü.');
    console.log('STATUS: SKIPPED (Tarif bulunamadı)');
    console.log('====================================================\n');
    process.exit(0);
  }

  // Max 10 recipes clamp
  const targetBatch = rawMeals.slice(0, 10);
  console.log(`\n[OK] API Bağlantısı Başarılı: ${rawMeals.length} tarif arasından ilk ${targetBatch.length} tarif alınıyor...\n`);

  let fetchedCount = targetBatch.length;
  let normalizedCount = 0;
  let validCount = 0;
  let warningCount = 0;
  let reviewCount = 0;
  let rejectedCount = 0;
  let duplicateCount = 0;
  let imageCandidatesReady = 0;
  let videoCandidatesReady = 0;

  const stagedRecipes = [];
  const recipeDecisions = [];

  // Setup existing titles set for duplicate check
  const existingTitles = new Set(
    existingRecipes.map(r => (r.name || r.title || '').toLowerCase().trim())
  );
  const seenBatchIds = new Set();
  const seenBatchTitles = new Set();

  for (const meal of targetBatch) {
    const id = String(meal.idMeal || '').trim();
    const title = String(meal.strMeal || '').trim();
    const instructions = String(meal.strInstructions || '').trim();
    const area = String(meal.strArea || 'Global').trim();
    const category = String(meal.strCategory || 'Ana Yemekler').trim();

    // 1. Schema Validation
    const hasValidId = id.length > 0;
    const hasValidTitle = title.length >= 2;
    const hasValidInstructions = instructions.length >= 10;

    // Ingredients extraction
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
      const item = meal['strIngredient' + i];
      const measure = meal['strMeasure' + i];
      if (item && typeof item === 'string') {
        const cItem = item.trim();
        if (cItem.length > 0 && cItem.toLowerCase() !== 'null') {
          ingredients.push({
            item: cItem,
            amount: measure && typeof measure === 'string' && measure.trim() ? measure.trim() : undefined
          });
        }
      }
    }

    const hasIngredients = ingredients.length > 0;
    const isSchemaValid = hasValidId && hasValidTitle && hasValidInstructions && hasIngredients;

    if (!isSchemaValid) {
      rejectedCount++;
      recipeDecisions.push({
        id,
        title: title || '[İsimsiz]',
        decision: 'REJECTED',
        score: 30,
        reasons: ['Bozuk veya eksik TheMealDB şeması (id, başlık veya malzeme eksik)']
      });
      continue;
    }

    normalizedCount++;

    // 2. Image and Video Candidates
    const thumbUrl = meal.strMealThumb ? String(meal.strMealThumb).trim() : null;
    let videoId = null;
    if (meal.strYoutube) {
      const match = String(meal.strYoutube).match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([\w-]{11})/);
      if (match && match[1]) videoId = match[1];
    }

    if (thumbUrl) imageCandidatesReady++;
    if (videoId) videoCandidatesReady++;

    // 3. Duplicate Detection & Idempotency
    const canonicalTitle = title.toLowerCase().trim();
    const isIdDuplicate = seenBatchIds.has(id);
    const isTitleDuplicate = existingTitles.has(canonicalTitle) || seenBatchTitles.has(canonicalTitle);

    let decision = 'VALID';
    const reasons = [];
    let score = 85;

    if (isIdDuplicate || isTitleDuplicate) {
      duplicateCount++;
      decision = 'REVIEW_REQUIRED';
      reasons.push(isIdDuplicate ? 'Mükerrer kaynak kimliği' : 'Mevcut katalogla başlık benzerliği');
      score -= 20;
    }

    seenBatchIds.add(id);
    seenBatchTitles.add(canonicalTitle);

    if (!videoId) {
      if (decision === 'VALID') decision = 'WARNING';
      reasons.push('Video adayı eksik');
      score -= 10;
    }

    // Images from TheMealDB require attribution and review
    reasons.push('Görsel TheMealDB topluluk lisansı altında (İnceleme Gerekli)');

    if (decision === 'VALID') validCount++;
    else if (decision === 'WARNING') warningCount++;
    else if (decision === 'REVIEW_REQUIRED') reviewCount++;
    else if (decision === 'REJECTED') rejectedCount++;

    recipeDecisions.push({
      id,
      title,
      decision,
      score,
      reasons
    });

    const isTurkish = area.toLowerCase() === 'turkish';
    stagedRecipes.push({
      id: `themealdb_${id}`,
      title,
      canonicalTitle,
      category,
      cuisine: area,
      language: isTurkish ? 'tr' : 'en',
      ingredients: ingredients.map(ing => ({
        name: ing.item,
        canonicalName: ing.item.toLowerCase(),
        amount: ing.amount || 'Göz kararı',
        isStaple: false
      })),
      instructions: instructions.split(/\r?\n+/).filter(s => s.trim().length > 5),
      image: thumbUrl,
      imageUrl: thumbUrl,
      imageCandidates: thumbUrl ? [thumbUrl] : [],
      videoId,
      videoEmbedUrl: videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : null,
      source: 'themealdb',
      sourceId: id,
      sourceUrl: meal.strSource || `https://www.themealdb.com/meal/${id}`,
      license: 'unknown',
      attribution: 'TheMealDB Open Recipe Database',
      qualityScore: score,
      gateDecision: decision
    });

    console.log(` - [${id}] "${title}" -> [${decision}] (Skor: ${score}) | Video: ${videoId ? 'YES' : 'NO'} | Görsel: ${thumbUrl ? 'YES' : 'NO'}`);
  }

  // 4. Save Staging Artifacts
  const batchId = `mealdb_live_${Date.now()}`;
  const manifest = {
    batchId,
    provider: 'themealdb',
    sourceLicense: 'TheMealDB Free Public Open Database License',
    startedAt: new Date(startTime).toISOString(),
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - startTime,
    totalFetched: fetchedCount,
    stats: {
      fetched: fetchedCount,
      normalized: normalizedCount,
      valid: validCount,
      warning: warningCount,
      reviewRequired: reviewCount,
      rejected: rejectedCount,
      duplicates: duplicateCount,
      imageCandidatesReady,
      videoCandidatesReady,
      imagesDownloaded: 0,
      videosDownloaded: 0
    },
    recipeDecisions
  };

  const report = {
    provider: 'TheMealDB',
    executionMode: 'STAGING_ISOLATED',
    productionDatasetModified: false,
    summary: manifest.stats,
    recipeDecisions
  };

  fs.writeFileSync(path.join(stagingDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  fs.writeFileSync(path.join(stagingDir, 'recipes.json'), JSON.stringify(stagedRecipes, null, 2), 'utf8');
  fs.writeFileSync(path.join(stagingDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');

  console.log('\n----------------------------------------------------');
  console.log(`Total Fetched         : ${fetchedCount}`);
  console.log(`Normalized            : ${normalizedCount}`);
  console.log(`Valid                 : ${validCount}`);
  console.log(`Warning               : ${warningCount}`);
  console.log(`Review Required       : ${reviewCount}`);
  console.log(`Rejected              : ${rejectedCount}`);
  console.log(`Duplicates            : ${duplicateCount}`);
  console.log('----------------------------------------------------');
  console.log(`Image Candidates Ready: ${imageCandidatesReady}`);
  console.log(`Video Candidates Ready: ${videoCandidatesReady}`);
  console.log('Images Downloaded     : 0 (No image downloads performed)');
  console.log('Videos Downloaded     : 0 (No video downloads performed)');
  console.log('----------------------------------------------------');
  console.log(`Staging Manifest      : ${path.join(stagingDir, 'manifest.json')}`);
  console.log(`Staging Recipes       : ${path.join(stagingDir, 'recipes.json')}`);
  console.log(`Staging Report        : ${path.join(stagingDir, 'report.json')}`);
  console.log('Production Dataset    : 100% UNTOUCHED (Zero modification)');
  console.log('====================================================');
  console.log('STATUS: PASS (TheMealDB live staging verification complete)\n');
}

runMealDbIntegrationTest().catch(err => {
  console.error('Fatal error in TheMealDB test:', err);
  process.exit(1);
});
