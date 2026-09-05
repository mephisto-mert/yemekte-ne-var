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
- **Durum:** Açık ve izinli yemek veritabanı.
- **Teknik Erişim:** Kamuya açık JSON uç noktaları (`search.php`, `lookup.php`).
- **Veri Alanları:** Malzeme listesi, ölçüler, hazırlanış adımları, görsel ve YouTube hazırlama videosu.
- **Yasal Güvence:** Ticari ve kişisel geliştirmeye açık kamu lisansı.

### Curated Local Catalog (Cookly Şefleri)
- **Durum:** Türkiye mutfağına özel olarak hazırlanmış yerel tarif koleksiyonu.
- **Yasal Güvence:** Şirket içi telifsiz ve kamuya açık geleneksel tarifler.

### Nefis Yemek Tarifleri (nefisyemektarifleri.com)
- **Durum:** **KESİNLİKLE YASAK (PROHIBITED)**.
- **Gerekçe:** `robots.txt` ile tüm scraper, bot ve veri çekme araçları engellenmiştir. Ticari kullanım veya kopyalama izni verilmemiştir.
- **Karar:** Otomatik veya manuel hiçbir veri kopyalaması yapılmaz.
