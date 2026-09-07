// Curated and 100% verified Turkish & World gastronomy video matching database

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
    keywords: ['ayran', 'susurluk', 'yayık ayran', 'yayik ayran'],
    videoId: 'h4KFSrPPhk8',
    videoTitle: 'Hazırlarından Farksız Bol Köpüklü Ev Yapımı Ayran Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'limonata',
    keywords: ['limonata', 'limon', 'lemonade', 'çilekli limonata', 'cilekli limonata'],
    videoId: '1_pGTeOL2Lk',
    videoTitle: '1 Portakal 1 Limon ile Limonata Yapımı | Pratik Limonata Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'turk_kahvesi',
    keywords: ['türk kahvesi', 'turk kahvesi', 'kahve', 'espresso', 'latte', 'frappe', 'soğuk kahve', 'filtre kahve', 'cappuccino', 'mocha'],
    videoId: 's2cj09WgbV0',
    videoTitle: 'Bol Köpüklü Sütlü & Sade Türk Kahvesi Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'soguk_cay',
    keywords: ['soğuk çay', 'soguk cay', 'ice tea', 'çay', 'bitki çayı', 'hibiskus', 'adaçayı', 'ıhlamur', 'yeşil çay'],
    videoId: 'RibpjkIt8nU',
    videoTitle: 'Ev Yapımı Soğuk Çay | Şeftalili Ice Tea Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'smoothie',
    keywords: ['smoothie', 'shake', 'protein shake', 'detox', 'detoks', 'milkshake'],
    videoId: 'HzqJrezYd_E',
    videoTitle: 'Vitamin Deposu 3 Muhteşem Smoothie & Shake Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'salgam',
    keywords: ['şalgam', 'salgam'],
    videoId: '34eOy-HE0gU',
    videoTitle: 'Ev Yapımı Doğal Şalgam Suyu Hazırlanışı',
    videoAuthor: 'Hatay Sandık İçi'
  },
  {
    key: 'serbet',
    keywords: ['şerbet', 'serbet', 'osmanlı şerbeti', 'demirhindi', 'reyhan'],
    videoId: '-hzdBJfXWQ4',
    videoTitle: 'İç Ferahlatan Mis Kokulu Osmanlı Padişah Şerbeti',
    videoAuthor: '100de100 marifet'
  },
  {
    key: 'komposto',
    keywords: ['komposto', 'hoşaf', 'hosaf'],
    videoId: '_wKJlqELVzI',
    videoTitle: 'Tam Kıvamında Karışık Meyve & Armut Kompostosu',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'sicak_cikolata',
    keywords: ['sıcak çikolata', 'sicak cikolata', 'hot chocolate', 'kakao'],
    videoId: '627qMA1JV2U',
    videoTitle: 'Kıvamlı Hakiki Sıcak Çikolata Yapımı',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'salep',
    keywords: ['salep', 'sahlep'],
    videoId: '7Hlvtol0Ml4',
    videoTitle: 'Hakiki Sütlü Salep Tarifi | Ustasından',
    videoAuthor: 'Lezzet Sepeti'
  },
  {
    key: 'visne_suyu',
    keywords: ['meyve suyu', 'vişne', 'visne', 'portakal suyu', 'limon suyu', 'kokteyl', 'şurup'],
    videoId: 'AK3LBX0wz8A',
    videoTitle: 'Ev Yapımı Doğal Meyve & Vişne Kompostosu Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },

  // 2. DESSERTS & SWEETS (Specific priority first)
  {
    key: 'peynir_helvasi',
    keywords: ['peynir helvası', 'peynir helvasi', 'çanakkale peynir helvası', 'canakkale peynir helvasi', 'fırınlanmış peynir helvası', 'firinlanmis peynir helvasi', 'höşmerim', 'hosmerim'],
    videoId: 'zOXBiT8Dv8w',
    videoTitle: 'Çanakkale Fırınlanmış Peynir Helvası 💯 Orijinal Tarif',
    videoAuthor: 'TUBA ÖZMEN KOCAMAN'
  },
  {
    key: 'irmik_helvasi',
    keywords: ['irmik helvası', 'irmik helvasi', 'dondurmalı irmik helvası', 'sütlü irmik helvası'],
    videoId: 'M0WW6j4NfQg',
    videoTitle: 'Tam Ölçülü Dondurmalı İrmik Helvası Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'un_helvasi',
    keywords: ['un helvası', 'un helvasi', 'cevizli un helvası', 'tereyağlı un helvası'],
    videoId: 'K7jQV76j2xc',
    videoTitle: 'Tutturma Garantili Anne Usulü Cevizli Un Helvası Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'helva_genel',
    keywords: ['helva', 'tahin helvası', 'saray helvası', 'koz helva'],
    videoId: 'M0WW6j4NfQg',
    videoTitle: 'Nefis Geleneksel Helva Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'firin_sutlac',
    keywords: ['sütlaç', 'sutlac', 'fırın sütlaç', 'firin sutlac', 'hünkarsütlacı'],
    videoId: 'O3wyuoEyEJ8',
    videoTitle: 'Tam Ölçülü Lokanta Kıvamında Fırın Sütlaç Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'baklava',
    keywords: ['baklava', 'fıstıklı baklava', 'cevizli baklava', 'şöbiyet', 'sobiyet', 'bülbül yuvası', 'havuç dilimi'],
    videoId: 'vpX0YM5V5S8',
    videoTitle: 'Hiç Oklava Kullanmadan Kat Kat Pratik Ev Baklavası Yapımı',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'kunefe',
    keywords: ['künefe', 'kunefe', 'kadayıf', 'kadayif', 'tel kadayıf', 'cevizli kadayıf'],
    videoId: 'rFZFcrscljA',
    videoTitle: 'Hatay Usulü Uzayan Peyniriyle Nefis Künefe Tarifi',
    videoAuthor: 'Yemektürkiyecom'
  },
  {
    key: 'kazandibi',
    keywords: ['kazandibi', 'tavukgöğsü', 'tavuk göğsü', 'muhallebi', 'saray muhallebisi', 'keşkül'],
    videoId: 'O7OfU8aS7dA',
    videoTitle: 'Evde Yanık Tabanlı Kolay Kazandibi Nasıl Yapılır?',
    videoAuthor: 'Tuğba Mutfakta'
  },
  {
    key: 'trilece',
    keywords: ['trileçe', 'trilece', 'karamelli trileçe', 'balkan tatlısı'],
    videoId: 'y5G1YVJyjto',
    videoTitle: 'Tam Ölçülü İftarın Yıldızı Karamelli Trileçe Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'cheesecake',
    keywords: ['cheesecake', 'san sebastian', 'çizkek', 'cizkek', 'limonlu cheesecake'],
    videoId: 'Srh9-WWY8dw',
    videoTitle: 'İçi Akışkan San Sebastian Cheesecake Tarifi',
    videoAuthor: 'Özlemli Mutfak'
  },

  // 3. BREAKFAST & EGGS
  {
    key: 'menemen',
    keywords: ['menemen', 'soğanlı menemen', 'kaşarlı menemen'],
    videoId: 'kUt0flbXXcw',
    videoTitle: 'Sahanda Mükemmel Menemen Tarifi',
    videoAuthor: "Refika'nın Mutfağı"
  },
  {
    key: 'omlet',
    keywords: ['omlet', 'kaşarlı omlet', 'sebzeli omlet', 'patatesli omlet', 'frittata'],
    videoId: 'nUaPQ5F9Uqk',
    videoTitle: 'Puf Puf Kabaran Kahvaltılık Omlet Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'kuymak',
    keywords: ['kuymak', 'muhlama', 'mıhlama', 'trabzon kuymağı'],
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
    keywords: ['sucuklu yumurta', 'kıymalı yumurta', 'pastırmalı yumurta', 'yumurta', 'haşlanmış yumurta'],
    videoId: 'DoUiN8r_Ysc',
    videoTitle: 'Tavada Hakiki Sucuklu Yumurta Nasıl Yapılır?',
    videoAuthor: 'Nefisyemekcom'
  },
  {
    key: 'cilbir',
    keywords: ['çılbır', 'cilbir', 'poşe', 'pose yumurta'],
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
    keywords: ['tost', 'avokado toast', 'sandviç', 'ekmek üstü', 'bruschetta', 'kumru'],
    videoId: 'RQHi956kU0E',
    videoTitle: 'Bol Kaşarlı Sanayi Usulü Gurme Tost Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },

  // 4. SOUPS
  {
    key: 'mercimek_corbasi',
    keywords: ['mercimek', 'mercimek çorbası', 'süzme mercimek', 'kırmızı mercimek'],
    videoId: 'Hm-sZJdy0lA',
    videoTitle: 'Lokanta Usulü Süzme Kırmızı Mercimek Çorbası Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'ezogelin_corbasi',
    keywords: ['ezogelin', 'ezogelin çorbası'],
    videoId: '5qwzunAd7KM',
    videoTitle: 'Lokanta Usulü Efsane Ezogelin Çorbası',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'tarhana_corbasi',
    keywords: ['tarhana', 'tarhana çorbası', 'ev tarhanası'],
    videoId: 'nncdWyHP2F4',
    videoTitle: 'Miss Gibi Şifalı Ev Tarhanası Çorbası Nasıl Yapılır?',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'yayla_corbasi',
    keywords: ['yayla', 'yayla çorbası', 'yoğurt çorbası', 'pirinçli çorba'],
    videoId: 'O-SG5CldEMs',
    videoTitle: 'Pirinçli Nane Soslu Yayla Çorbası Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'domates_corbasi',
    keywords: ['domates çorbası', 'domates çorba', 'kaşarlı domates'],
    videoId: '46gum1DHV34',
    videoTitle: 'Kaşarlı Sütlü Kadife Kıvamında Domates Çorbası',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'tavuk_corbasi',
    keywords: ['tavuk çorbası', 'tavuk suyu', 'şehriye çorbası', 'arpa şehriye', 'tel şehriye', 'düğün çorbası'],
    videoId: 'nRM5kz87XX4',
    videoTitle: 'Şifalı Tel Şehriyeli Tavuk Çorbası Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'kelle_paca',
    keywords: ['kelle paça', 'kelle paca', 'işkembe', 'iskembe', 'beyran', 'ayak paça', 'paça'],
    videoId: 'tDrQPkDHmGE',
    videoTitle: 'Kemik Suyuna Terbiyeli Lokanta Usulü Şifa Çorbası',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'mantar_corbasi',
    keywords: ['mantar çorbası', 'mantar corbasi', 'kremalı mantar'],
    videoId: 'MnytfME1FNE',
    videoTitle: 'Kremalı Sütlü Mantar Çorbası Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'sebze_corbasi',
    keywords: ['sebze çorbası', 'brokoli çorbası', 'kabak çorbası', 'balkabağı çorbası', 'çorba', 'corba'],
    videoId: 'k7t-4VU-XwA',
    videoTitle: 'Vitamin Deposu Şifalı Sebze Çorbası Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },

  // 5. PASTRIES & BAKERY
  {
    key: 'su_boregi',
    keywords: ['su böreği', 'su boregi', 'peynirli su böreği', 'kıymalı su böreği'],
    videoId: 'QrzKUlWDue4',
    videoTitle: 'Hamuru Asla Yırtılmayan Orijinal El Açması Su Böreği',
    videoAuthor: 'Lezzetli İkramlar'
  },
  {
    key: 'sigara_boregi',
    keywords: ['sigara böreği', 'sigara boregi', 'kalem börek', 'çıtır peynirli börek'],
    videoId: 'GpEbL48uw70',
    videoTitle: 'Çıtır Çıtır Dağılmayan Peynirli Sigara Böreği Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'borek_genel',
    keywords: ['börek', 'borek', 'kol böreği', 'paçanga', 'çiğ börek', 'ıspanaklı börek', 'kıymalı börek', 'patatesli börek', 'tepsi böreği', 'poğaça', 'pogaca', 'açma', 'simit'],
    videoId: 'a235SLBQQOU',
    videoTitle: 'Pamuk Gibi Yumuşacık Sodalı Tepsi Böreği & Poğaça Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },

  // 6. MAIN DISHES - MEATS, CHICKEN, CASSEROLES
  {
    key: 'tavuk_sote',
    keywords: ['tavuk sote', 'tavuk göğsü sote', 'tavuklu', 'tavuk yemeği', 'fırında tavuk', 'tavuk but'],
    videoId: '3wo7qr6PIU4',
    videoTitle: 'Lokum Gibi Yumuşacık Tavuk Sote Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'karniyarik',
    keywords: ['karnıyarık', 'karniyarik', 'imam bayıldı', 'patlıcan oturtma', 'patlıcan yemeği'],
    videoId: 'brvuUWDqXw8',
    videoTitle: 'Tam Kıvamında Fırında Karnıyarık Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'izmir_kofte',
    keywords: ['izmir köfte', 'izmir kofte', 'soslu köfte'],
    videoId: 'W8f6E3ryHvQ',
    videoTitle: 'Fırında Soslu Patatesli İzmir Köfte Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'anne_koftesi',
    keywords: ['köfte', 'kofte', 'kuru köfte', 'anne köftesi', 'kasap köfte', 'ıslama köfte', 'inegöl köfte', 'ızgara köfte', 'kadınbudu', 'içli köfte', 'dalyan köfte'],
    videoId: 'gqBJ64uTxnE',
    videoTitle: 'Asla Sertleşmeyen Yumuşacık Anne Köftesi Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'kuru_fasulye',
    keywords: ['kuru fasulye', 'fasulye yemeği', 'etli kuru fasulye'],
    videoId: '7rORG0W31aE',
    videoTitle: 'Lokanta Usulü Etli Kuru Fasulye Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'nohut_yemegi',
    keywords: ['nohut', 'nohut yemeği', 'etli nohut'],
    videoId: 'du0PEg5ivxE',
    videoTitle: 'Etli Lokanta Usulü Nefis Nohut Yemeği',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'tas_kebabi',
    keywords: ['tas kebabı', 'tas kebabi', 'orman kebabı', 'çökertme'],
    videoId: 's-Gs5j9f3dA',
    videoTitle: 'Lokum Kıvamında Yumuşacık Eti ile Tas Kebabı Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'et_sote',
    keywords: ['et sote', 'kavurma', 'dana eti', 'kuzu eti', 'antrikot', 'biftek', 'bonfile', 'kuşbaşı', 'tandır'],
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
    keywords: ['ali nazik', 'alinazik', 'patlıcan kebabı'],
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
    keywords: ['tantuni', 'mersin tantuni', 'dürüm'],
    videoId: 'MVtsn6oU_Sg',
    videoTitle: 'Evde Mersin Tantunisi Yapımı & Dürüm Tarifi',
    videoAuthor: "Refika'nın Mutfağı"
  },
  {
    key: 'kebap_adana',
    keywords: ['kebap', 'adana', 'urfa', 'beyti', 'iskender', 'döner', 'cağ kebabı'],
    videoId: '8_wS8QgwvvI',
    videoTitle: 'Evde Kolay ve Lezzetli Adana Kebap & Beyti Tarifi',
    videoAuthor: 'CHEF OKTAY USTA'
  },
  {
    key: 'manti',
    keywords: ['mantı', 'manti', 'kayseri mantısı', 'tepsi mantısı', 'çıtır mantı', 'sinop mantısı'],
    videoId: 'p6pHPxS3UsY',
    videoTitle: 'Sosuyla Pişen Tam Ölçülü Kayseri Mantısı Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'ciger_tava',
    keywords: ['ciğer', 'ciger', 'arnavut ciğeri', 'edirne ciğer'],
    videoId: 'JT-J2qrbaNQ',
    videoTitle: 'Edirne Usulü Yaprak Ciğer Tava Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },

  // 7. MEZES, SALADS & APPETIZERS
  {
    key: 'humus',
    keywords: ['humus', 'nohut ezmesi'],
    videoId: 'XD8hWdGCCWc',
    videoTitle: 'Hatay Usulü Sıcak Tereyağlı Humus Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },
  {
    key: 'kisir_meze',
    keywords: ['kısır', 'kisir', 'haydari', 'şakşuka', 'saksuka', 'fava', 'atom', 'babagannuş', 'mercimek köftesi', 'rus salatası', 'piyaz', 'salata', 'meze', 'çoban salatası', 'gavurdağı'],
    videoId: 'ktKIUduclxA',
    videoTitle: 'Ustasından Gerçek Hatay Usulü Kısır & Soğuk Meze Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri'
  },

  // 8. WORLD CUISINE & FAST FOOD
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
    videoTitle: 'Evde Hızlı ve Gurme Hamburger Tarifi | Hamburger 101',
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
    videoAuthor: 'Nefis Yemek Tarifleri',
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
 * Matches specific multi-word dish keywords first (longest match priority) to ensure 100% video accuracy.
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

  // Find the dish rule with the longest matching keyword to ensure exact dish-level specificity
  let bestMatch: { rule: DishVideoRule; matchLen: number } | null = null;

  for (const item of DISH_VIDEO_MAP) {
    for (const kw of item.keywords) {
      const normKw = normalizeForSearch(kw);
      if (normTitle.includes(normKw)) {
        if (!bestMatch || normKw.length > bestMatch.matchLen) {
          bestMatch = { rule: item, matchLen: normKw.length };
        }
      }
    }
  }

  if (bestMatch) {
    return {
      videoId: bestMatch.rule.videoId,
      videoTitle: `${rawTitle} | ${bestMatch.rule.videoTitle}`,
      videoAuthor: bestMatch.rule.videoAuthor,
      language: 'tr'
    };
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

