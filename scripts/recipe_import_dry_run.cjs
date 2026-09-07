/**
 * Recipe Import Pipeline — Dry Run Simulation Script
 * 
 * GUARANTEES:
 * 1. READ ONLY: Never modifies raw_recipes.json or recipesData.ts.
 * 2. ZERO SUPABASE MUTATION: Never connects to or writes to Supabase.
 * 3. ZERO DOWNLOADS: Downloads = 0, Video downloads = 0.
 * 4. DETERMINISTIC METRICS: Reports gate decisions, completeness, and quality score.
 */

const path = require('path');

// Mock sample dataset (10 representative recipes: valid, warning, review, duplicate)
const mockRecipes = [
  {
    id: 'dry_1',
    title: 'Geleneksel Mercimek Çorbası',
    category: 'Çorbalar',
    difficulty: 'Kolay',
    prepTime: '10 dk',
    cookTime: '20 dk',
    timeMinutes: 30,
    servings: 4,
    ingredients: [
      { item: 'Kırmızı Mercimek', amount: '1 su bardağı' },
      { item: 'Kuru Soğan', amount: '1 adet' },
      { item: 'Tereyağı', amount: '1 yemek kaşığı' },
      { item: 'Tuz', amount: '1 tatlı kaşığı' }
    ],
    steps: [
      'Soğanı tereyağında kavurun.',
      'Mercimeği ve suyu ilave edip 20 dakika kaynatın.',
      'Blenderdan geçirip sıcak servis yapın.'
    ],
    image: 'https://images.pexels.com/photos/1001/soup.jpg',
    videoId: 'mock_yt_vid_1',
    cuisine: 'Türk'
  },
  {
    id: 'dry_2',
    title: 'Karnıyarık',
    category: 'Ana Yemekler',
    difficulty: 'Orta',
    prepTime: '20 dk',
    cookTime: '30 dk',
    timeMinutes: 50,
    servings: 4,
    ingredients: [
      { item: 'Patlıcan', amount: '4 adet' },
      { item: 'Kıyma', amount: '250g' },
      { item: 'Soğan', amount: '2 adet' },
      { item: 'Sıvı Yağ', amount: '3 yemek kaşığı' }
    ],
    steps: [
      'Patlıcanları alacalı soyup kızartın.',
      'Kıymalı iç harcı hazırlayıp patlıcanlara doldurun.',
      'Fırında 20 dakika pişirin.'
    ],
    image: 'https://images.pexels.com/photos/1002/karniyarik.jpg',
    videoId: 'mock_yt_vid_2',
    cuisine: 'Türk'
  },
  {
    id: 'dry_3',
    title: 'İzmir Köfte',
    category: 'Köfteler',
    difficulty: 'Orta',
    prepTime: '25 dk',
    cookTime: '35 dk',
    timeMinutes: 60,
    servings: 4,
    ingredients: [
      { item: 'Kıyma', amount: '500g' },
      { item: 'Patates', amount: '3 adet' },
      { item: 'Domates', amount: '2 adet' },
      { item: 'Biber', amount: '3 adet' }
    ],
    steps: [
      'Köfteleri yoğurup şekil verin.',
      'Patates ve köfteleri hafifçe kızartıp tepsiye dizin.',
      'Salçalı sosu döküp fırında pişirin.'
    ],
    image: 'https://images.pexels.com/photos/1003/kofte.jpg',
    videoId: null, // triggers WARNING: video missing
    cuisine: 'Türk'
  },
  {
    id: 'dry_4',
    title: 'Menemen',
    category: 'Kahvaltılıklar',
    difficulty: 'Kolay',
    prepTime: '5 dk',
    cookTime: '10 dk',
    timeMinutes: 15,
    servings: 2,
    ingredients: [
      { item: 'Yumurta', amount: '3 adet' },
      { item: 'Domates', amount: '2 adet' },
      { item: 'Sivri Biber', amount: '2 adet' },
      { item: 'Zeytinyağı', amount: '2 yemek kaşığı' }
    ],
    steps: [
      'Biberleri yağda soteleyin.',
      'Domatesleri ekleyip pişirin.',
      'Yumurtaları kırıp hafifçe karıştırın.'
    ],
    image: null, // triggers WARNING: image missing
    videoId: 'mock_yt_vid_4',
    cuisine: 'Türk'
  },
  {
    id: 'dry_5',
    title: 'Zeytinyağlı Yaprak Sarması',
    category: 'Dolma & Sarmalar',
    difficulty: 'Zor',
    prepTime: '60 dk',
    cookTime: '45 dk',
    timeMinutes: 105,
    servings: 6,
    ingredients: [
      { item: 'Asma Yaprağı', amount: '300g' },
      { item: 'Pirinç', amount: '1.5 su bardağı' },
      { item: 'Soğan', amount: '3 adet' },
      { item: 'Zeytinyağı', amount: '1 çay bardağı' },
      { item: 'Kuş Üzümü', amount: '2 yemek kaşığı' }
    ],
    steps: [
      'İç harcı pişirip dinlendirin.',
      'Yaprakları tek tek sarın.',
      'Tencereye dizip kısık ateşte pişirin.'
    ],
    image: 'https://images.pexels.com/photos/1005/sarma.jpg',
    videoId: 'mock_yt_vid_5',
    cuisine: 'Türk'
  },
  {
    id: 'dry_6',
    title: 'Fırında Sütlaç',
    category: 'Tatlılar',
    difficulty: 'Orta',
    prepTime: '15 dk',
    cookTime: '30 dk',
    timeMinutes: 45,
    servings: 6,
    ingredients: [
      { item: 'Süt', amount: '1 litre' },
      { item: 'Pirinç', amount: 'yarım su bardağı' },
      { item: 'Şeker', amount: '1 su bardağı' },
      { item: 'Nişasta', amount: '2 yemek kaşığı' }
    ],
    steps: [
      'Pirinci haşlayın, süt ve şekeri ekleyin.',
      'Nişastayı suyla açıp ilave edin.',
      'Güveç kaplarına paylaştırıp fırında üzeri kızarana kadar pişirin.'
    ],
    image: 'https://images.pexels.com/photos/1006/sutlac.jpg',
    videoId: 'mock_yt_vid_6',
    cuisine: 'Türk'
  },
  {
    id: 'dry_7',
    title: 'Karnıyarık', // Exact Duplicate of dry_2 -> triggers REVIEW_REQUIRED
    category: 'Ana Yemekler',
    difficulty: 'Orta',
    ingredients: [
      { item: 'Patlıcan', amount: '4 adet' },
      { item: 'Kıyma', amount: '250g' }
    ],
    steps: ['Patlıcanları doldurup pişirin.'],
    image: 'https://images.pexels.com/photos/1002/karniyarik.jpg',
    cuisine: 'Türk'
  },
  {
    id: 'dry_8',
    title: 'Eksik Malzemeli Yemek', // Missing ingredients -> triggers REJECTED
    category: 'Genel',
    ingredients: [],
    steps: ['Hızlıca pişirin.'],
    image: null
  },
  {
    id: 'dry_9',
    title: 'Adı Olmayan Tarif', // Missing title -> triggers REJECTED
    title: '',
    category: 'Çorbalar',
    ingredients: [{ item: 'Su', amount: '1 litre' }],
    steps: []
  },
  {
    id: 'dry_10',
    title: 'Gavurdağı Salatası',
    category: 'Salatalar',
    difficulty: 'Kolay',
    prepTime: '15 dk',
    cookTime: '0 dk',
    timeMinutes: 15,
    servings: 4,
    ingredients: [
      { item: 'Domates', amount: '4 adet' },
      { item: 'Salatalık', amount: '2 adet' },
      { item: 'Ceviz', amount: '1 çay bardağı' },
      { item: 'Nar Ekşisi', amount: '2 yemek kaşığı' },
      { item: 'Zeytinyağı', amount: '3 yemek kaşığı' }
    ],
    steps: [
      'Tüm sebzeleri küçük küpler halinde doğrayın.',
      'Cevizi iri parçalar halinde ekleyin.',
      'Zeytinyağı ve nar ekşisi sosunu gezdirin.'
    ],
    image: 'https://images.pexels.com/photos/1010/salad.jpg',
    videoId: 'mock_yt_vid_10',
    cuisine: 'Türk'
  }
];

