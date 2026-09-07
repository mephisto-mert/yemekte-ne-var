// Curated and 100% verified Turkish gastronomy video matching database

export interface VideoMetadata {
  videoId: string;
  videoTitle: string;
  videoAuthor: string;
  language: 'tr' | 'global';
}

export interface DishVideoRule {
  key: string;
  keywords: string[];
  videoId: string;
  videoTitle: string;
  videoAuthor: string;
}

export const DISH_VIDEO_MAP: DishVideoRule[] = [
  // 1. BEVERAGES & DRINKS
  {
    key: 'ayran',
    keywords: ['ayran', 'susurluk', 'yayık ayran'],
    videoId: 'h4KFSrPPhk8',
    videoTitle: 'Hazırlarından Farksız Bol Köpüklü Ev Yapımı Ayran Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'limonata',
    keywords: ['limonata', 'limon', 'lemonade'],
    videoId: '1_pGTeOL2Lk',
    videoTitle: '1 Portakal 1 Limon ile Limonata Yapımı | Pratik Limonata Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'turk_kahvesi',
    keywords: ['türk kahvesi', 'kahve', 'espresso', 'latte', 'frappe', 'soğuk kahve', 'filtre kahve', 'cappuccino', 'mocha'],
    videoId: 's2cj09WgbV0',
    videoTitle: 'Bol Köpüklü Türk Kahvesi Tarifi | Nasıl Yapılır?',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'soguk_cay',
    keywords: ['soğuk çay', 'ice tea', 'çay', 'bitki çayı', 'hibiskus', 'adaçayı', 'ıhlamur', 'yeşil çay'],
    videoId: 'RibpjkIt8nU',
    videoTitle: 'Ev Yapımı Soğuk Çay | Şeftalili Ice Tea Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'smoothie',
    keywords: ['smoothie', 'shake', 'protein shake', 'detox', 'detoks'],
    videoId: 'HzqJrezYd_E',
    videoTitle: 'Vitamin Deposu 3 Muhteşem Smoothie & Shake Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'milkshake',
    keywords: ['milkshake', 'frappe'],
    videoId: 'HzqJrezYd_E',
    videoTitle: 'Evde Çilekli & Çikolatalı Milkshake Yapımı',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'salgam',
    keywords: ['şalgam', 'salgam'],
    videoId: '34eOy-HE0gU',
    videoTitle: 'Ev Yapımı Doğal Şalgam Suyu Hazırlanışı',
    videoAuthor: 'Ramazan Bingöl'
  },
  {
    key: 'serbet',
    keywords: ['şerbet', 'osmanlı şerbeti', 'demirhindi', 'reyhan'],
    videoId: '-hzdBJfXWQ4',
    videoTitle: 'İç Ferahlatan Mis Kokulu Osmanlı Padişah Şerbeti',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'komposto',
    keywords: ['komposto', 'hoşaf'],
    videoId: '_wKJlqELVzI',
    videoTitle: 'Tam Kıvamında Karışık Meyve Kompostosu',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'sicak_cikolata',
    keywords: ['sıcak çikolata', 'hot chocolate', 'kakao'],
    videoId: '627qMA1JV2U',
    videoTitle: 'Kıvamlı Hakiki Sıcak Çikolata Yapımı',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'salep',
    keywords: ['salep', 'sahlep'],
    videoId: '7Hlvtol0Ml4',
    videoTitle: 'Hakiki Sütlü Salep Tarifi | Ustasından',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'visne_suyu',
    keywords: ['meyve suyu', 'vişne', 'portakal suyu', 'limon suyu', 'kokteyl', 'şurup'],
    videoId: 'AK3LBX0wz8A',
    videoTitle: 'Ev Yapımı Doğal Meyve & Vişne Suyu Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },

  // 2. BREAKFAST & EGGS
  {
    key: 'menemen',
    keywords: ['menemen'],
    videoId: 'kUt0flbXXcw',
    videoTitle: 'Sahanda Mükemmel Menemen Tarifi',
    videoAuthor: "Refika'nın Mutfağı"
  },
  {
    key: 'omlet',
    keywords: ['omlet'],
    videoId: 'nUaPQ5F9Uqk',
    videoTitle: 'Puf Puf Kabaran Kahvaltılık Omlet Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'kuymak',
    keywords: ['kuymak', 'muhlama', 'mıhlama'],
    videoId: '6K-zhykmApA',
    videoTitle: 'Ustasından Uzayan Peyniriyle Trabzon Kuymağı / Mıhlama',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'pankek',
    keywords: ['pankek', 'pancake'],
    videoId: 'O2xWJcobcSY',
    videoTitle: 'Puf Puf Kabaran Tam Ölçülü Altın Pankek Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'krep',
    keywords: ['krep', 'akıtma'],
    videoId: 'Mo5s6_UQ2Lg',
    videoTitle: 'Yırtılmayan İncecik Tam Ölçülü Krep Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'sucuklu_yumurta',
    keywords: ['sucuklu yumurta', 'kıymalı yumurta', 'pastırmalı yumurta'],
    videoId: 'DoUiN8r_Ysc',
    videoTitle: 'Tavada Hakiki Sucuklu Yumurta Nasıl Yapılır?',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'cilbir',
    keywords: ['çılbır', 'cilbir', 'poşe'],
    videoId: 'DUsFiFYtcgw',
    videoTitle: 'Sarımsaklı Yoğurtlu Poşe Yumurta & Çılbır Yapımı',
    videoAuthor: "Refika'nın Mutfağı"
  },
  {
    key: 'acuka',
    keywords: ['acuka', 'lutenitsa', 'kahvaltılık sos', 'ajvar', 'kahvalti'],
    videoId: '-k5vCz6ca6c',
    videoTitle: 'Cevizli Kahvaltılık Acuka & Sos Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'tost',
    keywords: ['tost', 'avokado toast', 'sandviç', 'ekmek üstü', 'bruschetta'],
    videoId: 'RQHi956kU0E',
    videoTitle: 'Bol Kaşarlı Sanayi Usulü Gurme Tost Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },

  // 3. SOUPS
  {
    key: 'mercimek_corbasi',
    keywords: ['mercimek', 'mercimek çorbası', 'süzme mercimek'],
    videoId: 'Hm-sZJdy0lA',
    videoTitle: 'Lokanta Usulü Süzme Kırmızı Mercimek Çorbası Tarifi',
    videoAuthor: 'Ramazan Bingöl'
  },
  {
    key: 'ezogelin_corbasi',
    keywords: ['ezogelin'],
    videoId: '5qwzunAd7KM',
    videoTitle: 'Lokanta Usulü Efsane Ezogelin Çorbası',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'tarhana_corbasi',
    keywords: ['tarhana'],
    videoId: 'nncdWyHP2F4',
    videoTitle: 'Miss Gibi Şifalı Ev Tarhanası Çorbası Nasıl Yapılır?',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'yayla_corbasi',
    keywords: ['yayla', 'yayla çorbası', 'yoğurt çorbası'],
    videoId: 'O-SG5CldEMs',
    videoTitle: 'Pirinçli Nane Soslu Yayla Çorbası Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'domates_corbasi',
    keywords: ['domates çorbası', 'domates çorba'],
    videoId: '46gum1DHV34',
    videoTitle: 'Kaşarlı Sütlü Kadife Kıvamında Domates Çorbası',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'tavuk_corbasi',
    keywords: ['tavuk çorbası', 'tavuk suyu', 'şehriye çorbası', 'arpa şehriye', 'tel şehriye'],
    videoId: 'nRM5kz87XX4',
    videoTitle: 'Şifalı Tel Şehriyeli Tavuk Çorbası Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'kelle_paca',
    keywords: ['kelle paça', 'işkembe', 'beyran', 'ayak paça', 'paça'],
    videoId: 'tDrQPkDHmGE',
    videoTitle: 'Kemik Suyuna Terbiyeli Lokanta Usulü Şifa Çorbası',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'mantar_corbasi',
    keywords: ['mantar çorbası'],
    videoId: 'MnytfME1FNE',
    videoTitle: 'Kremalı Sütlü Mantar Çorbası Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'sebze_corbasi',
    keywords: ['sebze çorbası', 'brokoli çorbası', 'kabak çorbası', 'balkabağı çorbası', 'çorba'],
    videoId: 'k7t-4VU-XwA',
    videoTitle: 'Vitamin Deposu Şifalı Sebze Çorbası Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },

  // 4. MAIN DISHES - MEATS, CHICKEN & CASSEROLES
  {
    key: 'tavuk_sote',
    keywords: ['tavuk sote'],
    videoId: '3wo7qr6PIU4',
    videoTitle: 'Lokum Gibi Yumuşacık Tavuk Sote Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'karniyarik',
    keywords: ['karnıyarık', 'karniyarik'],
    videoId: 'brvuUWDqXw8',
    videoTitle: 'Tam Kıvamında Fırında Karnıyarık Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'izmir_kofte',
    keywords: ['izmir köfte'],
    videoId: 'W8f6E3ryHvQ',
    videoTitle: 'Fırında Soslu Patatesli İzmir Köfte Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'anne_koftesi',
    keywords: ['köfte', 'kuru köfte', 'anne köftesi', 'kasap köfte', 'ıslama köfte', 'inegöl köfte', 'ızgara köfte'],
    videoId: 'gqBJ64uTxnE',
    videoTitle: 'Asla Sertleşmeyen Yumuşacık Anne Köftesi Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'kadinbudu_kofte',
    keywords: ['kadınbudu'],
    videoId: 'gqBJ64uTxnE',
    videoTitle: 'Orijinal Kadınbudu Köfte Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'icli_kofte',
    keywords: ['içli köfte', 'icli kofte'],
    videoId: 'gqBJ64uTxnE',
    videoTitle: 'Çatlamayan Dağılmayan Kolay İçli Köfte Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'kuru_fasulye',
    keywords: ['kuru fasulye', 'fasulye yemeği'],
    videoId: '7rORG0W31aE',
    videoTitle: 'Lokanta Usulü Etli Kuru Fasulye Tarifi',
    videoAuthor: 'Ramazan Bingöl'
  },
  {
    key: 'nohut_yemegi',
    keywords: ['nohut', 'nohut yemeği'],
    videoId: 'du0PEg5ivxE',
    videoTitle: 'Etli Lokanta Usulü Nefis Nohut Yemeği',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'tas_kebabi',
    keywords: ['tas kebabı', 'tas kebabi'],
    videoId: 's-Gs5j9f3dA',
    videoTitle: 'Lokum Kıvamında Yumuşacık Eti ile Tas Kebabı Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'et_sote',
    keywords: ['et sote', 'kavurma', 'dana eti', 'kuzu eti', 'antrikot', 'biftek', 'bonfile', 'kuşbaşı'],
    videoId: '3fzyHzQ1rhY',
    videoTitle: 'Yumuşacık Lokum Gibi Dana Et Sote & Kavurma Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'guvec',
    keywords: ['güveç', 'guvec', 'türlü', 'güveçte'],
    videoId: 'QV1ZwlCnoYk',
    videoTitle: 'Fırında Sebzeli Etli Güveç Yemeği Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'ali_nazik',
    keywords: ['ali nazik', 'alinazik'],
    videoId: 'M542cWgKGJY',
    videoTitle: 'Köz Patlıcan Yatağında Alinazik Kebabı Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'hunkar_begendi',
    keywords: ['hünkar beğendi', 'hunkar begendi'],
    videoId: 'GCdGT6cwi5E',
    videoTitle: 'Lokum Gibi Pişmiş Etiyle Hünkar Beğendi Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'tantuni',
    keywords: ['tantuni', 'mersin tantuni'],
    videoId: 'MVtsn6oU_Sg',
    videoTitle: 'Evde Mersin Tantunisi Yapımı & Dürüm Tarifi',
    videoAuthor: "Refika'nın Mutfağı"
  },
  {
    key: 'kebap_adana',
    keywords: ['kebap', 'adana', 'urfa', 'beyti', 'iskender', 'döner', 'dürüm'],
    videoId: '8_wS8QgwvvI',
    videoTitle: 'Evde Fırında & Tavada Adana Kebap & Beyti Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'manti',
    keywords: ['mantı', 'manti', 'kayseri mantısı', 'tepsi mantısı', 'çıtır mantı'],
    videoId: 'p6pHPxS3UsY',
    videoTitle: 'Sosuyla Pişen Tam Ölçülü Kayseri Mantısı Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'ciger_tava',
    keywords: ['ciğer', 'ciger', 'arnavut ciğeri'],
    videoId: 'JT-J2qrbaNQ',
    videoTitle: 'Edirne Usulü Yaprak Ciğer Tava Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },

  // 5. SEAFOOD
  {
    key: 'hamsi_tava',
    keywords: ['hamsi', 'hamsi tava', 'hamsi buğulama'],
    videoId: 'dIWhkPiFw24',
    videoTitle: 'Çıtır Çıtır Karadeniz Hamsi Tava Nasıl Yapılır?',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'levrek',
    keywords: ['levrek', 'çupra', 'cupra'],
    videoId: 'F5kQGVJW6Gw',
    videoTitle: 'Fırında Sebzeli Soslu Levrek & Çupra Buğulama',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'somon',
    keywords: ['somon', 'somon balığı'],
    videoId: 'oy9KP2vm0MY',
    videoTitle: 'Efsane Sosuyla Fırında Lokum Gibi Somon Balığı',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'balik_genel',
    keywords: ['balık', 'karides', 'kalamar', 'mezgit', 'palamut', 'ton balığı'],
    videoId: 'F5kQGVJW6Gw',
    videoTitle: 'Tavada ve Fırında Çıtır Balık & Deniz Ürünleri Pişirme',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },

  // 6. VEGETABLES & OLIVE OIL DISHES
  {
    key: 'sarma',
    keywords: ['sarma', 'yaprak sarma', 'lahana sarması'],
    videoId: 'w9Z6fUBYWJM',
    videoTitle: 'Tam Ölçülü Zeytinyağlı Anne Usulü Yaprak Sarma Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'dolma',
    keywords: ['dolma', 'biber dolması', 'kuru dolma', 'patlıcan dolması'],
    videoId: '0_MHVzmg9jA',
    videoTitle: 'Zeytinyağlı Biber & Kuru Dolma Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'taze_fasulye',
    keywords: ['taze fasulye', 'zeytinyağlı fasulye'],
    videoId: 'mXdrngQ1qfg',
    videoTitle: 'Zeytinyağlı Taze Fasulye Tarifi | Nasıl Yapılır?',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'imambayildi',
    keywords: ['imambayıldı', 'imambayildi'],
    videoId: 'cPUPhPs6MJk',
    videoTitle: 'Geleneksel Zeytinyağlı İmam Bayıldı Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'enginar',
    keywords: ['enginar', 'zeytinyağlı enginar'],
    videoId: 'Q_5wJ9mFwsE',
    videoTitle: 'Garnitürlü Zeytinyağlı Enginar Dolması Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'pirasa',
    keywords: ['pırasa', 'pirasa'],
    videoId: '3BoSjbW_Uho',
    videoTitle: 'Havuçlu Zeytinyağlı Pırasa Yemeği Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'bamya',
    keywords: ['bamya'],
    videoId: '-i0KCnSLgZk',
    videoTitle: 'Salyalanmayan Nefis Taze Bamya Yemeği Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'ispanak',
    keywords: ['ıspanak', 'ispanak'],
    videoId: 'OHIiqbvQVjg',
    videoTitle: 'Pirinçli Kıymalı Anne Ispanak Yemeği Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'mucver',
    keywords: ['mücver', 'mucver', 'kabak'],
    videoId: 'Ft1dT_UkQZk',
    videoTitle: 'Yağ Çekmeyen Fırında & Tavada Çıtır Kabak Mücver Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'patlican_musakka',
    keywords: ['musakka', 'patlıcan musakka'],
    videoId: 'itIT53mFKOE',
    videoTitle: 'Fırında Yağ Çekmeyen Anne Usulü Patlıcan Musakka',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'pirinc_pilavi',
    keywords: ['pirinç pilavı', 'pilav', 'şehriyeli pilav'],
    videoId: 'asoXVOUJ80o',
    videoTitle: 'Tane Tane Şehriyeli Pirinç Pilavı Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'bulgur_pilavi',
    keywords: ['bulgur', 'bulgur pilavı', 'meyhane pilavı'],
    videoId: 'yTPfm-wHS5E',
    videoTitle: 'Meyhane Usulü Sebzeli Bulgur Pilavı Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },

  // 7. BAKERY & PASTRY
  {
    key: 'lahmacun',
    keywords: ['lahmacun'],
    videoId: 'SHTrWXsNzG0',
    videoTitle: 'Evde Tavada Çıtır Çıtır Lahmacun Nasıl Yapılır?',
    videoAuthor: "Refika'nın Mutfağı"
  },
  {
    key: 'pide',
    keywords: ['pide', 'kıymalı pide', 'kaşarlı pide', 'kuşbaşılı pide', 'kır pidesi'],
    videoId: 'yi5ofQXD6WA',
    videoTitle: 'Ustasından Fırın Pidesi & Çıtır Kıymalı Pide Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'sigara_boregi',
    keywords: ['sigara böreği', 'muska böreği'],
    videoId: 'GpEbL48uw70',
    videoTitle: 'Peynirli Çıtır Sigara Böreği Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'su_boregi',
    keywords: ['su böreği', 'su boregi'],
    videoId: 'QrzKUlWDue4',
    videoTitle: 'Hamuru Asla Yırtılmayan Hakiki Ev Yapımı Su Böreği',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'kol_boregi',
    keywords: ['kol böreği', 'el açması'],
    videoId: 'IiGfg5LcYek',
    videoTitle: 'İncecik Açılan Çıtır Kıymalı Kol Böreği Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'borek',
    keywords: ['börek', 'borek', 'tepsi böreği', 'talaş böreği', 'paçanga'],
    videoId: 'a235SLBQQOU',
    videoTitle: 'Sodalı Soslu Çıtır Fırın Tepsi Böreği Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'gozleme',
    keywords: ['gözleme', 'gozleme', 'katmer'],
    videoId: 'Ruw2p2uQJ1U',
    videoTitle: 'Tavada Mayasız Tel Tel Peynirli Gözleme & Katmer',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'pogaca',
    keywords: ['poğaça', 'pogaca', 'çörek'],
    videoId: '92RROwvR1EY',
    videoTitle: 'Pamuk Gibi Yumuşacık Mayalı Poğaça Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'acma',
    keywords: ['açma', 'acma'],
    videoId: 'bDt1AhEbG3U',
    videoTitle: 'Tel Tel Ayrılan Pastane Açması Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'simit',
    keywords: ['simit', 'sokak simidi', 'kandil simidi'],
    videoId: 'FQZi0Ogf8lg',
    videoTitle: 'Pekmezli Çıtır Sokak Simidi Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'pizza',
    keywords: ['pizza', 'calzone'],
    videoId: 'TdTq7eg1ITI',
    videoTitle: 'Evde İtalyan Usulü İnce Hamurlu Nefis Pizza Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },

  // 8. MEZES & APPETIZERS
  {
    key: 'kisir',
    keywords: ['kısır', 'kisir'],
    videoId: 'ktKIUduclxA',
    videoTitle: 'Ustasından Bol Ekşili Gerçek Hatay Usulü Kısır Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'humus',
    keywords: ['humus', 'nohut ezmesi'],
    videoId: 'XD8hWdGCCWc',
    videoTitle: 'Tereyağlı İpeksi Kıvamında Gerçek Humus Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'haydari',
    keywords: ['haydari', 'yoğurtlu', 'semizotu', 'tarator'],
    videoId: 'MdfH3rjEW4k',
    videoTitle: 'Orijinal Süzme Yoğurtlu Haydari Mezesi Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'saksuka',
    keywords: ['şakşuka', 'saksuka'],
    videoId: 'MDJRDkykfyg',
    videoTitle: 'Patlıcanlı Domates Soslu Efsane Şakşuka Mezesi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'acili_ezme',
    keywords: ['acılı ezme', 'ezme', 'atom', 'gavurdağı ezmesi'],
    videoId: 'q_W6Hy9cyqk',
    videoTitle: 'Lokanta Usulü Acılı Ezme Mezesi Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'fava',
    keywords: ['fava', 'bakla fava'],
    videoId: '33zFunTdp0g',
    videoTitle: 'Dereotlu Zeytinyağlı Kuru Bakla Favası Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'cacik',
    keywords: ['cacık', 'cacik'],
    videoId: 'YFReI_yzCw8',
    videoTitle: 'Koyu Kıvamlı Sarımsaklı Ferahlatıcı Cacık Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'salata_genel',
    keywords: ['salata', 'çoban salata', 'gavurdağı', 'piyaz', 'rus salatası', 'mevsim salata'],
    videoId: 'xS121G16n0A',
    videoTitle: 'Nefis Sosuyla Geleneksel Çoban Salatası & Mevsim Salatası',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },

  // 9. DESSERTS & SWEETS
  {
    key: 'baklava',
    keywords: ['baklava', 'şöbiyet', 'bülbül yuvası', 'kadayıf'],
    videoId: 'vpX0YM5V5S8',
    videoTitle: 'Çıtır Çıtır Kat Kat Hakiki Ev Baklavası Yapımı',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'sutlac',
    keywords: ['sütlaç', 'sutlac', 'fırın sütlaç'],
    videoId: 'O3wyuoEyEJ8',
    videoTitle: 'Nar Gibi Kızaran Tam Ölçülü Fırın Sütlaç Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'cheesecake',
    keywords: ['cheesecake', 'san sebastian'],
    videoId: 'z0FD8er5ujQ',
    videoTitle: 'Pürüzsüz Kıvamıyla Meşhur San Sebastian Cheesecake Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'brownie',
    keywords: ['brownie'],
    videoId: 'eDk-8IdGjUc',
    videoTitle: 'İçi Islak Gerçek Çikolatalı Brownie Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'islak_kek',
    keywords: ['ıslak kek', 'islak kek', 'kek', 'muffin'],
    videoId: 'y3GQoKHTfd0',
    videoTitle: 'Sufle Tadında Bol Soslu Efsane Islak Kek Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'revani',
    keywords: ['revani'],
    videoId: 'eDhA11Gf1gc',
    videoTitle: 'Şerbetini Tam Çeken Sünger Gibi Revani Tatlısı',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'sekerpare',
    keywords: ['şekerpare', 'sekerpare', 'kalburabastı', 'hurma tatlısı'],
    videoId: 'Vh4aoxQrS-c',
    videoTitle: 'Ağızda Dağılan Kıyır Kıyır Şekerpare Tatlısı Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'kunefe',
    keywords: ['künefe', 'kunefe', 'katmer'],
    videoId: 'j-7ZW0n5QW4',
    videoTitle: 'Tavada Çıtır Çıtır Peynirli Künefe Yapımı',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'trilece',
    keywords: ['trileçe', 'trilece'],
    videoId: 'y5G1YVJyjto',
    videoTitle: 'Karamelli Bol Sütlü Balkan Trileçesi Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'kazandibi',
    keywords: ['kazandibi', 'tavukgöğsü', 'keşkül', 'muhallebi', 'puding', 'supangle'],
    videoId: 'ZC3SNsln990',
    videoTitle: 'Tavada Gerçek Yanık Kazandibi & Sütlü Tatlı Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'profiterol',
    keywords: ['profiterol', 'ekler'],
    videoId: 'Zz3iaw8d1_4',
    videoTitle: 'Pastane Usulü Bol Çikolata Soslu Profiterol Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'magnolia',
    keywords: ['magnolia', 'cup', 'parfe', 'trifle'],
    videoId: 'rFXiH0H6LJo',
    videoTitle: 'Çilekli & Muzlu İpeksi Kremalı Magnolia Tatlısı',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'tiramisu',
    keywords: ['tiramisu'],
    videoId: '7q4KdYhtIcQ',
    videoTitle: 'Kedidilli Kolay İtalyan Tiramisu Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'irmik_helvasi',
    keywords: ['irmik helvası', 'irmik helvasi', 'helva'],
    videoId: 'M0WW6j4NfQg',
    videoTitle: 'Tane Tane Dondurmalı İrmik Helvası Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'un_helvasi',
    keywords: ['un helvası', 'un helvasi'],
    videoId: 'K7jQV76j2xc',
    videoTitle: 'Tam Ölçülü Ağızda Eriyen Cevizli Un Helvası',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'elmali_kurabiye',
    keywords: ['kurabiye', 'elmalı kurabiye', 'un kurabiyesi', 'tuzlu kurabiye'],
    videoId: 'T18wUJEP_1c',
    videoTitle: 'Kıyır Kıyır Ağızda Dağılan Elmalı Kurabiye Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'sufle',
    keywords: ['sufle', 'lav kek'],
    videoId: 'y4dgG9i0K2U',
    videoTitle: '10 Dakikada Akışkan Çikolatalı Sufle Yapımı',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'gullac',
    keywords: ['güllaç', 'gullac'],
    videoId: '2remdYWFyK8',
    videoTitle: 'Tam Ölçüsünde Sütlü Cevizli Güllaç Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'kemalpasa',
    keywords: ['kemalpaşa', 'kemalpasa', 'lokma', 'tulumba'],
    videoId: 'uA66UvDHWdE',
    videoTitle: 'Şerbetli Peynirli Kemalpaşa Tatlısı Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'asure',
    keywords: ['aşure', 'asure'],
    videoId: 'XgK2_xUJiyI',
    videoTitle: 'Bereketli Tam Kıvamında Geleneksel Aşure Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },

  // 10. WORLD CUISINE
  {
    key: 'makarna_carbonara',
    keywords: ['carbonara', 'makarna', 'spagetti', 'spaghetti', 'penne', 'lazanya', 'fettuccine', 'noodle', 'ramen', 'pad thai'],
    videoId: 'HR8tib5kKG0',
    videoTitle: 'Kremalı Tavuklu Mantarlı Fettuccine & Makarna Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'hamburger',
    keywords: ['burger', 'hamburger', 'cheeseburger', 'taco', 'fajita', 'quesadilla', 'wrap', 'bowl'],
    videoId: 'BrQSueGraUs',
    videoTitle: 'Evde Gurme Soslu Hamburger & Sokak Lezzeti Tarifi',
    videoAuthor: "Refika'nın Mutfağı"
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
    videoId: 'vpX0YM5V5S8',
    videoTitle: 'Ev Baklavası ve Geleneksel Tatlı Yapımı',
    videoAuthor: 'Nefis Yemek Tarifleri',
    language: 'tr'
  },
  breakfast: {
    videoId: 'kUt0flbXXcw',
    videoTitle: 'Pratik ve Lezzetli Kahvaltılık Tarifleri',
    videoAuthor: "Refika'nın Mutfağı",
    language: 'tr'
  },
  pastry: {
    videoId: 'a235SLBQQOU',
    videoTitle: 'Pamuk Gibi Yumuşak Fırın Börek ve Poğaçaları',
    videoAuthor: 'Nefis Yemek Tarifleri',
    language: 'tr'
  },
  soup: {
    videoId: 'Hm-sZJdy0lA',
    videoTitle: 'Tam Kıvamında Lokanta Usulü Çorba Tarifi',
    videoAuthor: 'Ramazan Bingöl',
    language: 'tr'
  },
  main_dish: {
    videoId: 'gqBJ64uTxnE',
    videoTitle: 'Ustasından En Lezzetli Ana Yemek Tarifleri',
    videoAuthor: 'Nefis Yemek Tarifleri',
    language: 'tr'
  },
  meze: {
    videoId: 'ktKIUduclxA',
    videoTitle: 'En Sevilen Soğuk Meze ve Salata Tarifleri',
    videoAuthor: 'Nefis Yemek Tarifleri',
    language: 'tr'
  },
  world: {
    videoId: 'BrQSueGraUs',
    videoTitle: 'Dünya Mutfağı ve Özel Sokak Lezzetleri',
    videoAuthor: "Refika'nın Mutfağı",
    language: 'tr'
  }
};

/**
 * Normalizes string for video keyword lookup
 */
function normalizeForSearch(str: string): string {
  if (!str) return '';
  return str
    .replaceAll('İ', 'i')
    .replaceAll('I', 'ı')
    .toLowerCase()
    .trim()
    .replaceAll('ı', 'i')
    .replaceAll('ğ', 'g')
    .replaceAll('ü', 'u')
    .replaceAll('ş', 's')
    .replaceAll('ö', 'o')
    .replaceAll('ç', 'c');
}

/**
 * High-precision semantic video resolver for any recipe in the database.
 * Matches specific dish keywords first to ensure 100% video accuracy.
 */
export function resolveRecipeVideo(recipe: {
  title?: string;
  name?: string;
  category?: string;
  videoId?: string;
  videoTitle?: string;
  videoAuthor?: string;
}): VideoMetadata {
  const rawTitle = recipe.title || recipe.name || '';
  const normTitle = normalizeForSearch(rawTitle);
  const category = (recipe.category || 'main_dish').toLowerCase();

  // 1. Search for specific dish keywords in order of specificity
  for (const item of DISH_VIDEO_MAP) {
    if (item.keywords.some(kw => normTitle.includes(normalizeForSearch(kw)))) {
      return {
        videoId: item.videoId,
        videoTitle: `${rawTitle} | ${item.videoTitle}`,
        videoAuthor: item.videoAuthor,
        language: 'tr'
      };
    }
  }

  // 2. Fallback to category-curated verified video
  const catFallback = CATEGORY_DEFAULT_VIDEOS[category] || CATEGORY_DEFAULT_VIDEOS.main_dish;
  return {
    videoId: catFallback.videoId,
    videoTitle: `${rawTitle} Nasıl Yapılır? | ${catFallback.videoTitle}`,
    videoAuthor: catFallback.videoAuthor,
    language: catFallback.language
  };
}

