import React, { useState, useEffect } from 'react';
import { X, Crown, Check, Zap, Sparkles, Loader2, HeartHandshake } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { PRICING_TIERS, StripeService } from '../services/stripeService';

export const SubscriptionModal: React.FC = () => {
  const {
    user,
    isPro,
    isSubscriptionModalOpen,
    closeSubscriptionModal,
    openAuthModal,
    upgradeToPro
  } = useAuth();

  const [selectedTier, setSelectedTier] = useState<'pro_monthly' | 'pro_annual'>('pro_monthly');
  const [isProcessing, setIsProcessing] = useState(false);
  const [upgraded, setUpgraded] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSubscriptionModalOpen) {
        closeSubscriptionModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSubscriptionModalOpen, closeSubscriptionModal]);

  if (!isSubscriptionModalOpen) return null;

  const handleUpgrade = async () => {
    if (!user) {
      closeSubscriptionModal();
      openAuthModal('signup');
      return;
    }

    setIsProcessing(true);
    try {
      const res = await StripeService.startCheckout(selectedTier, user.email);
      if (res.success) {
        upgradeToPro();
        setUpgraded(true);

        // Trigger confetti celebration
        try {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
          });
        } catch {
          // ignore if canvas-confetti is not available
        }

        setTimeout(() => {
          setUpgraded(false);
          closeSubscriptionModal();
        }, 2200);
      }
    } catch (err) {
      console.error('Subscription upgrade failed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscription-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn"
      onClick={closeSubscriptionModal}
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden max-h-[95vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Hero */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-amber-600 via-orange-600 to-amber-500 text-white text-center">
          <button
            onClick={closeSubscriptionModal}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md mb-3 shadow-lg">
            <Crown className="w-8 h-8 text-amber-200 fill-amber-300" />
          </div>
          <h2 id="subscription-modal-title" className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif">
            Cookly PRO ile Mutfakta Devrim
          </h2>
          <p className="text-xs sm:text-sm text-white/90 mt-2 max-w-md mx-auto">
            Sınırsız özel tarif oluşturun, çoklu cihazlarınızda anında eşitleyin ve yapay zeka şef özelliklerinin tadını çıkarın.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
          {isPro ? (
            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h3 className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                Tebrikler! Cookly PRO Kullanıcısısınız
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300 max-w-sm mx-auto">
                Tüm PRO ayrıcalıklarınız, sınırsız tarif ve öncelikli bulut eşitlemeniz aktif durumdadır.
              </p>
            </div>
          ) : (
            <>
              {/* Plan Toggle Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PRICING_TIERS.filter((t) => t.id !== 'free').map((tier) => {
                  const isSelected = selectedTier === tier.id;
                  return (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedTier(tier.id as any)}
                      className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/30 shadow-md ring-2 ring-amber-500/20'
                          : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-stone-50/50 dark:bg-stone-800/40'
                      }`}
                    >
                      {tier.badge && (
                        <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white shadow-sm">
                          {tier.badge}
                        </span>
                      )}
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-stone-900 dark:text-stone-100 text-base">
                          {tier.name}
                        </h4>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-amber-500 bg-amber-500' : 'border-stone-300 dark:border-stone-600'
                        }`}>
                          {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1 my-2">
                        <span className="text-3xl font-extrabold text-stone-900 dark:text-white">
                          {tier.price}
                        </span>
                        <span className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                          {tier.period}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 dark:text-stone-400">
                        {tier.description}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Feature Checklist */}
              <div className="bg-stone-50 dark:bg-stone-800/50 rounded-2xl p-5 border border-stone-100 dark:border-stone-800">
                <h5 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Cookly PRO ile Dahil Olan Ayrıcalıklar
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    'Sınırsız Özel Tarif Oluşturma',
                    'Anında Çoklu Cihaz Bulut Eşitlemesi',
                    'Yapay Zeka Destekli Menü Önerileri',
                    'Besin Değerleri ve Makro Takibi',
                    'Onaylı Altın Şef Rozeti & Profil',
                    'Reklamsız & Kesintisiz Mutfak Modu',
                  ].map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-medium text-stone-800 dark:text-stone-200">
                      <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div>
                <button
                  type="button"
                  onClick={handleUpgrade}
                  disabled={isProcessing || upgraded}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white rounded-2xl font-bold text-sm shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>İşleniyor...</span>
                    </>
                  ) : upgraded ? (
                    <>
                      <Check className="w-5 h-5 stroke-[3]" />
                      <span>PRO Aktif Edildi!</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-white" />
                      <span>
                        {!user
                          ? 'Hesap Aç ve PRO\'ya Geç'
                          : selectedTier === 'pro_monthly'
                          ? 'Ayda ₺79 ile Hemen Başla'
                          : 'Yılda ₺699 ile Avantajlı Başla'}
                      </span>
                    </>
                  )}
                </button>
                <p className="text-[11px] text-center text-stone-400 dark:text-stone-500 mt-2.5 flex items-center justify-center gap-1">
                  <HeartHandshake className="w-3.5 h-3.5" />
                  İstediğiniz zaman tek tıkla iptal edebilirsiniz. 14 gün koşulsuz iade garantisi.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
