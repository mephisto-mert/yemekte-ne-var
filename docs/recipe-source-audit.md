# Recipe Source Compliance & Access Audit

**Araştırma Tarihi:** 5 Eylül 2026  
**Denetim Kapsamı:** Cookly (Yemekte Ne Var?) platformunun gelecekteki tarif veri kaynaklarının teknik, hukuki ve operasyonel uygunluk analizi.  
**Temel İlke:** Sıfır-Risk, Fikri Mülkiyet Haklarına Saygı, FSEK (5846 sayılı Fikir ve Sanat Eserleri Kanunu) Uyumluğu, Robots.txt ve Kullanım Koşulları Uyumu.

---

## 1. Nefis Yemek Tarifleri (nefisyemektarifleri.com)

*Kaynak URL:* `https://www.nefisyemektarifleri.com/`

### Technical Access (Teknik Erişim)
* **API Durumu:** Resmi ve kamuya açık bir REST/GraphQL geliştirici API'si **BULUNMAMAKTADIR**.
* **WordPress REST API:** `/wp-json/` uç noktası `robots.txt` ile tüm tarayıcılara **Disallow** (engellenmiş) edilmiştir.
* **RSS / Feed:** `/feed/` ve `*/feed/` dizinleri `robots.txt` ile **Disallow** edilmiştir.
* **Yapılandırılmış Veri:** Sayfalarda Google arama motoru için `Schema.org/Recipe` formatında JSON-LD bulunmaktadır; ancak bu veri yalnızca arama motoru dizinlemesi içindir, üçüncü parti toplu çekime açık bir API değildir.
* **Güvenlik & Anti-Bot:** Cloudflare WAF, bot koruması ve HTTP 403 erişim kısıtlamaları aktiftir.

### Robots.txt İncelemesi
`https://www.nefisyemektarifleri.com/robots.txt` dosyası canlı olarak incelenmiş ve şu kritik kurallar tespit edilmiştir:
1. **Yapay Zeka ve Model Eğitimi (AI Training):** `GPTBot`, `ClaudeBot`, `CCBot`, `Applebot-Extended`, `img2dataset`, `laion-huggingface-processor` dahil onlarca AI botu **kesin olarak engellenmiştir (`Disallow: /`)**.
2. **Scraper ve Veri Toplama Araçları:** `Scrapy`, `FirecrawlAgent`, `Crawl4AI`, `Diffbot`, `Spider` gibi araçlar **tamamen engellenmiştir (`Disallow: /`)**.
3. **Genel İçerik Sinyali:** `Content-Signal: ai-train=no, search=yes, ai-input=no` kuralı açıkça beyan edilmiştir.
4. **Hassas Dizinler:** `/nyt-images/`, `/wp-json/`, `/feed/`, `*filtrele*`, `/ara/` dizinleri tüm botlara kapatılmıştır.
* **Sonuç:** Otomatik scraper veya crawler ile toplu veri çekmek `robots.txt` kurallarını doğrudan ihlal eder (**DO NOT CRAWL**).

### Terms of Use & Kullanım Koşulları
* **Kişisel Kullanım:** İçerikler yalnızca son kullanıcının kişisel, ticari olmayan görüntüleme ve pişirme amaçlı erişimine açıktır.
* **Otomatik Veri Çıkarma (Scraping):** Ticari amaçla otomatik yazılımlarla (spider, bot, crawler, scraper) sitenin taranması ve içeriklerin kopyalanması yasaktır.
* **Ticari Kullanım İzni:** **VERİLMEMİŞTİR (NOT GRANTED)**.
* **Yeniden Yayınlama (Republication):** Sitedeki tariflerin ve fotoğrafların başka bir sitede veya ticari SaaS uygulamasında yayınlanması izne tabidir, açık lisans bulunmamaktadır.

### Content Rights (İçerik Hakları Ayrımı)
Fikir ve Sanat Eserleri Kanunu (FSEK) ve uluslararası telif hukuku kapsamında içerik bileşenleri:

