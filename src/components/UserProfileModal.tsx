import React, { useState, useEffect } from 'react';
import { X, User, Crown, LogOut, Check, Save, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DIETARY_OPTIONS = [
  { id: 'all', label: 'Tümü (Kısıtlama Yok)' },
  { id: 'vegetarian', label: 'Vejetaryen' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten-free', label: 'Glütensiz' },
  { id: 'dairy-free', label: 'Laktozsuz' },
  { id: 'keto', label: 'Ketojenik' },
];

const ALLERGEN_OPTIONS = [
  { id: 'gluten', label: 'Glüten' },
  { id: 'dairy', label: 'Süt / Laktoz' },
  { id: 'egg', label: 'Yumurta' },
  { id: 'peanut', label: 'Yer Fıstığı' },
  { id: 'treenuts', label: 'Kabuklu Yemişler' },
  { id: 'seafood', label: 'Deniz Ürünleri' },
  { id: 'soy', label: 'Soya' },
];

export const UserProfileModal: React.FC = () => {
  const {
    user,
    profile,
    isPro,
    isProfileModalOpen,
    closeProfileModal,
    openSubscriptionModal,
    updateProfile,
    signOut
  } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [dietaryPreference, setDietaryPreference] = useState('all');
  const [allergens, setAllergens] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setDietaryPreference(profile.dietaryPreference || 'all');
      setAllergens(profile.allergens || []);
    }
  }, [profile, isProfileModalOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isProfileModalOpen) {
        closeProfileModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isProfileModalOpen, closeProfileModal]);

  if (!isProfileModalOpen || !user) return null;

  const toggleAllergen = (id: string) => {
    setAllergens(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateProfile({
        displayName,
        dietaryPreference,
        allergens,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err) {
      console.error('Profile update error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={closeProfileModal}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-stone-900 rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-white flex items-center justify-between border-b border-stone-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl">
              {displayName.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="profile-modal-title" className="text-lg font-bold text-white">
                  {displayName || 'Kullanıcı Profili'}
                </h2>
                {isPro ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 shadow-sm">
                    <Crown className="w-3 h-3 fill-stone-950" />
                    PRO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-700 text-stone-300">
                    Ücretsiz Plan
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-400">{user.email}</p>
            </div>
          </div>
          <button
            onClick={closeProfileModal}
            className="p-2 text-stone-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Subscription banner */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
            isPro
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
              : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
          }`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Abonelik Durumu
              </p>
              <p className="text-sm font-bold mt-0.5">
                {isPro ? '✨ Cookly Pro Aktif' : 'Standart Ücretsiz Plan'}
              </p>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                {isPro
                  ? 'Sınırsız özel tarif, öncelikli bulut senkronizasyonu ve gelişmiş planlayıcı.'
                  : 'Sınırsız tarif oluşturma ve tüm Pro özellikler için yükseltin.'}
              </p>
            </div>
            {!isPro && (
              <button
                type="button"
                onClick={() => {
                  closeProfileModal();
                  openSubscriptionModal();
                }}
                className="shrink-0 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
              >
                <Crown className="w-3.5 h-3.5" />
                Pro'ya Geç
              </button>
            )}
          </div>

          {/* Cloud Sync Status */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Bulut Senkronizasyonu Aktif</span>
            </div>
            <span className="font-semibold text-[10px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 rounded-full">
              Canlı
            </span>
          </div>

          {/* Display Name Input */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
              Görünen Ad / Şef Unvanı
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Dietary Preferences */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
              Beslenme Tercihi
            </label>
            <div className="grid grid-cols-2 gap-2">
              {DIETARY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setDietaryPreference(opt.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border text-left transition-all flex items-center justify-between ${
                    dietaryPreference === opt.id
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                      : 'border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  <span>{opt.label}</span>
                  {dietaryPreference === opt.id && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                </button>
              ))}
            </div>
          </div>

          {/* Allergens Selection */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">
              Alerjenler (Tariflerde Uyarılır)
            </label>
            <div className="flex flex-wrap gap-2">
              {ALLERGEN_OPTIONS.map((all) => {
                const isSelected = allergens.includes(all.id);
                return (
                  <button
                    key={all.id}
                    type="button"
                    onClick={() => toggleAllergen(all.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      isSelected
                        ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-400 text-rose-700 dark:text-rose-300 font-semibold'
                        : 'border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800'
                    }`}
                  >
                    {isSelected ? '⚠️ ' : ''}{all.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save & Sign Out buttons */}
          <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                signOut();
                closeProfileModal();
              }}
              className="px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              Çıkış Yap
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Kaydediliyor...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Kaydedildi!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Değişiklikleri Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
