/**
 * Pedagogical Instruction Expander for Global & Domestic Recipes.
 * Ensures every recipe step is rich, descriptive, beginner-friendly, and actionable.
 */

const INGREDIENT_TRANSLATION_MAP: Record<string, string> = {
  'garlic': 'Sarımsak',
  'onion': 'Kuru Soğan',
  'onions': 'Kuru Soğan',
  'olive oil': 'Zeytinyağı',
  'butter': 'Tereyağı',
  'salt': 'Tuz',
  'black pepper': 'Karabiber',
  'pepper': 'Biber',
  'water': 'Su',
  'flour': 'Un',
  'sugar': 'Şeker',
  'milk': 'Süt',
  'egg': 'Yumurta',
  'eggs': 'Yumurta',
  'chicken': 'Tavuk',
  'chicken breast': 'Tavuk Göğsü',
  'chicken breasts': 'Tavuk Göğsü',
  'beef': 'Dana Eti',
  'ground beef': 'Dana Kıyma',
  'rice': 'Pirinç',
  'tomato': 'Domates',
  'tomatoes': 'Domates',
  'tomato paste': 'Domates Salçası',
  'soy sauce': 'Soya Sosu',
  'cheese': 'Peynir',
  'parmesan': 'Parmesan Peyniri',
  'mozzarella': 'Mozzarella Peyniri',
  'potato': 'Patates',
  'potatoes': 'Patates',
  'lemon': 'Limon',
  'lemon juice': 'Taze Limon Suyu',
  'parsley': 'Taze Maydanoz',
  'oregano': 'Kekik',
  'cumin': 'Kimyon',
  'paprika': 'Kırmızı Toz Biber'
};

const MEASUREMENT_MAP: [RegExp, string][] = [
  [/(\d+)\s*cups?/gi, '$1 su bardağı'],
  [/(\d+)\s*tbsp/gi, '$1 yemek kaşığı'],
  [/(\d+)\s*tablespoons?/gi, '$1 yemek kaşığı'],
  [/(\d+)\s*tsp/gi, '$1 tatlı kaşığı'],
  [/(\d+)\s*teaspoons?/gi, '$1 çay kaşığı'],
  [/(\d+)\s*lbs?/gi, '$1 x 450g'],
  [/(\d+)\s*oz/gi, '$1 x 30g'],
  [/(\d+)\s*cloves?/gi, '$1 diş'],
  [/pinch/gi, '1 çimdik'],
  [/to taste/gi, 'damak zevkine göre']
];

export function translateIngredientName(name: string): string {
  const norm = name.toLowerCase().trim();
  return INGREDIENT_TRANSLATION_MAP[norm] || name;
}

export function normalizeMeasurement(amount: string): string {
  let res = amount;
  for (const [regex, replacement] of MEASUREMENT_MAP) {
    res = res.replace(regex, replacement);
  }
  return res.trim();
}

/**
 * Expands raw or brief recipe steps into comprehensive, beginner-friendly steps.
 */
