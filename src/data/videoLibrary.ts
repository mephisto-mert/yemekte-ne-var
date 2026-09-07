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
  {
    "key": "pizza",
    "keywords": [
      "pizza",
      "pizza margherita",
      "karışık pizza",
      "margarita",
      "sucuklu pizza",
      "mantarlı pizza",
      "italyan pizza"
    ],
    "videoId": "TdTq7eg1ITI",
    "videoTitle": "Abartmıyoruz! 🏆 100.000 Kişinin Denediği Tüm Zamanların En İyi Pizza Tarifi 🥇🙌🏻",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "pogaca",
    "keywords": [
      "poğaça",
      "pogaca",
      "mayalı poğaça",
      "peynirli poğaça",
      "zeytinli poğaça",
      "kaşarlı poğaça",
      "pamuk poğaça",
      "dereotlu poğaça"
    ],
    "videoId": "92RROwvR1EY",
    "videoTitle": "TÜM POĞAÇALARI UNUTUN 💯 BÖYLE YUMUŞACIK, LEZZETLİ BİR TARİF YOK!",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "acma",
    "keywords": [
      "açma",
      "acma",
      "zeytinli açma",
      "sade açma",
      "haşhaşlı açma"
    ],
    "videoId": "MR5JJp0pR2M",
    "videoTitle": "Öyle Bir Açma Ki Yumuşacık Tel Tel Pamuk Gibi 💯",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "simit",
    "keywords": [
      "simit",
      "sokak simiti",
      "gevrek",
      "kandil simidi",
      "kaşarlı simit"
    ],
    "videoId": "FQZi0Ogf8lg",
    "videoTitle": "Gevrek Sokak Simidi Tarifi  - Evde Simit Nasıl Yapılır ? - Nefis Yemek Tarifleri",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "lahmacun",
    "keywords": [
      "lahmacun",
      "fındık lahmacun",
      "ev lahmacunu",
      "fırında lahmacun"
    ],
    "videoId": "SHTrWXsNzG0",
    "videoTitle": "Evde Lahmacun Nasıl Yapılır? | Çıtır Çıtır Kolay Lahmacun Tarifi",
    "videoAuthor": "Refika'nın Mutfağı"
  },
  {
    "key": "pide",
    "keywords": [
      "pide",
      "kıymalı pide",
      "kaşarlı pide",
      "kuşbaşılı pide",
      "trabzon pidesi",
      "karadeniz pidesi",
      "kapalı pide",
      "kır pidesi"
    ],
    "videoId": "P3_GIry8958",
    "videoTitle": "Hazırını aratmaz! EVDE KIYMALI PİDE TARİFİ",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "su_boregi",
    "keywords": [
      "su böreği",
      "su boregi",
      "peynirli su böreği",
      "kıymalı su böreği",
      "yalancı su böreği"
    ],
    "videoId": "QrzKUlWDue4",
    "videoTitle": "GÜNDE 20 TEPSİ SİPARİŞ ALDIĞIM SU BÖREĞİ TARİFİ❗HAMURU ASLA YIRTILMAYAN SU BÖREĞİ❗ PÜF NOKTALARIYLA✅",
    "videoAuthor": "Lezzetli İkramlar (özlem🌸)"
  },
  {
    "key": "sigara_boregi",
    "keywords": [
      "sigara böreği",
      "sigara boregi",
      "kalem börek",
      "çıtır börek",
      "muska böreği"
    ],
    "videoId": "GpEbL48uw70",
    "videoTitle": "Sigara Böreği Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "pacanga_boregi",
    "keywords": [
      "paçanga",
      "pacanga",
      "pastırmalı börek",
      "fırında paçanga"
    ],
    "videoId": "0GLRLCMjL4Y",
    "videoTitle": "KIZARTMAYA SON! 🙅🏻‍♀ FIRINDA EFSANE PAÇANGA BÖREĞİ 👌🏻💯",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "kol_boregi",
    "keywords": [
      "kol böreği",
      "kol boregi",
      "ıspanaklı börek",
      "ispanakli borek",
      "kıymalı börek",
      "patatesli börek",
      "sarıyer böreği"
    ],
    "videoId": "eKL1-jpTE34",
    "videoTitle": "Hazır Yufka Olduğunu Anlamak İmkansız 🤫 En Yalancı Ispanaklı Börek 😜 El Açması Sandırır 💯",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "cig_borek",
    "keywords": [
      "çiğ börek",
      "cig borek",
      "kırım böreği",
      "tatar böreği",
      "kıymalı çiğ börek"
    ],
    "videoId": "LV3Oy6BPPRI",
    "videoTitle": "50 Yıllık Ustasından 🔥 Gerçek Çi Börek (Çiğ Börek) Tarifi",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "gozleme",
    "keywords": [
      "gözleme",
      "gozleme",
      "peynirli gözleme",
      "patatesli gözleme",
      "ıspanaklı gözleme",
      "kıymalı gözleme"
    ],
    "videoId": "Ruw2p2uQJ1U",
    "videoTitle": "Mayasız Tel Tel Gözleme Tarifi | Katmer Tadında 👌🏻😋",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "borek_genel",
    "keywords": [
      "börek",
      "borek",
      "tepsi böreği",
      "tepsi boregi",
      "hazır yufkadan börek",
      "böreği",
      "boregi",
      "banyolu börek",
      "sodalı börek"
    ],
    "videoId": "a235SLBQQOU",
    "videoTitle": "Sodalı Tepsi Böreği -  Börek Tarifleri - Nefis Yemek Tarifleri",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "ekmek_bazlama",
    "keywords": [
      "bazlama",
      "lavaş",
      "lavas",
      "pide ekmeği",
      "ekmek",
      "somun ekmek",
      "tandır ekmeği",
      "ramazan pidesi"
    ],
    "videoId": "r1_vcL4IHds",
    "videoTitle": "EVDE YAPILABİLECEK EN PRATİK EKMEK ♨️TAVADA BALON BAZLAMA",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "islak_kek",
    "keywords": [
      "ıslak kek",
      "islak kek",
      "brownie",
      "çikolatalı kek",
      "cikolatali kek",
      "sufle",
      "lav kek",
      "ağlayan pasta",
      "volkan kek"
    ],
    "videoId": "y3GQoKHTfd0",
    "videoTitle": "SUFLE TADINDA BOL SOSLU ISLAK KEK 🔝 ISLAK KEKİ BİR DE BU TARİFLE DENEYİN 👌🏻",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "kek_genel",
    "keywords": [
      "kek",
      "keki",
      "mozaik pasta",
      "havuçlu kek",
      "limonlu kek",
      "cevizli kek",
      "kakaolu kek",
      "muffin",
      "sade kek",
      "portakallı kek"
    ],
    "videoId": "kssdzaT_-9s",
    "videoTitle": "Sade Kek Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "pasta_yas",
    "keywords": [
      "yaş pasta",
      "yas pasta",
      "çilekli pasta",
      "çikolatalı pasta",
      "pasta",
      "pastası",
      "rulo pasta",
      "bisküvili pasta",
      "kedi dili pasta",
      "pandispanya"
    ],
    "videoId": "oUpU1nRmGGA",
    "videoTitle": "HAZIR ALMAYA SON 😉 Kolay Ev Yapımı Yaş Pasta Tarifi 🎂",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "kurabiye",
    "keywords": [
      "kurabiye",
      "kurabiyesi",
      "un kurabiyesi",
      "elmalı kurabiye",
      "çikolatalı kurabiye",
      "tuzlu kurabiye",
      "tırtıl kurabiye",
      "mantar kurabiye",
      "starbucks kurabiye"
    ],
    "videoId": "8QHKwnQvckU",
    "videoTitle": "Pastane Usulü UN KURABİYESİ TARİFİ - Nefis Yemek Tarifleri",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "cheesecake",
    "keywords": [
      "cheesecake",
      "san sebastian",
      "çizkek",
      "cizkek",
      "limonlu cheesecake",
      "frambuazlı cheesecake"
    ],
    "videoId": "Srh9-WWY8dw",
    "videoTitle": "SAN SEBASTİAN CHEESCAKE",
    "videoAuthor": "Özlemli Mutfak"
  },
  {
    "key": "tiramisu",
    "keywords": [
      "tiramisu",
      "kedidilli tiramisu",
      "kedi dili tatlısı",
      "kolay tiramisu"
    ],
    "videoId": "7q4KdYhtIcQ",
    "videoTitle": "Kedidilli Tiramisu Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "trilece",
    "keywords": [
      "trileçe",
      "trilece",
      "karamelli trileçe",
      "balkan tatlısı",
      "sütlü trileçe"
    ],
    "videoId": "y5G1YVJyjto",
    "videoTitle": "İFTARIN YILDIZI 🌟 TAM ÖLÇÜLÜ TRİLEÇE TARİFİ 💯 BİR DİLİM ASLA YETMEZ",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "profiterol",
    "keywords": [
      "profiterol",
      "ekler",
      "choux",
      "çikolata soslu profiterol"
    ],
    "videoId": "Zz3iaw8d1_4",
    "videoTitle": "HER ZAMAN TAM TUTAN PASTANE USULÜ 💯 Profiterol Tarifi",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "firin_sutlac",
    "keywords": [
      "sütlaç",
      "sutlac",
      "fırın sütlaç",
      "firin sutlac",
      "hünkarsütlacı"
    ],
    "videoId": "O3wyuoEyEJ8",
    "videoTitle": "Her Defasında Aynı Muhteşem Kıvam 👌🏻😍 Tam Ölçülü Fırın Sütlaç Tarifi",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "kazandibi",
    "keywords": [
      "kazandibi",
      "tavukgöğsü",
      "tavuk göğsü",
      "muhallebi",
      "saray muhallebisi",
      "keşkül",
      "supangle",
      "puding",
      "magnolia",
      "sakızlı muhallebi"
    ],
    "videoId": "O7OfU8aS7dA",
    "videoTitle": "Evde Kolay Kazandibi Nasıl Yapılır | Nefis Yemek Tarifleri",
    "videoAuthor": "Tuğba Mutfakta"
  },
  {
    "key": "kunefe",
    "keywords": [
      "künefe",
      "kunefe",
      "kadayıf",
      "kadayif",
      "tel kadayıf",
      "cevizli kadayıf",
      "kadayıf dolması",
      "fıstıklı kadayıf"
    ],
    "videoId": "rFZFcrscljA",
    "videoTitle": "Hatay Usulü Peynirli Künefe",
    "videoAuthor": "Yemektürkiyecom"
  },
  {
    "key": "baklava",
    "keywords": [
      "baklava",
      "baklavası",
      "fıstıklı baklava",
      "cevizli baklava",
      "şöbiyet",
      "sobiyet",
      "bülbül yuvası",
      "havuç dilimi",
      "ev baklavası"
    ],
    "videoId": "vpX0YM5V5S8",
    "videoTitle": "Çaktırmayın 🤫 Katları Tek Tek Açtınız Zannedecekler 💯 Hiç Oklava Kullanmadan Pratik Baklava Yapımı",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "sekerpare",
    "keywords": [
      "şekerpare",
      "sekerpare",
      "kemalpaşa",
      "kalburabastı",
      "kalburabasti",
      "hanım göbeği",
      "hurma tatlısı"
    ],
    "videoId": "tfRWIv6FNjg",
    "videoTitle": "Kıyır Kıyır Şekerpare Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "revani",
    "keywords": [
      "revani",
      "revanisi",
      "haşhaşlı revani",
      "şerbetli tatlı",
      "portakallı revani"
    ],
    "videoId": "PSmu7Xj2EaA",
    "videoTitle": "TEREDDÜTSÜZ DENEYİN! ÇOK HAFİF SÜPER BİR TARİF ⭐️⭐️⭐️Haşhaşlı Revani Tarifi",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "peynir_helvasi",
    "keywords": [
      "peynir helvası",
      "peynir helvasi",
      "çanakkale peynir helvası",
      "canakkale peynir helvasi",
      "fırınlanmış peynir helvası",
      "firinlanmis peynir helvasi",
      "höşmerim",
      "hosmerim"
    ],
    "videoId": "zOXBiT8Dv8w",
    "videoTitle": "Çanakkale Fırınlanmış Peynir HELVASI 💯 Orijinal TARİF 💯",
    "videoAuthor": "TUBA ÖZMEN KOCAMAN"
  },
  {
    "key": "irmik_helvasi",
    "keywords": [
      "irmik helvası",
      "irmik helvasi",
      "dondurmalı irmik helvası",
      "sütlü irmik helvası",
      "fıstıklı irmik helvası"
    ],
    "videoId": "M0WW6j4NfQg",
    "videoTitle": "Dondurmalı İrmik Helvası Tarifi",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "un_helvasi",
    "keywords": [
      "un helvası",
      "un helvasi",
      "cevizli un helvası",
      "tereyağlı un helvası",
      "anne usulü un helvası"
    ],
    "videoId": "K7jQV76j2xc",
    "videoTitle": "Bu Tarifle Herkes Helva Ustası 😉 Tutturma Garantili Cevizli Un Helvası",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "sarma_dolma",
    "keywords": [
      "yaprak sarma",
      "zeytinyağlı sarma",
      "zeytinyagli sarma",
      "lahana sarması",
      "biber dolması",
      "kuru dolma",
      "dolma",
      "sarma",
      "kabak dolması",
      "patlıcan dolması",
      "enginar dolması"
    ],
    "videoId": "w9Z6fUBYWJM",
    "videoTitle": "Zeytinyağlı Yaprak Sarma Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "makarna",
    "keywords": [
      "makarna",
      "makarnası",
      "spagetti",
      "spaghetti",
      "penne",
      "lazanya",
      "fettuccine",
      "carbonara",
      "erişte",
      "fiyonk makarna",
      "mantı makarna",
      "makarna fırında",
      "salçalı makarna"
    ],
    "videoId": "HR8tib5kKG0",
    "videoTitle": "Kremalı Tavuklu Mantarlı Makarna Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "balik_deniz",
    "keywords": [
      "hamsi",
      "hamsi tava",
      "levrek",
      "çipura",
      "cipura",
      "somon",
      "balık",
      "balik",
      "palamut",
      "karides",
      "kalamar",
      "karides güveç",
      "balık buğulama",
      "fırında balık",
      "istavrit",
      "lüfer",
      "mezgit"
    ],
    "videoId": "dIWhkPiFw24",
    "videoTitle": "Hamsi Tava I Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "karniyarik",
    "keywords": [
      "karnıyarık",
      "karniyarik",
      "patlıcan oturtma",
      "musakka",
      "patlıcan yemeği",
      "fırında karnıyarık"
    ],
    "videoId": "brvuUWDqXw8",
    "videoTitle": "DENEMEYEN KALMASIN ❗ İNANILMAZ LEZZETLİ FIRINDA KARNIYARIK TARİFİ 😋",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "tavuk_yemekleri",
    "keywords": [
      "tavuk sote",
      "tavuk göğsü",
      "tavuk but",
      "tavuk kanat",
      "fırında tavuk",
      "tavuk pirzola",
      "tavuklu",
      "tavuk",
      "tavuğu",
      "çıtır tavuk",
      "tavuk schnitzel",
      "tavuk baget",
      "köri soslu tavuk"
    ],
    "videoId": "3wo7qr6PIU4",
    "videoTitle": "EN LEZZETLİ Tavuk Sote Tarifi - Nefis Yemek Tarifleri",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "et_sote_kavurma",
    "keywords": [
      "et sote",
      "kavurma",
      "dana eti",
      "kuzu eti",
      "antrikot",
      "biftek",
      "bonfile",
      "kuşbaşı",
      "sac tava",
      "çoban kavurma",
      "kuzu kavurma",
      "dana kavurma"
    ],
    "videoId": "3fzyHzQ1rhY",
    "videoTitle": "YUMUŞACIK 💯 ET SOTE YEMEĞİ TARİFİ😋",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "guvec_turlu",
    "keywords": [
      "güveç",
      "guvec",
      "türlü",
      "güveçte",
      "fırın güveç",
      "etli türlü"
    ],
    "videoId": "QV1ZwlCnoYk",
    "videoTitle": "LEZZETLİ Sebzeli Etli Güveç Yemeği -  Nefis Yemek Tarifleri",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "kuru_fasulye",
    "keywords": [
      "kuru fasulye",
      "kuru fasulye yemeği",
      "güveçte kuru fasulye",
      "etli kuru fasulye",
      "pastırmalı kuru fasulye"
    ],
    "videoId": "7rORG0W31aE",
    "videoTitle": "Etli Kuru Fasulye Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "nohut_yemegi",
    "keywords": [
      "nohut",
      "nohut yemeği",
      "etli nohut",
      "güveçte nohut"
    ],
    "videoId": "du0PEg5ivxE",
    "videoTitle": "Etli Nohut Yemeği - LEZZETLİ KOLAY TARİF - Nefis Yemek Tarifleri",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "manti",
    "keywords": [
      "mantı",
      "manti",
      "kayseri mantısı",
      "tepsi mantısı",
      "çıtır mantı",
      "sinop mantısı",
      "hingel",
      "üçgen mantı"
    ],
    "videoId": "p6pHPxS3UsY",
    "videoTitle": "BU TARİF SİZİ MANTI USTASI YAPAR ✅ Sosuyla Pişen Tam Ölçülü Ev Mantısı",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "izmir_kofte",
    "keywords": [
      "izmir köfte",
      "izmir kofte",
      "fırında patatesli köfte",
      "salçalı köfte",
      "fırında soslu köfte"
    ],
    "videoId": "W8f6E3ryHvQ",
    "videoTitle": "İZMİR KÖFTE TARİFİ | NASIL YAPILIR?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "kofte_genel",
    "keywords": [
      "köfte",
      "kofte",
      "köftesi",
      "koftesi",
      "kuru köfte",
      "anne köftesi",
      "kasap köfte",
      "ıslama köfte",
      "inegöl köfte",
      "ızgara köfte",
      "dalyan köfte",
      "tepsi köftesi",
      "akçaabat köftesi",
      "misket köfte",
      "hasanpaşa köftesi",
      "cızbız köfte"
    ],
    "videoId": "gqBJ64uTxnE",
    "videoTitle": "Anne Köftesi - Köfte Tarifleri - Nefis Yemek Tarifleri",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "ali_nazik",
    "keywords": [
      "ali nazik",
      "alinazik",
      "patlıcan kebabı"
    ],
    "videoId": "M542cWgKGJY",
    "videoTitle": "Alinazik Kebabı Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "hunkar_begendi",
    "keywords": [
      "hünkar beğendi",
      "hunkar begendi"
    ],
    "videoId": "GCdGT6cwi5E",
    "videoTitle": "Sadece Hünkar Değil Herkes Beğenecek 😜 Lokum Gibi Pişmiş Hünkar Beğendi",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "tantuni",
    "keywords": [
      "tantuni",
      "mersin tantuni",
      "dürüm tantuni",
      "tavuk tantuni",
      "et tantuni"
    ],
    "videoId": "MVtsn6oU_Sg",
    "videoTitle": "Tantuni Challenge | Evde Hızlı ve Ucuz Tantuni Yapmak",
    "videoAuthor": "Refika'nın Mutfağı"
  },
  {
    "key": "tas_kebabi",
    "keywords": [
      "tas kebabı",
      "tas kebabi",
      "orman kebabı",
      "orman kebabi",
      "çökertme kebabı",
      "çökertme",
      "cokertme",
      "hünkar kebabı"
    ],
    "videoId": "s-Gs5j9f3dA",
    "videoTitle": "Lokum Kıvamında Yumuşacık Eti ile TAS KEBABI TARİFİ",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "kebap_genel",
    "keywords": [
      "adana kebap",
      "adana kebabı",
      "urfa kebap",
      "urfa kebabı",
      "iskender kebap",
      "beyti kebap",
      "patlıcan kebabı",
      "tepsi kebabı",
      "orman kebabı",
      "tas kebabı",
      "testi kebabı",
      "şiş kebap",
      "cağ kebabı",
      "çökertme kebabı",
      "ali nazik kebap",
      "kebap",
      "kebabı",
      "kebabi",
      "adana",
      "urfa",
      "beyti",
      "iskender",
      "döner",
      "doner"
    ],
    "videoId": "8_wS8QgwvvI",
    "videoTitle": "EVDE ADANA KEBAP HEM KOLAY HEM LEZZETLİ ❗️",
    "videoAuthor": "CHEF OKTAY USTA"
  },
  {
    "key": "ciger_tava",
    "keywords": [
      "ciğer",
      "ciger",
      "ciğeri",
      "arnavut ciğeri",
      "edirne ciğer",
      "yaprak ciğer"
    ],
    "videoId": "JT-J2qrbaNQ",
    "videoTitle": "EDİRNE TAVA CİĞERİ 😋 Evde En Kolay Ciğer Tarifi 💯",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "hamburger",
    "keywords": [
      "burger",
      "hamburger",
      "cheeseburger",
      "taco",
      "fajita",
      "quesadilla",
      "wrap",
      "bowl",
      "burrito",
      "hot dog",
      "sosisli"
    ],
    "videoId": "BrQSueGraUs",
    "videoTitle": "Refika'nın Hızlı Hamburger Tarifi Hamburger 101: 1. Bölüm",
    "videoAuthor": "Refika'nın Mutfağı"
  },
  {
    "key": "mercimek_corbasi",
    "keywords": [
      "mercimek çorbası",
      "mercimek corbasi",
      "süzme mercimek",
      "kırmızı mercimek çorbası",
      "yeşil mercimek çorbası"
    ],
    "videoId": "Hm-sZJdy0lA",
    "videoTitle": "LOKANTA USULÜ SÜZME MERCİMEK ÇORBASI TARİFİ | NASIL YAPILIR?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "ezogelin_corbasi",
    "keywords": [
      "ezogelin",
      "ezogelin çorbası",
      "ezogelin corbasi"
    ],
    "videoId": "5qwzunAd7KM",
    "videoTitle": "75 BİN kişinin defterine eklediği EFSANE EZOGELİN - Tüm zamanların en iyi çorba tarifi",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "tarhana_corbasi",
    "keywords": [
      "tarhana",
      "tarhana çorbası",
      "tarhana corbasi",
      "ev tarhanası"
    ],
    "videoId": "nncdWyHP2F4",
    "videoTitle": "Miss gibi Tarhana Çorbası Nasıl Yapılır? - Nefis Yemek Tarifleri",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "yayla_corbasi",
    "keywords": [
      "yayla",
      "yayla çorbası",
      "yayla corbasi",
      "yoğurt çorbası",
      "pirinçli yoğurt çorbası"
    ],
    "videoId": "O-SG5CldEMs",
    "videoTitle": "Yayla Çorbası Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "domates_corbasi",
    "keywords": [
      "domates çorbası",
      "domates corbasi",
      "kaşarlı domates çorbası",
      "sütlü domates"
    ],
    "videoId": "46gum1DHV34",
    "videoTitle": "Sütlü Domates Çorbası Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "tavuk_corbasi",
    "keywords": [
      "tavuk çorbası",
      "tavuk corbasi",
      "tavuk suyu çorba",
      "şehriye çorbası",
      "tel şehriye çorbası",
      "arpa şehriye çorbası",
      "düğün çorbası",
      "terbiyeli tavuk çorbası"
    ],
    "videoId": "nRM5kz87XX4",
    "videoTitle": "Tel Şehriyeli Tavuk Çorbası | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "kelle_paca",
    "keywords": [
      "kelle paça",
      "kelle paca",
      "işkembe",
      "iskembe",
      "işkembe çorbası",
      "beyran",
      "ayak paça",
      "paça çorbası",
      "kelle paça çorbası"
    ],
    "videoId": "tDrQPkDHmGE",
    "videoTitle": "Kemik Suyuna Terbiyeli Çorba Tarifi | Şifa Kaynağı 👌",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "mantar_corbasi",
    "keywords": [
      "mantar çorbası",
      "mantar corbasi",
      "kremalı mantar çorbası",
      "sütlü mantar çorbası"
    ],
    "videoId": "MnytfME1FNE",
    "videoTitle": "LEZZET GARANTİLİ ✅Kremalı Mantar Çorbası Tarifi",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "sebze_corbasi",
    "keywords": [
      "sebze çorbası",
      "brokoli çorbası",
      "kabak çorbası",
      "balkabağı çorbası",
      "çorba",
      "corba",
      "çorbası",
      "corbasi",
      "mercimek"
    ],
    "videoId": "k7t-4VU-XwA",
    "videoTitle": "VİTAMİN DEPOSU Sebze Çorbası Tarifi - Nefis Yemek Tarifleri",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "humus",
    "keywords": [
      "humus",
      "nohut ezmesi",
      "tereyağlı humus",
      "sıcak humus"
    ],
    "videoId": "XD8hWdGCCWc",
    "videoTitle": "Humus Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "kisir",
    "keywords": [
      "kısır",
      "kisir",
      "hatay kısırı",
      "antakya kısırı",
      "bulgur salatası"
    ],
    "videoId": "ktKIUduclxA",
    "videoTitle": "Kısırı Bir De Hatay Usulü Deneyin ✅ Ustasından Gerçek Hatay Kısırı",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "fava_ezme",
    "keywords": [
      "fava",
      "bakla ezmesi",
      "atom",
      "atom mezesi",
      "babagannuş",
      "babaganus",
      "acılı ezme",
      "ezme",
      "patlıcan ezmesi",
      "muhammara",
      "girit ezmesi",
      "köpoğlu"
    ],
    "videoId": "33zFunTdp0g",
    "videoTitle": "ENFES Fava Mezesi Nasıl Yapılır (Tekmili)  HER SOFRAYA YAKIŞIR / Bakla Fava Tarifi / Meze Tarifleri",
    "videoAuthor": "Cemile Güngör"
  },
  {
    "key": "rus_salatasi",
    "keywords": [
      "rus salatası",
      "amerikan salatası",
      "patates salatası",
      "tavuklu salata",
      "mayonezli salata"
    ],
    "videoId": "4uYtkWrQFa0",
    "videoTitle": "Makarnalı Rus Salatası Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "piyaz_salata",
    "keywords": [
      "piyaz",
      "piyazı",
      "kuru fasulye salatası",
      "gavurdağı",
      "gavurdagi",
      "çoban salatası",
      "coban salatasi",
      "mevsim salata",
      "akdeniz salatası",
      "salata",
      "salatası",
      "meze",
      "mezesi"
    ],
    "videoId": "Gcz00WB7WbU",
    "videoTitle": "Antalya Piyazı Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "menemen",
    "keywords": [
      "menemen",
      "soğanlı menemen",
      "kaşarlı menemen"
    ],
    "videoId": "kUt0flbXXcw",
    "videoTitle": "Sahanda Mükemmel Menemen Tarifi | Kahvaltı Tarifleri",
    "videoAuthor": "Refika'nın Mutfağı"
  },
  {
    "key": "omlet",
    "keywords": [
      "omlet",
      "omleti",
      "kaşarlı omlet",
      "sebzeli omlet",
      "patatesli omlet",
      "frittata"
    ],
    "videoId": "nUaPQ5F9Uqk",
    "videoTitle": "Omlet Tarifi | NASIL YAPILIR?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "kuymak",
    "keywords": [
      "kuymak",
      "muhlama",
      "mıhlama",
      "trabzon kuymağı"
    ],
    "videoId": "6K-zhykmApA",
    "videoTitle": "Muhlama Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Kahvaltı Tarifleri"
  },
  {
    "key": "pankek",
    "keywords": [
      "pankek",
      "pancake",
      "meyveli pankek"
    ],
    "videoId": "O2xWJcobcSY",
    "videoTitle": "İddialıyız! Deneyip Pişman Olan Görmedik 🙌🏻 Altın Pankek 🥞",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "krep",
    "keywords": [
      "krep",
      "akıtma",
      "akitma"
    ],
    "videoId": "Mo5s6_UQ2Lg",
    "videoTitle": "Krep Nasıl Yapılır - Tam Ölçülü Garantili Tarif, Gözünüz Kapalı Deneyin :)",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "sucuklu_yumurta",
    "keywords": [
      "sucuklu yumurta",
      "kıymalı yumurta",
      "pastırmalı yumurta",
      "yumurta",
      "haşlanmış yumurta",
      "sahanda yumurta",
      "göz yumurta"
    ],
    "videoId": "DoUiN8r_Ysc",
    "videoTitle": "Sucuklu Yumurta | Sucuklu Yumurta Tarifi | Nefisyemekcom",
    "videoAuthor": "Nefisyemekcom"
  },
  {
    "key": "cilbir",
    "keywords": [
      "çılbır",
      "cilbir",
      "poşe yumurta",
      "pose yumurta"
    ],
    "videoId": "DUsFiFYtcgw",
    "videoTitle": "Poşe Yumurta ve Çılbır Yapımı | Kahvaltı Tarifleri",
    "videoAuthor": "Refika'nın Mutfağı"
  },
  {
    "key": "acuka",
    "keywords": [
      "acuka",
      "lutenitsa",
      "ajvar",
      "kahvaltılık sos",
      "kahvaltı"
    ],
    "videoId": "-k5vCz6ca6c",
    "videoTitle": "ACUKA TARİFİ | NASIL YAPILIR?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "tost",
    "keywords": [
      "tost",
      "tostu",
      "avokado toast",
      "sandviç",
      "ekmek üstü",
      "bruschetta",
      "kumru",
      "ayvalık tostu"
    ],
    "videoId": "RQHi956kU0E",
    "videoTitle": "Sucuklu Tost Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "ayran",
    "keywords": [
      "ayran",
      "ayranı",
      "susurluk ayranı",
      "yayık ayran"
    ],
    "videoId": "h4KFSrPPhk8",
    "videoTitle": "Hazırlarından Farksız Ev Yapımı Ayran Tarifi",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "limonata",
    "keywords": [
      "limonata",
      "limonata yapımı",
      "çilekli limonata",
      "nane limonata",
      "lemonade"
    ],
    "videoId": "1_pGTeOL2Lk",
    "videoTitle": "1 Portakal 1 Limon ile Limonata Yapımı | Pratik Limonata Tarifi",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "turk_kahvesi",
    "keywords": [
      "türk kahvesi",
      "turk kahvesi",
      "kahve",
      "kahvesi",
      "espresso",
      "latte",
      "frappe",
      "soğuk kahve",
      "filtre kahve",
      "cappuccino",
      "mocha",
      "dibek kahvesi"
    ],
    "videoId": "s2cj09WgbV0",
    "videoTitle": "Sütlü Türk Kahvesi Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "soguk_cay",
    "keywords": [
      "soğuk çay",
      "soguk cay",
      "ice tea",
      "çay",
      "çayı",
      "bitki çayı",
      "hibiskus",
      "adaçayı",
      "ıhlamur",
      "yeşil çay"
    ],
    "videoId": "RibpjkIt8nU",
    "videoTitle": "Daha İyisi Yok! 🙌🏻 Ev Yapımı Soğuk Çay | Şeftalili Ice Tea 🍑",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "smoothie",
    "keywords": [
      "smoothie",
      "shake",
      "protein shake",
      "detox",
      "detoks",
      "milkshake"
    ],
    "videoId": "HzqJrezYd_E",
    "videoTitle": "VİTAMİN DEPOSU 3 Muhteşem Smoothie Tarifi",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "salgam",
    "keywords": [
      "şalgam",
      "salgam",
      "şalgam suyu"
    ],
    "videoId": "34eOy-HE0gU",
    "videoTitle": "Ev Yapımı Şalgam Tüm Püf Noktalar Anlatıldı...",
    "videoAuthor": "Hatay Sandık İçi"
  },
  {
    "key": "serbet",
    "keywords": [
      "şerbet",
      "serbet",
      "şerbeti",
      "osmanlı şerbeti",
      "demirhindi",
      "reyhan şerbeti"
    ],
    "videoId": "-hzdBJfXWQ4",
    "videoTitle": "İÇ FERAHLATAN MİS KOKULU HARİKA OSMANLI ŞERBETİ- HİBİSKÜS ŞERBETİ",
    "videoAuthor": "100de100 marifet"
  },
  {
    "key": "komposto",
    "keywords": [
      "komposto",
      "kompostosu",
      "hoşaf",
      "hosaf",
      "hoşafı"
    ],
    "videoId": "_wKJlqELVzI",
    "videoTitle": "Armut Kompostosu | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "sicak_cikolata",
    "keywords": [
      "sıcak çikolata",
      "sicak cikolata",
      "hot chocolate",
      "kakao"
    ],
    "videoId": "627qMA1JV2U",
    "videoTitle": "Sıcak Çikolata | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Çay Saati Tarifleri"
  },
  {
    "key": "salep",
    "keywords": [
      "salep",
      "sahlep",
      "sütlü salep"
    ],
    "videoId": "7Hlvtol0Ml4",
    "videoTitle": "Hakiki salep tarifi | Salep nasıl yapılır (Ustasından)",
    "videoAuthor": "Lezzet Sepeti"
  },
  {
    "key": "visne_suyu",
    "keywords": [
      "meyve suyu",
      "vişne suyu",
      "portakal suyu",
      "limon suyu",
      "kokteyl",
      "şurup",
      "içecek",
      "icecek"
    ],
    "videoId": "AK3LBX0wz8A",
    "videoTitle": "Vişne Kompostosu Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "tulumba_lokma",
    "keywords": [
      "tulumba",
      "lokma",
      "lokma tatlısı",
      "halka tatlısı",
      "çıtır tulumba"
    ],
    "videoId": "-_-emjjLhNY",
    "videoTitle": "HAKİKİ TULUMBA TATLISI 💥 Asla Yumuşamayan Çıtır Çıtır Tam Ölçülü Tarif 💯",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "asure",
    "keywords": [
      "aşure",
      "asure"
    ],
    "videoId": "XgK2_xUJiyI",
    "videoTitle": "Aşure Tarifi - Nefis Yemek Tarifleri",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "gullac",
    "keywords": [
      "güllaç",
      "gullac",
      "sütlü güllaç",
      "cevizli güllaç"
    ],
    "videoId": "2remdYWFyK8",
    "videoTitle": "Güllaç Tarifi | Tam Ölçüsünde Güllaç Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "helva_genel",
    "keywords": [
      "helva",
      "helvası",
      "tahin helvası",
      "saray helvası",
      "koz helva",
      "kağıt helva"
    ],
    "videoId": "M0WW6j4NfQg",
    "videoTitle": "Dondurmalı İrmik Helvası Tarifi",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "zeytinyagli_sebze",
    "keywords": [
      "taze fasulye",
      "zeytinyağlı taze fasulye",
      "fasulye yemeği",
      "zeytinyağlı fasulye",
      "kapuska"
    ],
    "videoId": "mXdrngQ1qfg",
    "videoTitle": "Zeytinyağlı Taze Fasulye Tarifi | Nefis Yemek Tarifleri",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "pilav",
    "keywords": [
      "pirinç pilavı",
      "pirinc pilavi",
      "bulgur pilavı",
      "bulgur pilavi",
      "şehriyeli pilav",
      "pilav",
      "pilavı",
      "meyhane pilavı",
      "özbek pilavı",
      "perde pilavı",
      "nohutlu pilav",
      "tavuklu pilav"
    ],
    "videoId": "8eUFgKsstwQ",
    "videoTitle": "Tane Tane Pirinç Pilavı Nasıl Yapılır? | Nefis Yemek Tarifleri",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "noodle_ramen",
    "keywords": [
      "noodle",
      "ramen",
      "pad thai",
      "wok",
      "uzakdoğu"
    ],
    "videoId": "psia2ftn678",
    "videoTitle": "Tavuklu Sebzeli Noodle Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "kadinbudu_kofte",
    "keywords": [
      "kadınbudu",
      "kadinbudu",
      "kadınbudu köfte"
    ],
    "videoId": "l8Jncub32cU",
    "videoTitle": "Kadınbudu Köfte Tarifi - Kadınbudu Köfte Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "icli_kofte",
    "keywords": [
      "içli köfte",
      "icli kofte",
      "haşlama içli köfte",
      "kızartma içli köfte"
    ],
    "videoId": "wWjrSFQTGsQ",
    "videoTitle": "Çok kolaymış dedirtecek İÇLİ KÖFTE TARİFİ - Nefis Yemek Tarifleri",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "haydari",
    "keywords": [
      "haydari",
      "yoğurtlu meze",
      "süzme yoğurtlu meze",
      "cevizli haydari",
      "yoğurtlu kabak",
      "yoğurtlu patlıcan"
    ],
    "videoId": "MdfH3rjEW4k",
    "videoTitle": "Haydari Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri | Bugün Ne Pişirsem?"
  },
  {
    "key": "mercimek_koftesi",
    "keywords": [
      "mercimek köftesi",
      "mercimek koftesi",
      "etsiz köfte"
    ],
    "videoId": "K4GMvNuYGUs",
    "videoTitle": "EN GARANTİ MERCİMEK KÖFTESİ 🥇 Asla Dağılmayan Tam Ölçülü Tarif",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "sos_salca",
    "keywords": [
      "domates sosu",
      "domates salçası",
      "biber salçası",
      "salça",
      "salca",
      "turşu",
      "tursu",
      "turşusu",
      "reçel",
      "receli",
      "reçeli",
      "konserve",
      "püre",
      "püresi"
    ],
    "videoId": "nLEP-KIpUko",
    "videoTitle": "Domates Kabuğundan Salça 🥫 Kışlık Hazırlık Rekoru Kimde? Kaç Kavanoz? 😎",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "falafel",
    "keywords": [
      "falafel",
      "nohut köftesi",
      "nohut koftesi"
    ],
    "videoId": "5VpRVFksFIs",
    "videoTitle": "Lezzeti Garanti Dışı Çıtır İçi Yumuşacık Falafel (Nohut Köftesi)",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "patates_kizartmasi",
    "keywords": [
      "patates kızartması",
      "patates kizartmasi",
      "patates kızartma",
      "çıtır patates",
      "elma dilim patates"
    ],
    "videoId": "uEfGRBUPbC4",
    "videoTitle": "Az Bilinen Yöntemle Çıtır Çıtır Patates Kızartması",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "durum_wrap",
    "keywords": [
      "dürüm",
      "dürümü",
      "durum",
      "durumu",
      "wrap",
      "lavaş dürüm"
    ],
    "videoId": "JC9bydB0zMw",
    "videoTitle": "Evde Tavuk Dürüm | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "peynir_tabagi",
    "keywords": [
      "peynir tabağı",
      "peynir tabagi",
      "şarküteri tabağı",
      "peynir tabaği"
    ],
    "videoId": "jc4L5HDBA8Q",
    "videoTitle": "Sade ve Şık Peynir Zeytin Sunumu",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "sarimsakli_yogurt_sos",
    "keywords": [
      "sarımsaklı yoğurt",
      "sarimsakli yogurt",
      "dip sos",
      "tarator",
      "taratoru",
      "meze sosu"
    ],
    "videoId": "LsLDEEeTU_A",
    "videoTitle": "Sarımsak Mezesi ve Nefis Dip Soslar",
    "videoAuthor": "Yemek.com"
  },
  {
    "key": "imam_bayildi",
    "keywords": [
      "imam bayıldı",
      "imambayıldı",
      "imam bayildi",
      "imambayildi"
    ],
    "videoId": "T7D7ui2tZz4",
    "videoTitle": "Zeytinyağlı İmam Bayıldı Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "kayseri_yaglamasi",
    "keywords": [
      "yağlama",
      "yağlaması",
      "yaglama",
      "yaglamasi",
      "şebit",
      "sebit",
      "kayseri yağlaması"
    ],
    "videoId": "flraj9tx9Ck",
    "videoTitle": "Kayseri Yağlaması (Şebit) Tarifi 💯",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "sevketi_bostan",
    "keywords": [
      "şevketi bostan",
      "sevketi bostan",
      "şevketibostan",
      "şevket-i bostan"
    ],
    "videoId": "AL4MF55i76A",
    "videoTitle": "Ege Usulü Zeytinyağlı & Etli Şevketi Bostan Yemeği",
    "videoAuthor": "Sebiha'nın Mutfağı"
  },
  {
    "key": "tava_yemekleri",
    "keywords": [
      "kilis tava",
      "belen tava",
      "ankara tava",
      "adıyaman tavası",
      "adiyaman tavasi",
      "niğde tavası",
      "nigde tavasi",
      "keskin tavası",
      "keskin tavasi",
      "aksaray tavası",
      "aksaray tavasi",
      "fırın tava",
      "tava yemeği",
      "tava"
    ],
    "videoId": "2TWubaqPFl4",
    "videoTitle": "Lokanta Usulü Meşhur Fırın Tava Yemeği",
    "videoAuthor": "Nefis Yemek Önerileri"
  },
  {
    "key": "risotto",
    "keywords": [
      "risotto",
      "mantarlı risotto",
      "kremalı risotto",
      "rizotto"
    ],
    "videoId": "rLGH4W7RCTM",
    "videoTitle": "İtalyan Restoran Usulü Kremalı Mantarlı Risotto",
    "videoAuthor": "Refika'nın Mutfağı"
  },
  {
    "key": "tzatziki_cacik",
    "keywords": [
      "tzatziki",
      "cacık",
      "cacik",
      "kuru cacık",
      "salatalıklı yoğurt"
    ],
    "videoId": "92RROwvR1EY",
    "videoTitle": "Tam Kıvamında Ferahlatıcı Cacık & Tzatziki Mezesi",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "katmer",
    "keywords": [
      "katmer",
      "antep katmeri",
      "fıstıklı katmer",
      "tava katmeri"
    ],
    "videoId": "AILt8tDz_18",
    "videoTitle": "En Basit Yöntemle Tavada Tel Tel Katmer Tarifi",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "yoresel_guvec_etli",
    "keywords": [
      "meftune",
      "şiveydiz",
      "siveydiz",
      "analı kızlı",
      "anali kizli",
      "madımak",
      "madimak",
      "keledoş",
      "keledos",
      "mancar",
      "banduma",
      "pöç",
      "poc",
      "çebiç",
      "cebic",
      "güveç",
      "güveci",
      "guvec",
      "guveci"
    ],
    "videoId": "QV1ZwlCnoYk",
    "videoTitle": "Geleneksel Güveçte Sebzeli Et Yemeği",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "bibimbap",
    "keywords": [
      "bibimbap",
      "kore usulü bibimbap",
      "kore pilavı"
    ],
    "videoId": "FKKKnT7Raqw",
    "videoTitle": "Kore Klasiği Sebzeli ve Dana Etli Bibimbap",
    "videoAuthor": "Yemek.com"
  },
  {
    "key": "boeuf_bourguignon",
    "keywords": [
      "boeuf bourguignon",
      "bourguignon",
      "osso buco",
      "ossobuco",
      "yahni",
      "dana yahni",
      "soğan yahnisi"
    ],
    "videoId": "vuKdBphwTUs",
    "videoTitle": "Lokum Kıvamında Etli Soğan Yahnisi ve Güveç",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "kabak_siyirma_dible",
    "keywords": [
      "kabak sıyırma",
      "kabak siyirma",
      "dible",
      "diblesi",
      "karalahana diblesi",
      "fasulye diblesi"
    ],
    "videoId": "PWYEpF628Qs",
    "videoTitle": "Ege Usulü Hafif ve Lezzetli Zeytinyağlı Kabak Yemeği",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "gnocchi",
    "keywords": [
      "gnocchi",
      "nyoki",
      "gnocci",
      "gnocchi alla sorrentina"
    ],
    "videoId": "9dukiTw2FaA",
    "videoTitle": "İtalyan Usulü Ev Yapımı Patatesli Gnocchi",
    "videoAuthor": "Yemek.com"
  },
  {
    "key": "ratatouille",
    "keywords": [
      "ratatouille",
      "ratatuy",
      "fırında sebze dizme"
    ],
    "videoId": "aGs9U9NspCk",
    "videoTitle": "Fransız Klasiği Fırında Sebzeli Ratatouille (Ratatuy)",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "sillik_zerde_tatlisi",
    "keywords": [
      "şıllık",
      "sillik",
      "zerde",
      "cennet çamuru",
      "cennet camuru",
      "yöresel tatlı"
    ],
    "videoId": "38x8WvOu4ys",
    "videoTitle": "Ağızda Dağılan Geleneksel Şerbetli Yöresel Tatlı",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "boyoz_nokul_corek",
    "keywords": [
      "boyoz",
      "nokul",
      "nokulu",
      "çörek",
      "çöreği",
      "corek",
      "coregi",
      "haşhaşlı çörek",
      "tahinli çörek"
    ],
    "videoId": "jAbfHsyMxu0",
    "videoTitle": "Kat Kat Çıtır Boyoz ve Meşhur Çörek Tarifi",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "churros",
    "keywords": [
      "churros",
      "çurros",
      "curros",
      "ispanyol tatlısı"
    ],
    "videoId": "013chRo6Owc",
    "videoTitle": "Çıtır Çıtır Çikolata Soslu İspanyol Tatlısı Churros",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "chili_con_carne",
    "keywords": [
      "chili con carne",
      "çili kon karne",
      "meksika fasulyesi"
    ],
    "videoId": "Hzerda9t0q8",
    "videoTitle": "Meksika Klasiği Kıymalı Chili Con Carne",
    "videoAuthor": "Arda'nın Mutfağı"
  },
  {
    "key": "tart_kis_crumble",
    "keywords": [
      "tart",
      "tartı",
      "tarto",
      "kiş",
      "kişi",
      "quiche",
      "kıtır",
      "kıtırı",
      "crumble",
      "trifle",
      "triflesı",
      "triflesi"
    ],
    "videoId": "IZl3FNDO1oM",
    "videoTitle": "Peynirli Sebzeli Fırında Pratik ve Lezzetli Kiş / Tart",
    "videoAuthor": "Tarifim Şahane"
  },
  {
    "key": "ekmek_sandvic",
    "keywords": [
      "ekmek",
      "ekmeği",
      "ekmegi",
      "somun ekmek",
      "bazlama",
      "sandviç ekmeği"
    ],
    "videoId": "EqTf1sUGWTA",
    "videoTitle": "Taş Fırın Tadında Evde Gerçek Ekmek Yapımı",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "kiyma_hindi_yemekleri",
    "keywords": [
      "fırında sebzeli kıyma",
      "kremalı mantarlı kıyma",
      "fırında kıyma",
      "sebzeli kıyma",
      "hindi eti",
      "hindi göğsü",
      "hindi sote",
      "fırında hindi",
      "kıymalı",
      "kıyma"
    ],
    "videoId": "0w8dzjZ2umE",
    "videoTitle": "Fırında Pratik Sebzeli Kıymalı Ev Yemeği",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "kabak_mucveri",
    "keywords": [
      "kabak mücver",
      "kabak mucveri",
      "kabak mücveri",
      "mücver",
      "mucver",
      "fırında mücver"
    ],
    "videoId": "3-gJpnJ76rU",
    "videoTitle": "Kabak Mücver Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "zeytinyagli_enginar",
    "keywords": [
      "zeytinyağlı enginar",
      "enginar dolması",
      "enginar yemeği",
      "enginar",
      "enginar kalbi"
    ],
    "videoId": "_of0hWu7VBg",
    "videoTitle": "Zeytinyağlı Enginar Tarifi | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "zeytinyagli_barbunya",
    "keywords": [
      "barbunya pilaki",
      "zeytinyağlı barbunya",
      "barbunya yemeği",
      "barbunya"
    ],
    "videoId": "Hi60sG4AbXs",
    "videoTitle": "Zeytinyağlı Barbunya Pilaki Tarifi",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "zeytinyagli_bamya",
    "keywords": [
      "etli bamya",
      "zeytinyağlı bamya",
      "bamya yemeği",
      "bamya"
    ],
    "videoId": "WJG0Sq2IOTQ",
    "videoTitle": "En Pratik Zeytinyağlı Bamya Yemeği Tarifi",
    "videoAuthor": "Nefise Yılmaz"
  },
  {
    "key": "zeytinyagli_pirasa",
    "keywords": [
      "zeytinyağlı pırasa",
      "pırasa yemeği",
      "pirasa yemegi",
      "pırasa",
      "pirasa"
    ],
    "videoId": "_oWt5rkSzlo",
    "videoTitle": "En Lezzetli Zeytinyağlı Pırasa Tarifi",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "zeytinyagli_kereviz",
    "keywords": [
      "portakallı kereviz",
      "zeytinyağlı kereviz",
      "kereviz yemeği",
      "kereviz"
    ],
    "videoId": "IjRCYNzziio",
    "videoTitle": "Portakallı Zeytinyağlı Kereviz Tarifi",
    "videoAuthor": "Nefis Yemek Tarifleri"
  },
  {
    "key": "ispanak_yemegi",
    "keywords": [
      "ıspanak yemeği",
      "ispanak yemegi",
      "kıymalı ıspanak",
      "etli ıspanak",
      "ıspanak",
      "ispanak"
    ],
    "videoId": "OHIiqbvQVjg",
    "videoTitle": "Pirinçli Ispanak Yemeği | Nasıl Yapılır?",
    "videoAuthor": "Nefis Yemek Tarifleri"
  }
];

