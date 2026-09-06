import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import { TheMealDbRecipeProvider, validateMealDbMeal } from '../pipeline/import/providers/mealDbProvider';
import { StagingOrchestrator } from '../pipeline/staging/orchestrator';
import { StagingCatalogRepository } from '../pipeline/staging/stagingCatalogRepository';
import { MAX_STAGING_BATCH_SIZE, DEFAULT_STAGING_BATCH_SIZE, PIPELINE_VERSION } from '../pipeline/staging/types';
import { SafeHttpClient, HttpResponse } from '../pipeline/image/providers/httpClient';
import { RecipeProvider } from '../pipeline/import/providers/types';
import { RawIngredient } from '../pipeline/types';

describe('PART 14.1 — TheMealDB Controlled Recipe Expansion Suite', () => {
  let testOutputDir: string;

  beforeEach(() => {
    testOutputDir = path.resolve(process.cwd(), `test-output/test-expansion-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  const createMockResponse = <T>(data: T, status = 200, ok = true): HttpResponse<T> => ({
    ok,
    status,
    data,
    headers: {}
  });

  describe('1. TheMealDB Response Normalization & Field Mapping', () => {
    it('1.1 should correctly normalize valid TheMealDB API meal object into RawRecipe', () => {
      const provider = new TheMealDbRecipeProvider();
      const rawApiMeal = {
        idMeal: '52772',
        strMeal: 'Teriyaki Chicken Casserole',
        strCategory: 'Chicken',
        strArea: 'Japanese',
        strInstructions: 'Preheat oven to 350 F.\r\nBake chicken with teriyaki sauce.\r\nServe warm.',
        strMealThumb: 'https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg',
        strYoutube: 'https://www.youtube.com/watch?v=4aZr5hZXP_s',
        strSource: 'https://www.example.com/teriyaki-chicken',
        strIngredient1: 'Chicken',
        strMeasure1: '3/4 lb',
        strIngredient2: 'Soy Sauce',
        strMeasure2: '1/2 cup',
        strIngredient3: '',
        strMeasure3: ''
      };

      const rawRecipe = provider.mapMealToRawRecipe(rawApiMeal);

      expect(rawRecipe.id).toBe('52772');
      expect(rawRecipe.source).toBe('themealdb');
      expect(rawRecipe.sourceId).toBe('52772');
      expect(rawRecipe.title).toBe('Teriyaki Chicken Casserole');
      expect(rawRecipe.category).toBe('Chicken');
      expect(rawRecipe.cuisine).toBe('Japanese');
      expect(rawRecipe.image).toBe('https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg');
      expect(rawRecipe.imageUrl).toBe('https://www.themealdb.com/images/media/meals/wvpsxx1468256321.jpg');
      expect(rawRecipe.videoId).toBe('4aZr5hZXP_s');
      expect(rawRecipe.ingredients).toHaveLength(2);
      expect(rawRecipe.ingredients?.[0]).toEqual({ item: 'Chicken', amount: '3/4 lb' });
      expect(rawRecipe.ingredients?.[1]).toEqual({ item: 'Soy Sauce', amount: '1/2 cup' });
      expect(rawRecipe.steps && rawRecipe.steps.length).toBeGreaterThanOrEqual(2);
      expect(rawRecipe.license).toBe('unknown'); // Never fabricate license
      expect(rawRecipe.sourceUrl).toBe('https://www.example.com/teriyaki-chicken');
    });

    it('1.2 should establish canonical composite key and provenance format', () => {
      const provider = new TheMealDbRecipeProvider();
      const rawApiMeal = {
        idMeal: '52795',
        strMeal: 'Chicken Handi',
        strCategory: 'Chicken',
        strArea: 'Indian',
        strInstructions: 'Cook chicken with spices until tender.',
        strMealThumb: 'https://www.themealdb.com/images/media/meals/wyxwsp1486979827.jpg',
        strIngredient1: 'Chicken',
        strMeasure1: '1.2 kg'
      };

      const rawRecipe = provider.mapMealToRawRecipe(rawApiMeal);
      expect(rawRecipe.source).toBe('themealdb');
      expect(rawRecipe.sourceId).toBe('52795');
      expect(`${rawRecipe.source}:${rawRecipe.sourceId}`).toBe('themealdb:52795');
    });

    it('1.3 should handle missing optional fields without fabricating data', () => {
      const provider = new TheMealDbRecipeProvider();
      const mealWithoutOptionals = {
        idMeal: '53000',
        strMeal: 'Simple Dish',
        strInstructions: 'Just cook everything together.',
        strIngredient1: 'Salt',
        strMeasure1: null
      };

      const rawRecipe = provider.mapMealToRawRecipe(mealWithoutOptionals);
      expect(rawRecipe.id).toBe('53000');
      expect(rawRecipe.title).toBe('Simple Dish');
      expect(rawRecipe.videoId).toBeNull();
      expect(rawRecipe.image).toBeNull();
      expect(rawRecipe.imageUrl).toBeNull();
      expect(rawRecipe.ingredients).toHaveLength(1);
      const ing = rawRecipe.ingredients?.[0] as RawIngredient;
      expect(ing.item).toBe('Salt');
      expect(ing.amount).toBeUndefined();
      expect(rawRecipe.sourceUrl).toBe('https://www.themealdb.com/meal/53000');
    });

    it('1.4 should validate MealDB raw payload and flag missing critical fields', () => {
      expect(validateMealDbMeal(null).isValid).toBe(false);
      expect(validateMealDbMeal({}).isValid).toBe(false);
      expect(validateMealDbMeal({ idMeal: '', strMeal: 'Test' }).isValid).toBe(false);
      expect(validateMealDbMeal({ idMeal: '1', strMeal: 'T', strInstructions: 'Cook' }).isValid).toBe(false);
      expect(validateMealDbMeal({ idMeal: '1', strMeal: 'Valid Title', strInstructions: 'Short' }).isValid).toBe(false);
      expect(validateMealDbMeal({ idMeal: '1', strMeal: 'Valid Title', strInstructions: 'Valid instructions step 1', strIngredient1: '' }).isValid).toBe(false);

      const validMeal = {
        idMeal: '100',
        strMeal: 'Delicious Soup',
        strInstructions: 'Boil water and add vegetables carefully.',
        strIngredient1: 'Water',
        strMeasure1: '1L'
      };
      expect(validateMealDbMeal(validMeal).isValid).toBe(true);
    });
  });

  describe('2. Batch Control & Limit Enforcement', () => {
    it('2.1 should use default batch size 10 when limit is not specified', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      const orchestrator = new StagingOrchestrator({ repository: repo });
      const mockHttpClient = new SafeHttpClient();
      vi.spyOn(mockHttpClient, 'get').mockResolvedValue(createMockResponse({
        meals: Array.from({ length: 25 }, (_, i) => ({
          idMeal: `5200${i}`,
          strMeal: `Chicken Dish ${i + 1}`,
          strInstructions: 'Step 1: Cook well and serve warm.',
          strIngredient1: 'Chicken',
          strMeasure1: '500g'
        }))
      }));

      const provider = new TheMealDbRecipeProvider({ httpClient: mockHttpClient });
      const result = await orchestrator.orchestrate(provider);

      expect(result.manifest.requested).toBe(DEFAULT_STAGING_BATCH_SIZE);
      expect(result.manifest.fetched).toBe(10);
      expect(result.stagedRecipes.length).toBe(10);
    });

    it('2.2 should accept explicit batch size up to 100', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      const orchestrator = new StagingOrchestrator({ repository: repo });
      const mockHttpClient = new SafeHttpClient();
      vi.spyOn(mockHttpClient, 'get').mockResolvedValue(createMockResponse({
        meals: Array.from({ length: 100 }, (_, i) => ({
          idMeal: `5210${i}`,
          strMeal: `Bulk Dish ${i + 1}`,
          strInstructions: 'Step 1: Cook well and serve warm.',
          strIngredient1: 'Beef',
          strMeasure1: '500g'
        }))
      }));

      const provider = new TheMealDbRecipeProvider({ httpClient: mockHttpClient });
      const result = await orchestrator.orchestrate(provider, { limit: MAX_STAGING_BATCH_SIZE });

      expect(result.manifest.requested).toBe(100);
      expect(result.manifest.fetched).toBe(100);
      expect(result.stagedRecipes.length).toBe(100);
    });

    it('2.3 should reject batch size exceeding 100 (101 > 100) with explicit error', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      const orchestrator = new StagingOrchestrator({ repository: repo });
      const provider = new TheMealDbRecipeProvider();

      await expect(
        orchestrator.orchestrate(provider, { limit: 101 })
      ).rejects.toThrow('Maksimum batch boyutu 100 tariftir');
    });

    it('2.4 should reject batch size <= 0 with explicit validation error', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      const orchestrator = new StagingOrchestrator({ repository: repo });
      const provider = new TheMealDbRecipeProvider();

      await expect(
        orchestrator.orchestrate(provider, { limit: 0 })
      ).rejects.toThrow('Geçersiz batch boyutu');

      await expect(
        orchestrator.orchestrate(provider, { limit: -5 })
      ).rejects.toThrow('Geçersiz batch boyutu');
    });
  });

  describe('3. Deduplication & Staging Repository Operations', () => {
    it('3.1 should update/merge existing recipe when re-ingested with same sourceId', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      const orchestrator = new StagingOrchestrator({ repository: repo });
      const mockHttpClient = new SafeHttpClient();

      // Batch 1: Ingest recipe 52772
      vi.spyOn(mockHttpClient, 'get').mockResolvedValueOnce(createMockResponse({
        meals: [
          {
            idMeal: '52772',
            strMeal: 'Teriyaki Chicken Casserole Initial',
            strInstructions: 'Cook chicken initially in the pan.',
            strIngredient1: 'Chicken',
            strMeasure1: '1 lb'
          }
        ]
      }));

      const provider = new TheMealDbRecipeProvider({ httpClient: mockHttpClient });
      await orchestrator.orchestrate(provider, { limit: 1 });
      expect(await repo.count()).toBe(1);

      const firstRecord = await repo.findBySourceId('themealdb', '52772');
      expect(firstRecord?.title).toBe('Teriyaki Chicken Casserole Initial');

      // Batch 2: Re-ingest same sourceId with updated title
      vi.spyOn(mockHttpClient, 'get').mockResolvedValueOnce(createMockResponse({
        meals: [
          {
            idMeal: '52772',
            strMeal: 'Teriyaki Chicken Casserole Updated',
            strInstructions: 'Cook chicken with teriyaki sauce updated.',
            strIngredient1: 'Chicken',
            strMeasure1: '1 lb'
          }
        ]
      }));

      await orchestrator.orchestrate(provider, { limit: 1 });
      expect(await repo.count()).toBe(1);
      const updatedRecord = await repo.findBySourceId('themealdb', '52772');
      expect(updatedRecord?.title).toBe('Teriyaki Chicken Casserole Updated');
    });

    it('3.2 should perform intra-batch deduplication', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      const orchestrator = new StagingOrchestrator({ repository: repo });
      const mockHttpClient = new SafeHttpClient();

      vi.spyOn(mockHttpClient, 'get').mockResolvedValueOnce(createMockResponse({
        meals: [
          { idMeal: '52001', strMeal: 'Butter Chicken', strInstructions: 'Cook chicken in butter sauce.', strIngredient1: 'Chicken', strMeasure1: '500g' },
          { idMeal: '52002', strMeal: 'Butter Chicken', strInstructions: 'Cook chicken in butter sauce.', strIngredient1: 'Chicken', strMeasure1: '500g' }
        ]
      }));

      const provider = new TheMealDbRecipeProvider({ httpClient: mockHttpClient });
      const result = await orchestrator.orchestrate(provider, { limit: 2 });

      expect(result.stagedRecipes).toHaveLength(2);
      const stagedAll = await repo.getAll();
      const dupFlagged = stagedAll.filter(r => r.reviewItems.some(i => i.type === 'duplicate'));
      expect(dupFlagged.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('4. Fault Tolerance & Network Error Handling', () => {
    it('4.1 should isolate malformed recipe in a batch without halting valid recipes', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      const orchestrator = new StagingOrchestrator({ repository: repo });

      const faultTolerantProvider: RecipeProvider = {
        id: 'themealdb',
        name: 'TheMealDB Fault Tolerant Provider',
        metadata: {
          id: 'themealdb',
          name: 'TheMealDB',
          sourceType: 'api',
          permissionStatus: 'authorized',
          permissionPolicy: 'allowed',
          license: 'Free Open DB',
          attributionRequired: true,
          requiresApiKey: false,
          capabilities: { search: true, pagination: true, batch: true, recipeDetail: true, images: true, videos: true }
        },
        isConfigured: () => true,
        search: async () => ({ recipes: [], pageSize: 0, totalAvailable: 0, hasMore: false, provider: 'themealdb', retrievedAt: '' }),
        fetchById: async () => null,
        fetchBatch: async () => ({
          recipes: [
            { id: '52010', title: 'Valid Dish 1', instructions: ['Boil water.'], ingredients: ['Rice'], category: 'Main' },
            null as any,
            { id: '52011', title: 'Valid Dish 2', instructions: ['Bake oven.'], ingredients: ['Flour'], category: 'Bakery' }
          ],
          pageSize: 3,
          totalAvailable: 3,
          hasMore: false,
          provider: 'themealdb',
          retrievedAt: new Date().toISOString()
        })
      };

      const result = await orchestrator.orchestrate(faultTolerantProvider, { limit: 3 });

      expect(result.manifest.fetched).toBe(3);
      expect(result.failedRecipes.length).toBeGreaterThanOrEqual(1);
      expect(result.stagedRecipes.length).toBe(2);
      expect(await repo.count()).toBe(2);
    });

    it('4.2 should gracefully handle provider exceptions without unhandled crashes', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      const orchestrator = new StagingOrchestrator({ repository: repo });

      const failingProvider: RecipeProvider = {
        id: 'themealdb',
        name: 'Failing Provider',
        metadata: {
          id: 'themealdb',
          name: 'TheMealDB',
          sourceType: 'api',
          permissionStatus: 'authorized',
          permissionPolicy: 'allowed',
          license: 'Free Open DB',
          attributionRequired: true,
          requiresApiKey: false,
          capabilities: { search: true, pagination: true, batch: true, recipeDetail: true, images: true, videos: true }
        },
        isConfigured: () => true,
        search: async () => { throw new Error('Network timeout (ETIMEDOUT)'); },
        fetchById: async () => null,
        fetchBatch: async () => { throw new Error('Network timeout (ETIMEDOUT)'); }
      };

      const result = await orchestrator.orchestrate(failingProvider, { limit: 5 });

      expect(result.manifest.failed).toBe(1);
      expect(result.stagedRecipes).toHaveLength(0);
      expect(result.failedRecipes.length).toBeGreaterThan(0);
      expect(result.failedRecipes[0].error).toContain('Network timeout');
    });

    it('4.3 should handle non-200 HTTP responses safely in TheMealDbRecipeProvider', async () => {
      const mockHttpClient = new SafeHttpClient();
      vi.spyOn(mockHttpClient, 'get').mockResolvedValueOnce(createMockResponse(null, 503, false));

      const provider = new TheMealDbRecipeProvider({ httpClient: mockHttpClient });
      const batchResult = await provider.search({ query: 'chicken', pageSize: 10 });

      expect(batchResult.recipes).toHaveLength(0);
      expect(batchResult.hasMore).toBe(false);
    });
  });

  describe('5. Production Immutability & Safety Gate Guarantees', () => {
    it('5.1 should never alter production raw_recipes.json', () => {
      const prodPath = path.resolve('src/data/raw_recipes.json');
      const content = fs.readFileSync(prodPath, 'utf8');
      const parsed = JSON.parse(content);
      expect(Array.isArray(parsed.recipes)).toBe(true);
      expect(parsed.recipes.length).toBe(50);
      expect(parsed.recipes[0].id).toBe(1);
    });

    it('5.2 should never alter production recipesData.ts', () => {
      const prodDataPath = path.resolve('src/data/recipesData.ts');
      const content = fs.readFileSync(prodDataPath, 'utf8');
      expect(content).toContain('RECIPES_DATA');
      expect(content).not.toContain('stage_themealdb');
    });

    it('5.3 should verify manifest contains correct version and stats', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      const orchestrator = new StagingOrchestrator({ repository: repo });
      const mockHttpClient = new SafeHttpClient();

      vi.spyOn(mockHttpClient, 'get').mockResolvedValueOnce(createMockResponse({
        meals: [
          { idMeal: '52050', strMeal: 'Soup Dish', strInstructions: 'Cook soup carefully on low heat.', strIngredient1: 'Lentils', strMeasure1: '1 cup' }
        ]
      }));

      const provider = new TheMealDbRecipeProvider({ httpClient: mockHttpClient });
      const result = await orchestrator.orchestrate(provider, { limit: 1 });

      expect(result.manifest.pipelineVersion).toBe(PIPELINE_VERSION);
      expect(result.manifest.provider).toBe('themealdb');
      expect(result.manifest.requested).toBe(1);
      expect(result.manifest.fetched).toBe(1);
      expect(result.manifest.normalized).toBe(1);
      expect(result.manifest.reviewRequired).toBe(1);
    });
  });
});