| İçerik Türü | Telif Durumu | Cookly'de Kullanılabilir mi? | Gerekçe & Risk Seviyesi |
| :--- | :--- | :--- | :--- |
| **Tarif Fikri & Yemeğin Adı** (Örn: "Mercimek Çorbası") | Telif Koruması Yok (Genel Kültür / Fikir) | **EVET** (Özgün formatta) | Yemek isimleri ve tarif fikirleri telife tabi değildir. |
| **Ham Malzeme Listesi** (Örn: "1 bardak mercimek, 1 soğan") | Telif Koruması Yok (Olgusal Bilgi) | **EVET** (Kendi kataloğumuzla) | Olgusal malzeme listeleri teliflenemez; ancak toplu çalınamaz. |
| **Özgün Tarif Metni / Adımları** (Yazarın cümleleri) | Edebi Eser Koruması (FSEK m. 2) | **HAYIR (İzinsiz Yasak)** | Yazarın üslubu ve anlatımı telif altındadır. |
| **Yemek Fotoğrafları** | Fotoğrafik / Güzel Sanat Eseri (FSEK m. 4) | **HAYIR (İzinsiz Yasak)** | Sitedeki fotoğraflar kullanıcılara ve siteye aittir. Kopyalamak doğrudan hak ihlalidir. |
| **Yemek Videoları** | Sinema / Görsel-İşitsel Eser | **YALNIZCA IFRAME EMBED İLE** | Doğrudan indirmek yasaktır; YouTube resmi oynatıcısı (iframe embed) YouTube ToS altında izinlidir. |
| **Kullanıcı Yorumları & Puanlar** | Kişisel Veri / Özgün İçerik | **HAYIR (Yasak)** | Kullanıcıya ait içeriktir. Taşınamaz. |
| **Toplu Veritabanı** | Sui Generis Veritabanı Hakkı (FSEK Ek m. 8) | **HAYIR (Kesinlikle Yasak)** | Veritabanının önemli bir kısmının aktarılması suçtur. |

### Öneri & Değerlendirme (Nefis Yemek Tarifleri)
* **Risk Seviyesi:** **HIGH (Yüksek Risk)**
* **Karar:** Nefis Yemek Tarifleri sitesinden toplu veri çekmek, scraping yapmak veya fotoğraflarını kopyalamak **HUKUKEN VE TEKNİK OLARAK KESİNLİKLE UYGUN DEĞİLDİR**.
* **Doğru Yaklaşım:** Sitenin içeriği kopyalanmamalıdır. Bunun yerine Türk mutfağının anonim/geleneksel yemek isimleri ve malzeme standartları referans alınarak **Cookly'nin kendi özgün tarif metinleri ve telifsiz görsel havuzu** oluşturulmalıdır. YouTube videoları için ise YouTube'un resmi paylaşılabilir iframe embed mekanizması kullanılmalıdır.

---

## 2. Alternatif Kaynaklar Araştırması

