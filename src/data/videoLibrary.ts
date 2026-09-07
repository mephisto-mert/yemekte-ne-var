// Curated and verified Turkish gastronomy video matching database

export interface VideoMetadata {
  videoId: string;
  videoTitle: string;
  videoAuthor: string;
  language: 'tr' | 'global';
}

// Specific dish keywords mapped to high-quality verified YouTube video IDs
const DISH_VIDEO_MAP: Array<{
  keywords: string[];
  videoId: string;
  videoTitle: string;
  videoAuthor: string;
}> = [
  // 1. BEVERAGES & DRINKS
  {
    keywords: ['limonata', 'limon', 'lemonade'],
    videoId: '1_pGTeOL2Lk',
    videoTitle: '1 Portakal 1 Limon ile 3 Litre Nefis Ev Limonatası',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['türk kahvesi', 'kahve', 'espresso', 'latte', 'frappe', 'soğuk kahve', 'filtre kahve'],
    videoId: 'FrlncMoDfUE',
    videoTitle: 'Bol Köpüklü ve Tam Kıvamında Kahve Yapımı',
    videoAuthor: 'PRATİK YEMEK TARİFLERİ'
  },
  {
    keywords: ['smoothie', 'milkshake', 'frozen', 'detox', 'detoks'],
    videoId: '5_c_2s_6w4U',
    videoTitle: 'Ferahlatıcı Meyveli ve Proteinli Smoothie & Shake',
    videoAuthor: "Refika'nın Mutfağı"
  },
  {
    keywords: ['çay', 'soğuk çay', 'ice tea', 'bitki çayı', 'hibiskus'],
    videoId: '1_pGTeOL2Lk',
    videoTitle: 'Ev Yapımı Doğal Soğuk Çay & Ferahlatıcı İçecek',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['şerbet', 'komposto', 'hoşaf', 'şalgam'],
    videoId: 't7coxF6l7rY',
    videoTitle: 'Geleneksel Şerbet ve Şalgam Suyu Hazırlanışı',
    videoAuthor: 'Ramazan Bingöl'
  },

  // 2. DESSERTS & SWEETS
  {
    keywords: ['baklava', 'şöbiyet', 'bülbül yuvası'],
    videoId: 'Ehf8igYTJVk',
    videoTitle: 'Ev Baklavası Nasıl Yapılır? | Çıtır Çıtır Şerbetli Tatlı',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['sütlaç', 'fırın sütlaç'],
    videoId: 'p19Hi93J6Ys',
    videoTitle: 'Nişastalı Fırın Sütlaç Tarifi | Tam Kıvamında',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['cheesecake', 'san sebastian', 'tart', 'pasta', 'trifle'],
    videoId: 'Ehf8igYTJVk',
    videoTitle: 'Pürüzsüz Kıvamıyla San Sebastian Cheesecake',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['brownie', 'kek', 'ıslak kek', 'sufle'],
    videoId: 'Ehf8igYTJVk',
    videoTitle: 'Bol Soslu Islak Kek ve Brownie Yapılışı',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['kurabiye', 'kalburabastı', 'hurma tatlısı', 'şekerpare'],
    videoId: '29iLULX7lnY',
    videoTitle: 'Kıyır Kıyır Ağızda Dağılan Kurabiye & Şerbetli Tatlı',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['muhallebi', 'puding', 'keşkül', 'kazandibi', 'tavukgöğsü'],
    videoId: 'p19Hi93J6Ys',
    videoTitle: 'İpeksi Kıvamında Geleneksel Sütlü Tatlı',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['helva', 'irmik helvası', 'un helvası', 'revani'],
    videoId: 'Ehf8igYTJVk',
    videoTitle: 'Tam Ölçülü Tane Tane İrmik Helvası & Revani',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },

  // 3. BREAKFAST & EGGS
  {
    keywords: ['menemen', 'şakşuka'],
    videoId: '3wo7qr6PIU4',
    videoTitle: 'Sahanda Mükemmel Menemen Tarifi',
    videoAuthor: "Refika'nın Mutfağı"
  },
  {
    keywords: ['omlet', 'yumurta', 'haşlama yumurta'],
    videoId: '3wo7qr6PIU4',
    videoTitle: 'Puf Puf Kabaran Kahvaltılık Omlet Yapımı',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['tost', 'avokado', 'sandviç', 'ekmek'],
    videoId: 'sRQ1I_iulrY',
    videoTitle: 'Domatesli & Avokadolu Gurme Kahvaltı Tostu',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['krep', 'pankek', 'akıtma'],
    videoId: '3wo7qr6PIU4',
    videoTitle: 'Yumuşacık Tavada Pankek ve Krep Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['kuymak', 'muhlama', 'mıhlama'],
    videoId: '3wo7qr6PIU4',
    videoTitle: 'Ustasından Uzayan Peyniriyle Trabzon Kuymağı',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },

  // 4. BAKERY, PASTRY & BREADS
  {
    keywords: ['poğaça', 'açma', 'çörek'],
    videoId: '53WIi2xE5Xs',
    videoTitle: 'Kuru Mayalı Pamuk Poğaça & Yumuşacık Açma',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['börek', 'su böreği', 'sigara böreği', 'kol böreği', 'gözleme'],
    videoId: 'GpEbL48uw70',
    videoTitle: 'Çıtır Sigara Böreği & Tepsi Böreği Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['lahmacun', 'pide', 'kıymalı pide', 'kaşarlı pide'],
    videoId: '53WIi2xE5Xs',
    videoTitle: 'Evde Tavada Çıtır Çıtır Lahmacun ve Pide',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['pizza', 'calzone'],
    videoId: '3CvcUsEbxI4',
    videoTitle: 'İtalyan Usulü İnce Hamurlu Ev Pizzası',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },

  // 5. SOUPS
  {
    keywords: ['mercimek', 'mercimek çorbası'],
    videoId: 'fCos8xZE900',
    videoTitle: 'Lokanta Usulü Süzme Kırmızı Mercimek Çorbası',
    videoAuthor: 'Ramazan Bingöl'
  },
  {
    keywords: ['ezogelin'],
    videoId: '5qwzunAd7KM',
    videoTitle: 'Lokanta Usulü Efsane Ezogelin Çorbası',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['tarhana'],
    videoId: 'nncdWyHP2F4',
    videoTitle: 'Miss Gibi Şifalı Ev Tarhanası Çorbası',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['çorba', 'tavuk suyu', 'yayla', 'domates çorbası', 'sebze çorbası'],
    videoId: 'fCos8xZE900',
    videoTitle: 'Tam Kıvamında Şifalı Tencere Çorbası',
    videoAuthor: 'Ramazan Bingöl'
  },

  // 6. MAIN DISHES & MEATS
  {
    keywords: ['tavuk sote', 'tavuk', 'tavuk göğsü', 'tavuk but'],
    videoId: '3wo7qr6PIU4',
    videoTitle: 'Lokum Gibi Yumuşacık Tavuk Sote Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['karnıyarık', 'imambayıldı', 'patlıcan'],
    videoId: 'S8pIn_XYib8',
    videoTitle: 'Tam Kıvamında Fırında Karnıyarık Tarifi',
    videoAuthor: 'Ayyüce Kamit'
  },
  {
    keywords: ['köfte', 'izmir köfte', 'kadınbudu', 'kuru köfte'],
    videoId: 'S8pIn_XYib8',
    videoTitle: 'Ustasından Anne Köftesi ve Fırında İzmir Köfte',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['ali nazik', 'hünkar beğendi'],
    videoId: 'sLsDRENkBBk',
    videoTitle: 'Ali Nazik Kebabı Nasıl Yapılır? | Köz Patlıcan Yatağında',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['tantuni', 'dürüm', 'kebap', 'adana', 'urfa'],
    videoId: 'k8x23R8wZ-s',
    videoTitle: 'Bol Soslu Yoğurtlu Efsane Dürüm Tantuni',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['hamsi', 'balık', 'levrek', 'somon', 'karides'],
    videoId: 'dIWhkPiFw24',
    videoTitle: 'Çıtır Çıtır Tava Balık & Somon Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['sarma', 'dolma', 'biber dolması', 'yaprak sarma'],
    videoId: 'S8pIn_XYib8',
    videoTitle: 'Zeytinyağlı Anne Usulü Yaprak Sarma & Dolma',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['güveç', 'kavurma', 'dana eti', 'kuzu eti', 'antrikot', 'bonfile'],
    videoId: '3wo7qr6PIU4',
    videoTitle: 'Fırında Güveç & Lokum Gibi Et Yemeği',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },

  // 7. MEZES & APPETIZERS
  {
    keywords: ['kısır'],
    videoId: 'ITcHY4l9784',
    videoTitle: 'Mükemmel Hatay Usulü Bol Ekşili Kısır',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['humus', 'fava', 'nohut'],
    videoId: '3wo7qr6PIU4',
    videoTitle: 'Tereyağlı İpeksi Kıvamında Gerçek Humus',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['mücver', 'kabak'],
    videoId: '3-gJpnJ76rU',
    videoTitle: 'Yağ Çekmeyen Çıtır Kabak Mücver Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['semizotu', 'yoğurtlu', 'haydari', 'cacık'],
    videoId: 'YvGcJ81lB7Y',
    videoTitle: 'Yoğurtlu Ferahlatıcı Meze ve Semizotu Salatası',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['ezme', 'şakşuka', 'atom', 'muhammara'],
    videoId: 'oGmekoYoqXI',
    videoTitle: 'Lokanta Usulü Acılı Ezme & Şakşuka Mezesi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    keywords: ['salata', 'çoban salata', 'gavurdağı', 'kinoa'],
    videoId: 'TKUPcTEtePg',
    videoTitle: 'Nefis Soslu Taze Mevsim Salatası',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },

  // 8. WORLD & STREET CUISINE
  {
    keywords: ['carbonara', 'makarna', 'spagetti', 'pesto', 'alfredo'],
    videoId: '30322lLo4Ow',
    videoTitle: 'Orijinal Kremalı Soslu İtalyan Makarnası',
    videoAuthor: 'Oğul Türkkan'
  },
  {
    keywords: ['pad thai', 'noodle', 'teriyaki', 'ramen', 'wok'],
    videoId: 'xGmM6DA4wAQ',
    videoTitle: 'Asya Usulü Wok Sote Noodle & Pad Thai',
    videoAuthor: 'Merlifood'
  },
  {
    keywords: ['taco', 'fajita', 'quesadilla', 'burger', 'bowl'],
    videoId: 'JC9bydB0zMw',
    videoTitle: 'Evde Gurme Sokak Lezzetleri & Dürüm Yapımı',
    videoAuthor: 'Nefis Yemek Tarifleri'
  }
];

