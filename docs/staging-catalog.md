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
| `npm run recipe:staging:dry-run` | 10 tariflik simüle edilmiş staging dry-run provası çalıştırır. |
| `npm run recipe:staging:test` | Canlı TheMealDB API'sinden maksimum 10 tarif çeker ve staging hattında işler (Ağ yoksa güvenli fallback). |
| `npm run recipe:staging:export` | Staging kataloğu ve manifesti `artifacts/staging/` klasörüne kopyalar. |
| `npm test` | 18 test paketinde 428 birim testini offline çalıştırır. |
