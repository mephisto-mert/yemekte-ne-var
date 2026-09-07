const fs = require('fs');
const path = require('path');

// 1. Load Raw Recipes without modifying
const rawPath = path.join(__dirname, '../src/data/raw_recipes.json');
const rawContent = fs.readFileSync(rawPath, 'utf8');
const rawData = JSON.parse(rawContent);
const rawRecipes = rawData.recipes || [];

// Canonical normalization implementation for Node CLI
function toCanonical(str) {
  if (!str) return '';
  return String(str)
    .replaceAll('İ', 'i')
    .replaceAll('I', 'ı')
    .toLowerCase()
    .replaceAll('\u0307', '')
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanDisplay(str) {
  if (!str) return '';
  return String(str).replace(/\s+/g, ' ').trim();
}

// Run Pipeline in dry-run mode
let validCount = 0;
let warningCount = 0;
let invalidCount = 0;
const canonicalMap = new Map();
const duplicates = [];
const issuesSummary = [];

for (const raw of rawRecipes) {
  const title = cleanDisplay(raw.name || raw.title);
  const canonicalTitle = toCanonical(title);
  const id = String(raw.id || canonicalTitle);

  // Validation checks
  const errors = [];
  const warnings = [];

  if (!title || title.length < 3) errors.push('Eksik başlık');
  if (!Array.isArray(raw.ingredients) || raw.ingredients.length === 0) errors.push('Eksik malzeme listesi');
  if (!Array.isArray(raw.steps) && !Array.isArray(raw.instructions)) errors.push('Eksik tarif adımları');
  if (typeof raw.servings !== 'number' || raw.servings <= 0) errors.push('Geçersiz porsiyon');

  // Check image & video warnings
  const img = raw.image || raw.imageUrl;
  if (!img || img.includes('placehold.co')) {
    warnings.push('Görsel eksik veya placeholder');
  }
  if (!raw.videoId) {
    warnings.push('Video ID eksik');
  }

  // Duplicate candidate check
  if (canonicalMap.has(canonicalTitle)) {
    const existing = canonicalMap.get(canonicalTitle);
    duplicates.push({
      sourceId: id,
      targetId: existing.id,
      sourceTitle: title,
      targetTitle: existing.title,
      canonicalTitle
    });
  } else {
    canonicalMap.set(canonicalTitle, { id, title });
  }

  if (errors.length > 0) {
    invalidCount++;
    issuesSummary.push({ id, title, type: 'INVALID', errors });
  } else if (warnings.length > 0) {
    warningCount++;
    issuesSummary.push({ id, title, type: 'WARNING', warnings });
  } else {
    validCount++;
  }
}

console.log('\n=============================================================');
console.log('   RECIPE DATA PIPELINE — DRY-RUN EXECUTION REPORT');
console.log('   (Production verisi değiştirilmedi - Salt Okunur Simülasyon)');
console.log('=============================================================');
console.log(`Total Recipes Processed : ${rawRecipes.length}`);
console.log(`Valid Recipes           : ${validCount}`);
console.log(`Warning Recipes         : ${warningCount} (Usable, but missing image or video)`);
console.log(`Invalid Recipes         : ${invalidCount}`);
console.log(`Duplicate Candidates    : ${duplicates.length}`);
console.log('=============================================================\n');

if (duplicates.length > 0) {
  console.log('DUPLICATE CANDIDATES:');
  duplicates.forEach(d => {
    console.log(` - [${d.sourceId}] "${d.sourceTitle}" <==> [${d.targetId}] "${d.targetTitle}" (Canonical: "${d.canonicalTitle}")`);
  });
  console.log('');
}

if (invalidCount > 0) {
  console.log('INVALID RECIPES:');
  issuesSummary.filter(i => i.type === 'INVALID').forEach(i => {
    console.log(` - [${i.id}] ${i.title}: ${i.errors.join(', ')}`);
  });
  console.log('');
}

console.log('DRY-RUN STATUS: PASS (Pipeline altyapısı hazır, veri tabanı değişmedi)\n');
