import { RecipeProvider, RecipeProviderMetadata, RecipeSearchOptions, RecipeBatchOptions, RecipeProviderBatchResult } from './types';
import { RawRecipe } from '../../types';

export class MockRecipeProvider implements RecipeProvider {
  readonly id = 'mock_recipe_provider';
  readonly name = 'Mock Recipe Provider';
  readonly metadata: RecipeProviderMetadata = {
    id: 'mock_recipe_provider',
    name: 'Mock Recipe Provider',
    sourceType: 'mock',
    permissionStatus: 'public_domain',
    permissionPolicy: 'allowed',
    license: 'Public Domain / Creative Commons 0',
    attributionRequired: false,
    requiresApiKey: false,
    capabilities: {
      search: true,
      pagination: true,
      batch: true,
      recipeDetail: true,
      images: true,
      videos: true
    },
    description: 'Deterministik test ve simülasyon sağlayıcısı.'
  };

  private recipes: RawRecipe[];

  constructor(customRecipes?: RawRecipe[]) {
    this.recipes = customRecipes || [
      {
        id: 'mock_1',
        title: 'Mercimek Çorbası',
        category: 'Çorbalar',
        difficulty: 'Kolay',
        prepTime: '10 dk',
        cookTime: '20 dk',
        time: '30 dk',
        timeMinutes: 30,
        servings: 4,
        ingredients: [
          { item: 'Kırmızı Mercimek', amount: '1 su bardağı' },
          { item: 'Soğan', amount: '1 adet' },
          { item: 'Havuç', amount: '1 adet' },
          { item: 'Tereyağı', amount: '1 yemek kaşığı' },
          { item: 'Tuz', amount: '1 tatlı kaşığı' }
        ],
        steps: [
          'Soğanı ve havucu doğrayıp tereyağında kavurun.',
          'Yıkanmış mercimekleri ve sıcak suyu ekleyin.',
          'Mercimekler yumuşayana kadar pişirip blenderdan geçirin.'
        ],
        image: 'https://images.pexels.com/photos/101/soup.jpg',
        videoId: 'dQw4w9WgXcQ',
        videoTitle: 'Geleneksel Mercimek Çorbası Yapılışı',
        cuisine: 'Türk',
        sourceUrl: 'https://example.com/mercimek'
      },
      {
        id: 'mock_2',
        title: 'Karnıyarık',
        category: 'Ana Yemekler',
        difficulty: 'Orta',
        prepTime: '20 dk',
        cookTime: '30 dk',
        time: '50 dk',
        timeMinutes: 50,
        servings: 4,
        ingredients: [
          { item: 'Patlıcan', amount: '4 adet' },
          { item: 'Kıyma', amount: '250g' },
          { item: 'Soğan', amount: '2 adet' },
          { item: 'Domates', amount: '2 adet' },
          { item: 'Sıvı Yağ', amount: '3 yemek kaşığı' }
        ],
        steps: [
          'Patlıcanları alacalı soyup kızartın.',
          'İç harcı için kıymayı, soğanı ve domatesi kavurun.',
          'Patlıcanların ortasını yarıp harcı doldurun ve fırınlayın.'
        ],
        image: 'https://images.pexels.com/photos/102/karniyarik.jpg',
        videoId: 'abc123video',
        cuisine: 'Türk',
        sourceUrl: 'https://example.com/karniyarik'
      },
      {
        id: 'mock_3',
        title: 'Menemen',
        category: 'Kahvaltılıklar',
        difficulty: 'Kolay',
        prepTime: '5 dk',
        cookTime: '10 dk',
        time: '15 dk',
        timeMinutes: 15,
        servings: 2,
        ingredients: [
          { item: 'Yumurta', amount: '3 adet' },
          { item: 'Domates', amount: '2 adet' },
          { item: 'Biber', amount: '2 adet' },
          { item: 'Zeytinyağı', amount: '2 yemek kaşığı' }
        ],
        steps: [
          'Biberleri zeytinyağında soteleyin.',
          'Doğranmış domatesleri ekleyip suyunu çekene kadar pişirin.',
          'Yumurtaları kırıp karıştırarak pişirin.'
        ],
        image: null, // missing image test
        videoId: null, // missing video test
        cuisine: 'Türk'
      }
    ];
  }

  isConfigured(): boolean {
    return true;
  }

  async search(options: RecipeSearchOptions): Promise<RecipeProviderBatchResult> {
    const q = (options.query || '').toLowerCase().trim();
    const filtered = this.recipes.filter(r => {
      const title = (r.title || r.name || '').toLowerCase();
      const cat = (r.category || '').toLowerCase();
      return title.includes(q) || cat.includes(q);
    });

    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const start = (page - 1) * pageSize;
    const paged = filtered.slice(start, start + pageSize);

    return {
      recipes: paged,
      page,
      pageSize,
      hasMore: start + pageSize < filtered.length,
      totalAvailable: filtered.length,
      provider: this.id,
      retrievedAt: new Date().toISOString()
    };
  }

  async fetchById(externalId: string): Promise<RawRecipe | null> {
    const found = this.recipes.find(r => String(r.id) === String(externalId));
    return found || null;
  }

  async fetchBatch(options?: RecipeBatchOptions): Promise<RecipeProviderBatchResult> {
    const page = options?.page || 1;
    const pageSize = Math.min(options?.pageSize || 10, 100);
    const start = (page - 1) * pageSize;
    const paged = this.recipes.slice(start, start + pageSize);

    return {
      recipes: paged,
      page,
      pageSize,
      hasMore: start + pageSize < this.recipes.length,
      totalAvailable: this.recipes.length,
      provider: this.id,
      retrievedAt: new Date().toISOString()
    };
  }
}
