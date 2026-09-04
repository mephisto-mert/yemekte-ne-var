import { describe, it, expect } from 'vitest';
import { ShoppingService } from '../services/shoppingService';
import { ShoppingItem, RecipeIngredient } from '../types';

describe('ShoppingService Unit Tests', () => {
  it('adds missing ingredients to list and aggregates duplicates', () => {
    const initialList: ShoppingItem[] = [
      { id: '1', name: 'Sarımsak', amount: '2 diş', checked: false, fromRecipeTitles: ['Tarif A'], addedAt: '' }
    ];

    const missing: RecipeIngredient[] = [
      { name: 'Sarımsak', amount: '1 diş' },
      { name: 'Krema', amount: '1 kutu' }
    ];

    const updated = ShoppingService.addMissingFromRecipe(initialList, missing, 'Tarif B');

    // Should still have 2 items (Sarımsak merged, Krema added)
    expect(updated.length).toBe(2);
    
    const garlic = updated.find(i => i.name.toLowerCase() === 'sarımsak');
    expect(garlic).toBeDefined();
    expect(garlic?.amount).toBe('2 diş + 1 diş');
    expect(garlic?.fromRecipeTitles).toContain('Tarif A');
    expect(garlic?.fromRecipeTitles).toContain('Tarif B');

    const cream = updated.find(i => i.name.toLowerCase() === 'krema');
    expect(cream).toBeDefined();
    expect(cream?.amount).toBe('1 kutu');
  });

  it('formats shopping list into clean WhatsApp / SMS text', () => {
    const items: ShoppingItem[] = [
      { id: '1', name: 'Süt', amount: '1 lt', checked: false, addedAt: '' },
      { id: '2', name: 'Yumurta', amount: '6 adet', checked: true, addedAt: '' }
    ];

    const text = ShoppingService.formatShareText(items);
    expect(text).toContain('▫️ Süt (1 lt)');
    expect(text).toContain('✅ Yumurta (6 adet)');
    expect(text).toContain('Cookly');
  });
});
