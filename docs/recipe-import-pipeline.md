# Scalable Recipe Import Pipeline

**Versiyon:** 1.0.0  
**Tarih:** 5 Eylül 2026  
**Durum:** Üretime Hazır (Production-Grade Import Foundation)

---

## 1. Genel Bakış

Bu doküman, Cookly (Yemekte Ne Var?) platformunun gelecekte binlerce veya on binlerce tarifi güvenli, tekrarsız, yüksek kaliteli ve tam yasal uyumlulukla içeri almasını sağlayan **Tarif İçe Aktarım Hattı'nı (Recipe Import Pipeline)** tanımlar.

Sistem, rastgele scraper'lar veya kontrolsüz toplu veri indirmeleri yerine; izin verilen sağlayıcılar (`RecipeProvider`), Türkçe normalizasyon, ölçeklenebilir mükerrer tespiti ($O(1)$ indexleme), kalite puanı denetimi (`RecipeImportQualityGate`) ve görsel/video hazır bulunuşluk entegrasyonu üzerine kurulmuştur.

---

## 2. Mimari Akış

```
[Recipe Source Provider] (TheMealDB / Curated / Mock)
           │
           ▼
     [RawRecipe] ◄─── (Eksik veriler null; asla sahte kalori/şef uydurulmaz)
           │
           ▼
[Turkish Normalization] ──► (İ/I, Ş/s, Ğ/g kanonik anahtarlar; orijinal başlık korunur)
           │
           ▼
  [Taxonomy & Tags] ──────► (Scalable Türkçe kategoriler; doğrulanabilir etiketler)
           │
           ▼
 [Scalable Deduplication] ─► (O(1) Kanonik Başlık, Kaynak ID ve Malzeme İmzası)
           │
           ▼
 [Import Quality Gate] ───► (VALID | WARNING | REVIEW_REQUIRED | REJECTED)
           │
           ▼
  [Media Readiness] ──────► (Image Ready, Video Ready, Missing States)
           │
           ▼
   [Batch Manifest] ──────► (Denetim kaydı, istatistikler, hata izolasyonu)
           │
           ▼
   [Dry-Run / Gate] ──────► (Production veri seti ve Supabase %100 KORUNUR)
```

---

## 3. Sağlayıcı Sözleşmesi (`RecipeProvider`)

Tüm veri sağlayıcıları standart sözleşmeyi uygular:
- `search(options)`: Başlık, kategori veya anahtar kelimeye göre arama yapar.
- `fetchById(id)`: Tekil tarif detayını çeker.
- `fetchBatch(options)`: Sayfalama (pagination) ve imleç (cursor) destekli toplu veri çeker.
- `metadata`: İzin durumu (`allowed`, `review_required`, `prohibited`), lisans bilgisi, kota limitleri ve yetenekleri (`capabilities`) beyan eder.

---

## 4. Türkçe Karakter Normalizasyonu

- **Kullanıcı Başlığı:** "İskender Kebap", "Karnıyarık", "Çoban Salatası" gibi Türkçe karakterler kullanıcı arayüzü için aynen korunur.
- **Kanonik Karşılaştırma Anahtarı:** İ/ı -> i, ğ -> g, ü -> u, ş -> s, ö -> o, ç -> c dönüşümleriyle noktalama işaretleri ve gereksiz boşluklar temizlenir (`iskender kebap`, `karniyarik`).
- Bu sayede `İSKENDER KEBABI` ile `iskender kebabı` tam olarak eşleşir.

---

## 5. Ölçeklenebilir Mükerrer Tespiti (Scalable Deduplication)

10.000+ tariflik büyük veri setlerinde $O(n^2)$ çift döngü karmaşıklığından kaçınmak için $O(1)$ harita indeksleme kullanılır:
1. **Kanonik Başlık İndeksi (`Map<string, NormalizedRecipe[]>`):** Özdeş isimli tarifleri anında tespit eder.
2. **Kaynak Kimliği İndeksi (`Map<string, NormalizedRecipe>`):** `provider:id` bileşik anahtarıyla mükerrer kayıtları engeller.
3. **Malzeme İmzası İndeksi (`Map<string, NormalizedRecipe[]>`):** Temel olmayan en belirleyici 5 malzemenin alfabetik sıralı imzasıyla içerik benzerliğini yakalar.
4. **Başlık Benzerliği (Token Jaccard):** "Karnıyarık" ile "Kıymalı Karnıyarık" gibi tarifleri otomatik silmez; `title_similarity` adayı olarak incelemeye (`REVIEW_REQUIRED`) yönlendirir.

---

## 6. İçe Aktarım Kalite Kapısı (`RecipeImportQualityGate`)

Her aday 0-100 arasında kalite puanı (`calculateRecipeQualityScore`) alır:
- **`VALID`:** Başlık, en az 2 malzeme, en az 1 adım, onaylı lisans, görsel ve video adayı mevcut, mükerrer yok.
- **`WARNING`:** İçerik tam ve kullanılabilir, ancak görsel veya video adayı henüz temin edilmemiş.
- **`REVIEW_REQUIRED`:** Hukuki inceleme bekleyen lisans, benzer tarif şüphesi veya eksik veri adımları.
- **`REJECTED`:** Yasaklı kaynak (prohibited), eksik başlık, sıfır malzeme, sıfır adım veya kabul edilemez kalite puanı.

---

## 7. Güvenlik ve Gizlilik

- **SSRF Koruması:** Sağlayıcı veya tarif kaynak URL'lerinde yerel IP'ler (`127.0.0.1`, `10.x`, `169.254.x`) engellenir.
- **Gizli Bilgi Maskeleme:** API anahtarları loglarda, hata mesajlarında ve manifestolarda maskelenir (`[REDACTED]`).
- **Nefis Yemek Tarifleri:** robots.txt ve telif hakları gereği kesinlikle crawl/scrape edilmez.
- **Veri Seti Dokunulmazlığı:** `raw_recipes.json` ve `recipesData.ts` dosyaları salt-okunurdur; bu aşamada hiçbir otomatik yazım yapılmaz.

---

## 8. Komutlar

```bash
# Kuru Çalıştırma (10 örnek tarif, sıfır indirme, sıfır disk yazımı)
npm run recipe:import:dry-run

# Güvenlik Kilitli CLI Arayüzü
npm run recipe:import
```