| Kaynak | Türkçe İçerik | API | Lisans | Ticari Kullanım | Görseller | Risk | Notlar |
| :--- | :---: | :---: | :--- | :---: | :--- | :---: | :--- |
| **TheMealDB** | Kısmi (Kategori & Yemekler) | Var (JSON REST) | Public Domain / CC0 | **EVET** | Açık Lisanslı Fotoğraflar | **LOW** | 300+ dünya tarifi ve Türk yemekleri (Baklava, Menemen, Kumpir). Güvenli API entegrasyonu. |
| **Vikipedi / Vikikitap Mutfak** | **EVET (Zengin)** | Var (MediaWiki API) | CC-BY-SA 3.0 / 4.0 | **EVET** (Kaynak göstererek) | Wikimedia Commons (CC) | **LOW** | Türk mutfağı çorbaları, etli yemekleri ve tatlıları hakkında tam açık lisanslı ansiklopedik tarif metinleri. |
| **Open Food Facts (OFF)** | **EVET** | Var (JSON API) | Open Database License (ODbL) | **EVET** (ODbL şartlarında) | CC fotoğraflar | **LOW** | Malzeme adları, barkodlar, besin değerleri ve alerjenler için küresel açık veritabanı. |
| **Spoonacular / Edamam API** | Çoklu Dil Desteği | Var (Ticari REST API) | Ticari SaaS Sözleşmesi | **EVET** (Lisans dahilinde) | Yüksek Çözünürlük | **MEDIUM** | Gelişmiş besin analizi ve tarif veritabanı. Aylık API ücreti gerektirir. |
| **Kaggle / Recipe1M+** | İngilizce (Çeviri Gerekir) | Dosya (JSON/Parquet) | CC BY-NC-SA veya Araştırma | **HAYIR (Non-Commercial)** | Kısmi | **HIGH** | Yalnızca araştırma amaçlıdır, ticari SaaS için uygun değildir. |
| **Cookly Orijinal Kürasyon** | **EVET (%100 Özgün)** | Kendi Pipeline'ımız | Tam Mülkiyet (All Rights Reserved) | **EVET (%100 Güvenli)** | Unsplash / Telifsiz Gıda Fotoğrafçılığı | **LOW (Sıfır Risk)** | En sürdürülebilir, güvenilir ve yüksek kaliteli yöntem. Kendi aşçılık/şef ekibimizin hazırladığı standart tarifler. |

---

## 3. Kaynak Risk Matrisi (Risk Matrix)

```
┌─────────────────────────────────────────────────────────────┐
│                    KAYNAK RİSK MATRİSİ                      │
├───────────────┬─────────────────────────────────────────────┤
│ LOW RISK      │ - Cookly Özgün Kürasyon (Sıfır Risk)        │
│ (İzin Verildi)│ - TheMealDB (Açık API, CC)                  │
│               │ - Vikikitap / Wikimedia Mutfak (CC-BY-SA)   │
│               │ - Open Food Facts (ODbL)                    │
├───────────────┼─────────────────────────────────────────────┤
│ MEDIUM RISK   │ - Spoonacular / Edamam (Ticari Ücretli API) │
│ (İnceleme)    │ - YouTube Embeds (ToS uyumlu iframe)        │
├───────────────┼─────────────────────────────────────────────┤
│ HIGH RISK     │ - Nefis Yemek Tarifleri (Scraping YASAK)    │
│ (Engellendi)  │ - Yemek.com / Lezzet.com.tr (Scraping YASAK)│
│               │ - NC Lisanslı Datasetler (Ticari YASAK)     │
└───────────────┴─────────────────────────────────────────────┘
```

---

## 4. Önerilen Veri Stratejisi (Recommended Strategy)

Türkiye pazarına özel binlerce tariflik zengin bir havuz inşa etmek için **3 ayaklı hibrit strateji**:

1. **Katman 1 — Özgün Cookly Kürasyon Havuzu (%70):**
   * Türk mutfağının anonimleşmiş geleneksel yemekleri (Karnıyarık, Kuru Fasulye, Mercimek Çorbası, Menemen vb.) için malzemeler ve adımlar ekibimiz/şeflerimiz tarafından **özgün Türkçe cümlelerle** yazılır.
   * Görseller Unsplash, Pexels ve lisanslı mutfak fotoğrafçılığı kütüphanelerinden derlenir.
2. **Katman 2 — Açık Lisanslı Küresel Kaynaklar & Çeviri (%15):**
   * TheMealDB ve Vikikitap kaynakları üzerinden açık lisanslı tarifler sisteme entegre edilir.
3. **Katman 3 — Topluluk & Kullanıcı Katkısı (%15):**
   * Uygulamanın kendi içindeki "Tarif Ekle" (`AddRecipeModal`) sistemi ile kullanıcıların kendi tariflerini girmesi teşvik edilir.
4. **Videolar İçin:**
   * YouTube API / oEmbed standartları kullanılarak, şeflerin YouTube videoları doğrudan YouTube iframe oynatıcısı üzerinden platforma gömülür (izleme trafiği ve reklam geliri doğrudan video sahibine gider, telif hakkı korunur).

---

*Rapor Sonu. Cookly Mühendislik ve Hukuk Uyum Departmanı.*
