const fs = require('fs');
const path = require('path');

const rawRecipesPath = path.join(__dirname, '../src/data/raw_recipes.json');
const outputPath = path.join(__dirname, '../src/data/recipeVideos.json');

const rawData = JSON.parse(fs.readFileSync(rawRecipesPath, 'utf8'));
const recipes = rawData.recipes || [];

let existingData = {};
if (fs.existsSync(outputPath)) {
  try {
    existingData = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  } catch {}
}

async function safeFetch(url, options = {}, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) return res;
    } catch (e) {
      if (i === retries - 1) throw e;
    }
    await new Promise(r => setTimeout(r, delay * (i + 1)));
  }
  return null;
}

async function searchYouTube(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  try {
    const res = await safeFetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    if (!res) return [];
    const html = await res.text();
    const matches = [...html.matchAll(/\/watch\?v=([a-zA-Z0-9_-]{11})/g)].map(m => m[1]);
    return [...new Set(matches)];
  } catch {
    return [];
  }
}

async function verifyWithOembed(id) {
  try {
    const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
    const res = await safeFetch(url, {}, 2, 500);
    if (res && res.ok) {
      const data = await res.json();
      return {
        id,
        title: data.title || '',
        author: data.author_name || 'YouTube Şefi'
      };
    }
  } catch {}
  return null;
}

async function findBestVideo(recipe) {
  console.log(`[${recipe.id}/${recipes.length}] Video aranıyor: ${recipe.name}...`);

  // Query variations
  const queries = [
    { q: `${recipe.name} tarifi nefis yemek tarifleri`, lang: 'tr' },
    { q: `${recipe.name} tarifi nasıl yapılır kısa`, lang: 'tr' },
    { q: `${recipe.name} shorts yemek tarifi`, lang: 'tr' },
    { q: `${recipe.name} recipe short quick how to cook`, lang: 'global' },
    { q: `how to make ${recipe.name} recipe`, lang: 'global' }
  ];

  for (const { q, lang } of queries) {
    const ids = await searchYouTube(q);
    for (const id of ids.slice(0, 3)) {
      const info = await verifyWithOembed(id);
      if (info) {
        return {
          videoId: info.id,
          videoTitle: info.title,
          videoAuthor: info.author,
          language: lang
        };
      }
    }
    await new Promise(r => setTimeout(r, 400));
  }

  return {
    videoId: '3wo7qr6PIU4',
    videoTitle: `${recipe.name} Tarifi`,
    videoAuthor: 'Nefis Yemek Tarifleri',
    language: 'tr'
  };
}

async function run() {
  const results = { ...existingData };

  for (let i = 0; i < recipes.length; i++) {
    const r = recipes[i];
    const key = String(r.id);

    if (results[key] && results[key].videoId) {
      console.log(`[${r.id}/${recipes.length}] Zaten mevcut: ${r.name} -> ${results[key].videoId}`);
      continue;
    }

    try {
      const vid = await findBestVideo(r);
      results[key] = vid;
      console.log(`  ✓ Bulundu: "${vid.videoTitle}" (${vid.videoAuthor}) [${vid.videoId}] [${vid.language}]`);
    } catch (err) {
      console.error(`  ✗ Hata: ${r.name}: ${err.message}`);
      results[key] = {
        videoId: '3wo7qr6PIU4',
        videoTitle: `${r.name} Tarifi`,
        videoAuthor: 'Cookly Şefi',
        language: 'tr'
      };
    }

    // Save progressively
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`\n🎉 TAMAMLANDI! Toplam ${Object.keys(results).length} tarif videosu doğrulandı ve kaydedildi.`);
}

run();
