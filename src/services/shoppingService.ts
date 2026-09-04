import { ShoppingItem, RecipeIngredient } from '../types';

export const ShoppingService = {
  /**
   * Adds missing ingredients from a recipe to the shopping list, merging duplicates
   */
  addMissingFromRecipe(
    currentList: ShoppingItem[], 
    missingIngredients: RecipeIngredient[], 
    recipeTitle: string
  ): ShoppingItem[] {
    const updated = [...currentList];

    for (const missing of missingIngredients) {
      const existingIndex = updated.findIndex(
        item => item.name.toLowerCase().trim() === missing.name.toLowerCase().trim()
      );

      if (existingIndex > -1) {
        const existing = updated[existingIndex];
        const combinedRecipes = Array.from(new Set([...(existing.fromRecipeTitles || []), recipeTitle]));
        
        updated[existingIndex] = {
          ...existing,
          amount: existing.amount ? `${existing.amount} + ${missing.amount}` : missing.amount,
          fromRecipeTitles: combinedRecipes,
          checked: false // Uncheck if re-added
        };
      } else {
        updated.push({
          id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: missing.name,
          amount: missing.amount || '1 adet',
          checked: false,
          fromRecipeTitles: [recipeTitle],
          addedAt: new Date().toISOString()
        });
      }
    }

    return updated;
  },

  /**
   * Generates a nicely formatted share text for WhatsApp or SMS
   */
  formatShareText(items: ShoppingItem[]): string {
    if (!items || items.length === 0) return '';
    let text = '🛒 Cookly - Mutfak Alışveriş Listem\n\n';
    
    items.forEach(item => {
      const checkMark = item.checked ? '✅' : '▫️';
      text += `${checkMark} ${item.name} (${item.amount})\n`;
    });

    text += '\n🍳 Mutfak Kurtarıcı ile hazırlandı.';
    return text;
  },

  /**
   * Opens WhatsApp with the list
   */
  shareViaWhatsApp(items: ShoppingItem[]): void {
    const text = encodeURIComponent(this.formatShareText(items));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  },

  /**
   * Opens SMS with the list
   */
  shareViaSMS(items: ShoppingItem[]): void {
    const text = encodeURIComponent(this.formatShareText(items));
    window.open(`sms:?body=${text}`, '_blank');
  }
};
