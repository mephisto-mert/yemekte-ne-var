import { describe, it, expect, beforeEach } from 'vitest';
import { 
  normalizeText, 
  isIngredientMatch, 
  tokensMatch,
  evaluateRecipeMatch, 
  matchRecipesAgainstPantry 
} from '../services/matchingService';
import { prepareRouletteCandidates, spinRoulette } from '../services/rouletteService';
import { StorageService } from '../services/storageService';
import { calculatePortions } from '../utils/portionCalculator';
import { ShoppingService } from '../services/shoppingService';
import { Recipe, RecipeIngredient, ShoppingItem } from '../types';

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

describe('Zero-Trust SaaS Certification Suite', () => {

  describe('1. Substring Collision & Word Boundary Protection (Defect #1)', () => {
    it('MUST NOT match "su" to "tavuk göğsü"', () => {
      expect(isIngredientMatch('Tavuk Göğsü', 'su')).toBe(false);
      expect(isIngredientMatch('tavuk göğsü', 'su')).toBe(false);
    });

    it('MUST NOT match "su" to "turşu"', () => {
      expect(isIngredientMatch('Turşu', 'su')).toBe(false);
      expect(isIngredientMatch('lahana turşusu', 'su')).toBe(false);
    });

    it('MUST NOT match "et" to "patates"', () => {
      expect(isIngredientMatch('Patates', 'et')).toBe(false);
      expect(isIngredientMatch('Taze Patates', 'et')).toBe(false);
    });

    it('MUST NOT match "bal" to "balık"', () => {
      expect(isIngredientMatch('Balık', 'bal')).toBe(false);
      expect(isIngredientMatch('Levrek Balığı', 'bal')).toBe(false);
    });

    it('CORRECTLY matches whole word "et" in "dana eti" or "kuşbaşı et"', () => {
      expect(isIngredientMatch('Kuşbaşı Et', 'et')).toBe(true);
      expect(isIngredientMatch('Dana Eti', 'et')).toBe(true);
    });

    it('CORRECTLY matches compound ingredients without spaces', () => {
      expect(isIngredientMatch('Zeytinyağı', 'zeytin yağı')).toBe(true);
      expect(isIngredientMatch('Pul Biber', 'pulbiber')).toBe(true);
      expect(isIngredientMatch('Ayçiçek Yağı', 'aycicek yagi')).toBe(true);
    });

    it('CORRECTLY matches Turkish plural variants', () => {
      expect(isIngredientMatch('Patatesler', 'patates')).toBe(true);
      expect(isIngredientMatch('Domates', 'domatesler')).toBe(true);
      expect(isIngredientMatch('Yumurtalar', 'yumurta')).toBe(true);
    });

    it('CORRECTLY matches water variants without collision', () => {
      expect(isIngredientMatch('Sıcak Su', 'su')).toBe(true);
      expect(isIngredientMatch('Su', 'ılık su')).toBe(true);
    });
  });

  describe('2. Negative & Security Edge Case Handling', () => {
    it('handles empty, null-like, and whitespace inputs safely', () => {
      expect(isIngredientMatch('', 'tavuk')).toBe(false);
      expect(isIngredientMatch('tavuk', '')).toBe(false);
      expect(isIngredientMatch('   ', '   ')).toBe(false);
    });

    it('handles potential XSS injection payloads safely without throwing', () => {
      const xss1 = '<script>alert(1)</script>';
      const xss2 = '"><svg/onload=alert(1)>';
      expect(() => isIngredientMatch(xss1, 'tavuk')).not.toThrow();
      expect(() => isIngredientMatch('tavuk', xss2)).not.toThrow();
      expect(isIngredientMatch(xss1, 'tavuk')).toBe(false);
    });

    it('handles extremely long inputs (ReDoS resistance)', () => {
      const longString = 'a'.repeat(10000);
      const start = Date.now();
      expect(isIngredientMatch(longString, 'tavuk')).toBe(false);
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100);
    });

    it('normalizes Turkish case conversion accurately (diacritic safety)', () => {
      expect(normalizeText('İSTANBUL')).toBe('istanbul');
      expect(normalizeText('ılık su')).toBe('ilik su');
      expect(normalizeText('ÇÖREK OTU')).toBe('corek otu');
      expect(normalizeText('ŞEKERLİ')).toBe('sekerli');
    });
  });

  describe('3. Meal Roulette Resilience & Mood Filtering (Defect #2)', () => {
    const mockRecipes: Recipe[] = [
      {
        id: 'r1',
        title: 'Hızlı Omlet',
        description: 'Pratik yumurta',
        image: '',
        ingredients: [{ name: 'Yumurta', amount: '2 adet', isStaple: false }],
        instructions: ['Çırpın', 'Pişirin'],
        cookingTime: '10 dk',
        timeMinutes: 10,
        difficulty: 'Kolay',
        servings: 1,
        category: 'breakfast',
        tags: ['pratik', 'yumurta'],
        calories: 220,
        macros: { protein: 14, carbs: 2, fat: 16 }
      },
      {
        id: 'r2',
        title: 'Patatesli Kuzu Yahni',
        description: 'Ağır ateşte et',
        image: '',
        ingredients: [
          { name: 'Kuzu Eti', amount: '400g', isStaple: false },
          { name: 'Patates', amount: '3 adet', isStaple: false }
        ],
        instructions: ['Kavurun', 'Kaynatın'],
        cookingTime: '60 dk',
        timeMinutes: 60,
        difficulty: 'Zor',
        servings: 4,
        category: 'main_dish',
        tags: ['et'],
        calories: 650,
        macros: { protein: 42, carbs: 30, fat: 38 }
      },
      {
        id: 'r3',
        title: 'Fırında Patates',
        description: 'Çıtır patates dilimleri',
        image: '',
        ingredients: [
          { name: 'Patates', amount: '4 adet', isStaple: false },
          { name: 'Zeytinyağı', amount: '2 yk', isStaple: true }
        ],
        instructions: ['Dilimleyin', 'Fırınlayın'],
        cookingTime: '25 dk',
        timeMinutes: 25,
        difficulty: 'Kolay',
        servings: 2,
        category: 'vegetarian',
        tags: ['vejetaryen', 'patates'],
        calories: 280,
        macros: { protein: 4, carbs: 45, fat: 8 }
      }
    ];

    it('filters strictly for under_25 minutes', () => {
      const candidates = prepareRouletteCandidates(mockRecipes, ['Patates'], [], 'under_25');
      expect(candidates.every(c => c.recipe.timeMinutes <= 25)).toBe(true);
      expect(candidates.some(c => c.recipe.id === 'r2')).toBe(false);
    });

    it('DOES NOT treat Patates as meat in vegetarian mood filter', () => {
      const candidates = prepareRouletteCandidates(mockRecipes, ['Patates'], [], 'vegetarian');
      const patatesDish = candidates.find(c => c.recipe.id === 'r3');
      expect(patatesDish).toBeDefined();
      expect(candidates.some(c => c.recipe.id === 'r2')).toBe(false);
    });

    it('handles empty roulette candidate list gracefully', () => {
      const selected = spinRoulette([]);
      expect(selected).toBeNull();
    });
  });

  describe('4. LocalStorage Corruption Resilience & Streak Idempotency (Defects #4 & #5)', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('safely falls back when pantry storage is corrupted or not an array', () => {
      localStorage.setItem('pantry_items_v2', '{"corrupted": true}');
      const items = StorageService.getPantry();
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBe(0);
    });

    it('safely falls back when favorites storage is invalid JSON', () => {
      localStorage.setItem('favorite_recipes_v2', 'undefined');
      const favs = StorageService.getFavorites();
      expect(Array.isArray(favs)).toBe(true);
      expect(favs).toEqual(['1', '5']);
    });

    it('streak increment is idempotent on the same day', () => {
      localStorage.setItem('chef_streak_v2', '3');
      localStorage.setItem('last_cook_date_v2', new Date().toDateString());

      const streak1 = StorageService.updateStreak();
      expect(streak1).toBe(3);

      const streak2 = StorageService.updateStreak();
      expect(streak2).toBe(3);
    });

    it('streak increments when cooking on the consecutive next day', () => {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      localStorage.setItem('chef_streak_v2', '3');
      localStorage.setItem('last_cook_date_v2', yesterday);

      const streak = StorageService.updateStreak();
      expect(streak).toBe(4);
    });

    it('streak resets to 1 when a day is skipped', () => {
      const twoDaysAgo = new Date(Date.now() - 172800000).toDateString();
      localStorage.setItem('chef_streak_v2', '5');
      localStorage.setItem('last_cook_date_v2', twoDaysAgo);

      const streak = StorageService.updateStreak();
      expect(streak).toBe(1);
    });

    it('persists and retrieves user theme preferences', () => {
      StorageService.saveTheme(false);
      expect(StorageService.getTheme()).toBe(false);
      StorageService.saveTheme(true);
      expect(StorageService.getTheme()).toBe(true);
    });
  });

  describe('5. Portion Scaling Calculation Safety', () => {
    const testIngs: RecipeIngredient[] = [
      { name: 'Pirinç', amount: '1 su bardağı', isStaple: false },
      { name: 'Tereyağı', amount: '1/2 yemek kaşığı', isStaple: true },
      { name: 'Tuz', amount: 'Göz kararı', isStaple: true }
    ];

    it('returns unmodified ingredients when original or target servings <= 0', () => {
      const scaledZero = calculatePortions(testIngs, 4, 0);
      expect(scaledZero[0].amount).toBe('1 su bardağı');

      const scaledNegative = calculatePortions(testIngs, 0, 4);
      expect(scaledNegative[0].amount).toBe('1 su bardağı');
    });

    it('correctly scales whole numbers and fractions', () => {
      const scaled = calculatePortions(testIngs, 2, 4);
      expect(scaled[0].amount).toBe('2 su bardağı');
      expect(scaled[1].amount).toBe('1 yemek kaşığı');
      expect(scaled[2].amount).toBe('Göz kararı');
    });
  });

  describe('6. Shopping List Deduplication & Text Formatting', () => {
    it('merges duplicate items and updates recipe source', () => {
      const list: ShoppingItem[] = [
        { id: '1', name: 'Yumurta', amount: '2 adet', checked: true, fromRecipeTitles: ['Menemen'], addedAt: '' }
      ];
      const missing: RecipeIngredient[] = [
        { name: 'Yumurta', amount: '3 adet', isStaple: false }
      ];

      const merged = ShoppingService.addMissingFromRecipe(list, missing, 'Kek');
      expect(merged.length).toBe(1);
      expect(merged[0].amount).toBe('2 adet + 3 adet');
      expect(merged[0].fromRecipeTitles).toContain('Menemen');
      expect(merged[0].fromRecipeTitles).toContain('Kek');
      expect(merged[0].checked).toBe(false);
    });

    it('formats WhatsApp / SMS share text with emojis correctly', () => {
      const list: ShoppingItem[] = [
        { id: '1', name: 'Domates', amount: '1 kg', checked: false, addedAt: '' },
        { id: '2', name: 'Biber', amount: '500g', checked: true, addedAt: '' }
      ];
      const text = ShoppingService.formatShareText(list);
      expect(text).toContain('Cookly');
      expect(text).toContain('Domates (1 kg)');
      expect(text).toContain('Biber (500g)');
    });
  });

  describe('7. Adversarial Round 2 Hardening & Stress Tests', () => {
    it('MUST NOT match dry spices (pul biber, karabiber) to fresh produce (biber, yeşil biber)', () => {
      expect(isIngredientMatch('Pul Biber', 'biber')).toBe(false);
      expect(isIngredientMatch('pul biber', 'yeşil biber')).toBe(false);
      expect(isIngredientMatch('Karabiber', 'biber')).toBe(false);
      expect(isIngredientMatch('biber', 'pul biber')).toBe(false);
      expect(isIngredientMatch('yeşil biber', 'karabiber')).toBe(false);
    });

    it('CORRECTLY matches fresh peppers among themselves', () => {
      expect(isIngredientMatch('Yeşil Biber', 'biber')).toBe(true);
      expect(isIngredientMatch('Sivri Biber', 'biber')).toBe(true);
      expect(isIngredientMatch('Kapya Biber', 'biber')).toBe(true);
      expect(isIngredientMatch('Biber', 'çarliston biber')).toBe(true);
    });

    it('CORRECTLY matches spice variants among themselves', () => {
      expect(isIngredientMatch('Pul Biber', 'pulbiber')).toBe(true);
      expect(isIngredientMatch('Karabiber', 'kara biber')).toBe(true);
    });

    it('safely handles corrupted/hostile LocalStorage for XP and streak', () => {
      localStorage.setItem('chef_xp_v2', 'not_a_number');
      expect(StorageService.getXP()).toBe(150);

      localStorage.setItem('chef_xp_v2', '-500');
      expect(StorageService.getXP()).toBe(150);

      localStorage.setItem('chef_streak_v2', 'corrupt_streak');
      expect(StorageService.getStreak()).toBe(0);

      localStorage.setItem('chef_streak_v2', '-10');
      expect(StorageService.getStreak()).toBe(0);
    });

    it('clamps cooked recipe ratings between 1 and 5', () => {
      localStorage.removeItem('cooked_history_v2');
      StorageService.addCookedRecipe('test-1', 'Test Yemek', -5);
      const history = StorageService.getCookedHistory();
      expect(history[0].rating).toBe(1);

      StorageService.addCookedRecipe('test-2', 'Test Yemek 2', 99);
      const history2 = StorageService.getCookedHistory();
      expect(history2[0].rating).toBe(5);
    });

    it('rejects invalid or empty custom recipes', () => {
      localStorage.removeItem('custom_recipes_v2');
      const badRecipe1 = { id: '', title: '' } as any;
      const res1 = StorageService.saveCustomRecipe(badRecipe1);
      expect(res1.length).toBe(0);

      const badRecipe2 = { id: 'r-1', title: '   ' } as any;
      const res2 = StorageService.saveCustomRecipe(badRecipe2);
      expect(res2.length).toBe(0);
    });
  });

});