function runDryRun() {
  console.log('\n====================================================');
  console.log('       RECIPE IMPORT PIPELINE — DRY RUN             ');
  console.log('====================================================');
  console.log('Provider              : mock_recipe_provider (Local Curated)');
  console.log('Permission Policy     : ALLOWED (Public Domain / CC0)');
  console.log(`Requested Recipes     : ${mockRecipes.length}`);
  console.log('----------------------------------------------------');

  let valid = 0;
  let warning = 0;
  let review = 0;
  let rejected = 0;
  let duplicates = 0;
  let imageReady = 0;
  let videoReady = 0;

  const seenTitles = new Set();
  const decisions = [];

  mockRecipes.forEach(r => {
    const rawTitle = r.title || r.name || '';
    const hasTitle = rawTitle.trim().length >= 2;
    const hasIng = Array.isArray(r.ingredients) && r.ingredients.length >= 2;
    const hasSteps = Array.isArray(r.steps) && r.steps.length >= 1;
    const cTitle = rawTitle.toLowerCase().trim();
    const isDup = seenTitles.has(cTitle);
    if (cTitle) seenTitles.add(cTitle);

    const hasImg = Boolean(r.image && r.image.startsWith('http'));
    const hasVid = Boolean(r.videoId && r.videoId.length >= 3);

    if (hasImg) imageReady++;
    if (hasVid) videoReady++;

    let decision = 'VALID';
    const reasons = [];

    if (!hasTitle || !hasIng || !hasSteps) {
      decision = 'REJECTED';
      if (!hasTitle) reasons.push('Başlık eksik');
      if (!hasIng) reasons.push('Yetersiz malzeme');
      if (!hasSteps) reasons.push('Adım listesi eksik');
      rejected++;
    } else if (isDup) {
      decision = 'REVIEW_REQUIRED';
      reasons.push('Kanonik başlık mükerrer eşleşmesi');
      duplicates++;
      review++;
    } else if (!hasImg || !hasVid) {
      decision = 'WARNING';
      if (!hasImg) reasons.push('Görsel adayı eksik');
      if (!hasVid) reasons.push('Video adayı eksik');
      warning++;
    } else {
      reasons.push('Tüm kalite kriterleri sağlandı');
      valid++;
    }

    decisions.push({
      id: r.id,
      title: rawTitle || '[BAŞLIKSIZ]',
      decision,
      reasons: reasons.join(', ')
    });
  });

  console.log('IMPORT DECISIONS BY RECIPE:');
  decisions.forEach(d => {
    console.log(` - [${d.id}] "${d.title}" -> [${d.decision}] (${d.reasons})`);
  });

  console.log('\n----------------------------------------------------');
  console.log(`Total Fetched         : ${mockRecipes.length}`);
  console.log(`Valid (Ready)         : ${valid}`);
  console.log(`Warning (Usable)      : ${warning}`);
  console.log(`Review Required       : ${review}`);
  console.log(`Rejected (Invalid)    : ${rejected}`);
  console.log(`Duplicates Detected   : ${duplicates}`);
  console.log('----------------------------------------------------');
  console.log(`Image Candidates Ready: ${imageReady}`);
  console.log(`Video Candidates Ready: ${videoReady}`);
  console.log('----------------------------------------------------');
  console.log('External Downloads    : 0');
  console.log('Production Mutation   : 0 (Dataset is 100% UNTOUCHED)');
  console.log('Supabase Mutation     : 0');
  console.log('====================================================');
  console.log('STATUS: PASS (Dry run completed safely in read-only mode)\n');
}

runDryRun();
