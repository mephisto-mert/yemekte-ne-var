import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  TheMealDbRecipeProvider,
  validateMealDbMeal
} from '../pipeline/import/providers/mealDbProvider';
import { SafeHttpClient } from '../pipeline/image/providers/httpClient';
import { ScalableDuplicateIndex } from '../pipeline/import/scalableDuplicateDetector';
import { StagingRecipeRepository } from '../pipeline/import/stagingRepository';
import { normalizeRecipe } from '../pipeline/normalizer';

describe('PART 11 — TheMealDB Import & Staging Verification Suite', () => {
  const sampleMealDbPayload = {
    idMeal: '52772',
    strMeal: 'Teriyaki Chicken Casserole',
    strCategory: 'Chicken',
    strArea: 'Japanese',
    strInstructions: 'Preheat oven to 350°F (175°C).\nCook rice according to package directions.\nStir in chicken and broccoli.\nBake for 30 minutes until hot and bubbly.',
    strMealThumb: 'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg',
    strYoutube: 'https://www.youtube.com/watch?v=4aZr5hZXP_s',
    strIngredient1: 'Soy Sauce',
    strMeasure1: '3/4 cup',
    strIngredient2: 'Water',
    strMeasure2: '1/2 cup',
    strIngredient3: 'Chicken Breasts',
    strMeasure3: '2 lbs',
    strIngredient4: '',
    strMeasure4: '',
    strIngredient5: 'null',
    strMeasure5: 'null'
  };

  // -----------------------------------------------------------------
  // 1. SCHEMA VALIDATION TESTS
  // -----------------------------------------------------------------
  it('Test 1: validateMealDbMeal tam ve geçerli meal nesnesini onaylar', () => {
    const result = validateMealDbMeal(sampleMealDbPayload);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('Test 2: validateMealDbMeal idMeal eksik veya boşsa reddeder', () => {
    const bad = { ...sampleMealDbPayload, idMeal: '' };
    const res = validateMealDbMeal(bad);
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain('idMeal');
  });

  it('Test 3: validateMealDbMeal strMeal eksik veya 2 karakterden kısaysa reddeder', () => {
    const bad = { ...sampleMealDbPayload, strMeal: 'A' };
    const res = validateMealDbMeal(bad);
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain('strMeal');
  });

  it('Test 4: validateMealDbMeal strInstructions eksik veya çok kısaysa reddeder', () => {
    const bad = { ...sampleMealDbPayload, strInstructions: 'Cook it.' };
    const res = validateMealDbMeal(bad);
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain('strInstructions');
  });

  it('Test 5: validateMealDbMeal hiç geçerli malzeme yoksa reddeder', () => {
    const bad = {
      ...sampleMealDbPayload,
      strIngredient1: '',
      strIngredient2: '  ',
      strIngredient3: 'null'
    };
    const res = validateMealDbMeal(bad);
    expect(res.isValid).toBe(false);
    expect(res.errors[0]).toContain('strIngredient');
  });

  // -----------------------------------------------------------------
  // 2. MAPPING, TITLE & LANGUAGE TESTS
  // -----------------------------------------------------------------
  it('Test 6: mapMealToRawRecipe orijinal İngilizce başlığı Türkçe\'ye çevirmeden korur', () => {
    const provider = new TheMealDbRecipeProvider();
    const raw = provider.mapMealToRawRecipe(sampleMealDbPayload);

    expect(raw.title).toBe('Teriyaki Chicken Casserole');
    expect(raw.name).toBe('Teriyaki Chicken Casserole');
    expect(raw.metadata?.sourceTitle).toBe('Teriyaki Chicken Casserole');
    expect(raw.metadata?.displayTitle).toBe('Teriyaki Chicken Casserole');
  });

  it('Test 7: mapMealToRawRecipe yabancı mutfaklar için en, Türk mutfağı için tr atar', () => {
    const provider = new TheMealDbRecipeProvider();
    const enRaw = provider.mapMealToRawRecipe(sampleMealDbPayload);
    expect(enRaw.language).toBe('en');

    const trMeal = {
      ...sampleMealDbPayload,
      strMeal: 'Karnıyarık',
      strArea: 'Turkish'
    };
    const trRaw = provider.mapMealToRawRecipe(trMeal);
    expect(trRaw.language).toBe('tr');
  });

  it('Test 8: mapMealToRawRecipe malzemeleri temizler, boş ve "null" stringleri eler', () => {
    const provider = new TheMealDbRecipeProvider();
    const raw = provider.mapMealToRawRecipe(sampleMealDbPayload);

    expect(raw.ingredients).toHaveLength(3);
    expect(raw.ingredients![0]).toEqual({ item: 'Soy Sauce', amount: '3/4 cup' });
    expect(raw.ingredients![1]).toEqual({ item: 'Water', amount: '1/2 cup' });
    expect(raw.ingredients![2]).toEqual({ item: 'Chicken Breasts', amount: '2 lbs' });
  });

  it('Test 9: mapMealToRawRecipe ölçü olmadığında boş string üretmez (undefined bırakır)', () => {
    const provider = new TheMealDbRecipeProvider();
    const mealWithoutMeasure = {
      ...sampleMealDbPayload,
      strIngredient1: 'Salt',
      strMeasure1: '',
      strIngredient2: '',
      strIngredient3: ''
    };
    const raw = provider.mapMealToRawRecipe(mealWithoutMeasure);

    expect(raw.ingredients).toHaveLength(1);
    expect(raw.ingredients![0]).toEqual({ item: 'Salt', amount: undefined });
  });

  // -----------------------------------------------------------------
  // 3. MEDIA CANDIDATE TESTS
  // -----------------------------------------------------------------
  it('Test 10: mapMealToRawRecipe YouTube linkinden 11 haneli videoId çıkarır', () => {
    const provider = new TheMealDbRecipeProvider();
    const raw = provider.mapMealToRawRecipe(sampleMealDbPayload);

    expect(raw.videoId).toBe('4aZr5hZXP_s');
    expect(raw.videoCandidates).toEqual(['4aZr5hZXP_s']);
    expect(raw.videoTitle).toContain('Teriyaki Chicken Casserole');
  });

  it('Test 11: mapMealToRawRecipe YouTube linki yoksa videoId null atar', () => {
    const provider = new TheMealDbRecipeProvider();
    const noYt = { ...sampleMealDbPayload, strYoutube: '' };
    const raw = provider.mapMealToRawRecipe(noYt);

    expect(raw.videoId).toBeNull();
    expect(raw.videoCandidates).toEqual([]);
  });

  it('Test 12: mapMealToRawRecipe görsel adayını bağlar ve needs_review olarak işaretler', () => {
    const provider = new TheMealDbRecipeProvider();
    const raw = provider.mapMealToRawRecipe(sampleMealDbPayload);

    expect(raw.image).toContain('themealdb.com');
    expect(raw.imageUrl).toContain('themealdb.com');
    expect(raw.imageCandidates).toHaveLength(1);
    expect(raw.metadata?.imagePermissionStatus).toBe('needs_review');
  });

  it('Test 13: mapMealToRawRecipe kaynak ve lisans metadata\'sını uydurmadan unknown kaydeder', () => {
    const provider = new TheMealDbRecipeProvider();
    const raw = provider.mapMealToRawRecipe(sampleMealDbPayload);

    expect(raw.source).toBe('themealdb');
    expect(raw.sourceId).toBe('52772');
    expect(raw.sourceUrl).toContain('themealdb.com/meal/52772');
    expect(raw.license).toBe('unknown');
    expect(raw.attribution).toBe('TheMealDB Open Recipe Database');
  });

  // -----------------------------------------------------------------
  // 4. PROVIDER SEARCH & PAGINATION TESTS (MOCKED)
  // -----------------------------------------------------------------
  it('Test 14: search boş arama sorgusu verildiğinde ağa çıkmadan boş döner', async () => {
    const provider = new TheMealDbRecipeProvider();
    const res = await provider.search({ query: '   ' });

    expect(res.recipes).toEqual([]);
    expect(res.hasMore).toBe(false);
  });

  it('Test 15: search şema doğrulaması başarısız olan kayıtları eler', async () => {
    const invalidMeal = { idMeal: '', strMeal: '' };
    const httpClient = {
      get: async () => ({
        ok: true,
        status: 200,
        data: { meals: [sampleMealDbPayload, invalidMeal] },
        headers: {}
      })
    } as any;

    const provider = new TheMealDbRecipeProvider({ httpClient });
    const res = await provider.search({ query: 'chicken' });

    expect(res.recipes).toHaveLength(1);
    expect(res.recipes[0].id).toBe('52772');
  });

  it('Test 16: search sayfalama sınırlarını (page, pageSize, hasMore) doğru hesaplar', async () => {
    const manyMeals = Array.from({ length: 15 }, (_, i) => ({
      ...sampleMealDbPayload,
      idMeal: `5200${i}`,
      strMeal: `Chicken Dish ${i}`
    }));

    const httpClient = {
      get: async () => ({
        ok: true,
        status: 200,
        data: { meals: manyMeals },
        headers: {}
      })
    } as any;

    const provider = new TheMealDbRecipeProvider({ httpClient });
    const page1 = await provider.search({ query: 'chicken', page: 1, pageSize: 5 });
    expect(page1.recipes).toHaveLength(5);
    expect(page1.hasMore).toBe(true);
    expect(page1.totalAvailable).toBe(15);

    const page3 = await provider.search({ query: 'chicken', page: 3, pageSize: 5 });
    expect(page3.recipes).toHaveLength(5);
    expect(page3.hasMore).toBe(false);
  });

  it('Test 17: fetchById geçersiz veya bulunamayan ID için null döner', async () => {
    const httpClient = {
      get: async () => ({
        ok: true,
        status: 200,
        data: { meals: null },
        headers: {}
      })
    } as any;

    const provider = new TheMealDbRecipeProvider({ httpClient });
    const res = await provider.fetchById('nonexistent');
    expect(res).toBeNull();
  });

  it('Test 18: healthCheck API erişilebilir olduğunda true döner', async () => {
    const httpClient = {
      get: async () => ({
        ok: true,
        status: 200,
        data: { meals: [sampleMealDbPayload] },
        headers: {}
      })
    } as any;

    const provider = new TheMealDbRecipeProvider({ httpClient });
    const isHealthy = await provider.healthCheck();
    expect(isHealthy).toBe(true);
  });

  // -----------------------------------------------------------------
  // 5. NETWORK SECURITY & RESILIENCE TESTS (SafeHttpClient)
  // -----------------------------------------------------------------
  it('Test 19: SafeHttpClient 401 Unauthorized hatasında retry yapmaz ve fail-safe döner', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      return {
        ok: false,
        status: 401,
        headers: new Map(),
        text: async () => 'Unauthorized'
      };
    });

    const client = new SafeHttpClient({ fetchFn: mockFetch as any, defaultMaxRetries: 3 });
    const res = await client.get('https://api.example.com/data');

    expect(res.ok).toBe(false);
    expect(res.status).toBe(401);
    expect(callCount).toBe(1); // No retries for 401
  });

  it('Test 20: SafeHttpClient 403 Forbidden hatasında retry yapmaz', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      return {
        ok: false,
        status: 403,
        headers: new Map(),
        text: async () => 'Forbidden'
      };
    });

    const client = new SafeHttpClient({ fetchFn: mockFetch as any, defaultMaxRetries: 3 });
    const res = await client.get('https://api.example.com/forbidden');

    expect(res.ok).toBe(false);
    expect(res.status).toBe(403);
    expect(callCount).toBe(1);
  });

  it('Test 21: SafeHttpClient 404 Not Found durumunu kontrollü ele alır', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      headers: new Map(),
      text: async () => 'Not Found'
    });

    const client = new SafeHttpClient({ fetchFn: mockFetch as any });
    const res = await client.get('https://api.example.com/missing');

    expect(res.ok).toBe(false);
    expect(res.status).toBe(404);
  });

  it('Test 22: SafeHttpClient 429 Rate Limit durumunda backoff bekler ve retry yapar', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: false,
          status: 429,
          headers: new Map([['retry-after', '1']]),
          text: async () => 'Rate limit exceeded'
        };
      }
      return {
        ok: true,
        status: 200,
        headers: new Map(),
        text: async () => JSON.stringify({ success: true })
      };
    });

    const client = new SafeHttpClient({
      fetchFn: mockFetch as any,
      defaultMaxRetries: 2,
      defaultRetryDelayMs: 10
    });

    const res = await client.get('https://api.example.com/rate-limited');
    expect(res.ok).toBe(true);
    expect(callCount).toBe(2);
  });

  it('Test 23: SafeHttpClient 500 Server Error durumunda retry yapar', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: false,
          status: 500,
          headers: new Map(),
          text: async () => 'Internal Server Error'
        };
      }
      return {
        ok: true,
        status: 200,
        headers: new Map(),
        text: async () => JSON.stringify({ recovered: true })
      };
    });

    const client = new SafeHttpClient({
      fetchFn: mockFetch as any,
      defaultMaxRetries: 2,
      defaultRetryDelayMs: 10
    });

    const res = await client.get('https://api.example.com/transient-500');
    expect(res.ok).toBe(true);
    expect(callCount).toBe(2);
  });

  it('Test 24: SafeHttpClient bozuk JSON döndüğünde kontrollü hata fırlatır', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map(),
      text: async () => 'NOT_VALID_JSON{['
    });

    const client = new SafeHttpClient({ fetchFn: mockFetch as any, defaultMaxRetries: 0 });
    await expect(client.get('https://api.example.com/bad-json')).rejects.toThrow('malformed JSON');
  });

  // -----------------------------------------------------------------
  // 6. IDEMPOTENCY & DUPLICATE DETECTION TESTS
  // -----------------------------------------------------------------
  it('Test 25: ScalableDuplicateIndex aynı themealdb:52772 kaydı tekrar geldiğinde mükerrer algılar', () => {
    const index = new ScalableDuplicateIndex();
    const provider = new TheMealDbRecipeProvider();
    const raw = provider.mapMealToRawRecipe(sampleMealDbPayload);
    const existing = normalizeRecipe({ ...raw, id: 'existing_52772' }, 'existing_52772');

    index.addRecipe(existing, 'themealdb', '52772');

    // Duplicate check for incoming identical source recipe candidate with different batch candidate ID
    const incoming = normalizeRecipe({ ...raw, id: 'candidate_incoming_52772' }, 'candidate_incoming_52772');
    const duplicates = index.checkDuplicate(incoming, 'themealdb', '52772');
    expect(duplicates.length).toBeGreaterThanOrEqual(1);
    expect(duplicates[0].matchType).toBe('exact_source_id');
    expect(duplicates[0].reason).toContain('Aynı kaynak kimliği');
  });

  // -----------------------------------------------------------------
  // 7. STAGING REPOSITORY & ISOLATION TESTS
  // -----------------------------------------------------------------
  it('Test 26: StagingRecipeRepository tarifleri izole test klasörüne idempotent kaydeder', async () => {
    const testDir = path.resolve(process.cwd(), 'test-output/recipe-import-test-sandbox');
    const repo = new StagingRecipeRepository({ stagingDir: testDir });

    const provider = new TheMealDbRecipeProvider();
    const raw = provider.mapMealToRawRecipe(sampleMealDbPayload);
    const normalized = normalizeRecipe(raw, 'stage_1');

    // First save
    const res1 = await repo.saveBatch([normalized], { source: 'themealdb', sourceId: '52772' });
    expect(res1.savedCount).toBe(1);
    expect(res1.duplicateCount).toBe(0);

    // Second save (identical recipe) -> duplicate must be skipped
    const res2 = await repo.saveBatch([normalized], { source: 'themealdb', sourceId: '52772' });
    expect(res2.savedCount).toBe(0);
    expect(res2.duplicateCount).toBe(1);

    const loaded = await repo.loadStagedRecipes();
    expect(loaded).toHaveLength(1);

    // Cleanup sandbox
    await repo.clearStaging();
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('Test 27: StagingRecipeRepository manifest, recipes ve report dosyalarını üretir', async () => {
    const testDir = path.resolve(process.cwd(), 'test-output/recipe-import-test-artifacts');
    const repo = new StagingRecipeRepository({ stagingDir: testDir });

    const provider = new TheMealDbRecipeProvider();
    const raw = provider.mapMealToRawRecipe(sampleMealDbPayload);
    const normalized = normalizeRecipe(raw, 'stage_art_1');

    const manifest: any = {
      batchId: 'test_batch_1',
      provider: 'themealdb',
      stats: { valid: 1, rejected: 0 }
    };

    const artifacts = await repo.saveStagingArtifacts({
      manifest,
      recipes: [normalized],
      report: { summary: manifest.stats, qualityDecisions: [] }
    });

    expect(fs.existsSync(artifacts.manifestPath)).toBe(true);
    expect(fs.existsSync(artifacts.recipesPath)).toBe(true);
    expect(fs.existsSync(artifacts.reportPath)).toBe(true);

    // Cleanup sandbox
    await repo.clearStaging();
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  // -----------------------------------------------------------------
  // 8. PRODUCTION DATASET IMMUTABILITY TEST
  // -----------------------------------------------------------------
  it('Test 28: Production veri setleri (raw_recipes.json ve recipesData.ts) kesinlikle değiştirilmez', () => {
    const rawPath = path.resolve(process.cwd(), 'src/data/raw_recipes.json');
    const tsPath = path.resolve(process.cwd(), 'src/data/recipesData.ts');

    expect(fs.existsSync(rawPath)).toBe(true);
    expect(fs.existsSync(tsPath)).toBe(true);

    const rawContent = fs.readFileSync(rawPath, 'utf8');
    const parsed = JSON.parse(rawContent);
    // Production dataset must have at least the initial 50 recipes preserved
    expect(parsed.recipes.length).toBeGreaterThanOrEqual(50);
    expect(parsed.recipes[0].name).toBe('Tavuk Sote');

    // None of the production recipes should be from TheMealDB
    const hasTheMealDb = parsed.recipes.some((r: any) => String(r.id).startsWith('themealdb_'));
    expect(hasTheMealDb).toBe(false);
  });
});
