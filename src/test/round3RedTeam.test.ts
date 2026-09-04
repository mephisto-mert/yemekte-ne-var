import { describe, it, expect, beforeEach } from 'vitest';
import { RECIPES_DATABASE } from '../data/recipesData';
import { 
  normalizeText, 
  isIngredientMatch, 
  tokensMatch, 
  evaluateRecipeMatch, 
  matchRecipesAgainstPantry 
} from '../services/matchingService';
import { StorageService } from '../services/storageService';
import { PlannerService } from '../services/plannerService';
import { ShoppingService } from '../services/shoppingService';
import { prepareRouletteCandidates, spinRoulette } from '../services/rouletteService';
import { calculatePortions } from '../utils/portionCalculator';

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

describe('ROUND 3 — RED TEAM ADVERSARIAL AUDIT SUITE', () => {

  describe('1. Recipe Dataset Forensics (50/50 Verification)', () => {
    it('contains exactly 50 recipes with unique IDs', () => {
      expect(RECIPES_DATABASE.length).toBe(50);
      const ids = RECIPES_DATABASE.map(r => r.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(50);
    });

    it('every recipe has valid titles, categories, difficulties, and calories', () => {
      RECIPES_DATABASE.forEach(r => {
        expect(typeof r.id).toBe('string');
        expect(r.id.trim().length).toBeGreaterThan(0);
        expect(typeof r.title).toBe('string');
        expect(r.title.trim().length).toBeGreaterThan(0);
        expect(['Kolay', 'Orta', 'Zor']).toContain(r.difficulty);
        expect(r.calories).toBeGreaterThan(0);
        expect(typeof r.cookingTime).toBe('string');
        expect(r.cookingTime).toMatch(/\d+\s*(dk|dakika|saat)/i);
        expect(typeof r.category).toBe('string');
        expect(r.category.trim().length).toBeGreaterThan(0);
      });
    });

    it('every recipe has non-empty ingredients and step-by-step instructions', () => {
      RECIPES_DATABASE.forEach(r => {
        expect(r.ingredients.length).toBeGreaterThanOrEqual(1);
        r.ingredients.forEach(i => {
          expect(i.name.trim().length).toBeGreaterThan(0);
          expect(typeof i.isStaple).toBe('boolean');
        });
        expect(r.instructions.length).toBeGreaterThanOrEqual(2);
        r.instructions.forEach(step => {
          expect(step.trim().length).toBeGreaterThan(0);
        });
      });
    });

    it('every recipe has a verified 11-character YouTube video ID and author/title metadata', () => {
      RECIPES_DATABASE.forEach(r => {
        expect(r.videoId).toBeDefined();
        expect(typeof r.videoId).toBe('string');
        expect(r.videoId!.trim().length).toBe(11);
        expect(r.videoTitle).toBeDefined();
        expect(r.videoAuthor).toBeDefined();
      });
    });
  });

  describe('2. Matching Engine Boundary & Exhaustive Matrix', () => {
    it('evaluates perfect match when all non-staple ingredients are present', () => {
      RECIPES_DATABASE.forEach(r => {
        const pantry = r.ingredients.map(i => i.name);
        const match = evaluateRecipeMatch(r, pantry);
        expect(match.missingCount).toBe(0);
        expect(match.tier).toBe('can_make_now');
      });
    });

    it('evaluates zero match when pantry has completely unrelated ingredients', () => {
      const hostilePantry = ['Ejderha Meyvesi', 'Kambiyo Pul', 'Tahta Parçası'];
      RECIPES_DATABASE.forEach(r => {
        const match = evaluateRecipeMatch(r, hostilePantry);
        expect(match.matchedIngredients.length).toBe(0);
        expect(match.tier).toBe('need_more');
      });
    });

    it('correctly handles staple tolerance (salt, water, black pepper missing does not disqualify)', () => {
      const menemen = RECIPES_DATABASE.find(r => r.title === 'Menemen')!;
      const pantryOnlyNonStaples = ['Domates', 'Biber', 'Yumurta'];
      const match = evaluateRecipeMatch(menemen, pantryOnlyNonStaples);
      expect(match.tier).toBe('can_make_now');
    });

    it('strictly separates Produce Peppers from Table Spices', () => {
      expect(isIngredientMatch('pul biber', 'biber')).toBe(false);
      expect(isIngredientMatch('karabiber', 'biber')).toBe(false);
      expect(isIngredientMatch('kara biber', 'yeşil biber')).toBe(false);
      expect(isIngredientMatch('biber', 'pul biber')).toBe(false);
      expect(isIngredientMatch('çarliston biber', 'karabiber')).toBe(false);
      expect(isIngredientMatch('sivri biber', 'biber')).toBe(true);
      expect(isIngredientMatch('biber', 'yeşil biber')).toBe(true);
      expect(isIngredientMatch('pul biber', 'pulbiber')).toBe(true);
      expect(isIngredientMatch('karabiber', 'karabiber')).toBe(true);
    });

    it('prevents sub-word collisions (su in tavuk göğsü, et in patates, bal in balık)', () => {
      expect(isIngredientMatch('su', 'tavuk göğsü')).toBe(false);
      expect(isIngredientMatch('su', 'turşu')).toBe(false);
      expect(isIngredientMatch('et', 'patates')).toBe(false);
      expect(isIngredientMatch('bal', 'balık')).toBe(false);
      expect(isIngredientMatch('un', 'zeytinyağı')).toBe(false);
    });
  });

  describe('3. LocalStorage Extreme Poisoning & Recovery', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('recovers from completely corrupted JSON in pantry', () => {
      localStorage.setItem('pantry_items_v2', '{{malformed json;;;!!');
      const pantry = StorageService.getPantry();
      expect(Array.isArray(pantry)).toBe(true);
    });

    it('filters out non-object and empty name items in pantry', () => {
      localStorage.setItem('pantry_items_v2', JSON.stringify([
        null,
        undefined,
        123,
        'just_a_string',
        { id: '1', name: '' },
        { id: '2', name: '   ' },
        { id: '3', name: 'Zeytin', addedDate: '2026-09-05', daysLeft: 5, isUrgent: false }
      ]));
      const pantry = StorageService.getPantry();
      expect(pantry.length).toBe(1);
      expect(pantry[0].name).toBe('Zeytin');
    });

    it('handles negative, NaN, and string XP safely', () => {
      localStorage.setItem('chef_xp_v2', 'NaN');
      expect(StorageService.getXP()).toBe(150);

      localStorage.setItem('chef_xp_v2', '-99999');
      expect(StorageService.getXP()).toBe(150);

      localStorage.setItem('chef_xp_v2', '500');
      expect(StorageService.getXP()).toBe(500);

      StorageService.incrementXP(50);
      expect(StorageService.getXP()).toBe(550);

      StorageService.incrementXP(-100);
      expect(StorageService.getXP()).toBe(550);
    });

    it('handles corrupted streak values safely', () => {
      localStorage.setItem('chef_streak_v2', 'undefined');
      expect(StorageService.getStreak()).toBe(0);

      localStorage.setItem('chef_streak_v2', '-5');
      expect(StorageService.getStreak()).toBe(0);

      localStorage.setItem('chef_streak_v2', '7');
      expect(StorageService.getStreak()).toBe(7);
    });

    it('safely handles XSS injections stored in favorites and custom recipes', () => {
      const xssPayload = '<script>alert(document.cookie)</script>';
      localStorage.setItem('favorite_recipes_v2', JSON.stringify([xssPayload, '1', '2']));
      const favs = StorageService.getFavorites();
      expect(favs).toContain(xssPayload);
      expect(favs.length).toBe(3);

      const xssRecipe = {
        id: 'xss-1',
        title: '<img src=x onerror=alert(1)>',
        cookingTime: '20 dk',
        difficulty: 'Kolay',
        ingredients: [{ name: 'Test', amount: '1', isStaple: false }],
        instructions: ['Test adımı']
      } as any;
      const custom = StorageService.saveCustomRecipe(xssRecipe);
      expect(custom.length).toBe(1);
      expect(custom[0].id).toBe('xss-1');
    });
  });

  describe('4. Gamification State Machine (Streak & Date Invariance)', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('first cook sets streak to 1', () => {
      const streak = StorageService.updateStreak();
      expect(streak).toBe(1);
    });

    it('cooking multiple times on the same date is idempotent (streak does not inflate)', () => {
      const s1 = StorageService.updateStreak();
      const s2 = StorageService.updateStreak();
      const s3 = StorageService.updateStreak();
      expect(s1).toBe(1);
      expect(s2).toBe(1);
      expect(s3).toBe(1);
    });

    it('cooking on consecutive days increments streak', () => {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      localStorage.setItem('last_cook_date_v2', yesterday);
      localStorage.setItem('chef_streak_v2', '4');

      const updated = StorageService.updateStreak();
      expect(updated).toBe(5);
    });

    it('skipping more than 1 day resets streak to 1', () => {
      const threeDaysAgo = new Date(Date.now() - 259200000).toDateString();
      localStorage.setItem('last_cook_date_v2', threeDaysAgo);
      localStorage.setItem('chef_streak_v2', '12');

      const updated = StorageService.updateStreak();
      expect(updated).toBe(1);
    });
  });

  describe('5. Weekly Planner & Roulette Determinism', () => {
    it('autoFillWeek fills all 7 days without throwing', () => {
      const plan = PlannerService.autoFillWeek(RECIPES_DATABASE, ['Tavuk', 'Patates']);
      expect(plan.length).toBe(7);
      const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
      plan.forEach((p, idx) => {
        expect(p.day).toBe(days[idx]);
        expect(p.dinnerRecipeId).toBeDefined();
      });
    });

    it('spinRoulette returns valid candidate even with empty pantry', () => {
      const candidates = prepareRouletteCandidates(RECIPES_DATABASE, [], [], 'anything');
      expect(candidates.length).toBe(RECIPES_DATABASE.length);
      const chosen = spinRoulette(candidates);
      expect(chosen).toBeDefined();
      expect(RECIPES_DATABASE.some(r => r.id === chosen?.recipe.id)).toBe(true);
    });

    it('spinRoulette handles mood filtering (under_25 <= 25 mins)', () => {
      const quickCandidates = prepareRouletteCandidates(RECIPES_DATABASE, [], [], 'under_25');
      quickCandidates.forEach(c => {
        expect(c.recipe.timeMinutes).toBeLessThanOrEqual(25);
      });
    });

    it('spinRoulette handles mood filtering (vegetarian excludes meat)', () => {
      const vegCandidates = prepareRouletteCandidates(RECIPES_DATABASE, [], [], 'vegetarian');
      vegCandidates.forEach(c => {
        const hasChickenOrMeat = c.recipe.ingredients.some(i => /tavuk|et|kiyma|balik/i.test(i.name));
        expect(hasChickenOrMeat).toBe(false);
      });
    });
  });

  describe('6. Portion Scaling Mathematics & Boundary Safety', () => {
    it('accurately scales portions up and down', () => {
      const ings = [
        { name: 'Un', amount: '2 su bardağı', isStaple: false },
        { name: 'Yumurta', amount: '4 adet', isStaple: false },
        { name: 'Tuz', amount: '1 çay kaşığı', isStaple: true }
      ];

      const doubled = calculatePortions(ings, 4, 8);
      expect(doubled[0].amount).toBe('4 su bardağı');
      expect(doubled[1].amount).toBe('8 adet');
      expect(doubled[2].amount).toBe('2 çay kaşığı');

      const halved = calculatePortions(ings, 4, 2);
      expect(halved[0].amount).toBe('1 su bardağı');
      expect(halved[1].amount).toBe('2 adet');
      expect(halved[2].amount).toBe('1/2 çay kaşığı');
    });

    it('returns original input when target or base portions are 0 or negative', () => {
      const ings = [{ name: 'Tavuk', amount: '500g', isStaple: false }];
      expect(calculatePortions(ings, 0, 4)[0].amount).toBe('500g');
      expect(calculatePortions(ings, 4, -2)[0].amount).toBe('500g');
    });
  });

});
