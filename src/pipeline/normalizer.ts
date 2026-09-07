import { RawRecipe, RawIngredient, NormalizedRecipe, NormalizedIngredient, RecipeDifficulty } from './types';

/**
 * Common staple keywords in Turkish cuisine
 */
const STAPLE_KEYWORDS = [
  'tuz',
  'su',
  'sıvı yağ',
  'zeytinyağı',
  'ayçiçek yağı',
  'karabiber',
  'pul biber',
  'un',
  'şeker'
];

/**
 * Cleans user-facing display text:
 * Trims leading/trailing whitespace and collapses internal multiple spaces.
 * CRITICAL: Preserves Turkish characters and original casing.
 */
export function cleanDisplayText(text: string | null | undefined): string {
  if (!text) return '';
  return String(text)
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Transforms Turkish text into a canonical ASCII comparison key:
 * - Maps Turkish uppercase/lowercase letters safely
 * - Replaces diacritics: ç->c, ğ->g, ı/i->i, ö->o, ş->s, ü->u
 * - Strips combining characters, punctuation, and non-alphanumeric noise
 * - Collapses spaces
 *
 * Example:
 *   "  Mercimek Çorbası  " -> "mercimek corbasi"
 *   "MERCİMEK ÇORBASI"     -> "mercimek corbasi"
 *   "İskender Kebabı!"     -> "iskender kebabi"
 */
export function toCanonicalText(text: string | null | undefined): string {
  if (!text) return '';
  
  return String(text)
    .replaceAll('İ', 'i')
    .replaceAll('I', 'ı')
    .toLowerCase()
    .replaceAll('\u0307', '') // Strip combining dot above
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c')
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with space
    .replace(/\s+/g, ' ')     // Collapse whitespace
    .trim();
}

/**
 * Safely normalizes an ingredient:
 * - Trims whitespace
 * - Preserves display name
 * - Computes canonical name for comparison
 * - Detects staples safely
 * NOTE: Non-aggressive! "süt", "krema", "süt kreması" remain strictly distinct.
 */
export function normalizeIngredient(raw: RawIngredient | string): NormalizedIngredient {
  let name = '';
  let amount = '';
  let unit = '';
  let isStapleExplicit: boolean | undefined = undefined;

  if (typeof raw === 'string') {
    name = cleanDisplayText(raw);
  } else if (typeof raw === 'object' && raw !== null) {
    name = cleanDisplayText(raw.name || raw.item || '');
    amount = cleanDisplayText(String(raw.amount ?? ''));
    unit = cleanDisplayText(raw.unit);
    isStapleExplicit = typeof raw.isStaple === 'boolean' ? raw.isStaple : undefined;
  }

  const canonicalName = toCanonicalText(name);
  const isStaple = isStapleExplicit ?? STAPLE_KEYWORDS.some(s => {
    const sCanonical = toCanonicalText(s);
    return canonicalName === sCanonical || canonicalName.includes(sCanonical);
  });

  return {
    name,
    canonicalName,
    amount,
    unit: unit || undefined,
    isStaple
  };
}

/**
 * Normalizes cooking / preparation time into standardized string and minutes
 */
export function normalizeTime(rawTime: string | number | undefined): { timeStr: string; minutes: number } {
  if (rawTime === undefined || rawTime === null || rawTime === '') {
    return { timeStr: '30 dk', minutes: 30 };
  }

  if (typeof rawTime === 'number') {
    const min = Math.max(0, Math.round(rawTime));
    return { timeStr: `${min} dk`, minutes: min };
  }

  const str = cleanDisplayText(String(rawTime));
  const numMatch = str.match(/\d+/);
  const minutes = numMatch ? parseInt(numMatch[0], 10) : 30;

  return {
    timeStr: str || `${minutes} dk`,
    minutes: Math.max(0, minutes)
  };
}

/**
 * Safely normalizes difficulty into 'Kolay' | 'Orta' | 'Zor'
 */
export function normalizeDifficulty(diff: string | undefined): RecipeDifficulty {
  if (!diff) return 'Orta';
  const c = toCanonicalText(diff);
  if (c.includes('kolay') || c.includes('easy')) return 'Kolay';
  if (c.includes('zor') || c.includes('hard')) return 'Zor';
  return 'Orta';
}

/**
 * Normalizes an entire raw recipe into a NormalizedRecipe.
 * 
 * GUARANTEES:
 * 1. Preserves original Turkish display title and text.
 * 2. Computes canonicalTitle for search and deduplication.
 * 3. NEVER invents fake rating, chef, reviewCount, calories, or macros.
 * 4. Filters out placeholder images (e.g. placehold.co) and sets them to null.
 */
export function normalizeRecipe(raw: RawRecipe, defaultId?: string): NormalizedRecipe {
  const title = cleanDisplayText(raw.title || raw.name || '');
  const canonicalTitle = toCanonicalText(title);

  const id = String(raw.id || defaultId || canonicalTitle.replace(/\s+/g, '_') || 'unknown_recipe');

  // Ingredients normalization
  const rawIngredients = Array.isArray(raw.ingredients) ? raw.ingredients : [];
  const ingredients: NormalizedIngredient[] = rawIngredients
    .map(ing => normalizeIngredient(ing))
    .filter(ing => ing.name.length > 0);

  // Instructions normalization
  const rawSteps = Array.isArray(raw.instructions)
    ? raw.instructions
    : Array.isArray(raw.steps)
      ? raw.steps
      : [];
  const instructions: string[] = rawSteps
    .map(step => cleanDisplayText(step))
    .filter(step => step.length > 0);

  // Time normalization
  const { timeStr, minutes } = normalizeTime(raw.timeMinutes ?? raw.cookingTime ?? raw.time);
  const preparationTime = raw.prepTime ? cleanDisplayText(raw.prepTime) : undefined;

  // Servings normalization
  let servings = 4;
  if (typeof raw.servings === 'number' && raw.servings > 0) {
    servings = Math.round(raw.servings);
  } else if (typeof raw.servings === 'string') {
    const parsed = parseInt(raw.servings, 10);
    if (!isNaN(parsed) && parsed > 0) servings = parsed;
  }

  // Tags normalization
  let rawTags: string[] = [];
  if (Array.isArray(raw.tags)) {
    rawTags = raw.tags.map(t => cleanDisplayText(String(t))).filter(Boolean);
  } else if (typeof raw.tags === 'string') {
    rawTags = raw.tags.split(',').map(t => cleanDisplayText(t)).filter(Boolean);
  }
  const tags = Array.from(new Set(rawTags));
  const canonicalTags = tags.map(t => toCanonicalText(t));

  // Category & Difficulty
  const category = cleanDisplayText(raw.category) || 'main_dish';
  const difficulty = normalizeDifficulty(raw.difficulty);
  const cuisine = cleanDisplayText(raw.cuisine) || 'Türk Mutfağı';

  // Description
  const description = cleanDisplayText(raw.description) || (title ? `${title} tarifi.` : '');

  // Image handling: discard fake placeholder images (placehold.co)
  let image: string | null = null;
  const candidateImage = cleanDisplayText(raw.image || raw.imageUrl);
  if (candidateImage && !candidateImage.includes('placehold.co') && candidateImage.startsWith('http')) {
    image = candidateImage;
  }

  // Video handling
  let videoId: string | null = null;
  if (raw.videoId && !raw.videoId.startsWith('search_') && raw.videoId.length >= 8) {
    videoId = cleanDisplayText(raw.videoId);
  }
  const videoTitle = raw.videoTitle ? cleanDisplayText(raw.videoTitle) : null;
  const videoAuthor = raw.videoAuthor ? cleanDisplayText(raw.videoAuthor) : null;
  const videoLanguage = (raw.videoLanguage === 'tr' || raw.videoLanguage === 'global')
    ? raw.videoLanguage
    : null;

  // STRICT FAKE DATA CONTROL:
  // Never invent fake values! If not provided or invalid, set null.
  let calories: number | null = null;
  if (typeof raw.calories === 'number' && raw.calories > 0) {
    calories = Math.round(raw.calories);
  } else if (typeof raw.calories === 'string') {
    const parsed = parseInt(raw.calories, 10);
    if (!isNaN(parsed) && parsed > 0) calories = parsed;
  }

  // Chef: Only keep if non-empty string and not automated placeholder
  let chef: string | null = null;
  if (typeof raw.chef === 'string' && raw.chef.trim()) {
    chef = cleanDisplayText(raw.chef);
  } else if (typeof raw.chef === 'object' && raw.chef !== null && typeof raw.chef.name === 'string') {
    chef = cleanDisplayText(raw.chef.name);
  }

  // Rating & ReviewCount: Only keep genuine numbers, never fabricate
  let rating: number | null = null;
  if (typeof raw.rating === 'number' && raw.rating >= 1 && raw.rating <= 5) {
    rating = Math.round(raw.rating * 10) / 10;
  }

  let reviewCount: number | null = null;
  if (typeof raw.reviewCount === 'number' && raw.reviewCount >= 0) {
    reviewCount = Math.round(raw.reviewCount);
  }

  // Tips
  const tips = Array.isArray(raw.tips)
    ? raw.tips.map(t => cleanDisplayText(t)).filter(Boolean)
    : [];

  return {
    id,
    title,
    canonicalTitle,
    description,
    category,
    difficulty,
    cookingTime: timeStr,
    timeMinutes: minutes,
    preparationTime,
    servings,
    ingredients,
    instructions,
    tags,
    canonicalTags,
    cuisine,
    image,
    videoId,
    videoTitle,
    videoAuthor,
    videoLanguage,
    calories,
    macros: null, // Never invent fake macros
    rating,
    reviewCount,
    chef,
    tips,
    sourceUrl: raw.sourceUrl ? cleanDisplayText(raw.sourceUrl) : undefined
  };
}
