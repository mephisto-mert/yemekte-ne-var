import { DailyMealPlan, Recipe, DayOfWeek } from '../types';
import { matchRecipesAgainstPantry } from './matchingService';

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'
];

export const PlannerService = {
  /**
   * Algorithmic "Fill my week" schedule generator.
   * Balances dinner meals across categories, prioritizing user's pantry items.
   */
  autoFillWeek(recipes: Recipe[], pantryItems: string[]): DailyMealPlan[] {
    const { canMakeNow, almostThere, needMore } = matchRecipesAgainstPantry(recipes, pantryItems);
    
    // Pool of best candidates
    const priorityPool = [
      ...canMakeNow.map(m => m.recipe),
      ...almostThere.map(m => m.recipe),
      ...needMore.map(m => m.recipe)
    ];

    const usedCategories = new Set<string>();
    const usedRecipeIds = new Set<string>();
    const plan: DailyMealPlan[] = [];

    for (const day of DAYS_OF_WEEK) {
      // Find a candidate not used yet and ideally from a varied category
      let chosen = priorityPool.find(r => !usedRecipeIds.has(r.id) && !usedCategories.has(r.category));
      
      // If no unique category candidate left, pick any unused
      if (!chosen) {
        chosen = priorityPool.find(r => !usedRecipeIds.has(r.id));
      }

      // If still nothing, pick from all recipes
      if (!chosen) {
        chosen = recipes[Math.floor(Math.random() * recipes.length)];
      }

      if (chosen) {
        usedRecipeIds.add(chosen.id);
        usedCategories.add(chosen.category);
      }

      plan.push({
        day,
        dinnerRecipeId: chosen?.id
      });
    }

    return plan;
  }
};
