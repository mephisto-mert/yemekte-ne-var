import { RecipeProvider, RecipeProviderMetadata, RecipeSearchOptions, RecipeBatchOptions, RecipeProviderBatchResult } from './types';
import { RawRecipe, RawIngredient } from '../../types';
import { SafeHttpClient } from '../../image/providers/httpClient';

export interface TheMealDbProviderConfig {
  apiKey?: string;
  httpClient?: SafeHttpClient;
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

      const allMapped = res.data.meals.map(m => this.mapMealToRawRecipe(m));
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
      return this.mapMealToRawRecipe(res.data.meals[0]);
    } catch {
      return null;
    }
  }

  async fetchBatch(options?: RecipeBatchOptions): Promise<RecipeProviderBatchResult> {
    // Uses search with standard cuisine or letter lookup
    const searchOptions: RecipeSearchOptions = {
      query: options?.category || 'chicken',
      page: options?.page || 1,
      pageSize: options?.pageSize || 10
    };
    return this.search(searchOptions);
  }

  /**
   * Transforms TheMealDB meal format into normalized RawRecipe.
   */
  private mapMealToRawRecipe(meal: any): RawRecipe {
    const id = String(meal.idMeal || '');
    const title = String(meal.strMeal || '').trim();
    const category = String(meal.strCategory || 'Ana Yemekler').trim();
    const cuisine = String(meal.strArea || 'Global').trim();
    const instructionsText = String(meal.strInstructions || '');

    // Split instructions into individual steps
    const steps = instructionsText
      .split(/\r?\n+/)
      .map(s => s.trim())
      .filter(s => s.length > 5 && !s.toLowerCase().startsWith('step'));

    // Extract ingredients and amounts from strIngredient1..20
    const ingredients: RawIngredient[] = [];
    for (let i = 1; i <= 20; i++) {
      const item = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (item && typeof item === 'string' && item.trim().length > 0) {
        ingredients.push({
          item: item.trim(),
          amount: measure ? String(measure).trim() : 'Göz kararı'
        });
      }
    }

    // Extract YouTube Video ID
    let videoId: string | undefined;
    const ytUrl = String(meal.strYoutube || '').trim();
    if (ytUrl) {
      const match = ytUrl.match(/(?:v=|youtu\.be\/)([\w-]+)/);
      if (match && match[1]) {
        videoId = match[1];
      }
    }

    return {
      id,
      title,
      name: title,
      category,
      cuisine,
      ingredients,
      steps: steps.length > 0 ? steps : [instructionsText],
      image: meal.strMealThumb || undefined,
      imageUrl: meal.strMealThumb || undefined,
      videoId,
      videoTitle: `${title} Hazırlanışı`,
      sourceUrl: meal.strSource || undefined,
      difficulty: 'Orta',
      timeMinutes: 40,
      servings: 4
    };
  }
}
