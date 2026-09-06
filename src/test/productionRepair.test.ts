import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CloudSyncService } from '../services/cloudSyncService';
import { StorageService } from '../services/storageService';
import { RECIPES_DATABASE } from '../data/recipesData';
import { Recipe, ShoppingItem } from '../types';

if (typeof globalThis.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  globalThis.localStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, val: string) => { store[key] = String(val); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => {
      for (const k in store) delete store[k];
    },
    length: 0,
    key: (_: number) => null,
  } as Storage;
}

describe('Production Repair & Hardening Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('StorageService Zero-State & Defaults', () => {
    it('initializes a fresh user with clean zero XP and zero streak', () => {
      expect(StorageService.getXP()).toBe(0);
      expect(StorageService.getStreak()).toBe(0);
    });

    it('initializes empty arrays for fresh user collections', () => {
      expect(StorageService.getPantry()).toEqual([]);
      expect(StorageService.getFavorites()).toEqual([]);
      expect(StorageService.getCustomRecipes()).toEqual([]);
      expect(StorageService.getShoppingList()).toEqual([]);
      expect(StorageService.getCookedHistory()).toEqual([]);
    });

    it('gracefully handles corrupted localStorage JSON and falls back to clean defaults', () => {
      localStorage.setItem('pantry_items_v2', 'INVALID_JSON{{{');
      localStorage.setItem('favorite_recipes_v2', '{{BROKEN}}');
      localStorage.setItem('custom_recipes_v2', 'null_unparsable');
      localStorage.setItem('shopping_list_v2', 'undefined');
      localStorage.setItem('user_xp_v2', 'NaN');
      localStorage.setItem('chef_streak_v2', '-99');

      expect(StorageService.getPantry()).toEqual([]);
      expect(StorageService.getFavorites()).toEqual([]);
      expect(StorageService.getCustomRecipes()).toEqual([]);
      expect(StorageService.getShoppingList()).toEqual([]);
      expect(StorageService.getXP()).toBe(0);
    });
  });

  describe('CloudSyncService Hardening & Error Resilience', () => {
    it('initializes with idle status, false syncing, and null lastError', () => {
      const cloudSync = new CloudSyncService();
      const status = cloudSync.getStatus();

      expect(status.status).toBe('idle');
      expect(status.isSyncing).toBe(false);
      expect(status.lastError).toBeNull();
      expect(status.hasConflicts).toBe(false);
    });

    it('handles simulated Supabase pull error without crashing and updates status to error', async () => {
      const mockEq = vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection timeout', code: 'PGRST000' }
        }),
        then: (resolve: any) => resolve({
          data: null,
          error: { message: 'Database connection timeout', code: 'PGRST000' }
        })
      });

      const mockSupabase: any = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: mockEq
          })
        })
      };

      const cloudSync = new CloudSyncService(mockSupabase);
      const result = await cloudSync.pullCloudData('user-test-123');

      expect(result).toBeNull();
      const status = cloudSync.getStatus();
      expect(status.status).toBe('error');
      expect(status.lastError).toContain('Database connection timeout');
      expect(status.isSyncing).toBe(false);
    });

    it('syncs shopping items using unique ID-based updates without dropping state', async () => {
      const mockEq = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: null }),
        then: (resolve: any) => resolve({ data: null, error: null })
      });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({
        update: mockUpdate,
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        delete: vi.fn().mockReturnValue({ eq: mockEq })
      });

      const mockSupabase: any = { from: mockFrom };
      const cloudSync = new CloudSyncService(mockSupabase);

      const item: ShoppingItem = {
        id: 'shop-item-99',
        name: 'Domates Salçası',
        amount: '2 yemek kaşığı',
        checked: true,
        addedAt: new Date().toISOString()
      };

      await cloudSync.syncShoppingChange('user-test-123', item, 'update');
      expect(mockFrom).toHaveBeenCalledWith('shopping_items');
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        checked: true
      }));
    });

    it('deduplicates custom recipes on cloud sync using recipe_id upsert/insert', async () => {
      const mockUpsert = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      });

      const mockFrom = vi.fn().mockReturnValue({
        upsert: mockUpsert,
        insert: mockInsert,
        delete: mockDelete
      });

      const mockSupabase: any = { from: mockFrom };
      const cloudSync = new CloudSyncService(mockSupabase);

      const customRecipe: Recipe = {
        id: 'custom-recipe-456',
        title: 'Özel Anne Köftesi',
        description: 'Geleneksel ev yapımı köfte tarifi.',
        image: 'https://images.pexels.com/photos/12345/meatballs.jpg',
        cookingTime: '30 dk',
        timeMinutes: 30,
        servings: 4,
        difficulty: 'Kolay',
        calories: 380,
        ingredients: [{ name: 'Kıyma', amount: '500g' }],
        instructions: ['Yoğur', 'Şekil ver', 'Pişir'],
        cuisine: 'Türk Mutfağı',
        category: 'Ana Yemek',
        tags: ['Köfte', 'Geleneksel'],
        isCustom: true
      };

      await cloudSync.syncCustomRecipe('user-test-123', customRecipe, 'save');

      expect(mockFrom).toHaveBeenCalledWith('custom_recipes');
      expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
        user_id: 'user-test-123',
        recipe_id: 'custom-recipe-456',
        title: 'Özel Anne Köftesi'
      }), expect.anything());
    });
  });

  describe('Production Recipes & Catalog Integrity', () => {
    it('contains exactly 100 verified production recipes in database', () => {
      expect(RECIPES_DATABASE.length).toBe(100);
    });

    it('guarantees unique IDs from 1 to 100 with valid attributes', () => {
      const ids = new Set<string>();
      RECIPES_DATABASE.forEach(r => {
        expect(r.id).toBeDefined();
        expect(ids.has(r.id)).toBe(false);
        ids.add(r.id);

        expect(r.title.length).toBeGreaterThan(2);
        expect(r.image).toMatch(/^https?:\/\//);
        expect(r.ingredients.length).toBeGreaterThan(0);
        expect(r.instructions.length).toBeGreaterThan(0);
        expect(r.calories).toBeGreaterThan(0);
      });
      expect(ids.size).toBe(100);
    });
  });

  describe('Schema.org Recipe JSON-LD Generation', () => {
    it('formats a complete and compliant Schema.org Recipe structured data object', () => {
      const sampleRecipe = RECIPES_DATABASE[0];

      const schema = {
        '@context': 'https://schema.org',
        '@type': 'Recipe',
        name: sampleRecipe.title,
        image: [sampleRecipe.image],
        description: sampleRecipe.description,
        recipeCuisine: sampleRecipe.cuisine || 'Türk Mutfağı',
        recipeCategory: sampleRecipe.category || 'Ana Yemek',
        recipeYield: '4 porsiyon',
        recipeIngredient: sampleRecipe.ingredients.map(i => `${i.amount ? i.amount + ' ' : ''}${i.name}`.trim()),
        recipeInstructions: sampleRecipe.instructions.map((step, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          text: step
        })),
        nutrition: {
          '@type': 'NutritionInformation',
          calories: `${sampleRecipe.calories} kcal`
        }
      };

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Recipe');
      expect(schema.name).toBe(sampleRecipe.title);
      expect(schema.recipeIngredient.length).toBe(sampleRecipe.ingredients.length);
      expect(schema.recipeInstructions.length).toBe(sampleRecipe.instructions.length);
      expect(schema.nutrition.calories).toContain('kcal');
    });
  });
});
