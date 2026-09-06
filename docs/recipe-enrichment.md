# Recipe Enrichment, Localization & Media Matching Engine

**Versiyon:** 1.0.0  
**Tarih:** 6 Eylül 2026  
**Durum:** Üretime Hazır (Production-Ready Enrichment Layer)

---

## 1. Genel Bakış ve Mimari

Bu doküman, Cookly (Yemekte Ne Var?) platformunun içe aktarılan ham veya yarı işlenmiş tariflerini üretim seviyesine getiren **Tarif Zenginleştirme ve Medya Eşleştirme Motoru'nu (Recipe Enrichment Engine)** tanımlar.

Enrichment hattı, `Recipe Import Pipeline` (bkz. [docs/recipe-import-pipeline.md](recipe-import-pipeline.md)) ile tam uyumlu olup aşağıdaki doğrusal ve izole aşamalardan oluşur:

```
[Raw Recipe]
      │
      ▼
[Normalization] ────► (Büyük/küçük harf, Türkçe diyakritikler, kanonik anahtar)
      │
      ▼
[Validation] ───────► (Şema, asgari malzeme ve adım denetimi)
      │
      ▼
[Deduplication] ────► (O(1) Kanonik başlık, kaynak kimliği ve malzeme imzası)
      │
      ▼
[Enrichment Layer] (src/pipeline/enrichment/)
      │
      ├─► [Localization] ───────► (Orijinal başlık korunur; sahte çeviri yapılmaz; pending/translated)
      ├─► [Taxonomy Mapping] ──► (TheMealDB/Global kategoriler Cookly standart kategorilerine eşlenir)
      ├─► [Ingredient Parsing] ─► (Miktar, birim ve malzeme adı güvenle ayrıştırılır; raw korunur)
      ├─► [Image Matching] ────► (0-100 puanlık şeffaf skor; telifsiz Pexels/Open vs needs_review)
      ├─► [Video Matching] ────► (11 haneli YouTube ID; resmi youtube-nocookie embed linki)
      └─► [Completeness] ──────► (blocking vs warning vs optional hata sınıflandırması)
      │
      ▼
[Quality Gate] ─────► (VALID | WARNING | REVIEW_REQUIRED | REJECTED)
      │
      ▼
[Human Review] ─────► (review-queue.json ve staging manifest oluşturulur)
```

---

## 2. Türkçe Yerelleştirme (Localization Policy)

- **Sıfır Sahte Çeviri Kuralı:** TheMealDB veya küresel kaynaklardan gelen İngilizce tarifler (örn. "Teriyaki Chicken Casserole") otomatik olarak makine çevirisiyle Türkçeleştirilip kataloğa sokulmaz.
- **Dil Etiketleri:**
  - `sourceLanguage`: Kaynak dil (`en`, `tr`).
  - `displayLanguage`: Kullanıcıya gösterilen dil (`en`, `tr`).
  - `translationStatus`: `not_translated`, `pending`, `translated`, `review_required`, `failed`.
- **`RecipeTranslator` Soyutlaması:** İleride bağlanacak yapay zeka veya profesyonel tercüme API'leri için standart arayüz sunar. `MockRecipeTranslator` güvenli şekilde `status: pending` ve `confidence: 0.0` döner.

---

## 3. Mutfak Taksonomisi (Taxonomy Mapping)

- Harici kategoriler (`Dessert`, `Chicken`, `Pasta`, `Vegetarian`, `Seafood`, `Soup` vb.) Cookly standart 14 kategorisine eşlenir.
- Mutfak kökeni (`Area`: `Turkish`, `Italian`, `Japanese` vb.) deterministik etiketlere dönüştürülür.
- Eşleşmeyen veya şüpheli kategoriler kesinlikle uydurulmaz; `status: unknown` ve `cooklyCategory: unknown` olarak işaretlenir.

---

## 4. Malzeme Ayrıştırma (Ingredient Parsing)

- Ayrı veya birleşik malzeme metinleri (`1 can coconut milk`, `500g chicken breasts`, `1/2 cup water`):
  - `name`: Malzemenin temiz adı
  - `amount`: Sayısal/kesirli miktar
  - `unit`: Ölçü birimi (`can`, `cup`, `g`, `tbsp` vb.)
  - `amountValue`: Ondalık karşılığı (`0.5`, `1.5`, `500`)
  - `confidence`: Ayrıştırma güven skoru (0.4 - 1.0)
  - `status`: `parsed`, `approximate`, `unparsed`
