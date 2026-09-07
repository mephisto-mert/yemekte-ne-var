# 🍳 Cookly — Yemekte Ne Var? (Mutfak Kurtarıcı)

<div align="center">

> **"Tell us what you have. We'll tell you what you can make."**  
> *"Evde ne var bilmiyorum / ne yemek yapacağımı bilmiyorum / elimdeki malzemelerle ne yapabilirim?"* sorusunu çözen modern, mobil öncelikli mutfak asistanı.

![React](https://img.shields.io/badge/React-18.3-61dafb?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178c6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.0-646cff?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Vitest](https://img.shields.io/badge/Tests-15%20Passed-4ade80?style=for-the-badge&logo=vitest&logoColor=white)

</div>

---

## 🌟 Öne Çıkan Özellikler

### 1. 3 Kademeli Akıllı Malzeme Eşleştirme Motoru
- 🟢 **Hemen Yapabilirsin (0 Kritik Eksik)**: Evinizdeki malzemelerle anında pişirebileceğiniz yemekler. Su, tuz, karabiber, sıvı yağ gibi mutfak demirbaşları (`isStaple`) eksik olsa dahi tolerans gösterilir.
- 🟡 **1–3 Malzeme Eksik (Neredeyse Hazır)**: Sadece 1 veya 2 malzeme tamamlayarak yapabileceğiniz pratik yemekler.
- 🔴 **Diğer Tarifler (Geniş Havuz)**: Kilerinizdeki malzemelerle eşleşme yüzdesine göre sıralanmış tüm tarifler.
- ⏰ **Raf Ömrü Uyarısı**: Kilerinizde bozulmaya yaklaşan ürünleri turuncu uyarı rozetiyle öne çıkarır ve israfı önler.

### 2. Kararsızlar İçin: "Meal Roulette" 🎲
- *"I don't care. Pick something for me"* mantığıyla çalışan ağırlıklı seçim algoritması.
- Ruh hali ve mod filtreleri: *Fark etmez*, *Hızlı & Pratik (<30 dk)*, *Hafif & Sağlıklı*, *Doyurucu / Ziyafet*, *Sadece Elimdekiler*.
- Çok aşamalı dönme animasyonu, Web Audio API ses efekti ve konfeti patlaması.

### 3. Mutfakta Eller Yağlıyken: Adım Adım Pişirme Modu (Cooking Mode) 🍳
- Mutfakta tezgah başında kolay dokunulabilir dev adımlama butonları.
- Tarif adımlarındaki süreleri (örn. `15 dk`) otomatik tespit eden **Akıllı Sayaç** ve çift tonlu Web Audio alarm zili.
- Sayfadan ayrılmadan açılan **Malzeme Çekmecesi**.
- **Tezgah Başı Canlı Video Çekmecesi**: Sayacı durdurmadan adım üzerinde videoyu izleme imkanı.

### 4. 50/50 Doğrulanmış YouTube Kısa Video Eğitimi 🎥
- Veritabanındaki 50 yemeğin tamamı için test edilmiş, doğrulanmış YouTube kısa tarif videoları (Nefis Yemek Tarifleri, Yemek.com, Rıfat Yurttaş vb.).
- Varsa Türkçe (`🇹🇷 Türkçe`), uluslararası yemeklerde global (`🌍 Global`) kısa video önceliği.
- Video başlığı, kanal künyesi ve doğrudan YouTube'da açma bağlantısı.

### 5. Akıllı & Birleştirilmiş Alışveriş Listesi 🛒
- Tarif detayından tek tıkla eksik malzemeleri listeye aktarma (`+ Eksikleri Alışverişe Ekle`).
- **Mükerrer Birleştirme Algoritması**: Farklı tariflerden gelen malzemeleri otomatik toplar (örn: `Yumurta (4 adet + 4 adet)`).
- **Tek Tıkla Paylaş**: `WhatsApp Paylaş` ve `SMS Gönder` bağlantılarıyla ailenize veya manava anında gönderme.

### 6. Algoritmik Haftalık Yemek Planlayıcı (Haftalık Plan) 📅
- Pazartesi'den Pazar'a 7 günlük takvim.
- **"⚡ Fill My Week (Otomatik Doldur)"**: Kiler stoğunuzdaki malzemelere ve favorilerinize göre takvimi dengeli ve israfsız menülerle doldurur.

### 7. Dinamik Porsiyon Ölçekleyici, İkame Veritabanı ve Alerjenler
- Kişi sayısı değiştikçe (+ / -) malzeme miktarlarını kesirli ve tam sayılarla anında yeniden hesaplar.
- 20+ mutfak ikame maddesi (örn: tereyağı yerine zeytinyağı, krema yerine süt+tereyağı).
- 6 grupta otomatik alerjen taraması (Gluten, Laktoz, Fındık vb.).

### 8. Kişisel Tarif Ekleme & Şef Karnesi (Gamification) 👨‍🍳
- Kullanıcılar kendi aile tariflerini ("Annemin Köftesi" vb.) ekleyebilir; eklenen tarifler kiler eşleştirmesine anında dahil edilir.
- "✓ Pişirdim" loglama, pişirme serisi (🔥 streak), XP seviyesi ve 5 adet başarı rozeti.

### 9. Mobil Öncelikli & PWA Uyumlu Tasarım 📱
- Başparmak erişimine uygun `BottomNav` barı (Keşfet, Rulet, Plan, Liste, Defter).
- Hızlı kiler malzeme ekleme çipleri ve modern kart tipografisi.

---

## 🛠️ Teknoloji Yığını

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Canvas Confetti
- **Build Tool**: Vite 6
- **Test Framework**: Vitest (15 birim testi)
- **Veri & Eşleştirme**: %100 yerel ve deterministik algoritmalar (Sıfır dış ücretli API bağımlılığı)
- **Depolama**: LocalStorage kalıcılığı

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- Node.js (v18 veya üzeri)
- npm veya pnpm / yarn

### Adımlar

1. **Depoyu Klonlayın:**
```bash
git clone https://github.com/mephisto-mert/yemekte-ne-var.git
cd yemekte-ne-var
```

2. **Bağımlılıkları Yükleyin:**
```bash
npm install
```

3. **Geliştirme Sunucusunu Başlatın:**
```bash
npm run dev
```
Uygulama `http://localhost:3000/` adresinde çalışacaktır.

4. **Birim Testlerini Çalıştırın:**
```bash
npm test
```

5. **Üretim Derlemesi Alın:**
```bash
npm run build
```

---

## 📁 Proje Dizin Yapısı

```
pantry_hub/
├── src/
│   ├── components/            # UI Bileşenleri
│   │   ├── Navbar.tsx         # Üst menü barı ve mod geçişleri
│   │   ├── BottomNav.tsx      # Mobil alt navigasyon çubuğu
│   │   ├── KitchenPantrySection.tsx  # Kiler yönetim paneli ve hızlı ekleme
│   │   ├── MealResultsSection.tsx    # 3 kademeli yemek keşfi ve filtreler
│   │   ├── RecipeCard.tsx            # Yemek kartı (video ve eşleşme rozetleri)
│   │   ├── RecipeDetailModal.tsx     # Tarif detayı, porsiyon ve video oynatıcı
│   │   ├── CookingModeModal.tsx      # Pişirme modu, sayaç ve canlı video
│   │   ├── MealRouletteModal.tsx     # Ağırlıklı yemek ruleti modalı
│   │   ├── ShoppingListModal.tsx     # Alışveriş listesi ve WhatsApp paylaşımı
│   │   ├── WeeklyPlannerModal.tsx    # 7 günlük menü takvimi
│   │   ├── AddRecipeModal.tsx        # Kişisel özel tarif formu
│   │   └── UserHistoryModal.tsx      # Şef XP, seri ve rozetler
│   ├── data/                  # Tarif, malzeme ve video verileri
│   │   ├── ingredientsData.ts # 150+ kiler malzemesi ve demirbaş listesi
│   │   ├── raw_recipes.json   # 50 zengin tarif şablonu
│   │   ├── recipeVideos.json  # 50 doğrulanmış YouTube kısa video verisi
│   │   ├── recipesData.ts     # Normalleştirilmiş tarif havuzu
│   │   └── substitutesData.ts # Mutfak ikame maddeleri ve alerjenler
│   ├── services/              # Çekirdek iş mantığı ve algoritmalar
│   │   ├── matchingService.ts # 3 kademeli kiler eşleştirme motoru
│   │   ├── rouletteService.ts # Ağırlıklı rulet algoritması
│   │   ├── shoppingService.ts # Akıllı alışveriş listesi ve birleştirme
│   │   ├── plannerService.ts  # 7 günlük menü üretici
│   │   └── storageService.ts  # LocalStorage kalıcılık yönetimi
│   ├── test/                  # Vitest birim testleri
│   ├── utils/                 # Porsiyon ölçekleyici, Web Audio zil sesi
│   ├── types/                 # TypeScript veri modelleri
│   ├── App.tsx                # Ana uygulama bileşeni
│   └── main.tsx               # Uygulama giriş noktası
├── package.json
└── vite.config.ts
```

---

## 📄 Lisans

Bu proje MIT lisansı ile lisanslanmıştır.
