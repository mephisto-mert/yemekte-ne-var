import { describe, it, expect } from 'vitest';
import { prepareRouletteCandidates, spinRoulette } from '../services/rouletteService';
import { Recipe } from '../types';

const MOCK_RECIPES: Recipe[] = [
  {
    id: '1',
    title: 'Tavuk Sote',
    description: '',
    image: '',
    ingredients: [
      { name: 'Tavuk', amount: '500g' },
      { name: 'Soğan', amount: '1 adet' }
    ],
    instructions: [],
    cookingTime: '20 dk',
    timeMinutes: 20,
    difficulty: 'Kolay',
    servings: 4,
    category: 'main_dish',
    tags: [],
    calories: 300
  },
  {
    id: '2',
    title: 'Zor Et Yemeği',
    description: '',
    image: '',
    ingredients: [
      { name: 'Kuzu İncik', amount: '1 kg' },
      { name: 'Arpacık Soğan', amount: '10 adet' },
      { name: 'Safran', amount: '1 g' }
    ],
    instructions: [],
    cookingTime: '90 dk',
    timeMinutes: 90,
    difficulty: 'Zor',
    servings: 4,
    category: 'main_dish',
    tags: [],
    calories: 700
  }
];

describe('RouletteService Unit Tests', () => {
  it('assigns significantly higher weight to recipes matching user pantry', () => {
    const pantry = ['Tavuk', 'Soğan'];
    const candidates = prepareRouletteCandidates(MOCK_RECIPES, pantry, []);

    const easyMatch = candidates.find(c => c.recipe.id === '1');
    const hardMissing = candidates.find(c => c.recipe.id === '2');

    expect(easyMatch).toBeDefined();
    expect(hardMissing).toBeDefined();
    expect(easyMatch!.weight).toBeGreaterThan(hardMissing!.weight);
  });

  it('filters candidates by under_25 mood', () => {
    const candidates = prepareRouletteCandidates(MOCK_RECIPES, [], [], 'under_25');
    expect(candidates.length).toBe(1);
    expect(candidates[0].recipe.id).toBe('1');
  });

  it('filters candidates by easy difficulty mood', () => {
    const candidates = prepareRouletteCandidates(MOCK_RECIPES, [], [], 'easy');
    expect(candidates.every(c => c.recipe.difficulty === 'Kolay')).toBe(true);
  });

  it('selects a valid candidate from spinRoulette', () => {
    const candidates = prepareRouletteCandidates(MOCK_RECIPES, ['Tavuk'], []);
    const selected = spinRoulette(candidates);
    expect(selected).not.toBeNull();
    expect(selected?.recipe).toBeDefined();
  });
});
