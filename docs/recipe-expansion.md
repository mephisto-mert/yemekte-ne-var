# Recipe Content Expansion & Media Enrichment Engine (PART 14)

**Versiyon:** 14.0.0  
**Tarih:** 6 Eylül 2026  
**Durum:** Üretime Hazır (Production-Grade Expansion Architecture)

---

## 1. Genel Bakış ve Amaç

PART 14 (Full Recipe Content Expansion — Fast Development Mode), Cookly / Yemekte Ne Var? platformunun içerik kataloğunu kontrollü, güvenli ve zenginleştirilmiş şekilde büyütmek için tasarlanmıştır.

Bu aşamada:
- TheMealDB ve izinli açık veri kaynaklarından kontrollü partiler halinde tarifler çekilir (10, 50, maksimum 100 tarif).
- YouTube resmi privacy-enhanced embed (`youtube-nocookie.com/embed/{id}`) modelleriyle video eşleştirmesi yapılır.
- Pexels ve doğrulanmış CDN kaynaklarıyla lisanslı görsel eşleştirmesi ve kalite puanlaması yürütülür.
- Türkçe yerelleştirme, taksonomi sınıflandırması ve malzeme normalizasyonu uygulanır.
- 10 maddelik Üretim Kabul Kapısı (Production Eligibility Gate) ile üretim veri seti korunur.

---

## 2. Medya Zenginleştirme ve Güvenlik Kuralları

### A. YouTube Video Güvenliği ve Embed Politikası
1. **İzinli Alan Adları:** Yalnızca resmi YouTube alan adları (`https://www.youtube-nocookie.com/embed/...`, `https://www.youtube.com/embed/...`) kabul edilir.
2. **Protokol Güvenliği:** `javascript:`, `data:`, `vbscript:`, `file:`, `http:` ve zararlı XSS karakterleri kesinlikle reddedilir.
3. **Deterministik Uygunluk Skoru (`calculateVideoRelevanceScore`):** 
   - 11 haneli doğrulanmış ID (+40 puan)
   - Başlık ve anahtar kelime eşleşmesi (+30 puan)
   - Mutfak/yemek kanalı otoritesi (+20 puan)
   - Mutfak ve dil bağlamı uyumu (+10 puan)
4. **Dosya İndirme Yasağı:** Sunucuya hiçbir video dosyası (.mp4, .mkv vb.) indirilmez. Yalnızca privacy-enhanced iframe embed bağlantıları oluşturulur.

### B. Görsel Kalite Kapısı ve Lisans Güvencesi
1. **Placeholder Filtresi:** `placehold.co`, sahte URL'ler ve sentetik placeholderlar reddedilir.
2. **Lisans Güvencesi:** Pexels/CC0 lisanslı görseller `authorized` / `ready` statüsü alırken, topluluk kaynaklı görseller `needs_review` inceleme kuyruğuna alınır.
3. **Çözünürlük ve CDN:** Güvenilir CDN'ler (Pexels, Unsplash, Wikimedia) önceliklendirilir.

---

## 3. Komutlar ve Kullanım

| Komut | Açıklama |
| :--- | :--- |
| `npm run recipe:expand:dry-run` | Simülasyon modunda içerik genişletme ve medya zenginleştirme provası çalıştırır. |
| `npm run recipe:expand -- --limit 10` | TheMealDB'den 10 tariflik kontrollü canlı genişletme batch'i işler. |
| `npm run recipe:expand -- --limit 50` | 50 tariflik canlı genişletme batch'i işler. |
| `npm run recipe:expand -- --query chicken` | Belirli bir sorguya göre canlı tarif çekip staging hattında zenginleştirir. |
| `npm run recipe:staging:dry-run` | Staging katalog dry-run çalıştırması. |
| `npm test` | Tüm 459 birim ve entegrasyon testini çalıştırır. |
| `npm run build` | TypeScript ve Vite üretim derlemesini doğrular. |

---

## 4. İzolasyon ve Koruma Garantileri

- **Üretim Veri Seti Dokunulmazlığı:** `src/data/raw_recipes.json` (50 tarif) ve `src/data/recipesData.ts` dosyalarında 0 değişiklik yapılır (`git diff -- src/data/` = 0).
- **Supabase Güvenliği:** Uzak veritabanına 0 mutasyon yapılır.
- **Batch Boyut Limiti:** Maksimum 100 tarif (`MAX_STAGING_BATCH_SIZE`). 100'ü aşan istekler açıkça hata verir.
