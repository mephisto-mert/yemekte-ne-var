# Recipe Image Acquisition & Safe Download Pipeline

**Versiyon:** 1.0.0  
**Tarih:** 5 Eylül 2026  
**Durum:** Üretime Hazır (Production-Grade Foundation)

---

## 1. Genel Bakış

Bu doküman, Cookly (Yemekte Ne Var?) platformunun onaylı görsel kaynaklarından (Pexels, yetkili API'ler veya küratörlü depolar) tespit edilen tarif görsel adaylarını (`ImageCandidate`) yerel, güvenli ve doğrulanmış görsel varlıklarına (`RecipeImageAsset`) dönüştüren **Güvenli İndirme ve İşleme Hattı'nı (Safe Download Pipeline)** tanımlar.

Bu sistem, PART 5 İzin Politikası (`SourcePermissionPolicy`), PART 6 Görsel Hattı, PART 7 Edinim Motoru ve PART 8 Pexels entegrasyonu üzerine inşa edilmiştir.

---

## 2. Mimari Akış ve Güvenlik Katmanları

```
Recipe
  │
  ▼
Query Builder ("Mercimek Çorbası food")
  │
  ▼
Approved Provider (Pexels / Curated)
  │
  ▼
ImageCandidate (permissionPolicy === 'allowed')
  │
  ▼
Candidate Ranking (Tier 1 Local > Tier 2 Licensed External)
  │
  ▼
Download Plan (Sanitized Path: public/images/recipes/{id}.webp)
  │
  ▼
[SSRF & URL Security Gate] ──► (localhost, 127.0.0.1, 10.x, 169.254.x.x BLOCKED)
  │
  ▼
[Safe HTTP Downloader] ─────► (Max 10MB, Timeout, Redirect Verification)
  │
  ▼
[Binary Signature Gate] ────► (Magic Bytes: JPEG, PNG, WEBP; HTML/SVG BLOCKED)
  │
  ▼
[Dimension Gate] ───────────► (Min 200x200, Max 6000px, 1x1 Pixel BLOCKED)
  │
  ▼
[Integrity Gate] ───────────► (SHA-256 Checksum, Zero Mutation)
  │
  ▼
[Atomic Storage] ───────────► (.tmp file -> fs.rename -> Final Path)
  │
  ▼
RecipeImageAsset Metadata & Manifest
```

---

## 3. Temel Bileşenler

### 3.1. SSRF & URL Güvenliği (`SafeUrlValidator`)
- **Protokol Güvenliği:** Yalnızca `https:` (ve test ortamında opsiyonel `http:`) protokolüne izin verilir. `javascript:`, `data:`, `file:`, `blob:`, `ftp:` kesinlikle reddedilir.
- **SSRF Önleme (Sunucu Taraflı İstek Sahteciliği):**
  - Yerel ana makineler (`localhost`, `*.localhost`, `loopback`, `0.0.0.0`) engellenir.
  - RFC 1918 Özel IP blokları (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`) engellenir.
  - Bulut meta veri servisi (`169.254.169.254` / `169.254.0.0/16`) engellenir.
  - Sayısal/onaltılık gizlenmiş IP'ler (`0x7f000001`, `2130706433`) engellenir.
  - IPv6 yerel ve bağlantı-yerel adresler (`::1`, `fc00::/7`, `fe80::/10`) engellenir.
- **Port Güvenliği:** Yalnızca standart portlara (80, 443) izin verilir.

### 3.2. Yönlendirme Güvenliği (Redirect Safety)
- Otomatik ve kontrolsüz HTTP yönlendirmesi engellenmiştir (`redirect: 'manual'`).
- Her 301, 302, 307, 308 yanıtında `Location` başlığı ayıklanır ve hedef URL **tekrar SSRF ve protokol güvenlik süzgecinden geçirilir**.
- Maksimum 3 yönlendirmeye izin verilir (yönlendirme döngüsü koruması).

### 3.3. Dosya İmzası ve Magic Bytes Doğrulaması (`BinaryImageValidator`)
- Yalnızca HTTP `Content-Type` başlığına güvenilmez (örneğin bir HTML hata sayfası JPEG Content-Type ile servis edilebilir).
- İndirilen binary akışın ilk baytları doğrulanır:
  - **JPEG:** `FF D8 FF`
  - **PNG:** `89 50 4E 47 0D 0A 1A 0A`
  - **WEBP:** `52 49 46 46` (RIFF) ... `57 45 42 50` (WEBP)
- Content-Type ile tespit edilen dosya imzası uyuşmadığında dosya derhal reddedilir.
- HTML etiketleri (`<html`, `<!doctype`, `<body`) veya SVG dosyaları tespit edildiğinde işlem iptal edilir.

### 3.4. Boyut ve Çözünürlük Denetimi
- Binary başlıklarından (PNG IHDR, JPEG SOF işaretçileri, WebP VP8/VP8L/VP8X blokları) harici kütüphane bağımlılığı olmaksızın gerçek genişlik ve yükseklik okunur.
- Minimum sınır: `200x200` piksel (1x1 izleme pikselleri engellenir).
- Maksimum sınır: `6000x6000` piksel (dekompresyon saldırıları engellenir).

### 3.5. Atomik Dosya Yazma (`AtomicFileWriter`)
- Dosya asla doğrudan hedef yola yazılmaz.
- Önce hedef dizinde gizli bir geçici dosya (`.recipe_id.tmp_timestamp_random`) oluşturulur.
- Tüm doğrulama ve yazma işlemleri bittikten sonra işletim sistemi düzeyinde atomik `fs.rename` çağrısı ile nihai konuma taşınır.
- Herhangi bir hata durumunda geçici dosya derhal silinir; diskte bozuk/yarım dosya bırakılmaz.

### 3.6. SHA-256 Sağlama Toplamı (Checksum) ve Bütünlük
- Başarıyla indirilen her dosyanın SHA-256 özeti hesaplanır.
- Çift (duplicate) görsellerin tespiti ve veri bütünlüğü denetimi bu özet üzerinden sağlanır.

---

## 4. İndirme Durumu Yaşam Döngüsü (Download Status)

| Durum | Açıklama |
| :--- | :--- |
| `planned` | Aday onaylandı, deterministik hedef dosya yolu oluşturuldu. |
| `downloading`| Güvenli HTTP istemcisi veri akışını aktarıyor. |
| `downloaded` | Binary akış RAM tamponuna alındı. |
| `validated`  | Magic bytes, Content-Type, boyut ve boyut sınırları doğrulandı. |
| `processed`  | Checksum hesaplandı, metaveri hazırlandı. |
| `stored`     | Atomik olarak kalıcı depolama alanına taşındı. |
| `failed`     | Ağ hatası, zaman aşımı veya doğrulama başarısızlığı. |
| `rejected`   | SSRF ihlali, telif politikası kısıtı (`prohibited`/`needs_review`). |

---

## 5. Komutlar ve Kullanım

### 1. Kuru Çalıştırma (Dry-Run Simülasyonu)
```bash
npm run image:download:dry-run
```
- İlk 3 tarif için plan oluşturur.
- Harici ağ çağrısı yapmaz (Ağ: 0).
- Diske dosya yazmaz (Yazma: 0, İndirme: 0).
- Üretim veri setini değiştirmez.

### 2. Canlı İndirme Testi (Maksimum 3 Tarif)
```bash
npm run image:download:test
```
- `PEXELS_API_KEY` mevcut değilse güvenle `[SKIPPED]` çıktısı vererek (Exit 0) sonlanır.
- `PEXELS_API_KEY` mevcutsa izole sandbox dizinine (`test-output/images/`) en fazla 3 görsel indirir, manifest üretir ve doğrular.
- Üretim `public/` veya `src/data/` dizinlerini kirletmez.

### 3. Otomatik Birim Testleri
```bash
npm test
```
- %100 mocklanmış yerel binary fikstürler kullanılır.
- Sıfır canlı harici ağ çağrısı garantisi.

---

## 6. Üretim Veri Seti Dokunulmazlığı (Immutability Guarantee)

Bu aşamada:
- `src/data/raw_recipes.json`
- `src/data/recipesData.ts`
dosyalarına otomatik görsel URL'si **kesinlikle yazılmaz**. İndirilen görseller ayrı bir varlık manifestosu (`manifest.json`) ile yönetilir. Tarif veri setine bağlama işlemi sonraki aşamalarda kontrollü olarak gerçekleştirilecektir.
