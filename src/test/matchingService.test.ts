import { describe, it, expect } from 'vitest';
import { 
  normalizeText, 
  isIngredientMatch, 
  evaluateRecipeMatch, 
  matchRecipesAgainstPantry 
} from '../services/matchingService';
import { Recipe } from '../types';

const MOCK_RECIPE: Recipe = {
  id: 'test_1',
  title: 'Tavuk Sote',
  description: 'Nefis tavuk sote',
  image: '',
  ingredients: [
    { name: 'Tavuk Göğsü', amount: '500g', isStaple: false },
    { name: 'Soğan', amount: '1 adet', isStaple: false },
    { name: 'Domates', amount: '2 adet', isStaple: false },
    { name: 'Biber', amount: '2 adet', isStaple: false },
    { name: 'Zeytinyağı', amount: '3 yk', isStaple: true },
    { name: 'Tuz', amount: '1 çk', isStaple: true },
    { name: 'Karabiber', amount: '1 çk', isStaple: true },
  ],
  instructions: ['Doğrayın', 'Pişirin'],
  cookingTime: '30 dk',
  timeMinutes: 30,
  difficulty: 'Kolay',
  servings: 4,
  category: 'main_dish',
  tags: ['tavuk', 'pratik'],
  calories: 350
};

describe('MatchingService Unit Tests', () => {
  it('normalizes Turkish characters correctly', () => {
    expect(normalizeText('Ispanak')).toBe('ispanak');
    expect(normalizeText('KÖFTE')).toBe('kofte');
    expect(normalizeText('Zeytinyağı')).toBe('zeytinyagi');
    expect(normalizeText('Çoban Salatası')).toBe('coban salatasi');
  });

  it('matches aliases correctly (Turkish & English, plurals)', () => {
    expect(isIngredientMatch('Tavuk Göğsü', 'chicken')).toBe(true);
    expect(isIngredientMatch('Domates', 'tomatoes')).toBe(true);
    expect(isIngredientMatch('Patatesler', 'patates')).toBe(true);
    expect(isIngredientMatch('Kıyma', 'dana kıyma')).toBe(true);
  });

  it('classifies recipe as CAN_MAKE_NOW when all critical ingredients are present', () => {
    const pantry = ['Tavuk', 'Soğan', 'Domates', 'Biber'];
    const result = evaluateRecipeMatch(MOCK_RECIPE, pantry);

    expect(result.tier).toBe('can_make_now');
    expect(result.missingIngredients.length).toBe(0);
    expect(result.matchPercentage).toBe(100);
  });

  it('tolerates missing staples without breaking CAN_MAKE_NOW status', () => {
    // User only has Tavuk, Soğan, Domates, Biber. Tuz and Karabiber are missing staples.
    const pantry = ['Tavuk', 'Soğan', 'Domates', 'Biber'];
    const result = evaluateRecipeMatch(MOCK_RECIPE, pantry);

    expect(result.tier).toBe('can_make_now');
    expect(result.missingStaples.length).toBeGreaterThan(0);
  });

  it('classifies recipe as ALMOST_THERE when 1-3 critical ingredients are missing', () => {
    // Missing Domates and Biber (2 critical items)
    const pantry = ['Tavuk', 'Soğan'];
    const result = evaluateRecipeMatch(MOCK_RECIPE, pantry);

    expect(result.tier).toBe('almost_there');
    expect(result.missingIngredients.length).toBe(2);
    expect(result.matchPercentage).toBe(50);
  });

  it('classifies recipe as NEED_MORE when 4+ critical ingredients are missing', () => {
    const pantry = ['Havuç']; // None of mock recipe critical items
    const result = evaluateRecipeMatch(MOCK_RECIPE, pantry);

    expect(result.tier).toBe('need_more');
    expect(result.missingIngredients.length).toBe(4);
    expect(result.matchPercentage).toBe(0);
  });

  it('partitions full recipe list into 3 distinct tiers', () => {
    const recipes = [MOCK_RECIPE];
    const { canMakeNow, almostThere, needMore } = matchRecipesAgainstPantry(recipes, ['Tavuk', 'Soğan', 'Domates', 'Biber']);

    expect(canMakeNow.length).toBe(1);
    expect(almostThere.length).toBe(0);
    expect(needMore.length).toBe(0);
  });
});
