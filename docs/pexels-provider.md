# Pexels Image Provider Entegrasyonu ve Güvenlik Kılavuzu

**Versiyon:** 1.0.0  
**Tarih:** 5 Eylül 2026  
**Durum:** Üretime Hazır (Production-Grade)

---

## 1. Genel Bakış

`PexelsImageProvider`, Cookly (Yemekte Ne Var?) platformunun tarif görsel edinim motoruna (`RecipeImageAcquisitionEngine`) doğrudan bağlanan, resmi **Pexels API v1** üzerinden güvenli ve lisanslı yemek görselleri getiren somut bir `ImageProvider` implementasyonudur.

Bu entegrasyon, PART 5'te belirlenen `SourcePermissionPolicy` ("allowed") ve PART 6'da tanımlanan görsel kalite doğrulama ve telif yönetim kuralları üzerine inşa edilmiştir.

---

## 2. Mimari ve Bileşenler

```
[Acquisition Engine]
         │
         ▼
[ImageProviderRegistry]
         │
         ▼
[PexelsImageProvider] (search / getById)
         │
         ▼
  [SafeHttpClient] ◄─── (Zero-leakage, Safe Retries, Mockable Fetch)
         │
         ▼
 [Pexels API v1] (https://api.pexels.com/v1/search)
```

### Temel Sınıflar ve Arayüzler

1. **`SafeHttpClient` (`src/pipeline/image/providers/httpClient.ts`)**:
   - HTTP isteklerini yürüten dayanıklı istemci.
   - API anahtarlarını ve kimlik bilgilerini otomatik olarak tespit edip hata mesajlarında ve loglarda `[REDACTED_API_KEY]` ile gizler.
   - Geçici olmayan yetkilendirme hatalarında (401 Unauthorized, 403 Forbidden) **kesinlikle yeniden deneme (retry) yapmaz**.
   - Hız sınırı (429 Too Many Requests) alındığında `Retry-After` başlığını kontrol eder ve kontrollü bekleme uygular.
   - 5xx sunucu hatalarında sınırlı exponential backoff uygular.
   - `fetchFn` enjeksiyonu sayesinde test ortamlarında sıfır harici ağ çağrısı (zero-network) garantisi sunar.

2. **`PexelsImageProvider` (`src/pipeline/image/providers/pexelsProvider.ts`)**:
   - `ImageProvider` sözleşmesini tam olarak uygular (`search` ve `getById`).
   - `PEXELS_API_KEY` ortam değişkenini güvenli şekilde okur.
   - Pexels API'sinin beklediği `Authorization: <API_KEY>` formatını kullanır (`Bearer` öneki olmadan).
   - API anahtarı yapılandırılmamışsa sessizce ve güvenli şekilde boş liste (`[]`) döner; sistemi çökertmez.
   - Pexels JSON çıktısını standart `ImageProviderResult` modeline dönüştürür.
   - Fotoğrafçı adı ve platform atfını (`Attribution: Photographer Name (Pexels)`) otomatik olarak ekler.
   - Pexels Ticari ve Kişisel Ücretsiz Lisansını (`Pexels License`) nesneye iliştirir.

---

## 3. Güvenlik ve Gizlilik Garantileri

1. **Sıfır Sızıntı (Zero Secret Leakage):**
   - API anahtarları asla konsola yazdırılmaz, hata mesajlarına eklenmez veya loglanmaz.
   - `.env` ve `.env.*` dosyaları `.gitignore` ile korunmaktadır.
   - `.env.example` içinde yalnızca placeholder (`PEXELS_API_KEY=`) yer alır.

2. **Ağ İzolasyonu ve Test Güvenliği (Zero Network Tests):**
   - Standart birim testleri (`npm test`) Pexels API uç noktalarına **asla gerçek HTTP çağrısı yapmaz**.
   - Tüm Vitest testleri, mocklanmış `fetchFn` veya `SafeHttpClient` aracılığıyla izole olarak çalıştırılır.
   - Gerçek Pexels API çağrıları yalnızca manuel olarak çalıştırılan `npm run image:pexels:test` ve `npm run image:pexels:dry-run` scriptleri üzerinden, ve sadece ortam değişkeni tanımlıysa yürütülür.

3. **Veri Bütünlüğü Koruması (Read-Only & Zero Mutation):**
   - Pexels sağlayıcısı ve ilgili dry-run scriptleri üretim veri tabanını (`src/data/raw_recipes.json` ve `recipesData.ts`) **kesinlikle değiştirmez**.
   - Disk üzerine görsel indirme işlemi indirme yöneticisi (`DownloadManager`) devreye sokulana kadar yapılmaz (Downloads: 0).

---

## 4. Kullanım ve Komutlar

### Ortam Değişkeni Tanımlama

Yerel ortamda Pexels API anahtarını kullanmak için `.env` dosyanıza ekleyin:
```bash
PEXELS_API_KEY=your_actual_pexels_api_key_here
```

### Dry-Run Simülasyonu

Üretim veri setinden ilk 3 tarifi seçip Pexels arama sorgularını simüle etmek için:
```bash
npm run image:pexels:dry-run
```
- API anahtarı yoksa: Güvenli fallback mesajı verilir, disk ve veri seti değişmez.
- API anahtarı varsa: Salt-okunur olarak arama yapılır, sonuçlar listelenir, dosya indirilmez.

### Entegrasyon Testi

Pexels API bağlantısını canlı doğrulamak için:
```bash
npm run image:pexels:test
```
- API anahtarı yoksa: `[SKIPPED]` durumu ile 0 koduyla temiz bir şekilde çıkar.
- API anahtarı varsa: Tek bir canlı arama isteği yaparak API anahtarının geçerliliğini ve yanıt formatını doğrular.

### Birim Testlerini Çalıştırma

Tüm test paketini (100% mocked, sıfır harici çağrı) çalıştırmak için:
```bash
npm test
```
