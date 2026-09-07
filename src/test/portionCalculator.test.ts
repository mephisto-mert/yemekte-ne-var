import { describe, it, expect } from 'vitest';
import { calculatePortions } from '../utils/portionCalculator';
import { RecipeIngredient } from '../types';

describe('PortionCalculator Unit Tests', () => {
  it('scales fractions and numbers proportionally', () => {
    const ingredients: RecipeIngredient[] = [
      { name: 'Tavuk', amount: '250 g' },
      { name: 'Süt', amount: '1/2 su bardağı' },
      { name: 'Yumurta', amount: '2 adet' }
    ];

    // Double servings from 2 to 4
    const scaled = calculatePortions(ingredients, 2, 4);

    expect(scaled[0].amount).toBe('500 g');
    expect(scaled[1].amount).toBe('1 su bardağı');
    expect(scaled[2].amount).toBe('4 adet');
  });

  it('returns original ingredients when servings ratio is 1', () => {
    const ingredients: RecipeIngredient[] = [
      { name: 'Tuz', amount: '1 tatlı kaşığı' }
    ];

    const scaled = calculatePortions(ingredients, 4, 4);
    expect(scaled[0].amount).toBe('1 tatlı kaşığı');
  });
});
