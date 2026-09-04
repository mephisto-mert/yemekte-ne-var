import React from 'react';
import { X, Trophy, Flame, CheckCircle2, Award, Calendar } from 'lucide-react';
import { CookedHistoryEntry, ChefBadge } from '../types';

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

  const level = Math.floor(xp / 100) + 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Şef Karnesi & Geçmiş</h2>
              <p className="text-xs text-slate-400">Pişirdiğin yemekler ve mutfak başarıların</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Pişirilen</p>
            <p className="text-2xl font-black text-white mt-1">{cookedHistory.length}</p>
            <p className="text-[10px] text-slate-500">Yemek</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <p className="text-[11px] text-orange-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
              <Flame className="w-3.5 h-3.5" /> Seri
            </p>
            <p className="text-2xl font-black text-orange-400 mt-1">{streak}</p>
            <p className="text-[10px] text-slate-500">Gün Üst Üste</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-center">
            <p className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">Şef Seviyesi</p>
            <p className="text-2xl font-black text-amber-400 mt-1">Lv. {level}</p>
            <p className="text-[10px] text-slate-500">{xp} XP</p>
          </div>
        </div>

        {/* Most Cooked Banner */}
        {mostCookedCount > 0 && (
          <div className="p-3.5 rounded-2xl bg-orange-500/10 border border-orange-500/20 mb-4 flex items-center justify-between text-xs">
            <span className="text-slate-300">En çok pişirdiğin: <strong className="text-white">{mostCookedTitle}</strong></span>
            <span className="font-extrabold text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded-md">
              {mostCookedCount} kez
            </span>
          </div>
        )}

        {/* Badges Section */}
        <div className="mb-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" /> Şef Rozetleri
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BADGES.map(badge => {
              const isUnlocked = cookedHistory.length >= badge.requiredValue || (badge.category === 'streak' && streak >= badge.requiredValue);
              return (
                <div
                  key={badge.id}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isUnlocked
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                      : 'bg-slate-950/40 border-slate-800/40 opacity-40 grayscale'
                  }`}
                >
                  <div className="text-2xl mb-1">{badge.emoji}</div>
                  <p className="text-xs font-bold truncate">{badge.name}</p>
                  <p className="text-[10px] text-slate-400">{badge.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cooked History Timeline */}
        <div className="flex-1 overflow-y-auto pr-1">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-orange-400" /> Son Pişirilenler
          </h4>

          {cookedHistory.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">
              Henüz pişirilen yemek kaydedilmedi. Bir tarifi tamamlayıp "✓ Pişirdim" butonuna basarak kaydet.
            </p>
          ) : (
            <div className="space-y-2">
              {cookedHistory.map(item => (
                <div key={item.id} className="p-3 rounded-xl bg-slate-800/50 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="font-bold text-white">{item.recipeTitle}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(item.cookedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-amber-400">⭐ {item.rating}/5</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
