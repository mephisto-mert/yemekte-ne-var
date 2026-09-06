# Cookly / Yemekte Ne Var — Production Recipe Catalog Import Architecture (PART 15)

**Versiyon:** 15.0.0  
**Tarih:** 6 Eylül 2026  
**Durum:** Üretime Alındı (Production Catalog: 100 Recipes Live)

---

## 1. Genel Bakış ve Amaç

Bu dokümantasyon, **PART 5–14** boyunca geliştirilen görsel edinimi, TheMealDB import, video eşleme, Türkçeleştirme, zenginleştirme ve staging kataloğu altyapılarının ardından, onaylı ve 10/10 güvenlik kapısını geçen tariflerin **kontrollü ve atomik şekilde gerçek üretim veri setine (`src/data/raw_recipes.json`)** aktarılmasını sağlayan **Production Catalog Importer** sistemini açıklar.

```
STAGING HAVUZU (50 Aday)
  │
  ▼
10-Point Production Eligibility Gate
  │ (Tüm 10 güvenlik kontrolünü eksiksiz geçenler)
  ▼
Deduplication & Deterministic Ranking Engine
  │ (Mevcut 50 tarifle çakışmayanlar, kalite skoruna göre sıralı)
  ▼
Production Recipe Model & Schema Validator
  │ (Tip, kategori, besin değeri, YouTube iframe embed, Pexels görsel URL)
  ▼
Atomic File Replacement (.tmp -> Verify -> fs.renameSync)
  │ (Sıfır veri kaybı, anlık atomik geçiş)
  ▼
PRODUCTION DATASET (Tam 100 Tarif)
```

---

## 2. Temel Güvenlik ve Koruma İlkeleri

1. **İlk 50 Üretim Tarifinin Dokunulmazlığı (Immutability)**:
   - Başlangıçtaki 50 tarifin (ID: 1–50) isimleri, fotoğrafları, malzemeleri, adımları, besin değerleri ve metadata'sı kesinlikle değiştirilmez.
   - Yeni tarifler daima `nextId = max(existingIds) + 1` kuralıyla ID: 51..100 olarak sıralı eklenir.

2. **Supabase Sıfır Mutasyon Garantisi**:
   - İçe aktarım tamamen local dosya tabanlı ve deterministiktir. Uzak Supabase veritabanına hiçbir doğrudan yazma veya kontrolsüz migrasyon yapılmaz.

3. **Sıfır Video Dosyası İndirme Garantisi**:
   - Asla sunucuya `.mp4`, `.mkv`, `.webm` video binary dosyaları indirilmez.
   - YouTube videoları yalnızca resmi `https://www.youtube-nocookie.com/embed/{videoId}` iframe formatında saklanır.

4. **Kural: "Kaliteyi Sayı Uğruna Düşürme"**:
   - Hedef 100 tarif olsa bile, güvenlik kapısını geçemeyen veya eksik hiçbir tarif içe aktarılmaz.
   - Sadece 10/10 kontrolü sağlayan tarifler eklenir.

---

## 3. 10-Noktalı Üretim Uygunluk Kapısı (10-Point Eligibility Gate)

Her aday tarif, aşağıdaki 10 kriterin tamamını sağlamak zorundadır:

| # | Kriter Adı | Açıklama | Doğrulama Mekanizması |
|---|---|---|---|
| 1 | `sourceAllowed` | Veri kaynağı izinli listesinde mi? | TheMealDB API veya Cookly Curated Kitchen |
| 2 | `licenseApproved` | Açık lisans / ticari kullanım uygun mu? | CC0, Public Domain, Pexels Free License |
| 3 | `localizationApproved` | Türkçe başlık, malzeme ve adımlar hazır mı? | 100% Türkçe çeviri & doğrulama |
| 4 | `contentComplete` | Malzeme listesi ve adımlar eksiksiz mi? | En az 1 malzeme, en az 2 adım, süre ve porsiyon |
| 5 | `imageApproved` | Görsel çözünürlüğü ve kalitesi onaylı mı? | Pexels/Curated gerçek URL (placehold.co YASAK) |
| 6 | `videoPolicySatisfied` | Resmi video embed politikasına uygun mu? | 11 haneli geçerli YouTube video ID'si |
| 7 | `noBlockingReview` | İnceleme kuyruğunda bekleyen engel var mı? | `reviewItems.length === 0` veya bloke eden sorun yok |
| 8 | `noDuplicate` | Üretimdeki mevcut tariflerle çakışıyor mu? | Başlık, canonical başlık ve `source:sourceId` kontrolü |
| 9 | `qualityThresholdMet` | Minimum kalite skorunu (>= 80) sağlıyor mu? | 4-boyutlu kalite motoru değerlendirmesi |
| 10 | `provenanceComplete` | Kaynak izlenebilirlik geçmişi tam mı? | Kaynak URL, pipeline versiyonu, dönüşüm adımları |

---

## 4. Atomik Dosya Güncelleme ve Geri Alma (Atomic Importer)

Doğrudan üretim dosyasının üzerine yazmak yerine **iki aşamalı atomik yazma** yöntemi kullanılır:

1. `src/data/raw_recipes.json.tmp` dosyası oluşturulur ve yeni dataset buraya yazılır.
2. Geçici dosya `JSON.parse` ile okunur ve tarif sayısının tam olarak `initialCount + importedCount` olduğu teyit edilir.
3. Node.js `fs.renameSync` işletim sistemi çağrısı ile geçici dosya orijinal dosyanın üzerine atomik olarak taşınır.
4. Herhangi bir hata veya kesinti durumunda orijinal dosya `%100` korunur.

---

## 5. CLI Komutları ve Kullanım

### A. Simülasyon / Kuru Çalıştırma (Dry Run)
Hiçbir dosyaya yazmadan havuzu denetler, kapıdan geçenleri ve çakışmaları raporlar:
```bash
npm run recipe:production:dry-run
# veya özel hedef sayısı ile:
npm run recipe:production:dry-run -- --target 100
```

### B. Canlı İçe Aktarım (Live Production Import)
Onaylı tarifleri `src/data/raw_recipes.json` içine güvenle aktarır:
```bash
npm run recipe:production:import
# veya özel hedef sayısı ile:
npm run recipe:production:import -- --target 100
```

---

## 6. Doğrulama ve Test Kapsamı

Projedeki 21 test dosyasında toplam **476 test** başarıyla çalışmaktadır:
- `src/test/productionImport.test.ts`: Kapı kontrolleri, mükerrer filtreleme, hedef sınırları, şema doğrulama, geçersiz görsel reddi ve atomik yazma testleri (17 test).
- `src/test/round3RedTeam.test.ts`: 100 tariflik yeni kataloğun unique ID, besin değeri, video metadata ve vejetaryen filtreleme doğrulamaları (24 test).
- `src/test/stagingCatalog.test.ts`, `src/test/recipeEnrichment.test.ts`, `src/test/pexelsProvider.test.ts`: Tüm boru hattı regresyon testleri.
- `npm run build`: Sıfır TypeScript hatası ile hatasız üretim derlemesi.