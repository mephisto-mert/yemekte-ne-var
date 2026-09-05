import { describe, it, expect } from 'vitest';
import {
  toCanonicalText,
  cleanDisplayText,
  normalizeIngredient,
  normalizeRecipe,
  validateRecipe,
  detectDuplicates,
  runRecipePipeline,
  RawRecipe
} from '../pipeline/pipeline';

describe('Recipe Data Pipeline — Foundation Tests', () => {

  // Test 1: Canonical comparison between Turkish diacritics and ascii
  it('Test 1: "Mercimek Çorbası" ve "mercimek corbasi" canonical comparison eşleşiyor', () => {
    const key1 = toCanonicalText('Mercimek Çorbası');
    const key2 = toCanonicalText('mercimek corbasi');
    expect(key1).toBe('mercimek corbasi');
    expect(key2).toBe('mercimek corbasi');
    expect(key1).toBe(key2);
  });

  // Test 2: Leading, trailing, and internal multiple whitespace normalization
  it('Test 2: Başında, sonunda ve içinde fazla boşluk bulunan metin normalize ediliyor', () => {
    const dirty = '   Mercimek     Çorbası    ';
    const cleanedDisplay = cleanDisplayText(dirty);
    const canonical = toCanonicalText(dirty);

    expect(cleanedDisplay).toBe('Mercimek Çorbası');
    expect(canonical).toBe('mercimek corbasi');
  });

  // Test 3: Upper/lower case Turkish character normalization
  it('Test 3: Büyük/küçük harf ve Türkçe karakterler (ç, ğ, ı, i, ö, ş, ü, İ, I) doğru normalize ediliyor', () => {
    expect(toCanonicalText('ÇORBA')).toBe('corba');
    expect(toCanonicalText('çorba')).toBe('corba');
    expect(toCanonicalText('İskender Kebabı')).toBe('iskender kebabi');
    expect(toCanonicalText('İSKENDER KEBABI')).toBe('iskender kebabi');
    expect(toCanonicalText('iskender kebabi')).toBe('iskender kebabi');
    expect(toCanonicalText('Hünkar Beğendi')).toBe('hunkar begendi');
    expect(toCanonicalText('ŞEHRIYE')).toBe('sehriye');
    expect(toCanonicalText('şehriye')).toBe('sehriye');
  });

  // Test 4: Missing title -> INVALID
  it('Test 4: Eksik veya 3 karakterden kısa title -> INVALID', () => {
    const raw: RawRecipe = {
      name: '',
      ingredients: ['Mercimek', 'Su'],
      steps: ['Pişirin'],
      servings: 4
    };
    const normalized = normalizeRecipe(raw);
    const validated = validateRecipe(normalized);

    expect(validated.status).toBe('INVALID');
    expect(validated.isUsable).toBe(false);
    expect(validated.errors.some(e => e.toLowerCase().includes('başlık'))).toBe(true);
  });

  // Test 5: Missing ingredients -> INVALID
  it('Test 5: Eksik ingredients -> INVALID', () => {
    const raw: RawRecipe = {
      name: 'Mercimek Çorbası',
      ingredients: [],
      steps: ['Pişirin'],
      servings: 4
    };
    const normalized = normalizeRecipe(raw);
    const validated = validateRecipe(normalized);

    expect(validated.status).toBe('INVALID');
    expect(validated.isUsable).toBe(false);
    expect(validated.errors.some(e => e.includes('malzeme'))).toBe(true);
  });

  // Test 6: Missing instructions -> INVALID
  it('Test 6: Eksik instructions / steps -> INVALID', () => {
    const raw: RawRecipe = {
      name: 'Mercimek Çorbası',
      ingredients: ['Mercimek', 'Su'],
      steps: [],
      servings: 4
    };
    const normalized = normalizeRecipe(raw);
    const validated = validateRecipe(normalized);

    expect(validated.status).toBe('INVALID');
    expect(validated.isUsable).toBe(false);
    expect(validated.errors.some(e => e.includes('adım'))).toBe(true);
  });

  // Test 7: Duplicate candidate detection based on normalized title
  it('Test 7: Aynı normalized title -> duplicate candidate olarak tespit ediliyor', () => {
    const raw1: RawRecipe = {
      id: 'rec_1',
      name: 'Mercimek Çorbası',
      ingredients: ['Mercimek'],
      steps: ['Pişir'],
      servings: 4
    };
    const raw2: RawRecipe = {
      id: 'rec_2',
      name: 'mercimek corbasi',
      ingredients: ['Mercimek'],
      steps: ['Pişir'],
      servings: 4
    };
    const raw3: RawRecipe = {
      id: 'rec_3',
      name: 'MERCİMEK ÇORBASI',
      ingredients: ['Mercimek'],
      steps: ['Pişir'],
      servings: 4
    };

    const norm1 = normalizeRecipe(raw1);
    const norm2 = normalizeRecipe(raw2);
    const norm3 = normalizeRecipe(raw3);

    const duplicates = detectDuplicates([norm1, norm2, norm3]);
    expect(duplicates.length).toBeGreaterThanOrEqual(1);
    expect(duplicates.some(d => d.canonicalTitle === 'mercimek corbasi')).toBe(true);
  });

  // Test 8: Pipeline does not invent fake rating, chef, reviewCount, or calories
  it('Test 8: Pipeline ASLA otomatik fake rating/chef/review/calorie üretmez', () => {
    const rawWithoutFake: RawRecipe = {
      name: 'Karnıyarık',
      ingredients: ['Patlıcan', 'Kıyma'],
      steps: ['Kızartın ve fırınlayın'],
      servings: 4
    };

    const normalized = normalizeRecipe(rawWithoutFake);

    expect(normalized.rating).toBeNull();
    expect(normalized.chef).toBeNull();
    expect(normalized.reviewCount).toBeNull();
    expect(normalized.calories).toBeNull();
    expect(normalized.macros).toBeNull();
  });

  // Test 9: Original Turkish display title is preserved
  it('Test 9: Orijinal Türkçe display title kesinlikle bozulmuyor', () => {
    const raw: RawRecipe = {
      name: '   İskender Kebabı (Tereyağlı)   ',
      ingredients: ['Pide', 'Döner', 'Tereyağı'],
      steps: ['Isıtın ve servis edin'],
      servings: 2
    };

    const normalized = normalizeRecipe(raw);

    // Display title retains exact Turkish characters and proper spacing
    expect(normalized.title).toBe('İskender Kebabı (Tereyağlı)');
    // Comparison canonical key is lowercase and ascii
    expect(normalized.canonicalTitle).toBe('iskender kebabi tereyagli');
  });

  // Test 10: Safe non-aggressive ingredient normalization
  it('Test 10: "süt", "krema" ve "süt kreması" güvenli şekilde farklı malzemeler olarak korunuyor', () => {
    const ingSut = normalizeIngredient('Süt');
    const ingKrema = normalizeIngredient('Krema');
    const ingSutKremasi = normalizeIngredient('Süt Kreması');

    expect(ingSut.canonicalName).toBe('sut');
    expect(ingKrema.canonicalName).toBe('krema');
    expect(ingSutKremasi.canonicalName).toBe('sut kremasi');

    expect(ingSut.canonicalName).not.toBe(ingKrema.canonicalName);
    expect(ingSut.canonicalName).not.toBe(ingSutKremasi.canonicalName);
    expect(ingKrema.canonicalName).not.toBe(ingSutKremasi.canonicalName);
  });

  // Test 11: Full pipeline batch execution
  it('Test 11: runRecipePipeline toplu işleme, doğrulama ve raporlama çıktısı üretiyor', () => {
    const batch: RawRecipe[] = [
      {
        id: '1',
        name: 'Ezogelin Çorbası',
        ingredients: [{ item: 'Mercimek', amount: '1 bardak' }],
        steps: ['Kaynatın'],
        servings: 4,
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd',
        videoId: 'abc12345678'
      },
      {
        id: '2',
        name: '', // Invalid
        ingredients: ['Tuz'],
        steps: ['Bilinmeyen'],
        servings: 2
      }
    ];

    const report = runRecipePipeline(batch);
    expect(report.total).toBe(2);
    expect(report.invalid).toBe(1);
    expect(report.results[0].status).toBe('VALID');
    expect(report.results[1].status).toBe('INVALID');
  });

});