export function expandPedagogicalInstructions(
  recipeName: string,
  category: string,
  rawSteps: string[],
  ingredientsSummary: string[] = []
): string[] {
  // If rawSteps are already comprehensive and long in Turkish, retain them
  const avgWords = rawSteps.reduce((acc, s) => acc + s.trim().split(/\s+/).length, 0) / (rawSteps.length || 1);
  const isAlreadyDetailedTurkish = avgWords >= 15 && /[çğışöüÇĞİŞÖÜ]/.test(rawSteps.join(' '));

  if (isAlreadyDetailedTurkish && rawSteps.length >= 3) {
    return rawSteps;
  }

  const mainIngs = ingredientsSummary.slice(0, 3).map(translateIngredientName).join(', ') || 'ana malzemeler';

  if (category.toLowerCase().includes('soup') || category.toLowerCase().includes('çorba')) {
    return [
      `${recipeName} için gerekli malzemeleri (${mainIngs}) temizleyip süzün. Sebzeleri ince yemeklik doğrayın.`,
      `Derin bir çorba tenceresine tereyağı veya zeytinyağını alıp orta ateşte eritin. Soğan ve sarımsağı ekleyip pembeleşene kadar 3-4 dakika kavurun.`,
      `Tencereye ana malzemeleri, baharatları ve 5-6 su bardağı sıcak suyu (veya et/tavuk suyunu) ilave edin. Tahta kaşıkla karıştırıp kaynamaya bırakın.`,
      `Kaynamaya başlayınca ocağın altını kısın. Tencerenin kapağını aralık bırakarak tüm malzemeler yumuşayana kadar yaklaşık 20-25 dakika pişirin.`,
      `Pişen çorbayı pürüzsüz bir kıvam için el blenderından geçirin veya terbiyesiyle buluşturun. Sıcakken tereyağlı sos ve taze limon ile servis yapın.`
    ];
  }

  if (category.toLowerCase().includes('dessert') || category.toLowerCase().includes('tatlı')) {
    return [
      `${recipeName} yapımına başlamadan önce tüm malzemeleri oda sıcaklığına getirin. Fırın kullanılacaksa fırını önceden 175-180°C ısıtın.`,
      `Geniş bir karıştırma kabında ana malzemeleri sırasıyla ekleyin ve pürüzsüz homojen bir kıvam alana kadar çırpma teliyle çırpın.`,
      `Karışımı yağlanmış fırın kabına veya tencereye aktarın. Belirtilen ısıda üzeri altın sarısı olana kadar fırınlayın ya da sürekli karıştırarak pişirin.`,
      `Pişen tatlıyı fırından veya ocaktan alın. Şerbetli ise şerbetini verin, sütlü ise oda sıcaklığına geldikten sonra buzdolabında dinlendirin.`,
      `Üzerini fıstık, ceviz veya taze meyve parçalarıyla süsleyerek soğuk ya da ılık olarak servis yapın.`
    ];
  }

  if (category.toLowerCase().includes('pastry') || category.toLowerCase().includes('börek') || category.toLowerCase().includes('hamur')) {
    return [
      `Hamur için un, sıvı malzemeler, maya ve tuzu yoğurma kabında toparlayın. Ele yapışmayan elastik bir kıvama gelene kadar 8-10 dakika yoğurup dinlendirin.`,
      `İç harcı için belirtilen malzemeleri (${mainIngs}) hazırlayıp baharatlarını damak zevkinize göre ayarlayın.`,
      `Dinlenen hamuru bezelere ayırıp unlanmış tezgahta merdane yardımıyla istenilen incelikte açın. İç harcı eşit paylaştırıp kapatın.`,
      `Tepsiye dizilen hamur işlerinin üzerine yumurta sarısı sürüp çörek otu serpin. 190°C fırında üzeri kızarana kadar 25-30 dakika pişirin.`,
      `Fırından çıkan sıcak lezzeti 5 dakika dinlendirip çıtır çıtır servis yapın.`
    ];
  }

  // General main dish / chicken / meat / pasta
  return [
    `${recipeName} için ana malzemeleri (${mainIngs}) temizleyip eşit lokmalık parçalar halinde hazırlayın. Sebzeleri yıkayıp doğrayın.`,
    `Geniş tabanlı bir tavayı ya da tencereyi orta-yüksek ateşte 1-2 dakika ısıtın. Sıvı yağı ekleyip ana malzemeleri suyunu salıp çekene kadar 7-8 dakika soteleyin.`,
    `Doğranmış soğan, sarımsak ve diğer sebzeleri ilave ederek kokusu çıkıp yumuşayana kadar 4-5 dakika daha sotelemeye devam edin.`,
    `Sosunu, salçasını veya baharatlarını ekleyip 2 dakika harmanlayın. Gerekirse yarım çay bardağı sıcak su ekleyip tencerenin kapağını kapatın.`,
    `Kısık ateşte lezzetler birbirine geçene kadar 15-20 dakika ağır ağır pişmeye bırakın. Ocaktan alıp 5 dakika dinlendirdikten sonra taze maydanoz serperek sıcak servis yapın.`
  ];
}
