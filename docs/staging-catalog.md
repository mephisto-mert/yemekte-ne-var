# Staging Catalog Builder & Controlled Recipe Expansion

**Versiyon:** 13.0.0  
**Tarih:** 6 Eylül 2026  
**Durum:** Üretime Hazır (Production-Grade Staging Architecture)

---

## 1. Genel Bakış ve Mimari

Bu doküman, Cookly (Yemekte Ne Var?) platformunun PART 5–12 boyunca kurulan tüm veri edinimi, normalizasyon, doğrulama, mükerrer kontrolü, görsel eşleştirme, video eşleştirme, yerelleştirme, taksonomi ve kalite puanlama altyapılarını tek bir kontrollü **Staging Katalog Üretim Akışında (Staging Catalog Builder)** birleştiren mimariyi tanımlar.

Staging mimarisi, üretim veri setini (`src/data/raw_recipes.json` ve `src/data/recipesData.ts`) ve uzak veritabanlarını (Supabase) %100 izole ve dokunulmaz tutar.

```
[Raw Recipe Data Provider] (TheMealDB / Open Catalog)
           │
           ▼
[Staging Orchestrator] (src/pipeline/staging/orchestrator.ts)
   │ (Limit <= 100 Denetimi, Hata İzolasyonu)
   ├─► 1. Normalizasyon & Şema Doğrulama
   ├─► 2. Scalable Duplicate Index (Mükerrer Kontrolü)
   ├─► 3. Kalite Kontrol Kapısı Değerlendirmesi
   ├─► 4. Zenginleştirme (Taksonomi, Malzeme, Görsel, Video, Çeviri)
   ├─► 5. Veri Kaynağı & Dönüşüm İzlenebilirliği (Provenance)
   └─► 6. 10 Maddelik Üretim Kabul Kapısı (Production Eligibility Gate)
           │
           ▼
[Staging Catalog Repository] (test-output/recipe-import/ / artifacts/staging/)
   ├─► staging-catalog.json (Staging Durumundaki Tarifler)
   ├─► staging-manifest.json (Çalıştırma ve İstatistik Raporu)
   └─► review-queue.json (İnsan İnceleme Kuyruğu)
```

---

## 2. Staging vs. Production Ayrımı

| Özellik | Staging Kataloğu | Production Kataloğu |
| :--- | :--- | :--- |
| **Depolama Yeri** | `test-output/recipe-import/`, `artifacts/staging/` | `src/data/raw_recipes.json`, `src/data/recipesData.ts` |
| **Erişim Türü** | Yazılabilir / Geçici / İnceleme Odaklı | Kesinlikle Salt Okunur / Korunan Üretim Verisi |
| **Veri Durumu** | `imported`, `enriched`, `needs_review`, `approved`, `rejected`, `production_ready` | Yayındaki onaylı tarifler (50 adet) |
| **Görsel / Video** | Aday URL'ler ve lisans inceleme kuyruğu | Doğrulanmış, lisanslı ve optimize edilmiş varlıklar |
| **Otomatik Aktarım** | **KESİNLİKLE YASAK (0 Otomatik Aktarım)** | Yalnızca manuel onay ve doğrulanmış manifest ile |

---

## 3. 10 Maddelik Üretim Kabul Kapısı (Production Eligibility Gate)

Bir tarifin staging ortamından production'a aktarılabilir (`production_ready`) sayılması için aşağıdaki 10 şartın tamamını eksiksiz sağlaması zorunludur:

1. **Source Allowed:** Kaynak açıkça izin verilmiş olmalıdır (Nefis Yemek Tarifleri veya izinsiz scraping kaynakları kesinlikle reddedilir).
2. **License Approved:** Görsel ve içerik lisansı doğrulanmış olmalıdır (`unknown`, `none` veya `requires_review` durumları reddedilir).
3. **Localization Approved:** Tarif Türkçe olmalı veya Türkçe çevirisi onaylanmış (`translated`) olmalıdır.
4. **Content Complete:** Başlık, en az 1 malzeme ve en az 1 adım eksiksiz bulunmalıdır.
5. **Image Approved:** Görsel durumu `ready` olmalıdır.
6. **Video Policy Satisfied:** Video durumu `ready` veya `missing` (opsiyonel) olmalıdır; `rejected` olanlar reddedilir.
7. **No Blocking Review:** Bekleyen kritik (`blocking`) inceleme maddesi bulunmamalıdır.
8. **No Duplicate:** Mükerrer tarif şüphesi bulunmamalıdır.
9. **Quality Threshold Met:** Kalite puanı en az **70/100** olmalıdır.
10. **Provenance Complete:** Kaynak, kaynak ID, içe aktarılma zamanı ve dönüşüm adımları eksiksiz kaydedilmiş olmalıdır.

---

## 4. Staging Veri Modeli ve Tipleri

```typescript
export interface StagedRecipe {
  id: string;
  source: string;
  sourceId: string;
  sourceUrl?: string;
  sourceLanguage: string;
  displayLanguage: string;
  title: string;
  displayTitle: string;
  canonicalTitle: string;
  description?: string;
  category: string;
  tags: string[];
  cuisine?: string;
  difficulty: string;
  cookingTime: string;
  timeMinutes: number;
  servings: number;
  ingredients: ParsedIngredient[];
  instructions: string[];
  image: ImageMatchingResult;
  video: VideoMatchingResult;
  quality: EnrichedQualityScore;
  completeness: CompletenessEvaluation;
  localization: LocalizedRecipeData;
  taxonomy: TaxonomyMappingResult;
  provenance: RecipeProvenance;
  reviewItems: ReviewItem[];
  status: StagingRecipeStatus;
  productionEligibility: ProductionImportEligibility;
  createdAt: string;
  updatedAt: string;
}
```

---

## 5. Komutlar ve Kullanım

| Komut | Açıklama |
| :--- | :--- |
| `npm run recipe:staging:dry-run` | Simüle edilmiş staging dry-run provası çalıştırır (`--limit <n>` destekler). |
| `npm run recipe:staging:test` | Canlı TheMealDB API'sinden kontrollü batch çeker ve staging hattında işler (`--limit <n>`, `--query <q>` destekler). |
| `npm run recipe:staging:export` | Staging kataloğu ve manifesti `artifacts/staging/` klasörüne aktarır. |
| `npm test` | Tüm birim ve entegrasyon testlerini offline çalıştırır. |

---

## 6. TheMealDB Kontrollü Genişleme Akışı (PART 14.1)

1. **API Erişimi**: Sadece resmi TheMealDB endpointleri (`search.php`, `lookup.php`) ve `SafeHttpClient` (zaman aşımı, hız sınırı, hata toleransı) kullanılır.
2. **Batch Denetimi**: Varsayılan 10 tarif (`DEFAULT_STAGING_BATCH_SIZE`), maksimum 100 tarif (`MAX_STAGING_BATCH_SIZE`). 100'ü aşan veya 0 ve altındaki limitler açık hata fırlatır.
3. **Şema Doğrulama**: `validateMealDbMeal` ile eksik veya bozuk API kayıtları izole edilir; tekil kayıt hataları tüm batch'i durdurmaz (`failedRecipes` kuyruğuna alınır).
4. **Bileşik Anahtar ve Güncelleme**: `themealdb:<idMeal>` formatı ile mükerrer eklemeler önlenir ve mevcut staging kaydı güncellenir.
5. **İzolasyon**: Üretim veri seti (`src/data/`) ve Supabase veritabanına kesinlikle sıfır mutasyon yapılır.

