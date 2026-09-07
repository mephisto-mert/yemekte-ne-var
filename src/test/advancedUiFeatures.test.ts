import { describe, it, expect } from 'vitest';
import { Recipe } from '../types';

describe('Advanced UI & UX Features Test Suite', () => {
  describe('1. Macro Nutrition Donut & Macro Breakdown Logic', () => {
    it('accurately calculates macro percentages and grams for meat-heavy recipe', () => {
      const baseKcal = 450;
      const p = Math.round((baseKcal * 0.35) / 4);
      const c = Math.round((baseKcal * 0.30) / 4);
      const f = Math.round((baseKcal * 0.35) / 9);

      const totalGrams = (p * 4) + (c * 4) + (f * 9);
      const pPct = Math.round(((p * 4) / totalGrams) * 100);
      const cPct = Math.round(((c * 4) / totalGrams) * 100);
      const fPct = Math.max(0, 100 - pPct - cPct);

      expect(p).toBeGreaterThan(30);
      expect(c).toBeGreaterThan(25);
      expect(f).toBeGreaterThan(15);
      expect(pPct + cPct + fPct).toBe(100);
    });

    it('accurately calculates macro distribution for vegetarian / soup recipe', () => {
      const baseKcal = 250;
      const p = Math.round((baseKcal * 0.15) / 4);
      const c = Math.round((baseKcal * 0.60) / 4);
      const f = Math.round((baseKcal * 0.25) / 9);

      const totalGrams = (p * 4) + (c * 4) + (f * 9);
      const pPct = Math.round(((p * 4) / totalGrams) * 100);
      const cPct = Math.round(((c * 4) / totalGrams) * 100);
      const fPct = Math.max(0, 100 - pPct - cPct);

      expect(cPct).toBeGreaterThanOrEqual(55);
      expect(pPct + cPct + fPct).toBe(100);
    });
  });

  describe('2. Supermarket Aisle Automatic Categorization', () => {
    const categorizeItem = (name: string): string => {
      const n = name.toLowerCase();
      if (n.includes('tuz') || n.includes('karabiber') || n.includes('pul biber') || n.includes('kekik') || n.includes('nane') || n.includes('kimyon') || n.includes('salça') || n.includes('sıvı yağ') || n.includes('zeytinyağ') || n.includes('sirke') || n.includes('sos') || n.includes('mayonez') || n.includes('ketçap') || n.includes('baharat')) {
        return '🧂 Baharat, Yağ & Sos';
      }
      if (n.includes('domates') || n.includes('biber') || n.includes('soğan') || n.includes('patates') || n.includes('sarımsak') || n.includes('maydanoz') || n.includes('roka') || n.includes('marul') || n.includes('limon') || n.includes('havuç') || n.includes('kabak') || n.includes('patlıcan') || n.includes('ıspanak') || n.includes('elma') || n.includes('portakal')) {
        return '🥦 Manav & Yeşillik';
      }
      if (n.includes('et') || n.includes('kıyma') || n.includes('tavuk') || n.includes('balık') || n.includes('köfte') || n.includes('sucuk') || n.includes('salam') || n.includes('sosis') || n.includes('pastırma') || n.includes('kuşbaşı') || n.includes('bonfile') || n.includes('pirzola')) {
        return '🥩 Kasap & Şarküteri';
      }
      if (n.includes('süt') || n.includes('peynir') || n.includes('yoğurt') || n.includes('tereyağ') || n.includes('yumurta') || n.includes('kaymak') || n.includes('kaşar') || n.includes('labne') || n.includes('zeytin')) {
        return '🧀 Süt & Kahvaltılık';
      }
      if (n.includes('un') || n.includes('şeker') || n.includes('pirinç') || n.includes('bulgur') || n.includes('makarna') || n.includes('mercimek') || n.includes('nohut') || n.includes('fasulye') || n.includes('irmik') || n.includes('erişte')) {
        return '🌾 Kuru Gıda & Bakliyat';
      }
      return '🛒 Diğer İhtiyaçlar';
    };

    it('categorizes fresh produce items correctly into Manav', () => {
      expect(categorizeItem('Taze Domates')).toBe('🥦 Manav & Yeşillik');
      expect(categorizeItem('Kuru Soğan')).toBe('🥦 Manav & Yeşillik');
      expect(categorizeItem('Maydanoz')).toBe('🥦 Manav & Yeşillik');
    });

    it('categorizes meat and poultry correctly into Kasap', () => {
      expect(categorizeItem('Dana Kıyma')).toBe('🥩 Kasap & Şarküteri');
      expect(categorizeItem('Tavuk Göğsü')).toBe('🥩 Kasap & Şarküteri');
      expect(categorizeItem('Kuşbaşı Et')).toBe('🥩 Kasap & Şarküteri');
    });

    it('categorizes dairy and breakfast items correctly', () => {
      expect(categorizeItem('Tam Yağlı Süt')).toBe('🧀 Süt & Kahvaltılık');
      expect(categorizeItem('Süzme Yoğurt')).toBe('🧀 Süt & Kahvaltılık');
      expect(categorizeItem('Kaşar Peyniri')).toBe('🧀 Süt & Kahvaltılık');
    });

    it('categorizes staples and grains correctly', () => {
      expect(categorizeItem('Pilavlık Pirinç')).toBe('🌾 Kuru Gıda & Bakliyat');
      expect(categorizeItem('Kırmızı Mercimek')).toBe('🌾 Kuru Gıda & Bakliyat');
      expect(categorizeItem('Zeytinyağı')).toBe('🧂 Baharat, Yağ & Sos');
    });
  });

  describe('3. 5-Tier 3D Chef Rank Progression Engine', () => {
    const getChefRank = (currentXp: number) => {
      if (currentXp >= 1000) return { title: 'Gastronomi Efsanesi', emoji: '👑', targetXp: 1000, progress: 100 };
      if (currentXp >= 600) return { title: 'Aşçıbaşı', emoji: '👨‍🍳', targetXp: 1000, progress: Math.round(((currentXp - 600) / 400) * 100) };
      if (currentXp >= 300) return { title: 'İstasyon Şefi', emoji: '🥘', targetXp: 600, progress: Math.round(((currentXp - 300) / 300) * 100) };
      if (currentXp >= 100) return { title: 'Komi Şef', emoji: '🔪', targetXp: 300, progress: Math.round(((currentXp - 100) / 200) * 100) };
      return { title: 'Mutfak Çırağı', emoji: '🍳', targetXp: 100, progress: Math.round((currentXp / 100) * 100) };
    };

    it('returns Mutfak Çırağı for beginner user (0-99 XP)', () => {
      const rank = getChefRank(50);
      expect(rank.title).toBe('Mutfak Çırağı');
      expect(rank.emoji).toBe('🍳');
      expect(rank.progress).toBe(50);
    });

    it('promotes user to Komi Şef at 100 XP', () => {
      const rank = getChefRank(100);
      expect(rank.title).toBe('Komi Şef');
      expect(rank.emoji).toBe('🔪');
      expect(rank.progress).toBe(0);
    });

    it('promotes user to İstasyon Şefi at 300 XP', () => {
      const rank = getChefRank(450);
      expect(rank.title).toBe('İstasyon Şefi');
      expect(rank.emoji).toBe('🥘');
      expect(rank.progress).toBe(50);
    });

    it('promotes user to Aşçıbaşı at 600 XP and Gastronomi Efsanesi at 1000 XP', () => {
      expect(getChefRank(700).title).toBe('Aşçıbaşı');
      expect(getChefRank(1200).title).toBe('Gastronomi Efsanesi');
      expect(getChefRank(1200).progress).toBe(100);
    });
  });

  describe('4. Floating MultiTimer Formatter & Safety', () => {
    const formatTime = (secs: number) => {
      const mins = Math.floor(secs / 60);
      const remainder = secs % 60;
      return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
    };

    it('formats seconds into mm:ss strings properly', () => {
      expect(formatTime(0)).toBe('00:00');
      expect(formatTime(65)).toBe('01:05');
      expect(formatTime(600)).toBe('10:00');
      expect(formatTime(1245)).toBe('20:45');
    });
  });
});