- Orijinal ham metin (`raw`) hiçbir zaman kaybolmaz; veri kaybı yaşanmaz.

---

## 5. Görsel Eşleştirme Motoru (Image Matching Engine)

- **Skorlama (0-100 Puan):**
  1. Başlık ve arama sorgusu uyumu (0-35 puan)
  2. Kategori ve mutfak bağlamı (0-15 puan)
  3. CDN ve teknik çözünürlük güvenilirliği (0-20 puan)
  4. Lisans ve kullanım izni güvenliği (0-30 puan)
- **Lisans Durumları:**
  - `authorized`: Açık lisans / Pexels onaylı (Skor $\ge 75 \rightarrow$ `ready`)
  - `needs_review`: Kullanıcı katkılı / TheMealDB (İnceleme gerekli $\rightarrow$ `needs_review`)
  - `placeholder` / `rejected`: `placehold.co` veya dummy görseller (Skor $0 \rightarrow$ `rejected`)
  - `missing`: Görsel yok $\rightarrow$ `missing`
- **Sıfır Toplu İndirme:** Bu aşamada sunucuya hiçbir harici görsel indirilmez.

---

## 6. Video Eşleştirme & Güvenlik (Video Matching & Security)

- **YouTube Video ID Doğrulaması:** Yalnızca 11 haneli standart karakter (`^[\w-]{11}$`) içeren kimlikler kabul edilir.
- **Resmi Gizlilik Korumalı Embed:** Sadece `https://www.youtube-nocookie.com/embed/{VIDEO_ID}` URL'si üretilir.
- **Engellenen Güvenlik Riskleri:**
  - `javascript:` sözde protokolleri engellenir.
  - `data:` URI şemaları engellenir.
  - Rastgele üçüncü taraf alan adlarından gelen iframe'ler engellenir.
  - XSS veya HTML enjeksiyonu (`<script>`, tırnak işaretleri) içeren linkler engellenir.

---

## 7. Bütünlük ve Üretime Hazırlık (Completeness & Production Readiness)

- **Kritik Engeller (`blocking`):** Eksik başlık, 0 malzeme, 0 hazırlanış adımı $\rightarrow$ `productionReady = false`.
- **Uyarılar (`warning`):** İnceleme bekleyen görsel lisansı, çevrilmemiş yabancı dil, bilinmeyen kategori.
- **İsteğe Bağlı (`optional`):** Eksik YouTube hazırlama videosu.
- **Üretim Kararı:** Tarifin `productionReady = true` olması için hiçbir `blocking` hatanın bulunmaması ve içeriğin tam olması şarttır.

---

## 8. İnsan İnceleme Kuyruğu (Human Review Queue)

- Sistem, otomatik karara bağlanamayan tüm durumlar için `ReviewItem` üretir.
- **İnceleme Tipleri:** `translation`, `image`, `video`, `license`, `duplicate`, `taxonomy`, `content`.
- Staging çıktısı olarak `test-output/recipe-import/review-queue.json` dosyası oluşturulur.

---

## 9. Deterministik Önbellekleme ve Hız Sınırları

- `DeterministicEnrichmentCache`: Sorgu ve parametrelerin SHA-256 özetini alarak deterministik önbellek sunar.
- **Gizli Bilgi Güvencesi:** API anahtarları, yetkilendirme başlıkları ve token'lar asla önbelleğe kaydedilmez veya loglanmaz.
- **Hız Sınırı:** Sağlayıcılar varsayılan `concurrency: 1` ile izole çalıştırılır.

---

## 10. Komutlar

```bash
# Zenginleştirme Kuru Çalıştırması (Dry-Run)
npm run recipe:enrich:dry-run

# İçe Aktarım Kuru Çalıştırması
npm run recipe:import:dry-run

# Görsel Aday ve İndirme Kuru Çalıştırmaları
npm run image:dry-run
npm run image:acquisition:dry-run
npm run image:pexels:dry-run
npm run image:download:dry-run

# Birim Testler
npm test
```
