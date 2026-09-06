import rawData from './raw_recipes.json';
import recipeVideos from './recipeVideos.json';
import { Recipe, RecipeIngredient } from '../types';

// Curated high quality food photos
const RECIPE_IMAGE_MAP: Record<string, string> = {
  '1': 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&auto=format&fit=crop', // Tavuk Sote
  '2': 'https://images.unsplash.com/photo-1625938145744-e380515399b7?w=800&auto=format&fit=crop', // Karnıyarık
  '3': 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&auto=format&fit=crop', // İzmir Köfte
  '4': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop', // Mercimek Çorbası
  '5': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop', // Menemen
  '6': 'https://images.unsplash.com/photo-1519869325930-281384150729?w=800&auto=format&fit=crop', // Baklava
  '7': 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop', // Yaprak Sarma
  '8': 'https://images.unsplash.com/photo-1628294895950-9805252327bc?w=800&auto=format&fit=crop', // Humus
  '9': 'https://images.unsplash.com/photo-1593001874117-c99c800e3eb5?w=800&auto=format&fit=crop', // Falafel
  '10': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop', // Çoban Salatası
  '11': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop', // Lahmacun
  '12': 'https://images.unsplash.com/photo-1556881286-fc6915169721?w=800&auto=format&fit=crop', // Ayran
  '13': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=800&auto=format&fit=crop', // Bulgur Pilavı
  '14': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop', // Su Böreği
  '15': 'https://images.unsplash.com/photo-1572441713132-c542fc4fe282?w=800&auto=format&fit=crop', // Domates Sosu
  '17': 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=800&auto=format&fit=crop', // Muhlama
  '18': 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=800&auto=format&fit=crop', // Pizza Margherita
  '19': 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&auto=format&fit=crop', // Protein Smoothie
  '23': 'https://images.unsplash.com/photo-1564834724105-918b73d1b9e0?w=800&auto=format&fit=crop', // Taze Fasulye
  '24': 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop', // Patates Kızartması
  '25': 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&auto=format&fit=crop', // Sütlaç
  '26': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop', // Kısır
  '27': 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop', // Ezogelin Çorbası
  '28': 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=800&auto=format&fit=crop', // Dürüm
  '29': 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop', // Türk Kahvesi
  '30': 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop', // Sigara Böreği
  '31': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop', // Ali Nazik
  '32': 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=800&auto=format&fit=crop', // Pad Thai
  '33': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&auto=format&fit=crop', // Kinoa Salatası
  '39': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop', // Kabak Mücver
  '43': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop', // Tantuni
  '46': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop', // Hamsi Tava
  '47': 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800&auto=format&fit=crop', // Spaghetti Carbonara
  '48': 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop', // Avokado Toast
};

const STAPLE_KEYWORDS = ['tuz', 'yağ', 'zeytinyağı', 'sıvı yağ', 'su', 'karabiber', 'pul biber', 'un', 'karabiber'];

export const RECIPES_DATABASE: Recipe[] = (rawData.recipes || []).map((r: any, idx: number) => {
  const idStr = String(r.id || idx + 1);
  const image = RECIPE_IMAGE_MAP[idStr] || r.image || r.imageUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop';

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

    const videoData = (recipeVideos as Record<string, any>)[idStr];
    const videoId = videoData?.videoId || (r.videoId && !r.videoId.startsWith('search_') ? r.videoId : undefined);

    return {
      id: idStr,
      title: r.name || 'Lezzetli Tarif',
      description: r.description || `${r.name} - Evinizdeki malzemelerle hazırlayabileceğiniz nefis ve pratik bir lezzet.`,
      image,
      imageUrl: image,
      ingredients,
      instructions: Array.isArray(r.steps) ? r.steps : ['Malzemeleri hazırlayın.', 'Tencerede pişirin.', 'Sıcak servis edin.'],
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
      videoId,
      videoTitle: videoData?.videoTitle || (videoId ? `${r.name} Nasıl Yapılır? | Yemek Tarifi` : undefined),
      videoAuthor: videoData?.videoAuthor || (videoId ? (r.chef?.name || 'Cookly Mutfak Şefi') : undefined),
      videoLanguage: videoData?.language || (videoId ? 'tr' : undefined),
      rating: r.rating ? Number(String(r.rating).replace(',', '.')) : 4.8,
      reviewCount: r.reviewCount || 150,
      chef: r.chef?.name || 'Mutfak Şefi',
      tips: r.tips || ['Yemeği kısık ateşte pişirirseniz lezzeti daha dengeli dağılacaktır.']
    };
});
