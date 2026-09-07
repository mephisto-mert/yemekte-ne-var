import rawData from './raw_recipes.json';
import recipeVideos from './recipeVideos.json';
import { Recipe, RecipeIngredient } from '../types';
import { resolveRecipeVideo } from './videoLibrary';

export function resolveRecipeImage(recipe: {
  id?: string | number;
  name?: string;
  title?: string;
  category?: string;
  image?: string;
  imageUrl?: string;
  videoId?: string;
}): string {
  const videoMeta = resolveRecipeVideo({
    title: recipe.title || recipe.name,
    category: recipe.category,
    videoId: recipe.videoId
  });

  if (videoMeta && videoMeta.videoId) {
    return `https://img.youtube.com/vi/${videoMeta.videoId}/hqdefault.jpg`;
  }

  const rawImg = recipe.image || recipe.imageUrl;
  if (
    rawImg &&
    !rawImg.includes('placehold.co') &&
    !rawImg.includes('photo-1519869325930-281384150729') &&
    !rawImg.includes('photo-1556881286-fc6915169721') &&
    !rawImg.includes('photo-1488477181946-6428a0291777')
  ) {
    return rawImg;
  }

  return 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop';
}

const STAPLE_KEYWORDS = ['tuz', 'yağ', 'zeytinyağı', 'sıvı yağ', 'su', 'karabiber', 'pul biber', 'un', 'karabiber'];

export const RECIPES_DATABASE: Recipe[] = (rawData.recipes || []).map((r: any, idx: number) => {
  const idStr = String(r.id || idx + 1);
  const image = resolveRecipeImage({
    id: idStr,
    name: r.name,
    category: r.category,
    image: r.image,
    imageUrl: r.imageUrl,
    videoId: r.videoId
  });

  const ingredients: RecipeIngredient[] = (r.ingredients || []).map((ing: any) => {
    const name = typeof ing === 'string' ? ing : (ing.item || '');
    const amount = typeof ing === 'string' ? '' : (ing.amount || '');
    const isStaple = STAPLE_KEYWORDS.some(s => name.toLowerCase().includes(s));
    return {
      name,
      amount,
      isStaple
    };
  });

  const cal = typeof r.calories === 'number' ? r.calories : parseInt(String(r.calories)) || 350;

  const videoMeta = resolveRecipeVideo({
    title: r.name,
    category: r.category,
    videoId: r.videoId,
    videoTitle: r.videoTitle,
    videoAuthor: r.chef?.name
  });

  return {
    id: idStr,
    title: r.name || 'Lezzetli Tarif',
    description: r.description || `${r.name} - Evinizdeki malzemelerle hazırlayabileceğiniz nefis ve pratik bir lezzet.`,
    image,
    imageUrl: image,
    ingredients,
    instructions: Array.isArray(r.steps) ? r.steps : ['Gerekli tüm malzemeleri tezgahta özenle hazırlayın.', 'Tencerede veya tavada uygun ısıda pişirin.', 'Sıcak olarak sevdiklerinizle birlikte servis edin.'],
    cookingTime: r.time || '30 dk',
    timeMinutes: r.timeMinutes || parseInt(String(r.time)) || 30,
    preparationTime: '15 dk',
    difficulty: (r.difficulty === 'Zor' || r.difficulty === 'Kolay' ? r.difficulty : 'Orta'),
    servings: r.servings || 4,
    category: r.category || 'main_dish',
    tags: Array.isArray(r.tags) ? r.tags : ['lezzetli', 'pratik', 'ev yemeği'],
    cuisine: r.cuisine || 'Türk Mutfağı',
    calories: cal,
    macros: {
      protein: Math.round(cal * 0.25 / 4),
      carbs: Math.round(cal * 0.50 / 4),
      fat: Math.round(cal * 0.25 / 9)
    },
    videoId: videoMeta.videoId,
    videoTitle: videoMeta.videoTitle,
    videoAuthor: videoMeta.videoAuthor,
    videoLanguage: videoMeta.language,
    rating: r.rating ? Number(String(r.rating).replace(',', '.')) : 4.8,
    reviewCount: r.reviewCount || 150,
    chef: r.chef?.name || videoMeta.videoAuthor,
    tips: r.tips || ['Yemeği kısık ateşte pişirirseniz lezzeti daha dengeli dağılacaktır.']
  };
});