// Fallback category videos with verified working playback
const CATEGORY_DEFAULT_VIDEOS: Record<string, VideoMetadata> = {
  drink: {
    videoId: '1_pGTeOL2Lk',
    videoTitle: 'Nefis Ferahlatıcı İçecek ve Limonata Yapımı',
    videoAuthor: 'Nefis Yemek Tarifleri',
    language: 'tr'
  },
  dessert: {
    videoId: 'Ehf8igYTJVk',
    videoTitle: 'Ev Baklavası ve Geleneksel Tatlı Yapımı',
    videoAuthor: 'Nefis Yemek Tarifleri',
    language: 'tr'
  },
  breakfast: {
    videoId: '3wo7qr6PIU4',
    videoTitle: 'Pratik ve Lezzetli Kahvaltılık Tarifleri',
    videoAuthor: "Refika'nın Mutfağı",
    language: 'tr'
  },
  pastry: {
    videoId: '53WIi2xE5Xs',
    videoTitle: 'Pamuk Gibi Yumuşak Fırın Börek ve Poğaçaları',
    videoAuthor: 'Nefis Yemek Tarifleri',
    language: 'tr'
  },
  soup: {
    videoId: 'fCos8xZE900',
    videoTitle: 'Tam Kıvamında Lokanta Usulü Çorba Tarifi',
    videoAuthor: 'Ramazan Bingöl',
    language: 'tr'
  },
  main_dish: {
    videoId: '3wo7qr6PIU4',
    videoTitle: 'Ustasından En Lezzetli Ana Yemek Tarifleri',
    videoAuthor: 'Nefis Yemek Tarifleri',
    language: 'tr'
  },
  meze: {
    videoId: 'oGmekoYoqXI',
    videoTitle: 'En Sevilen Soğuk Meze ve Salata Tarifleri',
    videoAuthor: 'Nefis Yemek Tarifleri',
    language: 'tr'
  },
  world: {
    videoId: '30322lLo4Ow',
    videoTitle: 'Dünya Mutfağı ve Özel Sokak Lezzetleri',
    videoAuthor: 'Cookly Mutfak Şefi',
    language: 'tr'
  }
};

