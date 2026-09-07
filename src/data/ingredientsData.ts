import { Ingredient } from '../types';

export const INGREDIENTS_DATABASE: Ingredient[] = [
  // MEAT & POULTRY
  { id: 'chicken', name: 'Tavuk', aliases: ['tavuk', 'chicken', 'tavuk göğsü', 'tavuk eti', 'tavuk but', 'tavuk pirzola', 'tavuk kanat', 'tavuklar'], category: 'meat', commonUnit: 'g' },
  { id: 'minced_meat', name: 'Kıyma', aliases: ['kıyma', 'kiyma', 'dana kıyma', 'ground beef', 'minced meat'], category: 'meat', commonUnit: 'g' },
  { id: 'beef', name: 'Kuşbaşı Et', aliases: ['kuşbaşı et', 'dana eti', 'et', 'dana kuşbaşı', 'kırmızı et', 'beef'], category: 'meat', commonUnit: 'g' },
  { id: 'fish', name: 'Balık', aliases: ['balık', 'balik', 'hamsi', 'somon', 'levrek', 'fish'], category: 'meat', commonUnit: 'adet' },
  { id: 'sucuk', name: 'Sucuk', aliases: ['sucuk', 'kasap sucuk'], category: 'meat', commonUnit: 'dilim' },

  // PRODUCE (SEBZE & MEYVE)
  { id: 'potato', name: 'Patates', aliases: ['patates', 'potato', 'potatoes', 'patatesler'], category: 'produce', commonUnit: 'adet' },
  { id: 'onion', name: 'Soğan', aliases: ['soğan', 'sogan', 'onion', 'onions', 'kuru soğan', 'soğanlar'], category: 'produce', commonUnit: 'adet' },
  { id: 'garlic', name: 'Sarımsak', aliases: ['sarımsak', 'sarimsak', 'garlic', 'sarımsaklar'], category: 'produce', commonUnit: 'diş' },
  { id: 'tomato', name: 'Domates', aliases: ['domates', 'tomato', 'tomatoes', 'domatesler', 'çeri domates'], category: 'produce', commonUnit: 'adet' },
  { id: 'pepper', name: 'Biber', aliases: ['biber', 'pepper', 'yeşil biber', 'sivri biber', 'kapya biber', 'çarliston biber'], category: 'produce', commonUnit: 'adet' },
  { id: 'carrot', name: 'Havuç', aliases: ['havuç', 'havuc', 'carrot', 'havuçlar'], category: 'produce', commonUnit: 'adet' },
  { id: 'eggplant', name: 'Patlıcan', aliases: ['patlıcan', 'patlican', 'eggplant', 'patlıcanlar'], category: 'produce', commonUnit: 'adet' },
  { id: 'zucchini', name: 'Kabak', aliases: ['kabak', 'zucchini', 'yeşil kabak'], category: 'produce', commonUnit: 'adet' },
  { id: 'spinach', name: 'Ispanak', aliases: ['ıspanak', 'ispanak', 'spinach'], category: 'produce', commonUnit: 'g' },
  { id: 'mushroom', name: 'Mantar', aliases: ['mantar', 'mushroom', 'kültür mantarı'], category: 'produce', commonUnit: 'g' },
  { id: 'cucumber', name: 'Salatalık', aliases: ['salatalık', 'salatalik', 'cucumber', 'hıyar'], category: 'produce', commonUnit: 'adet' },
  { id: 'lemon', name: 'Limon', aliases: ['limon', 'lemon', 'limon suyu'], category: 'produce', commonUnit: 'adet' },
  { id: 'parsley', name: 'Maydanoz', aliases: ['maydanoz', 'parsley', 'kıyılmış maydanoz'], category: 'produce', commonUnit: 'demet' },
  { id: 'dill', name: 'Dereotu', aliases: ['dereotu', 'dill'], category: 'produce', commonUnit: 'demet' },
  { id: 'green_beans', name: 'Taze Fasulye', aliases: ['taze fasulye', 'fasulye', 'green beans'], category: 'produce', commonUnit: 'g' },

  // DAIRY & EGGS
  { id: 'egg', name: 'Yumurta', aliases: ['yumurta', 'egg', 'eggs', 'yumurtalar'], category: 'dairy', commonUnit: 'adet' },
  { id: 'milk', name: 'Süt', aliases: ['süt', 'sut', 'milk', 'inek sütü'], category: 'dairy', commonUnit: 'su bardağı' },
  { id: 'yogurt', name: 'Yoğurt', aliases: ['yoğurt', 'yogurt', 'süzme yoğurt'], category: 'dairy', commonUnit: 'kase' },
  { id: 'cheese', name: 'Kaşar Peyniri', aliases: ['kaşar', 'kasar', 'kaşar peyniri', 'mozzarella', 'rendelenmiş kaşar'], category: 'dairy', commonUnit: 'g' },
  { id: 'white_cheese', name: 'Beyaz Peynir', aliases: ['beyaz peynir', 'peynir', 'feta', 'lor peyniri'], category: 'dairy', commonUnit: 'g' },
  { id: 'cream', name: 'Krema', aliases: ['krema', 'cream', 'sıvı krema'], category: 'dairy', commonUnit: 'kutu' },
  { id: 'butter', name: 'Tereyağı', aliases: ['tereyağı', 'tereyagi', 'butter'], category: 'dairy', isStaple: true, commonUnit: 'yemek kaşığı' },

  // GRAINS & LEGUMES
  { id: 'rice', name: 'Pirinç', aliases: ['pirinç', 'pirinc', 'rice', 'baldo pirinç'], category: 'grain', commonUnit: 'su bardağı' },
  { id: 'bulgur', name: 'Bulgur', aliases: ['bulgur', 'pilavlık bulgur', 'köftelik bulgur'], category: 'grain', commonUnit: 'su bardağı' },
  { id: 'pasta', name: 'Makarna', aliases: ['makarna', 'pasta', 'spagetti', 'penne', 'şehriye'], category: 'grain', commonUnit: 'paket' },
  { id: 'red_lentils', name: 'Kırmızı Mercimek', aliases: ['kırmızı mercimek', 'mercimek', 'lentil', 'lentils'], category: 'grain', commonUnit: 'su bardağı' },
  { id: 'green_lentils', name: 'Yeşil Mercimek', aliases: ['yeşil mercimek', 'yesil mercimek'], category: 'grain', commonUnit: 'su bardağı' },
  { id: 'chickpeas', name: 'Nohut', aliases: ['nohut', 'chickpeas', 'haşlanmış nohut'], category: 'grain', commonUnit: 'su bardağı' },
  { id: 'beans', name: 'Kuru Fasulye', aliases: ['kuru fasulye', 'fasulye'], category: 'grain', commonUnit: 'su bardağı' },
  { id: 'flour', name: 'Un', aliases: ['un', 'flour', 'buğday unu'], category: 'grain', isStaple: true, commonUnit: 'su bardağı' },
  { id: 'bread', name: 'Ekmek', aliases: ['ekmek', 'bread', 'bayat ekmek', 'tost ekmeği'], category: 'grain', commonUnit: 'dilim' },
  { id: 'phyllo', name: 'Yufka', aliases: ['yufka', 'hazır yufka', 'baklavalık yufka'], category: 'grain', commonUnit: 'adet' },

  // PANTRY STAPLES (Temel Malzemeler)
  { id: 'salt', name: 'Tuz', aliases: ['tuz', 'salt', 'sofra tuzu', 'kaya tuzu'], category: 'pantry_staple', isStaple: true, commonUnit: 'çay kaşığı' },
  { id: 'olive_oil', name: 'Zeytinyağı / Sıvı Yağ', aliases: ['zeytinyağı', 'zeytinyagi', 'sıvı yağ', 'sıvıyağ', 'ayçiçek yağı', 'oil', 'olive oil'], category: 'pantry_staple', isStaple: true, commonUnit: 'yemek kaşığı' },
  { id: 'water', name: 'Su', aliases: ['su', 'water', 'sıcak su', 'ılık su'], category: 'pantry_staple', isStaple: true, commonUnit: 'su bardağı' },
  { id: 'black_pepper', name: 'Karabiber', aliases: ['karabiber', 'black pepper', 'çekilmiş karabiber'], category: 'pantry_staple', isStaple: true, commonUnit: 'çay kaşığı' },
  { id: 'red_pepper_flakes', name: 'Pul Biber', aliases: ['pul biber', 'pulbiber', 'kırmızı pul biber', 'chili flakes'], category: 'pantry_staple', isStaple: true, commonUnit: 'tatlı kaşığı' },
  { id: 'tomato_paste', name: 'Salça', aliases: ['salça', 'salca', 'domates salçası', 'biber salçası', 'tomato paste'], category: 'pantry_staple', isStaple: true, commonUnit: 'yemek kaşığı' },
  { id: 'mint', name: 'Kuru Nane', aliases: ['nane', 'kuru nane', 'mint', 'taze nane'], category: 'pantry_staple', isStaple: true, commonUnit: 'tatlı kaşığı' },
  { id: 'thyme', name: 'Kekik', aliases: ['kekik', 'thyme', 'dağ kekiği'], category: 'pantry_staple', isStaple: true, commonUnit: 'çay kaşığı' },
  { id: 'sugar', name: 'Şeker', aliases: ['şeker', 'seker', 'toz şeker', 'sugar'], category: 'pantry_staple', isStaple: true, commonUnit: 'su bardağı' },
  { id: 'vinegar', name: 'Sirke', aliases: ['sirke', 'elma sirkesi', 'üzüm sirkesi', 'vinegar'], category: 'pantry_staple', isStaple: true, commonUnit: 'yemek kaşığı' },
];

export const POPULAR_QUICK_INGREDIENTS = [
  'Tavuk', 'Patates', 'Soğan', 'Domates', 'Yumurta', 
  'Makarna', 'Pirinç', 'Süt', 'Kaşar Peyniri', 'Kıyma', 
  'Sarımsak', 'Biber', 'Salça', 'Havuç', 'Yoğurt'
];

export const PANTRY_STAPLES_IDS = [
  'salt', 'olive_oil', 'water', 'black_pepper', 'red_pepper_flakes', 'flour', 'butter'
];
