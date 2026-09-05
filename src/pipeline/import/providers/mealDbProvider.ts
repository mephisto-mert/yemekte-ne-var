import { RecipeProvider, RecipeProviderMetadata, RecipeSearchOptions, RecipeBatchOptions, RecipeProviderBatchResult } from './types';
import { RawRecipe, RawIngredient } from '../../types';
import { SafeHttpClient } from '../../image/providers/httpClient';
import { parseYouTubeVideoId } from '../videoProvider';

export interface TheMealDbProviderConfig {
  apiKey?: string;
  httpClient?: SafeHttpClient;
}

export interface MealDbValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates the schema and completeness of a raw meal payload from TheMealDB.
 * Prevents malformed, incomplete, or corrupted API records from polluting the pipeline.
 */
export function validateMealDbMeal(meal: any): MealDbValidationResult {
  const errors: string[] = [];

  if (!meal || typeof meal !== 'object') {
    return { isValid: false, errors: ['Geçersiz veya boş yemek nesnesi (null/not an object)'] };
  }

  const id = String(meal.idMeal || '').trim();
  if (!id || id.length === 0) {
    errors.push('idMeal alanı eksik veya boş');
  }

  const title = String(meal.strMeal || '').trim();
  if (!title || title.length < 2) {
    errors.push('strMeal alanı eksik veya 2 karakterden kısa');
  }

  const instructions = String(meal.strInstructions || '').trim();
  if (!instructions || instructions.length < 10) {
    errors.push('strInstructions alanı eksik veya 10 karakterden kısa');
  }

  // Check ingredient presence: at least 1 valid non-empty ingredient
  let validIngredientCount = 0;
  for (let i = 1; i <= 20; i++) {
    const rawItem = meal[`strIngredient${i}`];
    if (rawItem && typeof rawItem === 'string') {
      const trimmed = rawItem.trim();
      if (trimmed.length > 0 && trimmed.toLowerCase() !== 'null' && trimmed.toLowerCase() !== 'undefined') {
        validIngredientCount++;
      }
    }
  }

  if (validIngredientCount === 0) {
    errors.push('En az 1 geçerli malzeme (strIngredient1..20) bulunmalıdır');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export class TheMealDbRecipeProvider implements RecipeProvider {
  readonly id = 'themealdb';
  readonly name = 'TheMealDB Open Recipe Database';
  readonly metadata: RecipeProviderMetadata = {
    id: 'themealdb',
    name: 'TheMealDB Open Recipe Database',
    sourceType: 'api',
    permissionStatus: 'authorized',
    permissionPolicy: 'allowed',
    license: 'TheMealDB Free Public Open Database License',
    attributionRequired: true,
    defaultAttribution: 'TheMealDB Open Recipe Platform',
    sourceUrl: 'https://www.themealdb.com',
    requiresApiKey: false, // Default free tier key '1'
    capabilities: {
      search: true,
      pagination: true,
      batch: true,
      recipeDetail: true,
      images: true,
      videos: true
    },
    rateLimit: {
      requestsPerMinute: 120,
      delayMs: 200
    },
    description: 'Küresel açık kaynaklı yemek tarifi ve video veritabanı API entegrasyonu.'
  };

  private apiKey: string;
  private httpClient: SafeHttpClient;

  constructor(config?: TheMealDbProviderConfig) {
    this.apiKey = config?.apiKey || (typeof process !== 'undefined' ? process.env?.THEMEALDB_API_KEY : undefined) || '1';
    this.httpClient = config?.httpClient || new SafeHttpClient();
  }

  isConfigured(): boolean {
    return true;
  }

  /**
   * Health check to test API reachability.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const url = `https://www.themealdb.com/api/json/v1/${encodeURIComponent(this.apiKey)}/lookup.php?i=52772`;
      const res = await this.httpClient.get<{ meals: any[] | null }>(url, { timeoutMs: 3500 });
      return res.ok && Array.isArray(res.data?.meals) && res.data.meals.length > 0;
    } catch {
      return false;
    }
  }

  async search(options: RecipeSearchOptions): Promise<RecipeProviderBatchResult> {
    const query = (options.query || '').trim();
    if (!query) {
      return {
        recipes: [],
        pageSize: options.pageSize || 10,
        hasMore: false,
        provider: this.id,
        retrievedAt: new Date().toISOString()
      };
    }

    const url = `https://www.themealdb.com/api/json/v1/${encodeURIComponent(this.apiKey)}/search.php?s=${encodeURIComponent(query)}`;

    try {
      const res = await this.httpClient.get<{ meals: any[] | null }>(url);
      if (!res.ok || !res.data || !Array.isArray(res.data.meals)) {
        return {
          recipes: [],
          pageSize: options.pageSize || 10,
          hasMore: false,
          provider: this.id,
          retrievedAt: new Date().toISOString()
        };
      }

      // Filter and map meals with at least valid meal object and ID
      const allMapped = res.data.meals
        .filter(m => m && typeof m === 'object' && String(m.idMeal || '').trim().length > 0)
        .map(m => this.mapMealToRawRecipe(m));

      const page = options.page || 1;
      const pageSize = Math.min(options.pageSize || 10, 50);
      const start = (page - 1) * pageSize;
      const paged = allMapped.slice(start, start + pageSize);

      return {
        recipes: paged,
        page,
        pageSize,
        hasMore: start + pageSize < allMapped.length,
        totalAvailable: allMapped.length,
        provider: this.id,
        retrievedAt: new Date().toISOString()
      };
    } catch {
      return {
        recipes: [],
        pageSize: options.pageSize || 10,
        hasMore: false,
        provider: this.id,
        retrievedAt: new Date().toISOString()
      };
    }
  }

  async fetchById(externalId: string): Promise<RawRecipe | null> {
    const cleanId = (externalId || '').trim();
    if (!cleanId) return null;

    const url = `https://www.themealdb.com/api/json/v1/${encodeURIComponent(this.apiKey)}/lookup.php?i=${encodeURIComponent(cleanId)}`;

    try {
      const res = await this.httpClient.get<{ meals: any[] | null }>(url);
      if (!res.ok || !res.data || !Array.isArray(res.data.meals) || res.data.meals.length === 0) {
        return null;
      }
      const meal = res.data.meals[0];
      if (!meal || typeof meal !== 'object' || !meal.idMeal) {
        return null;
      }
      return this.mapMealToRawRecipe(meal);
    } catch {
      return null;
    }
  }

  async fetchBatch(options?: RecipeBatchOptions): Promise<RecipeProviderBatchResult> {
    const searchOptions: RecipeSearchOptions = {
      query: options?.category || 'chicken',
      page: options?.page || 1,
      pageSize: options?.pageSize || 10
    };
    return this.search(searchOptions);
  }

  /**
   * Transforms TheMealDB meal format into normalized RawRecipe.
   * Preserves original title without automated machine translation.
   * Connects image and video candidates safely without downloading.
   */
  public mapMealToRawRecipe(meal: any): RawRecipe {
    const id = String(meal.idMeal || '').trim();
    const title = String(meal.strMeal || '').trim();
    const category = String(meal.strCategory || 'Ana Yemekler').trim();
    const cuisine = String(meal.strArea || 'Global').trim();
    const instructionsText = String(meal.strInstructions || '');

    // Split instructions into individual steps cleanly
    const steps = instructionsText
      .split(/\r?\n+/)
      .map(s => s.trim())
      .filter(s => s.length > 5 && !s.toLowerCase().startsWith('step'));

    // Extract ingredients and amounts from strIngredient1..20
    const ingredients: RawIngredient[] = [];
    for (let i = 1; i <= 20; i++) {
      const rawItem = meal[`strIngredient${i}`];
      const rawMeasure = meal[`strMeasure${i}`];

      if (rawItem && typeof rawItem === 'string') {
        const cleanItem = rawItem.trim();
        if (cleanItem.length > 0 && cleanItem.toLowerCase() !== 'null' && cleanItem.toLowerCase() !== 'undefined') {
          let cleanAmount: string | undefined = undefined;
          if (rawMeasure && typeof rawMeasure === 'string') {
            const m = rawMeasure.trim();
            if (m.length > 0 && m.toLowerCase() !== 'null' && m.toLowerCase() !== 'undefined') {
              cleanAmount = m;
            }
          }

          ingredients.push({
            item: cleanItem,
            amount: cleanAmount
          });
        }
      }
    }

    // Extract YouTube Video ID using existing videoProvider parser
    const ytUrl = meal.strYoutube ? String(meal.strYoutube).trim() : null;
    const videoId = parseYouTubeVideoId(ytUrl);
    const videoCandidates = videoId ? [videoId] : [];

    // Image candidate handling: TheMealDB provides image URL, but license is community-contributed
    const thumbUrl = meal.strMealThumb ? String(meal.strMealThumb).trim() : null;
    const imageCandidates = thumbUrl ? [thumbUrl] : [];

    // Language identification (no automated translation)
    const isTurkishArea = cuisine.toLowerCase() === 'turkish';
    const language = isTurkishArea ? 'tr' : 'en';

    return {
      id,
      title,
      name: title,
      category,
      cuisine,
      ingredients,
      steps: steps.length > 0 ? steps : [instructionsText],
      image: thumbUrl || null,
      imageUrl: thumbUrl || null,
      imageCandidates,
      videoId: videoId || null,
      videoTitle: videoId ? `${title} Hazırlanışı` : undefined,
      videoCandidates,
      source: 'themealdb',
      sourceId: id,
      externalId: id,
      sourceUrl: meal.strSource || `https://www.themealdb.com/meal/${id}`,
      license: 'unknown', // Do not invent licenses for community-contributed recipes/images
      attribution: 'TheMealDB Open Recipe Database',
      language,
      difficulty: 'Orta',
      timeMinutes: 40,
      servings: 4,
      metadata: {
        sourceTitle: title,
        displayTitle: title,
        originalArea: cuisine,
        originalCategory: category,
        provider: 'themealdb',
        imagePermissionStatus: 'needs_review'
      }
    };
  }
}

