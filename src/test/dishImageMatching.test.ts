import { describe, it, expect } from 'vitest';
import { RECIPES_DATABASE, resolveRecipeImage } from '../data/recipesData';
import { DISH_VIDEO_MAP } from '../data/videoLibrary';

describe('Accurate Dish-Matching Image Resolution Suite', () => {
  it('should verify that all 2,218 recipes have valid, non-placeholder images', () => {
    expect(RECIPES_DATABASE.length).toBeGreaterThanOrEqual(2200);

    for (const r of RECIPES_DATABASE) {
      expect(r.image).toBeDefined();
      expect(r.image.trim().length).toBeGreaterThan(10);
      expect(r.image).not.toContain('placehold.co');
      expect(r.imageUrl).not.toContain('placehold.co');
      expect(r.image).toBe(r.imageUrl);
    }
  });

  it('should verify that specific Turkish dishes resolve to authentic dish images', () => {
    const dishesToVerify = [
      { name: 'Kayseri Mantısı', expectedPattern: 'img.youtube.com' },
      { name: 'Eskişehir Çiğ Börek', expectedPattern: 'img.youtube.com' },
      { name: 'Çanakkale Fırınlanmış Peynir Helvası', expectedPattern: 'img.youtube.com' },
      { name: 'Hakiki Antep Fıstıklı Katmer', expectedPattern: 'img.youtube.com' },
      { name: 'Adıyaman Şıllık Tatlısı (Cevizli & Tereyağlı)', expectedPattern: 'img.youtube.com' },
      { name: 'San Sebastian Cheesecake', expectedPattern: 'img.youtube.com' },
      { name: 'Yayla Çorbası', expectedPattern: 'img.youtube.com' },
      { name: 'Kilis Tava (Patlıcan Tabanlı)', expectedPattern: 'img.youtube.com' },
      { name: 'İmam Bayıldı', expectedPattern: 'img.youtube.com' },
      { name: 'Kayseri Yağlaması (Şebit)', expectedPattern: 'img.youtube.com' },
      { name: 'Ayran', expectedPattern: 'images.unsplash.com' },
      { name: 'Pizza Margherita', expectedPattern: 'images.unsplash.com' },
      { name: 'Spaghetti Carbonara', expectedPattern: 'images.unsplash.com' },
      { name: 'Falafel', expectedPattern: 'images.unsplash.com' }
    ];

    for (const testItem of dishesToVerify) {
      const match = RECIPES_DATABASE.find(r => r.title.toLowerCase().includes(testItem.name.toLowerCase()));
      expect(match).toBeDefined();
      expect(match?.image).toContain(testItem.expectedPattern);
    }
  });

  it('should verify that DISH_VIDEO_MAP contains at least 120 verified dish rules', () => {
    expect(DISH_VIDEO_MAP.length).toBeGreaterThanOrEqual(120);
    for (const rule of DISH_VIDEO_MAP) {
      expect(rule.videoId).toHaveLength(11);
      expect(rule.keywords.length).toBeGreaterThan(0);
      expect(rule.videoTitle.length).toBeGreaterThan(3);
    }
  });
});
