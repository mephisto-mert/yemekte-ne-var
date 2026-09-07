import React from 'react';
import { X, Trophy, Flame, CheckCircle2, Award, Calendar } from 'lucide-react';
import { CookedHistoryEntry, ChefBadge } from '../types';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface UserHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  cookedHistory: CookedHistoryEntry[];
  streak: number;
  xp: number;
}

const BADGES: ChefBadge[] = [
  { id: '1', name: 'İlk Adım', emoji: '🥄', description: 'İlk tarifini mutfakta pişir', requiredValue: 1, category: 'cooking' },
  { id: '2', name: 'Acemi Aşçı', emoji: '🍳', description: '5 farklı tarif tamamla', requiredValue: 5, category: 'cooking' },
  { id: '3', name: 'Usta Şef', emoji: '👨‍🍳', description: '15 tarif tamamla', requiredValue: 15, category: 'cooking' },
  { id: '4', name: 'Ateşli Seri', emoji: '🔥', description: '3 gün üst üste yemek pişir', requiredValue: 3, category: 'streak' },
  { id: '5', name: 'Kiler Avcısı', emoji: '📦', description: 'Kilerindeki malzemelerle yemek yap', requiredValue: 1, category: 'explore' },
];

export const UserHistoryModal: React.FC<UserHistoryModalProps> = ({
  isOpen,
  onClose,
  cookedHistory,
  streak,
  xp
}) => {
  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  // Compute most cooked meal
  const counts: Record<string, number> = {};
  cookedHistory.forEach(entry => {
    counts[entry.recipeTitle] = (counts[entry.recipeTitle] || 0) + 1;
  });

  let mostCookedTitle = 'Henüz yok';
  let mostCookedCount = 0;
  Object.entries(counts).forEach(([title, count]) => {
    if (count > mostCookedCount) {
      mostCookedTitle = title;
      mostCookedCount = count;
    }
  });

  const getChefRank = (currentXp: number) => {
    if (currentXp >= 1000) return { title: 'Gastronomi Efsanesi', emoji: '👑', color: 'from-amber-400 to-yellow-500', nextTier: 'Maksimum Seviye', targetXp: 1000, progress: 100 };
    if (currentXp >= 600) return { title: 'Aşçıbaşı', emoji: '👨‍🍳', color: 'from-orange-500 to-amber-500', nextTier: 'Gastronomi Efsanesi (1000 XP)', targetXp: 1000, progress: Math.round(((currentXp - 600) / 400) * 100) };
    if (currentXp >= 300) return { title: 'İstasyon Şefi', emoji: '🥘', color: 'from-rose-500 to-orange-500', nextTier: 'Aşçıbaşı (600 XP)', targetXp: 600, progress: Math.round(((currentXp - 300) / 300) * 100) };
    if (currentXp >= 100) return { title: 'Komi Şef', emoji: '🔪', color: 'from-emerald-500 to-teal-500', nextTier: 'İstasyon Şefi (300 XP)', targetXp: 300, progress: Math.round(((currentXp - 100) / 200) * 100) };
    return { title: 'Mutfak Çırağı', emoji: '🍳', color: 'from-blue-500 to-cyan-500', nextTier: 'Komi Şef (100 XP)', targetXp: 100, progress: Math.round((currentXp / 100) * 100) };
  };

  const rank = getChefRank(xp);
  const level = Math.floor(xp / 100) + 1;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 border-0 sm:border border-stone-200 dark:border-slate-800 rounded-none sm:rounded-3xl p-5 sm:p-8 shadow-2xl overflow-hidden h-full sm:h-auto max-h-screen sm:max-h-[90vh] flex flex-col transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-stone-900 dark:text-white font-heading">Şef Karnesi & Başarılar</h2>
              <p className="text-xs text-stone-500 dark:text-slate-400">Mutfak rütben, pişirdiğin yemekler ve serilerin</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:text-slate-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D Chef Rank Progression Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border border-amber-500/30 shadow-lg my-3">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl shadow-inner">
                {rank.emoji}
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block">Mutfak Rütbesi</span>
                <h3 className="text-base font-black text-stone-900 dark:text-white font-heading">{rank.title}</h3>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-xl border border-amber-500/25">
                Lv. {level} ({xp} XP)
              </span>
            </div>
          </div>

          {/* Animated XP Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-stone-500 dark:text-slate-400 font-bold">
              <span>Sonraki Rütbe: {rank.nextTier}</span>
              <span className="text-amber-600 dark:text-amber-300 font-extrabold">%{rank.progress}</span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-stone-200 dark:bg-slate-800 overflow-hidden p-0.5 border border-stone-300 dark:border-slate-700">
              <div
                className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-700 shadow-sm"
                style={{ width: `${Math.min(100, Math.max(5, rank.progress))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-950/80 border border-stone-200 dark:border-slate-800 text-center shadow-xs">
            <p className="text-[11px] text-stone-500 dark:text-slate-400 font-bold uppercase tracking-wider">Pişirilen</p>
            <p className="text-2xl font-black text-stone-900 dark:text-white mt-1">{cookedHistory.length}</p>
            <p className="text-[10px] text-stone-400 dark:text-slate-500">Yemek</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-950/80 border border-stone-200 dark:border-slate-800 text-center shadow-xs">
            <p className="text-[11px] text-orange-600 dark:text-orange-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5" /> Seri
            </p>
            <p className="text-2xl font-black text-orange-600 dark:text-orange-400 mt-1">{streak}</p>
            <p className="text-[10px] text-stone-400 dark:text-slate-500">Gün Üst Üste</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-slate-950/80 border border-stone-200 dark:border-slate-800 text-center shadow-xs">
            <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider">Kazanılan XP</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">+{xp}</p>
            <p className="text-[10px] text-stone-400 dark:text-slate-500">Mutfak Puanı</p>
          </div>
        </div>

        {/* Most Cooked Banner */}
        {mostCookedCount > 0 && (
          <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-4 flex items-center justify-between text-xs">
            <span className="text-stone-700 dark:text-slate-300">En çok pişirdiğin: <strong className="text-stone-900 dark:text-white">{mostCookedTitle}</strong></span>
            <span className="font-extrabold text-orange-600 dark:text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-md">
              {mostCookedCount} kez
            </span>
          </div>
        )}

        {/* Badges Section */}
        <div className="mb-4">
          <h4 className="text-xs font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-500" /> Şef Rozetleri
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BADGES.map(badge => {
              const isUnlocked = cookedHistory.length >= badge.requiredValue || (badge.category === 'streak' && streak >= badge.requiredValue);
              return (
                <div
                  key={badge.id}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isUnlocked
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200 shadow-xs'
                      : 'bg-stone-100/50 dark:bg-slate-950/40 border-stone-200 dark:border-slate-800/40 opacity-40 grayscale'
                  }`}
                >
                  <div className="text-2xl mb-1">{badge.emoji}</div>
                  <p className="text-xs font-bold truncate text-stone-900 dark:text-white">{badge.name}</p>
                  <p className="text-[10px] text-stone-500 dark:text-slate-400">{badge.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cooked History Timeline */}
        <div className="flex-1 overflow-y-auto pr-1">
          <h4 className="text-xs font-bold text-stone-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-orange-500" /> Son Pişirilenler
          </h4>

          {cookedHistory.length === 0 ? (
            <p className="text-xs text-stone-400 dark:text-slate-500 text-center py-6">
              Henüz pişirilen yemek kaydedilmedi. Bir tarifi tamamlayıp "✓ Pişirdim" butonuna basarak kaydet.
            </p>
          ) : (
            <div className="space-y-2">
              {cookedHistory.map(item => (
                <div key={item.id} className="p-3 rounded-xl bg-stone-50 dark:bg-slate-800/50 border border-stone-200 dark:border-slate-800 flex items-center justify-between text-xs shadow-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="font-bold text-stone-900 dark:text-white">{item.recipeTitle}</p>
                      <p className="text-[10px] text-stone-500 dark:text-slate-400">
                        {new Date(item.cookedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-amber-500">⭐ {item.rating}/5</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