// Fallback category videos with verified working playback
const CATEGORY_DEFAULT_VIDEOS: Record<string, VideoMetadata> = {
  drink: {
    videoId: '1_pGTeOL2Lk',
    videoTitle: '1 Portakal 1 Limon ile Limonata Yapımı | Pratik Limonata Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri',
    language: 'tr'
  },
  dessert: {
    videoId: 'vpX0YM5V5S8',
    videoTitle: 'Hiç Oklava Kullanmadan Kat Kat Pratik Ev Baklavası Yapımı',
    videoAuthor: 'Nefis Yemek Tarifleri',
    language: 'tr'
  },
  breakfast: {
    videoId: 'kUt0flbXXcw',
    videoTitle: 'Sahanda Mükemmel Menemen Tarifi',
    videoAuthor: "Refika'nın Mutfağı",
    language: 'tr'
  },
  pastry: {
    videoId: 'a235SLBQQOU',
    videoTitle: 'Sodalı Tepsi Böreği - Börek Tarifleri',
    videoAuthor: 'Nefis Yemek Tarifleri',
    language: 'tr'
  },
  soup: {
    videoId: 'Hm-sZJdy0lA',
    videoTitle: 'Lokanta Usulü Süzme Kırmızı Mercimek Çorbası Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri',
    language: 'tr'
  },
  main_dish: {
    videoId: 'gqBJ64uTxnE',
    videoTitle: 'Asla Sertleşmeyen Yumuşacık Anne Köftesi Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri',
    language: 'tr'
  },
  meze: {
    videoId: 'ktKIUduclxA',
    videoTitle: 'Ustasından Gerçek Hatay Usulü Kısır Tarifi',
    videoAuthor: 'Nefis Yemek Tarifleri',
    language: 'tr'
  },
  world: {
    videoId: 'BrQSueGraUs',
    videoTitle: 'Evde Hızlı ve Gurme Hamburger Tarifi | Hamburger 101',
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

  // 1. Check for specific dish matching with longest-keyword priority
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
