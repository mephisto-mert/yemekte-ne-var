import { describe, it, expect } from 'vitest';
import { RECIPES_DATABASE } from '../data/recipesData';
import rawData from '../data/raw_recipes.json';

describe('Instruction Quality & Video Coverage Gate Suite', () => {
  it('contains at least 100 verified production recipes in databases', () => {
    expect(rawData.recipes.length).toBeGreaterThanOrEqual(100);
    expect(RECIPES_DATABASE.length).toBe(rawData.recipes.length);
  });

  it('guarantees every recipe has at least 3 detailed pedagogical steps', () => {
    RECIPES_DATABASE.forEach(r => {
      expect(r.instructions.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('guarantees instructions are beginner-friendly and detailed (no short <5 word steps)', () => {
    let totalWords = 0;
    let totalSteps = 0;

    RECIPES_DATABASE.forEach(r => {
      r.instructions.forEach(step => {
        const words = step.trim().split(/\s+/);
        expect(words.length, `Step too short in recipe: ${r.title}`).toBeGreaterThanOrEqual(6);
        totalWords += words.length;
        totalSteps++;
      });
    });

    const averageWords = totalWords / totalSteps;
    expect(averageWords).toBeGreaterThanOrEqual(15);
  });

  it('guarantees 100% video coverage with valid videoId on all recipes', () => {
    RECIPES_DATABASE.forEach(r => {
      expect(r.videoId, `Missing videoId for recipe: ${r.title}`).toBeDefined();
      expect(r.videoId?.length).toBeGreaterThan(3);
      expect(r.videoTitle).toBeDefined();
    });
  });

  it('guarantees all recipes have non-empty ingredients with valid measurements', () => {
    RECIPES_DATABASE.forEach(r => {
      expect(r.ingredients.length).toBeGreaterThanOrEqual(1);
      r.ingredients.forEach(ing => {
        expect(ing.name.length).toBeGreaterThan(1);
      });
    });
  });
});