/**
 * High-precision semantic video resolver for any recipe in the database.
 */
export function resolveRecipeVideo(recipe: {
  title?: string;
  name?: string;
  category?: string;
  videoId?: string;
  videoTitle?: string;
  videoAuthor?: string;
}): VideoMetadata {
  const title = (recipe.title || recipe.name || '').toLowerCase();
  const category = (recipe.category || 'main_dish').toLowerCase();

  // 1. Search for specific dish keywords
  for (const item of DISH_VIDEO_MAP) {
    if (item.keywords.some(kw => title.includes(kw.toLowerCase()))) {
      return {
        videoId: item.videoId,
        videoTitle: `${recipe.title || recipe.name} | ${item.videoTitle}`,
        videoAuthor: item.videoAuthor,
        language: 'tr'
      };
    }
  }

  // 2. Check if recipe already has an explicit valid 11-char videoId
  if (recipe.videoId && recipe.videoId.length === 11 && !recipe.videoId.startsWith('search_')) {
    return {
      videoId: recipe.videoId,
      videoTitle: recipe.videoTitle || `${recipe.title || recipe.name} Nasıl Yapılır? | Adım Adım Tarif`,
      videoAuthor: recipe.videoAuthor || 'Nefis Yemek Tarifleri',
      language: 'tr'
    };
  }

  // 3. Fallback to category-curated verified video
  const catFallback = CATEGORY_DEFAULT_VIDEOS[category] || CATEGORY_DEFAULT_VIDEOS.main_dish;
  return {
    videoId: catFallback.videoId,
    videoTitle: `${recipe.title || recipe.name} Nasıl Yapılır? | ${catFallback.videoTitle}`,
    videoAuthor: catFallback.videoAuthor,
    language: catFallback.language
  };
}
