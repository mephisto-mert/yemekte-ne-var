import { describe, it, expect, beforeEach, vi } from 'vitest';
import path from 'path';
import fs from 'fs';
import {
  MockRecipeProvider,
  TheMealDbRecipeProvider,
  RecipeProviderRegistry,
  defaultRecipeProviderRegistry,
  TURKISH_RECIPE_CATEGORIES,
  normalizeCategory,
  deriveTags,
  calculateRecipeQualityScore,
  evaluateImportQualityGate,
  ScalableDuplicateIndex,
  calculateTokenSimilarity,
  generateIngredientSignature,
  RecipeImportBatchEngine,
  MAX_IMPORT_BATCH_SIZE,
  parseYouTubeVideoId,
  buildYouTubeEmbedUrl,
  CuratedRecipeVideoProvider,
  StaticRecipeRepository,
  cleanDisplayText,
  toCanonicalText,
  normalizeRecipe
} from '../pipeline';

describe('Scalable Recipe Import Pipeline Tests (PART 10)', () => {
  let registry: RecipeProviderRegistry;
  let batchEngine: RecipeImportBatchEngine;

  beforeEach(() => {
    registry = new RecipeProviderRegistry();
    batchEngine = new RecipeImportBatchEngine();
  });

  // -------------------------------------------------------------
  // 1. PROVIDER CONTRACT & REGISTRY TESTS (Tests 1 - 8)
  // -------------------------------------------------------------
  it('Test 1: Provider başarıyla registry\'ye kaydedilir ve listelenir', () => {
    const mock = new MockRecipeProvider();
    registry.registerProvider(mock);
    expect(registry.listProviders().length).toBe(1);
    expect(registry.getProvider('mock_recipe_provider')).toBeDefined();
  });

  it('Test 2: Kayıtsız provider arandığında requireProvider kontrollü hata fırlatır', () => {
    expect(() => registry.requireProvider('unknown_provider')).toThrow('Bilinmeyen RecipeProvider');
  });

  it('Test 3: Provider yetenekleri (capabilities) tam olarak tanımlıdır', () => {
    const mock = new MockRecipeProvider();
    expect(mock.metadata.capabilities.search).toBe(true);
    expect(mock.metadata.capabilities.pagination).toBe(true);
    expect(mock.metadata.capabilities.batch).toBe(true);
    expect(mock.metadata.capabilities.images).toBe(true);
    expect(mock.metadata.capabilities.videos).toBe(true);
  });

  it('Test 4: Provider izin durumu ve lisans bilgileri eksiksizdir', () => {
    const mock = new MockRecipeProvider();
    expect(mock.metadata.permissionPolicy).toBe('allowed');
    expect(mock.metadata.license).toContain('Public Domain');
  });

  it('Test 5: Mock provider arama sorgusunu başarıyla filtreler', async () => {
    const mock = new MockRecipeProvider();
    const result = await mock.search({ query: 'çorba' });
    expect(result.recipes.length).toBeGreaterThan(0);
    expect(result.recipes[0].title).toContain('Çorba');
  });

  it('Test 6: Mock provider fetchById ile mevcut tarifi çeker', async () => {
    const mock = new MockRecipeProvider();
    const recipe = await mock.fetchById('mock_1');
    expect(recipe).not.toBeNull();
    expect(recipe?.title).toBe('Mercimek Çorbası');
  });

  it('Test 7: Mock provider fetchById ile bulunamayan ID için null döner', async () => {
    const mock = new MockRecipeProvider();
    const recipe = await mock.fetchById('non_existent_999');
    expect(recipe).toBeNull();
  });

  it('Test 8: unregisterProvider kaydı başarıyla siler', () => {
    const mock = new MockRecipeProvider();
    registry.registerProvider(mock);
    expect(registry.unregisterProvider(mock.id)).toBe(true);
    expect(registry.getProvider(mock.id)).toBeUndefined();
  });

  // -------------------------------------------------------------
  // 2. PAGINATION & BATCH OPTIONS TESTS (Tests 9 - 12)
  // -------------------------------------------------------------
  it('Test 9: Sayfalama (pagination) ilk sayfayı doğru sınırlar', async () => {
    const mock = new MockRecipeProvider();
    const res = await mock.fetchBatch({ page: 1, pageSize: 2 });
    expect(res.recipes.length).toBe(2);
    expect(res.hasMore).toBe(true);
    expect(res.page).toBe(1);
  });

  it('Test 10: Sayfalama ikinci sayfayı doğru dilimler', async () => {
    const mock = new MockRecipeProvider();
    const res = await mock.fetchBatch({ page: 2, pageSize: 2 });
    expect(res.recipes.length).toBe(1);
    expect(res.hasMore).toBe(false);
  });

  it('Test 11: Sayfa boyutu belirtilmediğinde varsayılan 10 kullanılır', async () => {
    const mock = new MockRecipeProvider();
    const res = await mock.fetchBatch();
    expect(res.pageSize).toBe(10);
  });

  it('Test 12: Sayfa boyutu en fazla 100 ile sınırlandırılır', async () => {
    const mock = new MockRecipeProvider();
    const res = await mock.fetchBatch({ pageSize: 500 });
    expect(res.pageSize).toBe(100);
  });

  // -------------------------------------------------------------
  // 3. TÜRKÇE NORMALİZASYON TESTS (Tests 13 - 17)
  // -------------------------------------------------------------
  it('Test 13: cleanDisplayText Türkçe karakterleri ve orijinal büyük/küçük harfleri korur', () => {
    const raw = '   İskender   Kebabı (Özel   Soslu)   ';
    const cleaned = cleanDisplayText(raw);
    expect(cleaned).toBe('İskender Kebabı (Özel Soslu)');
  });

  it('Test 14: toCanonicalText Türkçe karakterleri ASCII kanonik anahtara dönüştürür', () => {
    expect(toCanonicalText('MERCİMEK ÇORBASI')).toBe('mercimek corbasi');
    expect(toCanonicalText('Fırında Sütlaç')).toBe('firinda sutlac');
    expect(toCanonicalText('Zeytinyağlı Yaprak')).toBe('zeytinyagli yaprak');
  });

  it('Test 15: Noktalama işaretleri ve özel karakterler kanonik anahtardan elenir', () => {
    expect(toCanonicalText('Karnıyarık!!! #1 (Lezzetli)')).toBe('karniyarik 1 lezzetli');
  });

  it('Test 16: İ ve I harfleri Türkçe dil kurallarına göre normalize edilir', () => {
    expect(toCanonicalText('İSKENDER')).toBe('iskender');
    expect(toCanonicalText('ISPANAK')).toBe('ispanak');
  });

  it('Test 17: normalizeRecipe fonksiyonu başlığı ve kanonik anahtarı ayrı ayrı saklar', () => {
    const raw = { id: 'test_1', title: 'Çoban Salatası' };
    const norm = normalizeRecipe(raw, 'test_1');
    expect(norm.title).toBe('Çoban Salatası');
    expect(norm.canonicalTitle).toBe('coban salatasi');
  });

  // -------------------------------------------------------------
  // 4. TAXONOMY & CATEGORY TESTS (Tests 18 - 22)
  // -------------------------------------------------------------
  it('Test 18: TURKISH_RECIPE_CATEGORIES geniş kapsamlı Türkçe kategorileri içerir', () => {
    expect(TURKISH_RECIPE_CATEGORIES).toContain('Çorbalar');
    expect(TURKISH_RECIPE_CATEGORIES).toContain('Ana Yemekler');
    expect(TURKISH_RECIPE_CATEGORIES).toContain('Tatlılar');
    expect(TURKISH_RECIPE_CATEGORIES).toContain('Hamur İşleri');
  });

  it('Test 19: normalizeCategory İngilizce ve alternatif isimleri Türkçe kategoriye eşler', () => {
    expect(normalizeCategory('soup')).toBe('Çorbalar');
    expect(normalizeCategory('dessert')).toBe('Tatlılar');
    expect(normalizeCategory('beef')).toBe('Ana Yemekler');
    expect(normalizeCategory('breakfast')).toBe('Kahvaltılıklar');
  });

  it('Test 20: Bilinmeyen özel kategoriler bozulmadan korunur (esnek model)', () => {
    expect(normalizeCategory('Moleküler Mutfak')).toBe('Moleküler Mutfak');
  });

  it('Test 21: deriveTags pişirme süresine göre pratik ve süre etiketlerini türetir', () => {
    const res = deriveTags({
      title: 'Hızlı Omlet',
      ingredients: ['Yumurta', 'Tereyağı'],
      instructions: ['Tavada pişirin.'],
      timeMinutes: 10
    });
    expect(res.derivedTags).toContain('15-dakika');
    expect(res.derivedTags).toContain('pratik');
    expect(res.derivedTags).toContain('tavada');
  });

  it('Test 22: deriveTags et içermeyen tarifler için vejetaryen etiketini türetir', () => {
    const res = deriveTags({
      title: 'Mercimek Çorbası',
      ingredients: ['Mercimek', 'Soğan', 'Havuç'],
      instructions: ['Kaynatın.']
    });
    expect(res.derivedTags).toContain('vejetaryen');
  });

  // -------------------------------------------------------------
  // 5. SCALABLE DUPLICATE DETECTION TESTS (Tests 23 - 28)
  // -------------------------------------------------------------
  it('Test 23: ScalableDuplicateIndex kanonik başlık eşleşmesini O(1) hızında bulur', () => {
    const index = new ScalableDuplicateIndex();
    const r1 = normalizeRecipe({ id: '1', title: 'Karnıyarık' }, '1');
    const r2 = normalizeRecipe({ id: '2', title: 'KARNIYARIK' }, '2');

    index.addRecipe(r1, 'local', '1');
    const matches = index.checkDuplicate(r2, 'incoming', '2');

    expect(matches.length).toBe(1);
    expect(matches[0].matchType).toBe('exact_canonical_title');
    expect(matches[0].matchedRecipeId).toBe('1');
  });

  it('Test 24: Aynı sağlayıcı ve sourceId çakışmasını tespit eder', () => {
    const index = new ScalableDuplicateIndex();
    const r1 = normalizeRecipe({ id: 'ex_1', title: 'Yemek A' }, 'ex_1');
    const r2 = normalizeRecipe({ id: 'ex_1_new', title: 'Yemek Farklı Başlık' }, 'ex_1');

    index.addRecipe(r1, 'themealdb', 'ex_1');
    const matches = index.checkDuplicate(r2, 'themealdb', 'ex_1');

    expect(matches.length).toBe(1);
    expect(matches[0].matchType).toBe('exact_source_id');
  });

  it('Test 25: Malzeme imzası ile içerik benzerliğini yakalar', () => {
    const index = new ScalableDuplicateIndex();
    const r1 = normalizeRecipe({
      id: '1',
      title: 'Özel Çorba',
      ingredients: [
        { item: 'Kırmızı Mercimek', amount: '1 bardak' },
        { item: 'Havuç', amount: '1 adet' }
      ]
    }, '1');

    const r2 = normalizeRecipe({
      id: '2',
      title: 'Değişik Çorba',
      ingredients: [
        { item: 'Kırmızı Mercimek', amount: '2 bardak' },
        { item: 'Havuç', amount: '2 adet' }
      ]
    }, '2');

    index.addRecipe(r1, 'src', '1');
    const matches = index.checkDuplicate(r2, 'src', '2');
    expect(matches.some(m => m.matchType === 'ingredient_signature')).toBe(true);
  });

  it('Test 26: Token benzerliği yakın başlıkları (Karnıyarık ~ Kıymalı Karnıyarık) benzerlik adayı olarak bulur', () => {
    const index = new ScalableDuplicateIndex();
    const r1 = normalizeRecipe({ id: '1', title: 'Karnıyarık' }, '1');
    const r2 = normalizeRecipe({ id: '2', title: 'Kıymalı Karnıyarık' }, '2');

    index.addRecipe(r1, 'src', '1');
    const matches = index.checkDuplicate(r2, 'src', '2');
    expect(matches.some(m => m.matchType === 'title_similarity')).toBe(true);
  });

  it('Test 27: calculateTokenSimilarity aynı metin için 1.0, farklı metin için 0.0 döner', () => {
    expect(calculateTokenSimilarity('mercimek corbasi', 'mercimek corbasi')).toBe(1.0);
    expect(calculateTokenSimilarity('tavuk sote', 'elma kompostosu')).toBe(0.0);
  });

  it('Test 28: Benzersiz tarif için duplicate kontrolü boş dizi döner', () => {
    const index = new ScalableDuplicateIndex();
    const r1 = normalizeRecipe({ id: '1', title: 'Baklava' }, '1');
    const r2 = normalizeRecipe({ id: '2', title: 'Tarhana Çorbası' }, '2');

    index.addRecipe(r1);
    expect(index.checkDuplicate(r2).length).toBe(0);
  });

  // -------------------------------------------------------------
  // 6. RECIPE QUALITY SCORE TESTS (Tests 29 - 33)
  // -------------------------------------------------------------
  it('Test 29: Eksiksiz bir tarif 85+ alarak "excellent" seviyesine ulaşır', () => {
    const recipe = normalizeRecipe({
      id: '1',
      title: 'Fırında Levrek',
      category: 'Deniz Ürünleri',
      ingredients: [
        { item: 'Levrek', amount: '2 adet' },
        { item: 'Zeytinyağı', amount: '2 yemek kaşığı' }
      ],
      steps: ['Balıkları temizleyin.', 'Fırında 25 dakika pişirin.'],
      image: 'https://images.pexels.com/levrek.jpg',
      videoId: 'yt_levrek_1'
    }, '1');

    const quality = calculateRecipeQualityScore(recipe, {
      sourceName: 'Test',
      sourceType: 'mock',
      retrievedAt: '',
      contentPermissionStatus: 'authorized',
      permissionPolicy: 'allowed',
      license: 'CC0'
    });

    expect(quality.score).toBeGreaterThanOrEqual(85);
    expect(quality.tier).toBe('excellent');
  });

  it('Test 30: Görsel ve videosu eksik ama içeriği tam tarif "good" seviyesinde kalır', () => {
    const recipe = normalizeRecipe({
      id: '2',
      title: 'Cacık',
      category: 'Mezeler',
      ingredients: [
        { item: 'Yoğurt', amount: '1 kase' },
        { item: 'Salatalık', amount: '2 adet' }
      ],
      steps: ['Salatalıkları rendeleyin.', 'Yoğurtla karıştırın.']
    }, '2');

    const quality = calculateRecipeQualityScore(recipe);
    expect(quality.score).toBeGreaterThanOrEqual(70);
    expect(quality.score).toBeLessThan(85);
    expect(quality.tier).toBe('good');
  });

  it('Test 31: Adımları eksik tarif "review" seviyesine düşer', () => {
    const recipe = normalizeRecipe({
      id: '3',
      title: 'Hızlı Atıştırmalık',
      ingredients: [{ item: 'Ekmek', amount: '1 dilim' }],
      steps: []
    }, '3');

    const quality = calculateRecipeQualityScore(recipe);
    expect(quality.tier).toBe('reject');
  });

  it('Test 32: Boş tarif < 50 puan alarak "reject" seviyesine düşer', () => {
    const recipe = normalizeRecipe({ id: '4', title: '' }, '4');
    const quality = calculateRecipeQualityScore(recipe);
    expect(quality.score).toBeLessThan(50);
    expect(quality.tier).toBe('reject');
  });

  it('Test 33: calculateRecipeQualityScore detaylı puan dökümü sunar', () => {
    const recipe = normalizeRecipe({ id: '5', title: 'Test' }, '5');
    const quality = calculateRecipeQualityScore(recipe);
    expect(quality.breakdown).toHaveProperty('title');
    expect(quality.breakdown).toHaveProperty('ingredients');
    expect(quality.breakdown).toHaveProperty('instructions');
  });

  // -------------------------------------------------------------
  // 7. IMPORT QUALITY GATE TESTS (Tests 34 - 39)
  // -------------------------------------------------------------
  it('Test 34: Yasaklı kaynak (prohibited) doğrudan REJECTED kararı alır', () => {
    const recipe = normalizeRecipe({ id: '1', title: 'Yasaklı Tarif', ingredients: [{ item: 'A', amount: '1' }, { item: 'B', amount: '2' }], steps: ['Pişir'] }, '1');
    const gate = evaluateImportQualityGate({
      recipe,
      sourceMetadata: {
        sourceName: 'Scraper',
        sourceType: 'external',
        retrievedAt: '',
        contentPermissionStatus: 'unknown',
        permissionPolicy: 'prohibited'
      }
    });

    expect(gate.decision).toBe('REJECTED');
    expect(gate.completeness.importReady).toBe(false);
  });

  it('Test 35: Malzemesi eksik tarif doğrudan REJECTED kararı alır', () => {
    const recipe = normalizeRecipe({ id: '2', title: 'Malzemesiz Tarif', ingredients: [], steps: ['Pişir'] }, '2');
    const gate = evaluateImportQualityGate({ recipe });
    expect(gate.decision).toBe('REJECTED');
  });

  it('Test 36: Mükerrer şüphesi olan tarif REVIEW_REQUIRED kararı alır', () => {
    const recipe = normalizeRecipe({
      id: '3',
      title: 'Mükerrer Karnıyarık',
      ingredients: [{ item: 'Patlıcan', amount: '2' }, { item: 'Kıyma', amount: '100g' }],
      steps: ['Fırınla']
    }, '3');

    const gate = evaluateImportQualityGate({
      recipe,
      duplicateCandidate: true,
      duplicateReason: 'Aynı kanonik başlık bulundu.'
    });

    expect(gate.decision).toBe('REVIEW_REQUIRED');
  });

  it('Test 37: İçeriği tam ancak görsel veya videosu olmayan tarif WARNING kararı alır', () => {
    const recipe = normalizeRecipe({
      id: '4',
      title: 'Çorba',
      ingredients: [{ item: 'Su', amount: '1L' }, { item: 'Tuz', amount: '1tk' }],
      steps: ['Kaynat']
    }, '4');

    const gate = evaluateImportQualityGate({
      recipe,
      sourceMetadata: {
        sourceName: 'Mock',
        sourceType: 'mock',
        retrievedAt: '',
        contentPermissionStatus: 'authorized',
        permissionPolicy: 'allowed',
        license: 'CC0'
      }
    });

    expect(gate.decision).toBe('WARNING');
    expect(gate.completeness.importReady).toBe(true);
    expect(gate.imageStatus).toBe('missing');
  });

  it('Test 38: Tüm kriterleri karşılayan tarif VALID kararı alır', () => {
    const recipe = normalizeRecipe({
      id: '5',
      title: 'Tam Teşekküllü Tarif',
      ingredients: [{ item: 'A', amount: '1' }, { item: 'B', amount: '2' }],
      steps: ['Adım 1', 'Adım 2'],
      image: 'https://images.pexels.com/food.jpg',
      videoId: 'yt_video_123'
    }, '5');

    const gate = evaluateImportQualityGate({
      recipe,
      sourceMetadata: {
        sourceName: 'Mock',
        sourceType: 'mock',
        retrievedAt: '',
        contentPermissionStatus: 'authorized',
        permissionPolicy: 'allowed',
        license: 'CC0'
      }
    });

    expect(gate.decision).toBe('VALID');
    expect(gate.imageStatus).toBe('ready');
    expect(gate.videoStatus).toBe('ready');
  });

  it('Test 39: İzin durumu belirsiz (review_required) kaynak REVIEW_REQUIRED kararı alır', () => {
    const recipe = normalizeRecipe({
      id: '6',
      title: 'Şüpheli Kaynak Tarifi',
      ingredients: [{ item: 'A', amount: '1' }, { item: 'B', amount: '2' }],
      steps: ['Pişir']
    }, '6');

    const gate = evaluateImportQualityGate({
      recipe,
      sourceMetadata: {
        sourceName: 'Unclear Source',
        sourceType: 'external',
        retrievedAt: '',
        contentPermissionStatus: 'pending_review',
        permissionPolicy: 'review_required'
      }
    });

    expect(gate.decision).toBe('REVIEW_REQUIRED');
  });

  // -------------------------------------------------------------
  // 8. BATCH ENGINE & MANIFEST TESTS (Tests 40 - 44)
  // -------------------------------------------------------------
  it('Test 40: Batch engine toplu tarifleri normalize eder ve manifest üretir', async () => {
    const provider = new MockRecipeProvider();
    const result = await batchEngine.executeBatch({ provider, pageSize: 3 });

    expect(result.fetchedCount).toBe(3);
    expect(result.manifest).toBeDefined();
    expect(result.manifest.stats.valid).toBeGreaterThan(0);
    expect(result.manifest.recipeDecisions.length).toBe(3);
  });

  it('Test 41: MAX_IMPORT_BATCH_SIZE (100) aşırı büyük istekleri sınırlar', async () => {
    const provider = new MockRecipeProvider();
    const result = await batchEngine.executeBatch({ provider, pageSize: 9999 });
    expect(result.requestedCount).toBe(MAX_IMPORT_BATCH_SIZE);
  });

  it('Test 42: Batch içi hata izolasyonu (bir tarifteki hata diğerlerini durdurmaz)', async () => {
    const badRecipes = [
      { id: '1', title: 'İyi Tarif', ingredients: [{ item: 'A', amount: '1' }, { item: 'B', amount: '2' }], steps: ['Pişir'] },
      { id: '2', title: null as any, ingredients: null as any }, // Malformed item
      { id: '3', title: 'İkinci İyi Tarif', ingredients: [{ item: 'C', amount: '1' }, { item: 'D', amount: '2' }], steps: ['Kaynat'] }
    ];

    const provider = new MockRecipeProvider(badRecipes);
    const result = await batchEngine.executeBatch({ provider });

    expect(result.fetchedCount).toBe(3);
    expect(result.candidates.length).toBe(3); // Normalizer handles gracefully
  });

  it('Test 43: Batch içi aynı başlığa sahip tarifler mükerrer olarak etiketlenir', async () => {
    const dupRecipes = [
      { id: 'd1', title: 'Ezogelin Çorbası', ingredients: [{ item: 'A', amount: '1' }, { item: 'B', amount: '2' }], steps: ['Pişir'] },
      { id: 'd2', title: 'Ezogelin Çorbası', ingredients: [{ item: 'A', amount: '1' }, { item: 'B', amount: '2' }], steps: ['Pişir'] }
    ];

    const provider = new MockRecipeProvider(dupRecipes);
    const result = await batchEngine.executeBatch({ provider });

    expect(result.duplicateCount).toBe(1);
    expect(result.candidates[1].decision).toBe('REVIEW_REQUIRED');
  });

  it('Test 44: Batch sonucu işlem süresi ve benzersiz batchId içerir', async () => {
    const provider = new MockRecipeProvider();
    const result = await batchEngine.executeBatch({ provider });
    expect(result.batchId).toMatch(/^batch_\d+_[a-z0-9]+$/);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  // -------------------------------------------------------------
  // 9. THEMEALDB PROVIDER TESTS (Tests 45 - 48)
  // -------------------------------------------------------------
  it('Test 45: TheMealDbRecipeProvider HTTP yanıtını RawRecipe formatına dönüştürür', async () => {
    const sampleMeal = {
      idMeal: '52772',
      strMeal: 'Teriyaki Chicken Casserole',
      strCategory: 'Chicken',
      strArea: 'Japanese',
      strInstructions: 'Boil water.\nCook chicken thoroughly.\nServe warm.',
      strMealThumb: 'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg',
      strYoutube: 'https://www.youtube.com/watch?v=4aZr5hZXP_s',
      strIngredient1: 'Chicken',
      strMeasure1: '3/4 cup',
      strIngredient2: 'Soy Sauce',
      strMeasure2: '1/2 cup'
    };

    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ meals: [sampleMeal] })
    });

    const provider = new TheMealDbRecipeProvider({
      httpClient: { get: async () => ({ ok: true, status: 200, data: { meals: [sampleMeal] }, headers: {} }) } as any
    });

    const res = await provider.search({ query: 'chicken' });
    expect(res.recipes.length).toBe(1);
    const mapped = res.recipes[0];

    expect(mapped.id).toBe('52772');
    expect(mapped.title).toBe('Teriyaki Chicken Casserole');
    expect(mapped.videoId).toBe('4aZr5hZXP_s');
    expect(mapped.ingredients?.length).toBe(2);
    expect(mapped.image).toContain('themealdb.com');
  });

  it('Test 46: TheMealDb arama boş veya hatalı döndüğünde çökmeden boş liste döner', async () => {
    const provider = new TheMealDbRecipeProvider({
      httpClient: { get: async () => ({ ok: true, status: 200, data: { meals: null }, headers: {} }) } as any
    });

    const res = await provider.search({ query: 'nonexistentdish' });
    expect(res.recipes).toEqual([]);
  });

  it('Test 47: TheMealDb fetchById tekil tarifi doğru çeker', async () => {
    const sampleMeal = { idMeal: '52772', strMeal: 'Soup' };
    const provider = new TheMealDbRecipeProvider({
      httpClient: { get: async () => ({ ok: true, status: 200, data: { meals: [sampleMeal] }, headers: {} }) } as any
    });

    const recipe = await provider.fetchById('52772');
    expect(recipe).not.toBeNull();
    expect(recipe?.title).toBe('Soup');
  });

  it('Test 48: TheMealDb metadata açık kamu lisansını beyan eder', () => {
    const provider = new TheMealDbRecipeProvider();
    expect(provider.metadata.permissionPolicy).toBe('allowed');
    expect(provider.metadata.license).toContain('TheMealDB');
  });

  // -------------------------------------------------------------
  // 10. YOUTUBE VIDEO ARCHITECTURE TESTS (Tests 49 - 52)
  // -------------------------------------------------------------
  it('Test 49: parseYouTubeVideoId farklı formatlardaki YouTube linklerinden 11 haneli ID\'yi ayıklar', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
  });

  it('Test 50: buildYouTubeEmbedUrl resmi gizlilik odaklı (nocookie) embed URL\'si üretir', () => {
    const embed = buildYouTubeEmbedUrl('dQw4w9WgXcQ');
    expect(embed).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
  });

  it('Test 51: CuratedRecipeVideoProvider video aramasını başarıyla gerçekleştirir', async () => {
    const videoProvider = new CuratedRecipeVideoProvider();
    const res = await videoProvider.searchVideos({ recipeTitle: 'Mercimek Çorbası' });
    expect(res.candidates.length).toBeGreaterThan(0);
    expect(res.candidates[0].videoId).toBe('mock_vid_mercimek');
  });

  it('Test 52: CuratedRecipeVideoProvider getVideoById ile resmi embed nesnesi döner', async () => {
    const videoProvider = new CuratedRecipeVideoProvider();
    const vid = await videoProvider.getVideoById('dQw4w9WgXcQ');
    expect(vid).not.toBeNull();
    expect(vid?.embedUrl).toContain('youtube-nocookie.com');
  });

  // -------------------------------------------------------------
  // 11. REPOSITORY & DATASET IMMUTABILITY TESTS (Tests 53 - 55)
  // -------------------------------------------------------------
  it('Test 53: StaticRecipeRepository read-only modda saveRecipe çağrıldığında güvenlik hatası fırlatır', async () => {
    const repo = new StaticRecipeRepository({ readOnly: true });
    const norm = normalizeRecipe({ id: 'test_1', title: 'Test' }, 'test_1');

    await expect(repo.saveRecipe(norm)).rejects.toThrow('GÜVENLİK KORUMASI: StaticRecipeRepository salt-okunur');
  });

  it('Test 54: StaticRecipeRepository findById mevcut üretim tariflerini güvenle okur', async () => {
    const repo = new StaticRecipeRepository();
    const found = await repo.findById('1');
    expect(found).not.toBeNull();
  });

  it('Test 55: Üretim veri seti (raw_recipes.json) testler ve pipeline sonrasında 50 tarif olarak kalır', () => {
    const rawPath = path.resolve(__dirname, '../data/raw_recipes.json');
    const content = fs.readFileSync(rawPath, 'utf8');
    const parsed = JSON.parse(content);

    expect(parsed.recipes).toBeDefined();
    expect(parsed.recipes.length).toBe(50);
    expect(parsed.recipes[0].name).toBe('Tavuk Sote');
  });
});
