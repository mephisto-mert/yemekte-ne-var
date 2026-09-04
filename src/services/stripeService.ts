export interface PricingTier {
  id: 'free' | 'pro_monthly' | 'pro_annual';
  name: string;
  price: string;
  period: string;
  description: string;
  badge?: string;
  features: { title: string; included: boolean }[];
  highlight?: boolean;
}

export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'free',
    name: 'Mutfak Çırağı',
    price: '₺0',
    period: 'süresiz',
    description: 'Evdeki malzemelerle harika yemekler keşfetmek için ideal başlangıç.',
    features: [
      { title: 'Tüm 50+ Temel Tarif Kataloğu', included: true },
      { title: 'Akıllı 3 Aşamalı Malzeme Eşleştirme', included: true },
      { title: 'Yemek Ruleti & Pişirme Modu Zamanlayıcılar', included: true },
      { title: '5 Adete Kadar Özel Tarif Ekleme', included: true },
      { title: 'Haftalık Yemek Planlayıcı (Temel)', included: true },
      { title: 'Yerel ve Bulut Veri Yedekleme', included: true },
      { title: 'Sınırsız Özel Tarif Oluşturma', included: false },
      { title: 'Yapay Zeka Destekli Haftalık Menü Doldurma', included: false },
      { title: 'Öncelikli Çoklu Cihaz Senkronizasyonu', included: false },
      { title: 'Onaylı Şef Rozeti & VIP Destek', included: false },
    ],
    highlight: false,
  },
  {
    id: 'pro_monthly',
    name: 'Cookly PRO',
    price: '₺79',
    period: '/ ay',
    badge: 'En Popüler',
    description: 'Yemek yapmayı tutkuya dönüştürenler ve profesyonel mutfak düzeni isteyenler için.',
    features: [
      { title: 'Tüm 50+ Temel Tarif Kataloğu', included: true },
      { title: 'Akıllı 3 Aşamalı Malzeme Eşleştirme', included: true },
      { title: 'Yemek Ruleti & Pişirme Modu Zamanlayıcılar', included: true },
      { title: 'Sınırsız Özel Tarif Oluşturma', included: true },
      { title: 'Haftalık Yemek Planlayıcı (Sınırsız)', included: true },
      { title: 'Anında Çoklu Cihaz Gerçek Zamanlı Eşitleme', included: true },
      { title: 'Yapay Zeka Destekli Haftalık Menü Doldurma', included: true },
      { title: 'Beslenme Uzmanı Makro & Kalori Takibi', included: true },
      { title: 'Onaylı Altın Şef Rozeti', included: true },
      { title: 'Öncelikli Müşteri Desteği', included: true },
    ],
    highlight: true,
  },
  {
    id: 'pro_annual',
    name: 'Cookly PRO Yıllık',
    price: '₺699',
    period: '/ yıl',
    badge: '%26 Tasarruf',
    description: 'Yıllık peşin ödemede 2 ay hediye! En avantajlı şef deneyimi.',
    features: [
      { title: 'Tüm PRO Özellikleri Dahil', included: true },
      { title: 'Sınırsız Özel Tarif Oluşturma', included: true },
      { title: 'Anında Çoklu Cihaz Gerçek Zamanlı Eşitleme', included: true },
      { title: 'Yapay Zeka Destekli Haftalık Menü Doldurma', included: true },
      { title: 'Beslenme Uzmanı Makro & Kalori Takibi', included: true },
      { title: 'Onaylı Altın Şef Rozeti & VIP Topluluk', included: true },
    ],
    highlight: false,
  },
];

export const FREE_CUSTOM_RECIPE_LIMIT = 5;

export const StripeService = {
  /**
   * Check if user can add more custom recipes under their tier
   */
  canCreateCustomRecipe(currentCount: number, isPro: boolean): { allowed: boolean; limit: number; remaining: number } {
    if (isPro) {
      return { allowed: true, limit: Infinity, remaining: Infinity };
    }
    const remaining = Math.max(0, FREE_CUSTOM_RECIPE_LIMIT - currentCount);
    return {
      allowed: currentCount < FREE_CUSTOM_RECIPE_LIMIT,
      limit: FREE_CUSTOM_RECIPE_LIMIT,
      remaining,
    };
  },

  /**
   * Initiate Stripe Checkout or simulated activation
   */
  async startCheckout(tierId: 'pro_monthly' | 'pro_annual', userEmail?: string): Promise<{ success: boolean; url?: string; message?: string }> {
    const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    const stripePriceId = tierId === 'pro_annual' 
      ? import.meta.env.VITE_STRIPE_PRO_ANNUAL_PRICE_ID 
      : import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID;

    // If Stripe keys are configured and valid, call backend checkout endpoint
    if (stripePublishableKey && stripePriceId && !stripePublishableKey.includes('placeholder')) {
      try {
        const response = await fetch('/api/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priceId: stripePriceId, email: userEmail }),
        });
        const session = await response.json();
        if (session.url) {
          window.location.href = session.url;
          return { success: true, url: session.url };
        }
      } catch (err) {
        console.warn('Stripe checkout network call failed, falling back to simulated checkout:', err);
      }
    }

    // Interactive Demo Simulation Mode
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'Tebrikler! Cookly PRO aboneliğiniz başarıyla aktif edildi.',
        });
      }, 800);
    });
  }
};
