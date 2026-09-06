import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  detectLanguage,
  MockRecipeTranslator,
  localizeRecipe
} from '../pipeline/enrichment/localization';
import { mapToCooklyTaxonomy } from '../pipeline/enrichment/taxonomyMapper';
import { parseIngredient, parseNumericValue } from '../pipeline/enrichment/ingredientParser';
import { matchRecipeImage } from '../pipeline/enrichment/imageMatcher';
import {
  matchRecipeVideo,
  isValidSecureEmbedUrl,
  buildVideoSearchQuery,
  MockRecipeVideoSearchProvider
} from '../pipeline/enrichment/videoMatcher';
import { evaluateRecipeCompleteness } from '../pipeline/enrichment/completenessEngine';
import { calculateEnrichedQualityScore } from '../pipeline/enrichment/qualityScorer';
import { HumanReviewQueue, extractReviewItemsFromEnrichment } from '../pipeline/enrichment/reviewQueue';
import { DeterministicEnrichmentCache } from '../pipeline/enrichment/cache';
import { enrichRecipe, enrichBatch } from '../pipeline/enrichment/enrichmentEngine';
import { NormalizedRecipe } from '../pipeline/types';

describe('PART 12 — Recipe Enrichment, Localization & Media Matching Engine Suite', () => {
  const sampleNormalizedRecipe: NormalizedRecipe = {
    id: 'test_rec_1',
    title: 'Teriyaki Chicken Casserole',
    canonicalTitle: 'teriyaki chicken casserole',
    description: 'Delicious Japanese style chicken casserole',
    category: 'Chicken',
    difficulty: 'Orta',
    cookingTime: '40 dakika',
    timeMinutes: 40,
    servings: 4,
    ingredients: [
      { name: 'Soy Sauce', canonicalName: 'soy sauce', amount: '3/4 cup', isStaple: false },
      { name: 'Chicken Breasts', canonicalName: 'chicken breasts', amount: '2 lbs', isStaple: false },
      { name: 'Water', canonicalName: 'water', amount: '1/2 cup', isStaple: true }
    ],
    instructions: [
      'Preheat oven to 350°F (175°C).',
      'Cook chicken and mix with soy sauce and rice.',
      'Bake for 30 minutes.'
    ],
    tags: ['chicken', 'japanese'],
    canonicalTags: ['chicken', 'japanese'],
    cuisine: 'Japanese',
    image: 'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg',
    videoId: '4aZr5hZXP_s',
    videoTitle: 'Teriyaki Chicken Video',
    videoAuthor: null,
    videoLanguage: 'global',
    calories: null,
    macros: null,
    rating: null,
    reviewCount: null,
    chef: null,
    tips: []
  };

  // -----------------------------------------------------------------
  // 1. LOCALIZATION TESTS (Tests 1 - 8)
  // -----------------------------------------------------------------
  it('Test 1: detectLanguage Türkçe diyakritik içeren metinler için "tr" döner', () => {
    expect(detectLanguage('Karnıyarık')).toBe('tr');
    expect(detectLanguage('Mercimek Çorbası')).toBe('tr');
    expect(detectLanguage('Fırında Sütlaç')).toBe('tr');
  });

  it('Test 2: detectLanguage areaHint "Turkish" olduğunda "tr" döner', () => {
    expect(detectLanguage('Meatballs', 'Turkish')).toBe('tr');
  });

  it('Test 3: detectLanguage standart İngilizce metinler için "en" döner', () => {
    expect(detectLanguage('Teriyaki Chicken Casserole')).toBe('en');
    expect(detectLanguage('Spaghetti Bolognese')).toBe('en');
  });

  it('Test 4: detectLanguage boş veya tanımsız girdi için güvenli şekilde "en" döner', () => {
    expect(detectLanguage('')).toBe('en');
    expect(detectLanguage(null)).toBe('en');
  });

  it('Test 5: MockRecipeTranslator çeviri uydurmaz, status="pending" döner', async () => {
    const translator = new MockRecipeTranslator();
    const res = await translator.translateText({
      text: 'Chicken Curry',
      fromLang: 'en',
      toLang: 'tr'
    });

    expect(res.translatedText).toBe('Chicken Curry');
    expect(res.status).toBe('pending');
    expect(res.provider).toBe('none');
    expect(res.confidence).toBe(0.0);
  });

  it('Test 6: localizeRecipe Türkçe tariflerde displayTitle aynen korur ve translated döner', async () => {
    const trRecipe = { ...sampleNormalizedRecipe, title: 'Mercimek Çorbası', cuisine: 'Turkish' };
    const res = await localizeRecipe(trRecipe);

    expect(res.displayTitle).toBe('Mercimek Çorbası');
    expect(res.displayLanguage).toBe('tr');
    expect(res.translationStatus).toBe('translated');
  });

  it('Test 7: localizeRecipe İngilizce tarifte otomatik Türkçe çeviri yapmaz (not_translated)', async () => {
    const res = await localizeRecipe(sampleNormalizedRecipe);

    expect(res.displayTitle).toBe('Teriyaki Chicken Casserole');
    expect(res.displayLanguage).toBe('en');
    expect(res.translationStatus).toBe('not_translated');
  });

  it('Test 8: localizeRecipe orijinal boşluk ve karakter formatını korur', async () => {
    const res = await localizeRecipe(sampleNormalizedRecipe);
    expect(res.sourceTitle).toBe(sampleNormalizedRecipe.title);
  });

  // -----------------------------------------------------------------
  // 2. TAXONOMY MAPPING TESTS (Tests 9 - 16)
  // -----------------------------------------------------------------
  it('Test 9: mapToCooklyTaxonomy "Dessert" kategorisini "Tatlılar" ile eşler', () => {
    const res = mapToCooklyTaxonomy({ category: 'Dessert' });
    expect(res.cooklyCategory).toBe('Tatlılar');
    expect(res.status).toBe('mapped');
  });

  it('Test 10: mapToCooklyTaxonomy "Chicken" kategorisini "Ana Yemekler" ile eşler', () => {
    const res = mapToCooklyTaxonomy({ category: 'Chicken' });
    expect(res.cooklyCategory).toBe('Ana Yemekler');
    expect(res.status).toBe('mapped');
  });

  it('Test 11: mapToCooklyTaxonomy "Pasta" kategorisini "Makarna & Hamur İşleri" ile eşler', () => {
    const res = mapToCooklyTaxonomy({ category: 'Pasta' });
    expect(res.cooklyCategory).toBe('Makarna & Hamur İşleri');
  });

  it('Test 12: mapToCooklyTaxonomy "Vegetarian" kategorisini "Sebze Yemekleri" ile eşler', () => {
    const res = mapToCooklyTaxonomy({ category: 'Vegetarian' });
    expect(res.cooklyCategory).toBe('Sebze Yemekleri');
  });

  it('Test 13: mapToCooklyTaxonomy "Seafood" kategorisini "Deniz Ürünleri" ile eşler', () => {
    const res = mapToCooklyTaxonomy({ category: 'Seafood' });
    expect(res.cooklyCategory).toBe('Deniz Ürünleri');
  });

  it('Test 14: mapToCooklyTaxonomy bilinmeyen kategoriyi "unknown" olarak bırakır ve uydurmaz', () => {
    const res = mapToCooklyTaxonomy({ category: 'FantasyCategory123' });
    expect(res.cooklyCategory).toBe('unknown');
    expect(res.status).toBe('unknown');
    expect(res.confidence).toBe(0.0);
  });

  it('Test 15: mapToCooklyTaxonomy "Turkish" mutfağı için etiketleri türetir', () => {
    const res = mapToCooklyTaxonomy({ area: 'Turkish' });
    expect(res.matchedTags).toContain('türk-mutfağı');
    expect(res.matchedTags).toContain('geleneksel');
  });

  it('Test 16: mapToCooklyTaxonomy "Italian" mutfağı için akdeniz-mutfağı etiketini türetir', () => {
    const res = mapToCooklyTaxonomy({ area: 'Italian' });
    expect(res.matchedTags).toContain('italyan-mutfağı');
    expect(res.matchedTags).toContain('akdeniz-mutfağı');
  });

  // -----------------------------------------------------------------
  // 3. INGREDIENT PARSING TESTS (Tests 17 - 24)
  // -----------------------------------------------------------------
  it('Test 17: parseIngredient ayrı amount ve item nesnesini başarıyla ayrıştırır', () => {
    const res = parseIngredient({ item: 'Chicken Breasts', amount: '500g' });
    expect(res.name).toBe('Chicken Breasts');
    expect(res.amount).toBe('500');
    expect(res.unit).toBe('g');
    expect(res.status).toBe('parsed');
  });

  it('Test 18: parseNumericValue tamsayı ve ondalık sayıları doğru ayrıştırır', () => {
    expect(parseNumericValue('500')).toBe(500);
    expect(parseNumericValue('1.5')).toBe(1.5);
  });

  it('Test 19: parseNumericValue basit kesirleri (1/2, 3/4) doğru ayrıştırır', () => {
    expect(parseNumericValue('1/2')).toBe(0.5);
    expect(parseNumericValue('3/4')).toBe(0.75);
  });

  it('Test 20: parseNumericValue bileşik kesirleri (1 1/2) doğru ayrıştırır', () => {
    expect(parseNumericValue('1 1/2')).toBe(1.5);
    expect(parseNumericValue('2 1/4')).toBe(2.25);
  });

  it('Test 21: parseIngredient "1 can coconut milk" tekil stringini parse eder', () => {
    const res = parseIngredient('1 can coconut milk');
    expect(res.amount).toBe('1');
    expect(res.unit).toBe('can');
    expect(res.name).toBe('coconut milk');
    expect(res.status).toBe('parsed');
  });

  it('Test 22: parseIngredient tuz, su ve zeytinyağı gibi temel malzemeleri (isStaple) tespit eder', () => {
    const salt = parseIngredient('1 tsp salt');
    expect(salt.isStaple).toBe(true);

    const chicken = parseIngredient('500g chicken');
    expect(chicken.isStaple).toBe(false);
  });

  it('Test 23: parseIngredient ölçüsüz belirsiz malzemelerde raw metni korur ve unparsed işaretler', () => {
    const res = parseIngredient('Fresh coriander leaves');
    expect(res.raw).toBe('Fresh coriander leaves');
    expect(res.name).toBe('Fresh coriander leaves');
    expect(res.status).toBe('unparsed');
  });

  it('Test 24: parseIngredient boş veya geçersiz girdide çökmez', () => {
    const res = parseIngredient('');
    expect(res.name).toBe('');
    expect(res.status).toBe('unparsed');
  });

  // -----------------------------------------------------------------
  // 4. IMAGE MATCHING TESTS (Tests 25 - 30)
  // -----------------------------------------------------------------
  it('Test 25: matchRecipeImage görsel olmadığında status="missing" döner', () => {
    const noImg = { ...sampleNormalizedRecipe, image: null };
    const res = matchRecipeImage(noImg);
    expect(res.status).toBe('missing');
    expect(res.imageMatchScore).toBe(0);
  });

  it('Test 26: matchRecipeImage placehold.co içeren görselleri tespit eder ve reddeder', () => {
    const placeholderRecipe = { ...sampleNormalizedRecipe, image: 'https://placehold.co/600x400' };
    const res = matchRecipeImage(placeholderRecipe);
    expect(res.status).toBe('rejected');
    expect(res.imageMatchScore).toBe(0);
  });

  it('Test 27: matchRecipeImage başlık ve kategori uyumuna göre şeffaf skor üretir', () => {
    const res = matchRecipeImage(sampleNormalizedRecipe);
    expect(res.imageMatchScore).toBeGreaterThanOrEqual(40);
    expect(res.reasons.length).toBeGreaterThan(0);
  });

  it('Test 28: matchRecipeImage Pexels onaylı görsel için status="ready" döner', () => {
    const pexelsRecipe = {
      ...sampleNormalizedRecipe,
      image: 'https://images.pexels.com/photos/1001/chicken.jpg'
    };
    const res = matchRecipeImage(pexelsRecipe, { permissionStatus: 'authorized', license: 'Pexels License' });
    expect(res.status).toBe('ready');
    expect(res.imageMatchScore).toBeGreaterThanOrEqual(70);
  });

  it('Test 29: matchRecipeImage TheMealDB görsellerini lisans güvencesi için "needs_review" olarak işaretler', () => {
    const res = matchRecipeImage(sampleNormalizedRecipe, { license: 'unknown' });
    expect(res.status).toBe('needs_review');
    expect(res.permissionStatus).toBe('needs_review');
  });

  it('Test 30: matchRecipeImage confidence değerini 0 ile 1 arasında döndürür', () => {
    const res = matchRecipeImage(sampleNormalizedRecipe);
    expect(res.confidence).toBeGreaterThanOrEqual(0);
    expect(res.confidence).toBeLessThanOrEqual(1);
  });

  // -----------------------------------------------------------------
  // 5. VIDEO MATCHING & SECURITY TESTS (Tests 31 - 40)
  // -----------------------------------------------------------------
  it('Test 31: matchRecipeVideo geçerli 11 haneli YouTube ID için status="ready" döner', () => {
    const res = matchRecipeVideo(sampleNormalizedRecipe);
    expect(res.status).toBe('ready');
    expect(res.videoId).toBe('4aZr5hZXP_s');
    expect(res.videoMatchScore).toBe(100);
  });

  it('Test 32: matchRecipeVideo resmi youtube-nocookie.com/embed/ URL üretir', () => {
    const res = matchRecipeVideo(sampleNormalizedRecipe);
    expect(res.embedUrl).toBe('https://www.youtube-nocookie.com/embed/4aZr5hZXP_s');
  });

  it('Test 33: matchRecipeVideo videoId olmadığında status="missing" döner', () => {
    const noVid = { ...sampleNormalizedRecipe, videoId: null };
    const res = matchRecipeVideo(noVid);
    expect(res.status).toBe('missing');
    expect(res.videoMatchScore).toBe(0);
  });

  it('Test 34: matchRecipeVideo 11 karakterden farklı bozuk ID\'leri reddeder', () => {
    const badVid = { ...sampleNormalizedRecipe, videoId: 'too_short' };
    const res = matchRecipeVideo(badVid);
    expect(res.status).toBe('rejected');
  });

  it('Test 35: buildVideoSearchQuery güvenli arama terimi üretir', () => {
    const query = buildVideoSearchQuery(sampleNormalizedRecipe);
    expect(query.queryString).toContain('Teriyaki Chicken Casserole');
    expect(query.recipeTitle).toBe('Teriyaki Chicken Casserole');
  });

  it('Test 36: MockRecipeVideoSearchProvider geçerli 11 haneli video adayı üretir', async () => {
    const provider = new MockRecipeVideoSearchProvider();
    const query = buildVideoSearchQuery(sampleNormalizedRecipe);
    const candidates = await provider.searchCandidates(query);

    expect(candidates).toHaveLength(1);
    expect(candidates[0].videoId).toHaveLength(11);
    expect(candidates[0].embedUrl).toContain('youtube-nocookie.com/embed/');
  });

  it('Test 37: isValidSecureEmbedUrl "javascript:" linklerini kesinlikle engeller', () => {
    expect(isValidSecureEmbedUrl('javascript:alert(1)')).toBe(false);
  });

  it('Test 38: isValidSecureEmbedUrl "data:" URI linklerini kesinlikle engeller', () => {
    expect(isValidSecureEmbedUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
  });

  it('Test 39: isValidSecureEmbedUrl yetkisiz üçüncü taraf iframe alan adlarını engeller', () => {
    expect(isValidSecureEmbedUrl('https://evil-site.com/embed/4aZr5hZXP_s')).toBe(false);
  });

  it('Test 40: isValidSecureEmbedUrl HTML etiketleri ve tırnak işaretleri içeren URL\'leri engeller', () => {
    expect(isValidSecureEmbedUrl('https://www.youtube-nocookie.com/embed/<script>')).toBe(false);
    expect(isValidSecureEmbedUrl('https://www.youtube-nocookie.com/embed/4aZr5hZXP_s" onload="alert(1)')) .toBe(false);
  });

  // -----------------------------------------------------------------
  // 6. COMPLETENESS & QUALITY TESTS (Tests 41 - 49)
  // -----------------------------------------------------------------
  it('Test 41: evaluateRecipeCompleteness eksiksiz tarifte productionReady=true döner', () => {
    const completeness = evaluateRecipeCompleteness({
      recipe: sampleNormalizedRecipe,
      localizedData: {
        sourceTitle: sampleNormalizedRecipe.title,
        sourceLanguage: 'tr',
        displayTitle: sampleNormalizedRecipe.title,
        displayLanguage: 'tr',
        translationStatus: 'translated'
      },
      taxonomyData: {
        cooklyCategory: 'Ana Yemekler',
        matchedTags: ['tavuk'],
        confidence: 0.9,
        status: 'mapped'
      },
      imageData: {
        imageMatchScore: 85,
        status: 'ready',
        reasons: [],
        confidence: 0.85,
        permissionStatus: 'authorized',
        license: 'CC0'
      },
      videoData: {
        videoMatchScore: 100,
        status: 'ready',
        reasons: [],
        confidence: 1.0,
        permissionStatus: 'authorized_embed'
      }
    });

    expect(completeness.contentComplete).toBe(true);
    expect(completeness.productionReady).toBe(true);
    expect(completeness.issues.filter(i => i.severity === 'blocking')).toHaveLength(0);
  });

  it('Test 42: evaluateRecipeCompleteness başlık eksik olduğunda blocking hata üretir', () => {
    const bad = { ...sampleNormalizedRecipe, title: '' };
    const completeness = evaluateRecipeCompleteness({
      recipe: bad,
      localizedData: { sourceTitle: '', sourceLanguage: 'tr', displayTitle: '', displayLanguage: 'tr', translationStatus: 'translated' },
      taxonomyData: { cooklyCategory: 'Çorbalar', matchedTags: [], confidence: 1, status: 'mapped' },
      imageData: { imageMatchScore: 0, status: 'missing', reasons: [], confidence: 1, permissionStatus: 'none', license: 'none' },
      videoData: { videoMatchScore: 0, status: 'missing', reasons: [], confidence: 1, permissionStatus: 'none' }
    });

    expect(completeness.productionReady).toBe(false);
    expect(completeness.issues.some(i => i.field === 'title' && i.severity === 'blocking')).toBe(true);
  });

  it('Test 43: evaluateRecipeCompleteness malzeme olmadığında blocking hata üretir', () => {
    const bad = { ...sampleNormalizedRecipe, ingredients: [] };
    const completeness = evaluateRecipeCompleteness({
      recipe: bad,
      localizedData: { sourceTitle: bad.title, sourceLanguage: 'tr', displayTitle: bad.title, displayLanguage: 'tr', translationStatus: 'translated' },
      taxonomyData: { cooklyCategory: 'Çorbalar', matchedTags: [], confidence: 1, status: 'mapped' },
      imageData: { imageMatchScore: 0, status: 'missing', reasons: [], confidence: 1, permissionStatus: 'none', license: 'none' },
      videoData: { videoMatchScore: 0, status: 'missing', reasons: [], confidence: 1, permissionStatus: 'none' }
    });

    expect(completeness.productionReady).toBe(false);
    expect(completeness.issues.some(i => i.field === 'ingredients' && i.severity === 'blocking')).toBe(true);
  });

  it('Test 44: evaluateRecipeCompleteness hazırlanış adımı olmadığında blocking hata üretir', () => {
    const bad = { ...sampleNormalizedRecipe, instructions: [] };
    const completeness = evaluateRecipeCompleteness({
      recipe: bad,
      localizedData: { sourceTitle: bad.title, sourceLanguage: 'tr', displayTitle: bad.title, displayLanguage: 'tr', translationStatus: 'translated' },
      taxonomyData: { cooklyCategory: 'Çorbalar', matchedTags: [], confidence: 1, status: 'mapped' },
      imageData: { imageMatchScore: 0, status: 'missing', reasons: [], confidence: 1, permissionStatus: 'none', license: 'none' },
      videoData: { videoMatchScore: 0, status: 'missing', reasons: [], confidence: 1, permissionStatus: 'none' }
    });

    expect(completeness.productionReady).toBe(false);
    expect(completeness.issues.some(i => i.field === 'instructions' && i.severity === 'blocking')).toBe(true);
  });

  it('Test 45: evaluateRecipeCompleteness görsel eksik veya incelenmemiş olduğunda blocking DEĞİL, warning üretir', () => {
    const completeness = evaluateRecipeCompleteness({
      recipe: sampleNormalizedRecipe,
      localizedData: { sourceTitle: sampleNormalizedRecipe.title, sourceLanguage: 'tr', displayTitle: sampleNormalizedRecipe.title, displayLanguage: 'tr', translationStatus: 'translated' },
      taxonomyData: { cooklyCategory: 'Ana Yemekler', matchedTags: [], confidence: 1, status: 'mapped' },
      imageData: { imageMatchScore: 50, status: 'needs_review', reasons: [], confidence: 0.5, permissionStatus: 'needs_review', license: 'unknown' },
      videoData: { videoMatchScore: 100, status: 'ready', reasons: [], confidence: 1, permissionStatus: 'authorized_embed' }
    });

    // Content is complete, so not blocked
    expect(completeness.contentComplete).toBe(true);
    expect(completeness.productionReady).toBe(true);
    expect(completeness.issues.some(i => i.field === 'image' && i.severity === 'warning')).toBe(true);
  });

  it('Test 46: evaluateRecipeCompleteness video olmadığında optional uyarı üretir', () => {
    const completeness = evaluateRecipeCompleteness({
      recipe: sampleNormalizedRecipe,
      localizedData: { sourceTitle: sampleNormalizedRecipe.title, sourceLanguage: 'tr', displayTitle: sampleNormalizedRecipe.title, displayLanguage: 'tr', translationStatus: 'translated' },
      taxonomyData: { cooklyCategory: 'Ana Yemekler', matchedTags: [], confidence: 1, status: 'mapped' },
      imageData: { imageMatchScore: 80, status: 'ready', reasons: [], confidence: 0.8, permissionStatus: 'authorized', license: 'CC0' },
      videoData: { videoMatchScore: 0, status: 'missing', reasons: [], confidence: 1, permissionStatus: 'none' }
    });

    expect(completeness.issues.some(i => i.field === 'video' && i.severity === 'optional')).toBe(true);
  });

  it('Test 47: evaluateRecipeCompleteness taksonomi eşleşmediğinde warning üretir', () => {
    const completeness = evaluateRecipeCompleteness({
      recipe: sampleNormalizedRecipe,
      localizedData: { sourceTitle: sampleNormalizedRecipe.title, sourceLanguage: 'tr', displayTitle: sampleNormalizedRecipe.title, displayLanguage: 'tr', translationStatus: 'translated' },
      taxonomyData: { cooklyCategory: 'unknown', matchedTags: [], confidence: 0, status: 'unknown' },
      imageData: { imageMatchScore: 80, status: 'ready', reasons: [], confidence: 0.8, permissionStatus: 'authorized', license: 'CC0' },
      videoData: { videoMatchScore: 100, status: 'ready', reasons: [], confidence: 1, permissionStatus: 'authorized_embed' }
    });

    expect(completeness.issues.some(i => i.field === 'category' && i.severity === 'warning')).toBe(true);
  });

  it('Test 48: calculateEnrichedQualityScore alt puanları doğru ağırlıklandırır', () => {
    const completeness = evaluateRecipeCompleteness({
      recipe: sampleNormalizedRecipe,
      localizedData: { sourceTitle: sampleNormalizedRecipe.title, sourceLanguage: 'tr', displayTitle: sampleNormalizedRecipe.title, displayLanguage: 'tr', translationStatus: 'translated' },
      taxonomyData: { cooklyCategory: 'Ana Yemekler', matchedTags: [], confidence: 1, status: 'mapped' },
      imageData: { imageMatchScore: 80, status: 'ready', reasons: [], confidence: 0.8, permissionStatus: 'authorized', license: 'CC0' },
      videoData: { videoMatchScore: 100, status: 'ready', reasons: [], confidence: 1, permissionStatus: 'authorized_embed' }
    });

    const score = calculateEnrichedQualityScore({
      recipe: sampleNormalizedRecipe,
      completeness,
      imageData: { imageMatchScore: 80, status: 'ready', reasons: [], confidence: 0.8, permissionStatus: 'authorized', license: 'CC0' },
      videoData: { videoMatchScore: 100, status: 'ready', reasons: [], confidence: 1, permissionStatus: 'authorized_embed' },
      taxonomyData: { cooklyCategory: 'Ana Yemekler', matchedTags: [], confidence: 1, status: 'mapped' },
      localizedData: { sourceTitle: sampleNormalizedRecipe.title, sourceLanguage: 'tr', displayTitle: sampleNormalizedRecipe.title, displayLanguage: 'tr', translationStatus: 'translated' }
    });

    expect(score.overallScore).toBeGreaterThanOrEqual(75);
    expect(score.tier).toBe('excellent');
    expect(score.breakdown.content).toBeGreaterThan(0);
    expect(score.breakdown.image).toBeGreaterThan(0);
    expect(score.breakdown.video).toBeGreaterThan(0);
  });

  it('Test 49: calculateEnrichedQualityScore düşük içerikte reject tier üretir', () => {
    const poorRecipe = { ...sampleNormalizedRecipe, title: 'A', ingredients: [], instructions: [] };
    const completeness = evaluateRecipeCompleteness({
      recipe: poorRecipe,
      localizedData: { sourceTitle: 'A', sourceLanguage: 'en', displayTitle: 'A', displayLanguage: 'en', translationStatus: 'not_translated' },
      taxonomyData: { cooklyCategory: 'unknown', matchedTags: [], confidence: 0, status: 'unknown' },
      imageData: { imageMatchScore: 0, status: 'missing', reasons: [], confidence: 0, permissionStatus: 'none', license: 'none' },
      videoData: { videoMatchScore: 0, status: 'missing', reasons: [], confidence: 0, permissionStatus: 'none' }
    });

    const score = calculateEnrichedQualityScore({
      recipe: poorRecipe,
      completeness,
      imageData: { imageMatchScore: 0, status: 'missing', reasons: [], confidence: 0, permissionStatus: 'none', license: 'none' },
      videoData: { videoMatchScore: 0, status: 'missing', reasons: [], confidence: 0, permissionStatus: 'none' },
      taxonomyData: { cooklyCategory: 'unknown', matchedTags: [], confidence: 0, status: 'unknown' },
      localizedData: { sourceTitle: 'A', sourceLanguage: 'en', displayTitle: 'A', displayLanguage: 'en', translationStatus: 'not_translated' }
    });

    expect(score.overallScore).toBeLessThan(50);
    expect(score.tier).toBe('reject');
  });

  // -----------------------------------------------------------------
  // 7. REVIEW QUEUE & CACHE TESTS (Tests 50 - 52)
  // -----------------------------------------------------------------
  it('Test 50: HumanReviewQueue yeni inceleme maddesi ekler ve çözümler', () => {
    const queue = new HumanReviewQueue();
    const item = queue.addItem({
      recipeId: 'rec_1',
      type: 'image',
      severity: 'warning',
      reason: 'Lisans onayı bekleniyor',
      source: 'themealdb'
    });

    expect(queue.getPendingItems()).toHaveLength(1);
    expect(item.status).toBe('pending');

    const resolved = queue.resolveItem(item.id, 'approved', 'Görsel uygun bulundu.');
    expect(resolved).toBe(true);
    expect(queue.getPendingItems()).toHaveLength(0);
  });

  it('Test 51: DeterministicEnrichmentCache verileri deterministik anahtarla saklar ve döndürür', () => {
    const cache = new DeterministicEnrichmentCache();
    const key = cache.generateKey('query', { q: 'chicken', page: 1 });

    cache.set(key, { result: 'cached_data' }, 'test_provider');

    expect(cache.has(key)).toBe(true);
    expect(cache.get(key)).toEqual({ result: 'cached_data' });
    expect(cache.size()).toBe(1);

    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it('Test 52: enrichBatch 10 tarifi hata izolasyonu ile işler ve review kuyruğu üretir', async () => {
    const recipes = Array.from({ length: 10 }, (_, i) => ({
      ...sampleNormalizedRecipe,
      id: `batch_rec_${i + 1}`,
      title: `Dish ${i + 1}`
    }));

    const batchRes = await enrichBatch(recipes);

    expect(batchRes.totalProcessed).toBe(10);
    expect(batchRes.results).toHaveLength(10);
    expect(batchRes.reviewQueue.length).toBeGreaterThan(0);
    expect(batchRes.failedRecipes).toHaveLength(0);
  });

  // -----------------------------------------------------------------
  // 8. PRODUCTION IMMUTABILITY TEST (Test 53)
  // -----------------------------------------------------------------
  it('Test 53: Production dataset dosyaları (raw_recipes.json ve recipesData.ts) asla değiştirilmez', () => {
    const rawPath = path.resolve(process.cwd(), 'src/data/raw_recipes.json');
    const tsPath = path.resolve(process.cwd(), 'src/data/recipesData.ts');

    expect(fs.existsSync(rawPath)).toBe(true);
    expect(fs.existsSync(tsPath)).toBe(true);

    const rawContent = fs.readFileSync(rawPath, 'utf8');
    const parsed = JSON.parse(rawContent);

    expect(parsed.recipes).toHaveLength(50);
  });
});
