/**
 * Recipe Import Dry-Run Script
 * Demonstrates the Source Adapter -> Pipeline -> Staging Report workflow
 * without touching production databases or making external HTTP requests.
 */

// Standalone self-contained runner for dry-run simulation
function runDryRun() {
  const mockAdapter = {
    name: 'mock_local_source',
    metadata: {
      sourceName: 'Mock Local Source',
      sourceType: 'mock',
      retrievedAt: new Date().toISOString()
    },
    fetchRawRecipes() {
      return [
        {
          id: 'mock_yayla_1',
          name: 'Test Yayla Çorbası',
          category: 'soup',
          difficulty: 'Kolay',
          time: '25 dk',
          timeMinutes: 25,
          servings: 4,
          ingredients: [
            { item: 'Pirinç', amount: '1 çay bardağı' },
            { item: 'Yoğurt', amount: '1.5 su bardağı' },
            { item: 'Nane', amount: '1 yemek kaşığı' }
          ],
          steps: [
            'Pirinci haşlayın.',
            'Yoğurtlu terbiyeyi ekleyin.',
            'Nane ile servis edin.'
          ],
          image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd',
          videoId: 'mock_vid_1'
        },
        {
          id: 'mock_sehriye_2',
          name: 'Test Tel Şehriye Çorbası',
          category: 'soup',
          difficulty: 'Kolay',
          time: '20 dk',
          timeMinutes: 20,
          servings: 4,
          ingredients: [
            { item: 'Tel Şehriye', amount: '1 çay bardağı' },
            { item: 'Salça', amount: '1 yemek kaşığı' }
          ],
          steps: [
            'Salçayı kavurun, su ekleyin.',
            'Şehriyeleri ilave edip pişirin.'
          ]
          // Missing image & video -> WARNING
        },
        {
          id: 'mock_invalid_3',
          name: '', // Missing title -> INVALID
          servings: 0,
          ingredients: [],
          steps: []
        }
      ];
    }
  };

  const rawRecipes = mockAdapter.fetchRawRecipes();

  // Canonical normalization helper
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

  let valid = 0;
  let warnings = 0;
  let invalid = 0;
  let duplicateCandidates = 0;
  let importable = 0;
  let rejected = 0;
  let needsReview = 0;

  const results = [];

  for (const raw of rawRecipes) {
    const title = (raw.name || raw.title || '').trim();
    const canonicalTitle = toCanonical(title);
    const id = raw.id;

    const errors = [];
    const warns = [];

    if (!title || title.length < 3) errors.push('Eksik başlık');
    if (!Array.isArray(raw.ingredients) || raw.ingredients.length === 0) errors.push('Eksik malzeme listesi');
    if (!Array.isArray(raw.steps) || raw.steps.length === 0) errors.push('Eksik tarif adımları');
    if (typeof raw.servings !== 'number' || raw.servings <= 0) errors.push('Geçersiz porsiyon');

    if (!raw.image) warns.push('Görsel eksik');
    if (!raw.videoId) warns.push('Video eksik');

    let status = 'VALID';
    let decision = 'importable';
    let reason = '';

    if (errors.length > 0) {
      status = 'INVALID';
      decision = 'rejected';
      reason = errors.join(', ');
      invalid++;
      rejected++;
    } else if (warns.length > 0) {
      status = 'WARNING';
      decision = 'importable';
      reason = `Uyarılar: ${warns.join(', ')}`;
      warnings++;
      importable++;
    } else {
      status = 'VALID';
      decision = 'importable';
      reason = 'Kusursuz veri kalitesi';
      valid++;
      importable++;
    }

    results.push({ id, title, status, decision, reason });
  }

  console.log('\n====================================================');
  console.log('            RECIPE IMPORT DRY RUN REPORT            ');
  console.log('====================================================');
  console.log(`Source                       : ${mockAdapter.name}`);
  console.log(`Fetched                      : ${rawRecipes.length}`);
  console.log('----------------------------------------------------');
  console.log(`Valid                        : ${valid}`);
  console.log(`Warnings                     : ${warnings}`);
  console.log(`Invalid                      : ${invalid}`);
  console.log(`Duplicate Candidates         : ${duplicateCandidates}`);
  console.log('----------------------------------------------------');
  console.log(`Importable                   : ${importable}`);
  console.log(`Needs Review                 : ${needsReview}`);
  console.log(`Rejected                     : ${rejected}`);
  console.log('----------------------------------------------------');
  console.log('Production database modified : NO');
  console.log('====================================================\n');

  console.log('CANDIDATES BREAKDOWN:');
  results.forEach(r => {
    console.log(` - [${r.decision.toUpperCase()}] ID: "${r.id}" | Title: "${r.title || '<BOŞ>'}" | Durum: ${r.status} (${r.reason})`);
  });
  console.log('');
}

runDryRun();
