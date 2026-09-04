export interface SubstituteInfo {
  original: string;
  substitutes: string[];
  tips: string;
}

export const SUBSTITUTES_DATABASE: Record<string, SubstituteInfo> = {
  'süt': {
    original: 'Süt',
    substitutes: ['Badem sütü', 'Yulaf sütü', 'Soya sütü', 'Hindistan cevizi sütü'],
    tips: 'Hamur işlerinde ve tatlılarda yulaf sütü en yakın lezzeti verir; kahvelerde badem sütü tercih edilir.'
  },
  'tereyağı': {
    original: 'Tereyağı',
    substitutes: ['Zeytinyağı', 'Hindistan cevizi yağı', 'Sade yağ (Ghee)', 'Margarin'],
    tips: 'Tuzlu yemeklerde zeytinyağı (3/4 oranında), tatlı ve keklerde hindistan cevizi yağı harika alternatiftir.'
  },
  'yumurta': {
    original: 'Yumurta',
    substitutes: ['Muz püresi (1/4 muz = 1 yumurta)', 'Elma püresi', 'Keten tohumu + ılık su', 'Yoğurt (1/4 su bardağı)'],
    tips: 'Kek ve kurabiyelerde bağlayıcı olarak olgun muz püresi veya chia/keten tohumu jeli mükemmel sonuç verir.'
  },
  'un': {
    original: 'Un (Buğday)',
    substitutes: ['Yulaf unu', 'Badem unu', 'Pirinç unu', 'Mısır unu', 'Karabuğday unu'],
    tips: 'Glütensiz alternatif arıyorsanız, badem unu ve mısır nişastası karışımı dokuyu korur.'
  },
  'şeker': {
    original: 'Şeker',
    substitutes: ['Bal', 'Akçaağaç şurubu', 'Hurma püresi', 'Pekmez', 'Stevia'],
    tips: 'Bal veya pekmez kullanırken tarifteki diğer sıvı miktarını yaklaşık 2-3 yemek kaşığı azaltın.'
  },
  'krema': {
    original: 'Krema',
    substitutes: ['Hindistan cevizi kreması', 'Süt + Tereyağı karışımı', 'Kaju kreması', 'Süzme yoğurt'],
    tips: 'Çorba ve makarnalarda hafiflik için sütle seyreltilmiş süzme yoğurt kullanılabilir.'
  },
  'tavuk': {
    original: 'Tavuk',
    substitutes: ['Mantar (İstiridye / Portobello)', 'Tofu', 'Nohut', 'Haşlanmış soya fasulyesi'],
    tips: 'İstiridye mantarı sote yapıldığında tavuk etine çok yakın bir lifli doku ve lezzet sağlar.'
  },
  'kıyma': {
    original: 'Kıyma',
    substitutes: ['Yeşil mercimek', 'İnce çekilmiş ceviz + mantar', 'Soya kıyması'],
    tips: 'Karnıyarık ve soslarda haşlanmış yeşil mercimek veya kavrulmuş mantar doyurucu bir alternatiftir.'
  },
};

export const ALLERGEN_DATABASE: Record<string, string[]> = {
  'Laktoz / Süt': ['süt', 'krema', 'tereyağı', 'peynir', 'yoğurt', 'kaymak', 'ayran', 'kaşar'],
  'Gluten': ['un', 'buğday', 'arpa', 'çavdar', 'makarna', 'ekmek', 'yufka', 'şehriye', 'bulgur'],
  'Yumurta': ['yumurta', 'mayonez'],
  'Kuruyemiş': ['fındık', 'fıstık', 'ceviz', 'badem', 'antep fıstığı', 'kaju', 'susam'],
  'Deniz Ürünü': ['balık', 'hamsi', 'somon', 'karides', 'midye', 'kalamar'],
  'Soya': ['soya', 'soya sosu', 'tofu'],
};
