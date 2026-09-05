/**
 * Scalable Recipe Category and Tag Taxonomy for Turkish Cuisine.
 * Designed to handle 10,000+ recipes without rigid enum limitations.
 */

export const TURKISH_RECIPE_CATEGORIES = [
  'Çorbalar',
  'Ana Yemekler',
  'Tatlılar',
  'Kahvaltılıklar',
  'Hamur İşleri',
  'Kebaplar',
  'Pide & Lahmacun',
  'Börekler',
  'Dolma & Sarmalar',
  'Pilavlar',
  'Makarnalar',
  'Salatalar',
  'Mezeler',
  'Zeytinyağlılar',
  'Köfteler',
  'Deniz Ürünleri',
  'İçecekler',
  'Atıştırmalıklar',
  'Kışlık Hazırlıklar',
  'Soslar',
  'Bebek & Çocuk',
  'Diyet & Sağlıklı'
] as const;

export type TurkishCategory = typeof TURKISH_RECIPE_CATEGORIES[number] | string;

const CATEGORY_MAP: Record<string, TurkishCategory> = {
  'soup': 'Çorbalar',
  'corba': 'Çorbalar',
  'çorba': 'Çorbalar',
  'çorbalar': 'Çorbalar',
  'main': 'Ana Yemekler',
  'main_dish': 'Ana Yemekler',
  'beef': 'Ana Yemekler',
  'chicken': 'Ana Yemekler',
  'lamb': 'Ana Yemekler',
  'pork': 'Ana Yemekler',
  'meat': 'Ana Yemekler',
  'et': 'Ana Yemekler',
  'ana yemek': 'Ana Yemekler',
  'ana yemekler': 'Ana Yemekler',
  'dessert': 'Tatlılar',
  'sweet': 'Tatlılar',
  'tatli': 'Tatlılar',
  'tatlı': 'Tatlılar',
  'tatlılar': 'Tatlılar',
  'breakfast': 'Kahvaltılıklar',
  'kahvalti': 'Kahvaltılıklar',
  'kahvaltı': 'Kahvaltılıklar',
  'kahvaltılıklar': 'Kahvaltılıklar',
  'pastry': 'Hamur İşleri',
  'bakery': 'Hamur İşleri',
  'hamur': 'Hamur İşleri',
  'hamur işleri': 'Hamur İşleri',
  'borek': 'Börekler',
  'börek': 'Börekler',
  'börekler': 'Börekler',
  'salad': 'Salatalar',
  'salata': 'Salatalar',
  'salatalar': 'Salatalar',
  'side': 'Mezeler',
  'starter': 'Mezeler',
  'meze': 'Mezeler',
  'mezeler': 'Mezeler',
  'pasta': 'Makarnalar',
  'makarna': 'Makarnalar',
  'makarnalar': 'Makarnalar',
  'rice': 'Pilavlar',
  'pilav': 'Pilavlar',
  'pilavlar': 'Pilavlar',
  'seafood': 'Deniz Ürünleri',
  'balik': 'Deniz Ürünleri',
  'balık': 'Deniz Ürünleri',
  'deniz ürünleri': 'Deniz Ürünleri',
  'vegetarian': 'Zeytinyağlılar',
  'vegan': 'Zeytinyağlılar',
  'zeytinyagli': 'Zeytinyağlılar',
  'zeytinyağlı': 'Zeytinyağlılar',
  'zeytinyağlılar': 'Zeytinyağlılar'
};

/**
 * Maps raw or multilingual category names into canonical Turkish categories.
 */
export function normalizeCategory(rawCategory?: string | null): string {
  if (!rawCategory || typeof rawCategory !== 'string') {
    return 'Ana Yemekler';
  }

  const clean = rawCategory.toLowerCase().trim().replace(/_/g, ' ');
  return CATEGORY_MAP[clean] || rawCategory.trim();
}

/**
 * Derives safe, verifiable tags based on ingredients, cooking method, and timing.
 * Does NOT invent fabricated tags.
 */
export function deriveTags(options: {
  title: string;
  ingredients: string[];
  instructions: string[];
  timeMinutes?: number;
  sourceTags?: string[];
}): { sourceTags: string[]; derivedTags: string[]; allTags: string[] } {
  const sourceTags = (options.sourceTags || []).map(t => t.trim()).filter(Boolean);
  const derivedSet = new Set<string>();

  const titleLower = options.title.toLowerCase();
  const allText = [
    options.title,
    ...options.ingredients,
    ...options.instructions
  ].join(' ').toLowerCase();

  // 1. Time-based tags
  if (typeof options.timeMinutes === 'number' && options.timeMinutes > 0) {
    if (options.timeMinutes <= 15) {
      derivedSet.add('15-dakika');
      derivedSet.add('pratik');
    } else if (options.timeMinutes <= 30) {
      derivedSet.add('30-dakika');
      derivedSet.add('pratik');
    }
  }

  // 2. Cooking method tags
  if (allText.includes('fırın') || allText.includes('fırında') || allText.includes('fırınlayın')) {
    derivedSet.add('fırında');
  }
  if (allText.includes('tava') || allText.includes('tavada') || allText.includes('kızartın')) {
    derivedSet.add('tavada');
  }
  if (allText.includes('tencere') || allText.includes('tencerede') || allText.includes('haşlayın')) {
    derivedSet.add('tencerede');
  }
  if (allText.includes('düdüklü')) {
    derivedSet.add('düdüklü');
  }
  if (allText.includes('airfryer') || allText.includes('air-fryer') || allText.includes('hava fritözü')) {
    derivedSet.add('air-fryer');
  }

  // 3. Vegetarian detection (absence of meat/poultry/fish keywords)
  const meatKeywords = ['kıyma', 'et', 'kuşbaşı', 'tavuk', 'balık', 'hindi', 'sucuk', 'sosis', 'pastırma', 'kavurma', 'beef', 'chicken', 'pork', 'lamb', 'meat', 'fish'];
  const hasMeat = options.ingredients.some(ing => {
    const ingLower = ing.toLowerCase();
    return meatKeywords.some(m => ingLower.includes(m));
  });

  if (!hasMeat && (options.ingredients.length > 0)) {
    derivedSet.add('vejetaryen');
  }

  const derivedTags = Array.from(derivedSet);
  const combined = Array.from(new Set([...sourceTags, ...derivedTags]));

  return {
    sourceTags,
    derivedTags,
    allTags: combined
  };
}
