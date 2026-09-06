import { TaxonomyMappingResult } from './types';

/**
 * External Category to Cookly Category Standard Mapping Dictionary.
 */
const EXTERNAL_CATEGORY_MAP: Record<string, string> = {
  dessert: 'Tatlılar',
  beef: 'Ana Yemekler',
  chicken: 'Ana Yemekler',
  lamb: 'Ana Yemekler',
  goat: 'Ana Yemekler',
  pork: 'Ana Yemekler',
  pasta: 'Makarna & Hamur İşleri',
  vegetarian: 'Sebze Yemekleri',
  vegan: 'Sebze Yemekleri',
  breakfast: 'Kahvaltılıklar',
  starter: 'Salatalar & Mezeler',
  side: 'Salatalar & Mezeler',
  seafood: 'Deniz Ürünleri',
  soup: 'Çorbalar'
};

const EXTERNAL_AREA_TAGS_MAP: Record<string, string[]> = {
  turkish: ['türk-mutfağı', 'geleneksel'],
  italian: ['italyan-mutfağı', 'akdeniz-mutfağı'],
  mexican: ['meksika-mutfağı'],
  japanese: ['japon-mutfağı', 'asya-mutfağı'],
  chinese: ['çin-mutfağı', 'asya-mutfağı'],
  indian: ['hint-mutfağı'],
  french: ['fransız-mutfağı'],
  greek: ['yunan-mutfağı', 'akdeniz-mutfağı'],
  american: ['amerikan-mutfağı'],
  spanish: ['ispanyol-mutfağı', 'akdeniz-mutfağı']
};

/**
 * Maps external category, area, and tags into standardized Cookly taxonomy.
 * Safely sets status to 'unknown' if no verified mapping exists.
 */
export function mapToCooklyTaxonomy(options: {
  category?: string | null;
  area?: string | null;
  tags?: string[] | string | null;
}): TaxonomyMappingResult {
  const rawCat = (options.category || '').toLowerCase().trim();
  const rawArea = (options.area || '').toLowerCase().trim();

  const matchedTags: string[] = [];

  // 1. Match Area tags
  if (rawArea && EXTERNAL_AREA_TAGS_MAP[rawArea]) {
    matchedTags.push(...EXTERNAL_AREA_TAGS_MAP[rawArea]);
  }

  // 2. Match Category
  const mappedCategory = EXTERNAL_CATEGORY_MAP[rawCat];

  if (mappedCategory) {
    matchedTags.push(rawCat);
    return {
      cooklyCategory: mappedCategory,
      sourceCategory: options.category || undefined,
      sourceArea: options.area || undefined,
      matchedTags: Array.from(new Set(matchedTags)),
      confidence: 0.9,
      status: 'mapped'
    };
  }

  // If raw category is already a valid Turkish category
  const knownTurkishCategories = [
    'Çorbalar', 'Ana Yemekler', 'Zeytinyağlılar', 'Sebze Yemekleri',
    'Bakliyat Yemekleri', 'Makarna & Hamur İşleri', 'Salatalar & Mezeler',
    'Tatlılar', 'Kahvaltılıklar', 'İçecekler', 'Aperatifler & Atıştırmalıklar',
    'Soslar & Çeşniler', 'Deniz Ürünleri', 'Diyet & Hafif Tarifler'
  ];

  const directTr = knownTurkishCategories.find(c => c.toLowerCase() === rawCat);
  if (directTr) {
    return {
      cooklyCategory: directTr,
      sourceCategory: options.category || undefined,
      sourceArea: options.area || undefined,
      matchedTags: Array.from(new Set(matchedTags)),
      confidence: 1.0,
      status: 'mapped'
    };
  }

  // Ambiguous or unknown category -> do not guess or assign wrong category
  return {
    cooklyCategory: 'unknown',
    sourceCategory: options.category || undefined,
    sourceArea: options.area || undefined,
    matchedTags: Array.from(new Set(matchedTags)),
    confidence: 0.0,
    status: 'unknown'
  };
}
