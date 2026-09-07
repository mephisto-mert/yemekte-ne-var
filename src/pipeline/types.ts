/**
 * Recipe Data Pipeline — Type Definitions
 * Establishes the three-tier data separation:
 * 1. RAW (Source data - untrusted, raw from scraper/JSON/user)
 * 2. NORMALIZED (Standardized data, cleaned whitespace, canonical keys)
 * 3. VALIDATED (Verified data, rule checks, usable application candidate)
 */

export type RecipeDifficulty = 'Kolay' | 'Orta' | 'Zor';

// ==========================================
// 1. RAW DATA MODEL (SOURCE DATA)
// ==========================================
export interface RawIngredient {
  item?: string;
  name?: string;
  amount?: string | number;
  unit?: string;
  isStaple?: boolean;
}

export interface RawRecipe {
  id?: string | number;
  name?: string;
  title?: string;
  description?: string;
  category?: string;
  difficulty?: string;
  time?: string | number;
  cookingTime?: string;
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  timeMinutes?: number;
  calories?: number | string;
  image?: string | null;
  imageUrl?: string | null;
  imageCandidates?: string[];
  ingredients?: (RawIngredient | string)[];
  steps?: string[];
  instructions?: string[];
  servings?: number | string;
  tags?: string[] | string;
  cuisine?: string;
  chef?: any;
  rating?: any;
  reviewCount?: any;
  tips?: string[];
  videoId?: string | null;
  videoTitle?: string;
  videoAuthor?: string;
  videoLanguage?: string;
  videoCandidates?: string[];
  source?: string;
  sourceId?: string;
  sourceUrl?: string;
  externalId?: string;
  license?: string | null;
  attribution?: string | null;
  language?: string;
  metadata?: Record<string, any>;
}

// ==========================================
// 2. NORMALIZED DATA MODEL (PROCESSING DATA)
// ==========================================
export interface NormalizedIngredient {
  name: string;          // Display name with cleaned whitespace (e.g. "Kırmızı Mercimek")
  canonicalName: string; // ASCII lowercase comparison key (e.g. "kirmizi mercimek")
  amount: string;        // Cleaned amount (e.g. "1 su bardağı")
  unit?: string;
  isStaple: boolean;
}

export interface NormalizedRecipe {
  id: string;
  title: string;               // Preserved Turkish display title (e.g. "Mercimek Çorbası")
  canonicalTitle: string;      // Canonical comparison key (e.g. "mercimek corbasi")
  description: string;
  category: string;
  difficulty: RecipeDifficulty;
  cookingTime: string;
  timeMinutes: number;
  preparationTime?: string;
  servings: number;
  ingredients: NormalizedIngredient[];
  instructions: string[];      // Cleaned step list
  tags: string[];
  canonicalTags: string[];
  cuisine: string;
  image: string | null;        // Null if missing or placeholder (no fake fallback)
  videoId: string | null;
  videoTitle: string | null;
  videoAuthor: string | null;
  videoLanguage: 'tr' | 'global' | null;
  calories: number | null;     // Real calorie or null (no fake calorie invention)
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  } | null;
  rating: number | null;       // Real rating or null (no fake rating)
  reviewCount: number | null;  // Real review count or null
  chef: string | null;         // Real chef or null (no fake "Şef Ahmet")
  tips: string[];
  sourceUrl?: string;
}

// ==========================================
// 3. VALIDATED DATA MODEL (APPLICATION DATA)
// ==========================================
export type ValidationStatus = 'VALID' | 'WARNING' | 'INVALID';

export interface ValidationIssue {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidatedRecipe {
  status: ValidationStatus;
  errors: string[];
  warnings: string[];
  recipe: NormalizedRecipe;
  isUsable: boolean; // true if VALID or WARNING, false if INVALID
}

// ==========================================
// 4. DUPLICATE DETECTION MODEL
// ==========================================
export type DuplicateStatus = 'unique' | 'duplicate_candidate';

export interface DuplicateCandidate {
  sourceId: string;
  targetId: string;
  sourceTitle: string;
  targetTitle: string;
  canonicalTitle: string;
  reason: string;
}

// ==========================================
// 5. PIPELINE REPORT MODEL
// ==========================================
export interface PipelineReport {
  total: number;
  valid: number;
  warnings: number;
  invalid: number;
  duplicateCandidates: DuplicateCandidate[];
  results: ValidatedRecipe[];
}
