import { describe, it, expect } from 'vitest';
import {
  translateIngredientName,
  normalizeMeasurement,
  expandPedagogicalInstructions
} from '../pipeline/enrichment/instructionExpander';

describe('Pedagogical Instruction Expander & Localization Upgrade Suite', () => {
  it('translates common international culinary ingredients accurately to Turkish', () => {
    expect(translateIngredientName('garlic')).toBe('Sarımsak');
    expect(translateIngredientName('olive oil')).toBe('Zeytinyağı');
    expect(translateIngredientName('butter')).toBe('Tereyağı');
    expect(translateIngredientName('chicken breast')).toBe('Tavuk Göğsü');
    expect(translateIngredientName('soy sauce')).toBe('Soya Sosu');
  });

  it('converts imperial and English measurements into Turkish culinary standards', () => {
    expect(normalizeMeasurement('2 cups')).toBe('2 su bardağı');
    expect(normalizeMeasurement('1 tbsp')).toBe('1 yemek kaşığı');
    expect(normalizeMeasurement('1 tsp')).toBe('1 tatlı kaşığı');
    expect(normalizeMeasurement('2 cloves')).toBe('2 diş');
  });

  it('expands brief steps into rich pedagogical instructions with heat levels and guidance', () => {
    const rawBriefSteps = ['Chop vegetables.', 'Cook in pan.', 'Serve hot.'];
    const expanded = expandPedagogicalInstructions('Sebzeli Tavuk Sote', 'main_dish', rawBriefSteps, ['Tavuk', 'Biber', 'Soğan']);

    expect(expanded.length).toBeGreaterThanOrEqual(4);
    expanded.forEach(step => {
      const words = step.trim().split(/\s+/);
      expect(words.length).toBeGreaterThanOrEqual(10);
    });

    const totalWords = expanded.reduce((acc, s) => acc + s.trim().split(/\s+/).length, 0);
    const avgWords = totalWords / expanded.length;
    expect(avgWords).toBeGreaterThanOrEqual(15);
  });

  it('retains already detailed Turkish instructions without duplicating', () => {
    const detailedTurkish = [
      'Tavuk göğsünü fazla neminden arındırmak için kağıt havlu ile kurulayın ve yaklaşık 2 cm boyutlarında eşit kuşbaşı parçalar halinde doğrayın.',
      'Kuru soğanları piyazlık ince ince doğrayın; yeşil ve kırmızı biberlerin çekirdeklerini temizleyip jülyen şeritler halinde kesin.',
      'Geniş ve yapışmaz tabanlı bir tavayı orta-yüksek ateşte 1-2 dakika ısıtın. 3 yemek kaşığı zeytinyağını ekleyip doğranmış tavukları soteleyin.',
      'Küp doğranmış domatesleri ve baharatları ekleyip kısık ateşte 10 dakika pişmeye bırakın.'
    ];

    const result = expandPedagogicalInstructions('Tavuk Sote', 'main_dish', detailedTurkish);
    expect(result).toEqual(detailedTurkish);
  });
});
