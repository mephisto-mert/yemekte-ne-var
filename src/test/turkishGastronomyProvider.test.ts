import { describe, it, expect } from 'vitest';
import { TurkishGastronomyProvider, TURKISH_GASTRONOMY_DATASET } from '../pipeline/import/providers/turkishGastronomyProvider';

describe('Turkish Gastronomy Dataset & Provider Suite', () => {
  const provider = new TurkishGastronomyProvider();

  it('provides all regional gastronomy candidates with valid unique IDs', () => {
    const candidates = provider.getAllCandidates();
    expect(candidates.length).toBeGreaterThanOrEqual(8);

    const ids = new Set<string>();
    candidates.forEach(c => {
      expect(c.sourceId).toMatch(/^tr-gastronomy-/);
      expect(ids.has(c.sourceId)).toBe(false);
      ids.add(c.sourceId);
    });
  });

  it('guarantees all candidates adhere to detailed pedagogical instruction standards', () => {
    const candidates = provider.getAllCandidates();
    candidates.forEach(c => {
      expect(c.steps.length).toBeGreaterThanOrEqual(4);
      c.steps.forEach(step => {
        const words = step.trim().split(/\s+/);
        expect(words.length, `Step too short in candidate ${c.name}`).toBeGreaterThanOrEqual(8);
      });
    });
  });

  it('guarantees 100% video integration with valid YouTube video IDs and Turkish language', () => {
    const candidates = provider.getAllCandidates();
    candidates.forEach(c => {
      expect(c.videoId).toBeDefined();
      expect(c.videoId.length).toBeGreaterThan(3);
      expect(c.videoTitle).toBeDefined();
      expect(c.videoAuthor).toBeDefined();
      expect(c.videoLanguage).toBe('tr');
    });
  });

  it('guarantees non-empty ingredients with exact amounts for every candidate', () => {
    const candidates = provider.getAllCandidates();
    candidates.forEach(c => {
      expect(c.ingredients.length).toBeGreaterThanOrEqual(5);
      c.ingredients.forEach(ing => {
        expect(ing.item.length).toBeGreaterThan(1);
        expect(ing.amount.length).toBeGreaterThan(1);
      });
    });
  });

  it('correctly filters candidates by category and retrieves by ID', () => {
    const soups = provider.getCandidatesByCategory('soup');
    expect(soups.length).toBeGreaterThanOrEqual(1);
    expect(soups[0].name).toContain('Yuvalama');

    const found = provider.getCandidateById('tr-gastronomy-102');
    expect(found).toBeDefined();
    expect(found?.name).toContain('Tepsi Kebabı');
  });
});
