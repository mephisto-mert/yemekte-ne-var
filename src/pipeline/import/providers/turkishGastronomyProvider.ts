import { Recipe, RecipeIngredient } from '../../../types';

export interface GastronomyRecipeCandidate {
  sourceId: string;
  name: string;
  category: string;
  cuisine: string;
  region: string;
  difficulty: 'Kolay' | 'Orta' | 'Zor';
  time: string;
  timeMinutes: number;
  servings: number;
  calories: number;
  ingredients: { item: string; amount: string; isStaple?: boolean }[];
  steps: string[];
  imageUrl: string;
  videoId: string;
  videoTitle: string;
  videoAuthor: string;
  videoLanguage: 'tr';
  tags: string[];
}

export const TURKISH_GASTRONOMY_DATASET: GastronomyRecipeCandidate[] = [
  {
    sourceId: 'tr-gastronomy-101',
    name: 'Gaziantep Yuvalama Çorbası',
    category: 'soup',
    cuisine: 'Türk Mutfağı',
    region: 'Güneydoğu Anadolu (Gaziantep)',
    difficulty: 'Zor',
    time: '60 dk',
    timeMinutes: 60,
    servings: 6,
    calories: 340,
    ingredients: [
      { item: 'Kırık pirinç', amount: '1 su bardağı' },
      { item: 'Yağsız kıyma', amount: '200g' },
      { item: 'Kuşbaşı kuzu eti', amount: '300g' },
      { item: 'Haşlanmış nohut', amount: '1 su bardağı' },
      { item: 'Süzme yoğurt', amount: '500g' },
      { item: 'Yumurta', amount: '1 adet' },
      { item: 'Tereyağı', amount: '2 yemek kaşığı' },
      { item: 'Kuru nane', amount: '1 yemek kaşığı' },
      { item: 'Tuz', amount: '1 tatlı kaşığı', isStaple: true }
    ],
    steps: [
      'Geceden ıslatılmış kırık pirinci iyice süzüp kurutun ve un haline gelene kadar robottan geçirin. Kıyma, tuz ve karabiber ile birlikte sakız kıvamı alana kadar 15 dakika yoğurun.',
      'Yoğrulan harçtan nohut büyüklüğünde minik misketler (yuvalamalar) yuvarlayın. Yuvalamaları buharda ya da hafif yağlanmış kevgir üzerinde 10 dakika haşlayın.',
      'Ayrı bir tencerede kuşbaşı kuzu etini üzerini geçecek kadar su ile yumuşayana kadar yaklaşık 30-35 dakika haşlayın. Haşlanan etin içerisine önceden haşlanmış nohutları ve buharda pişen yuvalamaları ilave edin.',
      'Yoğurtlu terbiye için; derin bir kasede süzme yoğurt, yumurta ve 1 yemek kaşığı unu pürüzsüz olana kadar çırpın. Kaynayan et suyundan azar azar ekleyerek yoğurdu ılıtın (kesilmemesi için).',
      'Ilıyan yoğurt sosunu tencereye yavaş yavaş döküp çorba kaynayana kadar aynı yönde sürekli karıştırın. Kaynadıktan sonra kısık ateşte 5 dakika daha tutun.',
      'Küçük bir tavada tereyağını kızdırıp bol kuru naneyi köpürene kadar yakın. Çorbanın üzerine naneli tereyağını gezdirerek sıcak servis yapın.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop',
    videoId: 'x8Bkm4YnIWs',
    videoTitle: 'Tam Ölçülü Orijinal Antep Yuvalama Tarifi',
    videoAuthor: 'Gaziantep Mutfak Sanatları',
    videoLanguage: 'tr',
    tags: ['çorba', 'yöresel', 'gaziantep', 'bayram yemeği', 'yoğurtlu']
  },
  {
    sourceId: 'tr-gastronomy-102',
    name: 'Hatay Tepsi Kebabı (Sini Kebabı)',
    category: 'main_dish',
    cuisine: 'Türk Mutfağı',
    region: 'Akdeniz (Hatay)',
    difficulty: 'Kolay',
    time: '40 dk',
    timeMinutes: 40,
    servings: 4,
    calories: 420,
    ingredients: [
      { item: 'Zırh kıyması (orta yağlı)', amount: '600g' },
      { item: 'Kırmızı kapya biber', amount: '2 adet' },
      { item: 'Yeşil biber', amount: '3 adet' },
      { item: 'Sarımsak', amount: '4 diş' },
      { item: 'Maydanoz', amount: 'Yarım demet' },
      { item: 'Biber salçası', amount: '1 yemek kaşığı' },
      { item: 'Domates', amount: '2 adet' },
      { item: 'Karabiber', amount: '1 çay kaşığı', isStaple: true },
      { item: 'Tuz', amount: '1 tatlı kaşığı', isStaple: true }
    ],
    steps: [
      'Kapya biberleri, yeşil biberleri, sarımsakları ve maydanozu zırhtan veya kesme tahtasında bıçakla pirinç tanesi büyüklüğünde incecik kıyın.',
      'Geniş bir yoğurma kabında kıymayı, doğranmış sebzeleri, 1 tatlı kaşığı biber salçasını, tuzu ve karabiberi tüm lezzetler birleşene kadar 5-6 dakika yoğurun.',
      'Yuvarlak fırın tepsisinin veya güveç sininin tabanını 1 tatlı kaşığı biber salçası ve zeytinyağı ile hafifçe yağlayın. Hazırlanan köfte harcını tepsiye yaklaşık 1.5 cm kalınlığında eşit şekilde yayın ve elinizle düzeltin.',
      'Kebabı bıçakla üçgen ya da kare dilimler halinde porsiyonlayın. Üzerine dilimlenmiş domates ve yeşil biberleri yerleştirin.',
      '1 yemek kaşığı salçayı yarım su bardağı ılık suda açıp kebabın kenarlarından tepsiye dökün. Önceden 200°C ısıtılmış fırında yaklaşık 25-30 dakika nar gibi kızarana kadar pişirin. Sıcak lavaş ve ayran ile servis edin.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop',
    videoId: 'q6Wp_M7h1Yg',
    videoTitle: 'Orijinal Hatay Tepsi Kebabı Tarifi | Parmak Isırtan Lezzet',
    videoAuthor: 'Hatay Gastronomi Evi',
    videoLanguage: 'tr',
    tags: ['kebap', 'hatay', 'fırın yemeği', 'kolay', 'etli']
  },
  {
    sourceId: 'tr-gastronomy-103',
    name: 'Kayseri Yağlaması (Şebit)',
    category: 'pastry',
    cuisine: 'Türk Mutfağı',
    region: 'İç Anadolu (Kayseri)',
    difficulty: 'Orta',
    time: '50 dk',
    timeMinutes: 50,
    servings: 4,
    calories: 460,
    ingredients: [
      { item: 'Un', amount: '4 su bardağı', isStaple: true },
      { item: 'Kuru maya', amount: '1 paket' },
      { item: 'Dana kıyma', amount: '400g' },
      { item: 'Kuru soğan', amount: '2 adet' },
      { item: 'Yeşil biber', amount: '3 adet' },
      { item: 'Domates', amount: '3 adet' },
      { item: 'Tereyağı', amount: '2 yemek kaşığı' },
      { item: 'Sıvı yağ', amount: 'Yarım çay bardağı', isStaple: true },
      { item: 'Sarımsaklı yoğurt', amount: '1 kase' }
    ],
    steps: [
      'Hamur için ılık su, süt, maya, şeker, tuz ve unu derin bir kaba alıp ele yapışmayan yumuşak kıvamda yoğurun. 30 dakika üzerini örterek mayalandırın.',
      'Mayalanan hamurdan mandalina büyüklüğünde 12-14 adet beze çıkarın. Bezeleri unlu tezgahta pasta tabağı büyüklüğünde incecik açıp yağsız teflon tavada arkalı önlü pişirin (şebit ekmekleri).',
      'Kıymalı sos için; tavada sıvı yağ ve tereyağını ısıtın. Çok ince doğranmış soğanları ve biberleri kavurun. Kıymayı ekleyip suyunu çekene kadar pişirin. Rendelenmiş domates, salça, tuz, karabiber ve 1 çay bardağı sıcak su ekleyerek sulu bir kıvam alana kadar 7-8 dakika kaynatın.',
      'Geniş bir servis tabağına ilk pişen lavaşı serin. Üzerine sıcak kıymalı sostan 2-3 kaşık koyup her yerine eşitçe yayın. Üzerine ikinci lavaşı koyup aynı işlemi kat kat tekrarlayın.',
      'Tüm katlar bittiğinde yağlamayı dörde dilimleyin. Ortasına bol sarımsaklı yoğurt koyarak servis edin.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&auto=format&fit=crop',
    videoId: 'V1YpNm-42wA',
    videoTitle: 'Meşhur Kayseri Yağlaması Nasıl Yapılır? | Adım Adım Anlatım',
    videoAuthor: 'Nefis Yemek Tarifleri',
    videoLanguage: 'tr',
    tags: ['kayseri', 'yağlama', 'hamur işi', 'kıymalı', 'yöresel']
  },
  {
    sourceId: 'tr-gastronomy-104',
    name: 'Ege Usulü Şevketi Bostan (Kuzu Etli)',
    category: 'olive_oil',
    cuisine: 'Türk Mutfağı',
    region: 'Ege (İzmir / Aydın)',
    difficulty: 'Orta',
    time: '50 dk',
    timeMinutes: 50,
    servings: 4,
    calories: 280,
    ingredients: [
      { item: 'Şevketi bostan (ayıklanmış)', amount: '500g' },
      { item: 'Kuzu kuşbaşı eti', amount: '350g' },
      { item: 'Kuru soğan', amount: '1 adet' },
      { item: 'Sızma zeytinyağı', amount: '4 yemek kaşığı', isStaple: true },
      { item: 'Limon suyu', amount: '1 adet limon' },
      { item: 'Un', amount: '1 yemek kaşığı', isStaple: true },
      { item: 'Yumurta sarısı', amount: '1 adet' },
      { item: 'Tuz', amount: '1 tatlı kaşığı', isStaple: true }
    ],
    steps: [
      'Şevketi bostanların sert kök kısımlarını ve dikenli yapraklarını temizleyin. Bol sirkeli suda 15 dakika bekletip toprağından tamamen arındırın ve 3-4 cm uzunluğunda doğrayın. Kararmaması için limonlu suya alın.',
      'Düdüklü veya geniş tabanlı tencereye zeytinyağını alın. Yemeklik doğranmış soğanı ve kuzu etlerini ekleyip etler suyunu salıp çekene kadar 8-10 dakika kavurun.',
      'Süzülen şevketi bostanları tencereye ilave edin. 2-3 dakika etlerle birlikte soteleyin. Üzerine sebzelerin hizasına gelecek kadar sıcak su ve tuz ekleyin. Kapağını kapatıp etler ve otlar lokum gibi yumuşayana kadar yaklaşık 30 dakika pişirin.',
      'Terbiye için; bir kasede 1 adet yumurta sarısı, taze sıkılmış limon suyu ve 1 yemek kaşığı unu çırpın. Yemeğin sıcak suyundan bir kepçe ekleyerek terbiyeyi ılıtın.',
      'Hazırlanan terbiyeyi tencereye yavaş yavaş ilave edin. Tencereyi hafifçe sallayarak sosu yedirin ve kısık ateşte 3-4 dakika daha kaynatıp ocaktan alın. Ilık olarak servis yapın.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop',
    videoId: 'd0G_wW2k9yI',
    videoTitle: 'Ege Usulü Etli Şevketi Bostan Yemeği Tarifi',
    videoAuthor: 'Ege Lezzetleri',
    videoLanguage: 'tr',
    tags: ['ege', 'şevketi bostan', 'ot yemeği', 'zeytinyağlı', 'kuzu etli']
  },
  {
    sourceId: 'tr-gastronomy-105',
    name: 'Trabzon Usulü Hamsili Pilav',
    category: 'regional',
    cuisine: 'Türk Mutfağı',
    region: 'Karadeniz (Trabzon / Rize)',
    difficulty: 'Orta',
    time: '55 dk',
    timeMinutes: 55,
    servings: 4,
    calories: 390,
    ingredients: [
      { item: 'Taze hamsi (kılçığı ayıklanmış)', amount: '800g' },
      { item: 'Baldo pirinç', amount: '1.5 su bardağı' },
      { item: 'Kuru soğan', amount: '2 adet' },
      { item: 'Kuş üzümü', amount: '2 yemek kaşığı' },
      { item: 'Dolmalık fıstık', amount: '2 yemek kaşığı' },
      { item: 'Tereyağı', amount: '2 yemek kaşığı' },
      { item: 'Zeytinyağı', amount: '3 yemek kaşığı', isStaple: true },
      { item: 'Yenibahar & Tarçın', amount: '1 çay kaşığı' },
      { item: 'Kuru nane & Dereotu', amount: '1 yemek kaşığı' }
    ],
    steps: [
      'Hamsilerin kafalarını ve kılçıklarını temizleyip kelebek şeklinde açın. İyice yıkayıp süzgece alın ve hafifçe tuzlayın.',
      'İç pilav için; tencereye zeytinyağı ve tereyağını alın. İnce kıyılmış soğanları ve dolmalık fıstıkları pembeleşene kadar kavurun. Yıkanmış pirinci ekleyip 3-4 dakika şeffaflaşana kadar soteleyin.',
      'Kuş üzümü, yenibahar, tarçın, karabiber, nane, tuz ve 1.5 su bardağı sıcak suyu ekleyin. Kısık ateşte suyunu çekene kadar yarı pişmiş (diri) kıvamda pişirin. İnce kıyılmış dereotunu ekleyip demlenmeye bırakın.',
      'Fırın kabını veya yuvarlak borcamı tereyağı ile bolca yağlayın. Hamsilerin parlak deri kısımları tepsinin tabanına gelecek ve kenarlardan hafif taşacak şekilde yan yana dizerek kabın tabanını tamamen kaplayın.',
      'Hazırladığınız ılık iç pilavı hamsilerin üzerine döküp düzeltin. Dışarı sarkan hamsileri pilavın üzerine kapatın ve kalan hamsilerle de üst kısmı tamamen örtün.',
      'Üzerine hafifçe zeytinyağı gezdirin. Önceden 190°C ısıtılmış fırında hamsiler altın sarısı çıtır olana kadar yaklaşık 30-35 dakika fırınlayın. Ters çevirip dilimleyerek sıcak servis yapın.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop',
    videoId: 'e4Gk2YmQ8sM',
    videoTitle: 'Geleneksel Fırında Hamsili Pilav Tarifi | Karadeniz Usulü',
    videoAuthor: 'Karadeniz Yemekleri',
    videoLanguage: 'tr',
    tags: ['karadeniz', 'hamsi', 'balık', 'pilav', 'fırın']
  },
  {
    sourceId: 'tr-gastronomy-106',
    name: 'Konya Fırın Kebabı (Çebiç)',
    category: 'main_dish',
    cuisine: 'Türk Mutfağı',
    region: 'İç Anadolu (Konya)',
    difficulty: 'Orta',
    time: '90 dk',
    timeMinutes: 90,
    servings: 4,
    calories: 480,
    ingredients: [
      { item: 'Kuzu ön kol veya gerdan eti', amount: '800g' },
      { item: 'Kuzu kuyruk yağı', amount: '50g' },
      { item: 'Tırnak pide veya lavaş', amount: '4 adet' },
      { item: 'Kaya tuzu', amount: '1 tatlı kaşığı', isStaple: true },
      { item: 'Kuru soğan (sumaklı)', amount: '2 adet' }
    ],
    steps: [
      'Kuzu etlerini büyük porsiyonlar halinde yıkayıp süzün. Etlerin lezzeti kendi yağında piştikçe ortaya çıkacağı için ekstra baharat eklenmez.',
      'Döküm tencerenin veya fırına dayanıklı kapaklı bir güveç kabının tabanına ince dilimlenmiş kuyruk yağını dizin. Üzerine iri kuzu eti parçalarını yerleştirin.',
      'Üzerine 1 çay bardağı kadar ılık su ve kaya tuzu ekleyin. Tencerenin kapağını sıkıca kapatın (arzu edilirse hava almaması için hamurla sıvanabilir).',
      'Önceden 160°C ısıtılmış fırında etler kemiğinden ayrılıp tel tel dökülecek lokum kıvamına gelene kadar ağır ağır yaklaşık 2-2.5 saat fırınlayın.',
      'Servis tabağına tırnak pideleri dizin, üzerine etin lezzetli suyundan gezdirin. Yumuşacık pişen fırın kebabını pidelerin üzerine yerleştirin. Yanında sumaklı soğan söğüş ve ayran ile sıcak servis yapın.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop',
    videoId: 'x8NmK5_2yQw',
    videoTitle: 'Evde Lokum Gibi Konya Fırın Kebabı Yapımı',
    videoAuthor: 'Konya Mutfağı TV',
    videoLanguage: 'tr',
    tags: ['kebap', 'konya', 'kuzu eti', 'lokum', 'yöresel']
  },
  {
    sourceId: 'tr-gastronomy-107',
    name: 'Erzurum Cağ Kebabı',
    category: 'main_dish',
    cuisine: 'Türk Mutfağı',
    region: 'Doğu Anadolu (Erzurum)',
    difficulty: 'Orta',
    time: '45 dk',
    timeMinutes: 45,
    servings: 4,
    calories: 410,
    ingredients: [
      { item: 'Kuzu but eti (yaprak doğranmış)', amount: '600g' },
      { item: 'Kuru soğan suyu', amount: '1 çay bardağı' },
      { item: 'Kaya tuzu', amount: '1 tatlı kaşığı', isStaple: true },
      { item: 'Taze çekilmiş karabiber', amount: '1 çay kaşığı', isStaple: true },
      { item: 'Lavaş ekmeği', amount: '4 adet' }
    ],
    steps: [
      'Kuzu but etini ince yaprak dilimleri halinde kesin. Bir kasede soğan suyu, tuz ve bol karabiberi karıştırıp etleri bu marinasyonda buzdolabında en az 4 saat (tercihen 1 gece) dinlendirin.',
      'Marine olan etleri yatay metal şişlere (veya ızgara aparatına) sıkıca dizin.',
      'Döküm tavayı veya ızgarayı dumanı tütene kadar yüksek ateşte ısıtın. Şişe dizili etleri her iki tarafı da nar gibi kızarana kadar çevirerek yüksek ısıda pişirin.',
      'Pişen etleri cağ şişinden sıyırarak taze pişmiş sıcak lavaşın üzerine alın. Yanında közlenmiş domates ve biber ile sıcak servis edin.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=800&auto=format&fit=crop',
    videoId: 'm8k7Y_21xAw',
    videoTitle: 'Evde Gerçek Erzurum Cağ Kebabı Nasıl Yapılır?',
    videoAuthor: 'Doğu Gastronomi',
    videoLanguage: 'tr',
    tags: ['kebap', 'erzurum', 'cağ kebabı', 'kuzu', 'ızgara']
  },
  {
    sourceId: 'tr-gastronomy-108',
    name: 'Bolu Mengen Usulü Kuzu Etli Orman Kebabı',
    category: 'main_dish',
    cuisine: 'Türk Mutfağı',
    region: 'Karadeniz (Bolu / Mengen)',
    difficulty: 'Kolay',
    time: '45 dk',
    timeMinutes: 45,
    servings: 4,
    calories: 360,
    ingredients: [
      { item: 'Kuzu kuşbaşı eti', amount: '500g' },
      { item: 'Taze bezelye', amount: '1 su bardağı' },
      { item: 'Havuç', amount: '2 adet' },
      { item: 'Patates', amount: '2 adet' },
      { item: 'Arpacık soğan', amount: '10 adet' },
      { item: 'Tereyağı & Zeytinyağı', amount: '2 yemek kaşığı' },
      { item: 'Domates salçası', amount: '1 yemek kaşığı' },
      { item: 'Kekik & Tuz', amount: '1 tatlı kaşığı', isStaple: true }
    ],
    steps: [
      'Patates ve havuçları küp küp doğrayın. Arpacık soğanları soyup bütün bırakın. Bezelyeleri yıkayıp süzün.',
      'Geniş tencerede zeytinyağını ısıtın. Kuzu etlerini ekleyip suyunu çekene kadar 8-10 dakika kavurun.',
      'Arpacık soğanları ve havuçları ekleyip 3-4 dakika soteleyin. Salçayı ekleyip kokusu çıkana kadar kavurun.',
      'Doğranmış patatesleri, bezelyeleri, tuzu, kekiği ve 2 su bardağı sıcak suyu ilave edin. Kapağı kapalı olarak kısık ateşte sebzeler yumuşayana kadar yaklaşık 25 dakika pişirin. Sıcak servis yapın.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&auto=format&fit=crop',
    videoId: 'q8Fnm_X32wM',
    videoTitle: 'Geleneksel Mengen Orman Kebabı Tarifi',
    videoAuthor: 'Mengen Aşçılar Derneği',
    videoLanguage: 'tr',
    tags: ['orman kebabı', 'bolu', 'mengen', 'tencere yemeği', 'etli']
  }
];

export class TurkishGastronomyProvider {
  public getAllCandidates(): GastronomyRecipeCandidate[] {
    return [...TURKISH_GASTRONOMY_DATASET];
  }

  public getCandidateById(sourceId: string): GastronomyRecipeCandidate | undefined {
    return TURKISH_GASTRONOMY_DATASET.find(c => c.sourceId === sourceId);
  }

  public getCandidatesByCategory(category: string): GastronomyRecipeCandidate[] {
    return TURKISH_GASTRONOMY_DATASET.filter(c => c.category === category);
  }
}
