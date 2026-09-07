# Recipe Sources & Access Compliance Registry

**Tarih:** 5 Eylül 2026  
**Kapsam:** Cookly (Yemekte Ne Var?) platformunun tarif veri kaynakları için teknik, hukuki ve operasyonel erişim matrisi.

---

## 1. Kaynak Değerlendirme Matrisi

| Kaynak | Tür | Politika | Lisans / Kullanım Koşulları | Görsel Desteği | Video Desteği | Kota & Limit |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TheMealDB** | REST API | **ALLOWED** | TheMealDB Free Public Open Database License | Evet (Thumb URL) | Evet (Resmi YouTube linki) | 120 req/dk |
| **Curated Local Catalog** | JSON / Local | **ALLOWED** | Public Domain / CC0 / Cookly Proprietary | Evet | Evet | Limitsiz |
| **Pexels API** | REST API | **ALLOWED** | Pexels Commercial & Personal Free License | Evet (Orijinal/Büyük) | Hayır (Sadece Görsel) | 200 req/dk |
| **YouTube Data API / Embed** | REST / IFrame | **ALLOWED** | YouTube Developer Terms of Service (Embed) | Hayır (Scrape yasak) | Evet (Official Embed) | 10.000 units/gün |
| **Nefis Yemek Tarifleri** | Web Scraping | **PROHIBITED** | robots.txt Disallow, Ticari İzin Yok | ❌ YASAK | ❌ YASAK | **ERİŞİM ENGELLİ** |
| **Rastgele Web Scraping** | HTML Scraping | **PROHIBITED** | Telif ve FSEK Riski, robots.txt ihlali | ❌ YASAK | ❌ YASAK | **ERİŞİM ENGELLİ** |

---

## 2. Kaynak Detayları

### TheMealDB (themealdb.com)
- **Provider Kimliği:** `themealdb`
- **Durum:** **ALLOWED (İzinli - Kontrollü Staging Kullanımı)**
- **Resmi Uç Noktalar (Endpoints):**
  - İsimle Arama: `https://www.themealdb.com/api/json/v1/1/search.php?s={query}`
  - ID ile Detay: `https://www.themealdb.com/api/json/v1/1/lookup.php?i={id}`
  - Kategoriye Göre Filtre: `https://www.themealdb.com/api/json/v1/1/filter.php?c={category}`
- **Lisans Modeli:** TheMealDB Free Public Open Database License. Tarif metinleri açık kamuya açıktır.
- **Zorunlu Atıf (Attribution):** "TheMealDB Open Recipe Database" veya kaynak belirtimi zorunludur.
- **Kısıtlamalar ve Limitler:**
  - **Hız Limiti (Rate Limit):** 120 istek / dakika; batch aramalarında istekler arası en az 200ms gecikme uygulanır.
  - **API Bağımlılığı:** Harici ağa bağımlıdır. Ağ veya DNS erişimi yoksa sistem çökmek yerine işlemi güvenli biçimde `SKIPPED` olarak işaretler.
  - **Dil ve Lokalizasyon Sınırı:** Tarifler İngilizce veya orijinal dillerindedir. Otomatik makine çevirisi yasaktır; orijinal başlık ve `language: en` etiketi korunur.
  - **Besin Değerleri:** Kalori ve makro bilgisi API çıktısında mevcut değildir. Sahte veri üretimi yasak olduğundan bu alanlar `null` kalır.
- **Görsel Kısıtlamaları (Image Limitations):**
  - TheMealDB görselleri (`strMealThumb`) kullanıcılar tarafından yüklendiğinden CC0/Kamu Malı güvencesi yoktur.
  - Lisans durumu `unknown`, inceleme durumu `needs_review` olarak işaretlenir.
  - Bu aşamada sunucuya hiçbir görsel indirilmez (`imagesDownloaded = 0`).
- **Video Kısıtlamaları (Video Limitations):**
  - `strYoutube` alanından yalnızca 11 haneli video kimliği ayıklanır.
  - Gizlilik odaklı `youtube-nocookie.com/embed/` URL'si oluşturulur.
  - YouTube video dosyası veya video kapağı (thumbnail) indirilmesi yasaktır (`videosDownloaded = 0`).
- **Bilinmeyen / Belirsiz Alanlar (UNKNOWN):**
  - Bireysel kullanıcı katkılı tariflerin özgün telif durumu: `UNKNOWN` (topluluk katkısı).
  - Görsellerin ticari reklam/pazarlama kullanım hakları: `UNKNOWN` (review zorunludur).

### Curated Local Catalog (Cookly Şefleri)
- **Durum:** Türkiye mutfağına özel olarak hazırlanmış yerel tarif koleksiyonu.
- **Yasal Güvence:** Şirket içi telifsiz ve kamuya açık geleneksel tarifler.

### Nefis Yemek Tarifleri (nefisyemektarifleri.com)
- **Durum:** **KESİNLİKLE YASAK (PROHIBITED)**.
- **Gerekçe:** `robots.txt` ile tüm scraper, bot ve veri çekme araçları engellenmiştir. Ticari kullanım veya kopyalama izni verilmemiştir.
- **Karar:** Otomatik veya manuel hiçbir veri kopyalaması yapılmaz.
