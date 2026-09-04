import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  Flame, 
  ChefHat, 
  Heart, 
  Share2, 
  Check, 
  Plus, 
  Minus, 
  AlertTriangle, 
  Video, 
  ShoppingBag,
  ExternalLink,
  Info
} from 'lucide-react';
import { Recipe, RecipeIngredient, MatchResult } from '../types';
import { calculatePortions } from '../utils/portionCalculator';
import { ALLERGEN_DATABASE, SUBSTITUTES_DATABASE } from '../data/substitutesData';

interface RecipeDetailModalProps {
  recipe: Recipe | null;
  onClose: () => void;
  match?: MatchResult;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onStartCooking: (recipe: Recipe) => void;
  onAddMissingToShopping: (missing: RecipeIngredient[], recipeTitle: string) => void;
  onMarkAsCooked: (recipe: Recipe) => void;
}

export const RecipeDetailModal: React.FC<RecipeDetailModalProps> = ({
  recipe,
  onClose,
  match,
  isFavorite,
  onToggleFavorite,
  onStartCooking,
  onAddMissingToShopping,
  onMarkAsCooked
}) => {
  if (!recipe) return null;

  const [servings, setServings] = useState<number>(recipe.servings || 4);
  const [selectedSubIng, setSelectedSubIng] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isCookedDone, setIsCookedDone] = useState(false);
  const [isShoppingAdded, setIsShoppingAdded] = useState(false);

  // Scaled ingredients
  const scaledIngredients = calculatePortions(recipe.ingredients, recipe.servings || 4, servings);

  // Allergen check
  const allergensFound: string[] = [];
  recipe.ingredients.forEach(ing => {
    const nameLower = ing.name.toLowerCase();
    Object.entries(ALLERGEN_DATABASE).forEach(([allergenName, items]) => {
      if (items.some(item => nameLower.includes(item))) {
        if (!allergensFound.includes(allergenName)) {
          allergensFound.push(allergenName);
        }
      }
    });
  });

  const handleShare = async () => {
    const shareText = `🍳 ${recipe.title}\n⏱️ ${recipe.cookingTime} | ${recipe.difficulty}\n🔥 ${recipe.calories} kcal\n\nCookly ile keşfet: https://mutfakkurtarici.app/recipe/${recipe.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: recipe.title,
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch {}
    }
    
    // Fallback: Copy to clipboard
    navigator.clipboard.writeText(shareText);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCookedClick = () => {
    onMarkAsCooked(recipe);
    setIsCookedDone(true);
    setTimeout(() => setIsCookedDone(false), 3000);
  };

  const missingList = match?.missingIngredients || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl my-auto h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Hero Image */}
        <div className="relative h-48 sm:h-64 w-full bg-slate-800 flex-shrink-0 overflow-hidden">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />

          {/* Floating Actions */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-900/80 text-orange-400 border border-slate-700/60 backdrop-blur-md">
              {recipe.cuisine || 'Türk Mutfağı'}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onToggleFavorite(recipe.id)}
                className={`p-2.5 rounded-full backdrop-blur-md transition-all shadow-lg ${
                  isFavorite ? 'bg-rose-500 text-white' : 'bg-slate-900/80 text-slate-300 hover:text-rose-400'
                }`}
                title="Favori"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={handleShare}
                className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white backdrop-blur-md transition-all shadow-lg"
                title="Tarifi Paylaş"
              >
                <Share2 className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white backdrop-blur-md transition-all shadow-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Title & Badge on bottom of hero */}
          <div className="absolute bottom-4 left-4 right-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-md">
              {recipe.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-700/60">
                <Clock className="w-3.5 h-3.5 text-orange-400" />
                {recipe.cookingTime}
              </span>
              <span className="flex items-center gap-1 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-slate-700/60">
                <Flame className="w-3.5 h-3.5 text-amber-400" />
                {recipe.calories} kcal
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-700/60 text-slate-300">
                {recipe.difficulty}
              </span>
              {recipe.chef && (
                <span className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  👨‍🍳 {recipe.chef}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          
          {copiedLink && (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold text-center">
              Tarif bağlantısı panoya kopyalandı! 📋
            </div>
          )}

          {/* Missing Ingredients Warning / Add to Cart Banner */}
          {missingList.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-4 h-4" />
                  Eksik Malzemeler ({missingList.length} adet)
                </h4>
                <p className="text-xs text-slate-300">
                  {missingList.map(i => `${i.name} (${i.amount || ''})`).join(', ')}
                </p>
              </div>

              <button
                onClick={() => {
                  onAddMissingToShopping(missingList, recipe.title);
                  setIsShoppingAdded(true);
                  setTimeout(() => setIsShoppingAdded(false), 2500);
                }}
                className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 shadow-md whitespace-nowrap self-start sm:self-auto ${
                  isShoppingAdded
                    ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
                    : 'bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20'
                }`}
              >
                {isShoppingAdded ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                <span>{isShoppingAdded ? 'Listeye Eklendi! ✓' : '+ Eksikleri Alışverişe Ekle'}</span>
              </button>
            </div>
          )}

          {/* Description */}
          <p className="text-sm text-slate-300 leading-relaxed">
            {recipe.description}
          </p>

          {/* Allergen Alert */}
          {allergensFound.length > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>Alerjen Uyarısı: Bu tarif <strong>{allergensFound.join(', ')}</strong> içerir.</span>
            </div>
          )}

          {/* Portion Scaler Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Malzemeler</span>
              <span className="text-xs font-normal text-slate-400">
                (Alternatif görmek için malzemeye tıkla)
              </span>
            </h3>

            {/* Servings Counter */}
            <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/80">
              <span className="text-xs text-slate-400 font-medium mr-1">Porsiyon:</span>
              <button
                onClick={() => setServings(Math.max(1, servings - 1))}
                className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-extrabold text-orange-400 w-4 text-center">
                {servings}
              </span>
              <button
                onClick={() => setServings(servings + 1)}
                className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Ingredients Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {scaledIngredients.map((ing, idx) => {
              const ingLower = ing.name.toLowerCase();
              const hasSub = Object.keys(SUBSTITUTES_DATABASE).some(k => ingLower.includes(k));
              const isMissing = missingList.some(m => m.name.toLowerCase() === ingLower);

              return (
                <div
                  key={idx}
                  onClick={() => hasSub && setSelectedSubIng(ingLower)}
                  className={`p-3 rounded-xl border transition-all flex items-center justify-between text-xs cursor-pointer ${
                    isMissing
                      ? 'bg-amber-500/5 border-amber-500/30 text-amber-200'
                      : 'bg-slate-800/50 border-slate-800 text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${isMissing ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    <span className="font-semibold">{ing.name}</span>
                    {hasSub && (
                      <span className="text-[10px] text-orange-400 font-bold bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">
                        Alternatif var
                      </span>
                    )}
                  </div>
                  <span className="font-bold text-slate-400">{ing.amount}</span>
                </div>
              );
            })}
          </div>

          {/* Substitute Modal Popover if selected */}
          {selectedSubIng && (
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 relative">
              <button
                onClick={() => setSelectedSubIng(null)}
                className="absolute top-2 right-2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
              {(() => {
                const subKey = Object.keys(SUBSTITUTES_DATABASE).find(k => selectedSubIng.includes(k));
                const subInfo = subKey ? SUBSTITUTES_DATABASE[subKey] : null;
                if (!subInfo) return null;
                return (
                  <div>
                    <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5" />
                      {subInfo.original} İçin Mutfak Alternatifleri:
                    </h4>
                    <div className="flex flex-wrap gap-1.5 mb-2 mt-2">
                      {subInfo.substitutes.map(sub => (
                        <span key={sub} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-900 text-orange-300 border border-slate-800">
                          ✓ {sub}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 italic">💡 Şef İpucu: {subInfo.tips}</p>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Step-by-Step Instructions */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3">
              Hazırlanış Adımları
            </h3>
            <div className="space-y-3">
              {recipe.instructions.map((step, idx) => (
                <div key={idx} className="flex gap-3 p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800/70">
                  <span className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center text-xs font-extrabold flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* YouTube Video Section */}
          <div className="pt-2">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-500 border border-rose-500/30 flex items-center justify-center">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Kısa Video Tarif</span>
                    {recipe.videoLanguage && (
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                        {recipe.videoLanguage === 'tr' ? '🇹🇷 Türkçe' : '🌍 Global'}
                      </span>
                    )}
                  </h3>
                  {recipe.videoAuthor && (
                    <p className="text-[11px] text-slate-400">
                      Kanal / Şef: <strong className="text-orange-400">{recipe.videoAuthor}</strong>
                    </p>
                  )}
                </div>
              </div>

              {recipe.videoId && (
                <a
                  href={`https://www.youtube.com/watch?v=${recipe.videoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700 shadow-sm"
                >
                  <span>YouTube'da Aç</span>
                  <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
                </a>
              )}
            </div>

            {recipe.videoId ? (
              <div className="space-y-2">
                <div className="relative aspect-video rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-xl">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${recipe.videoId}`}
                    title={recipe.videoTitle || recipe.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                </div>
                {recipe.videoTitle && (
                  <p className="text-xs text-slate-400 italic px-1">
                    🎬 {recipe.videoTitle}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Bu tarif için doğrudan video entegrasyonu hazırlandı. YouTube üzerinden izleyebilirsiniz.
                </p>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(`${recipe.title} tarifi nasıl yapılır`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md flex-shrink-0"
                >
                  <span>YouTube'da Ara</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleCookedClick}
            disabled={isCookedDone}
            className="py-3 px-4 rounded-xl text-xs font-extrabold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{isCookedDone ? '✓ Geçmişe Eklendi!' : '✓ Pişirdim'}</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onStartCooking(recipe);
            }}
            className="flex-1 min-w-[200px] py-3.5 px-6 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 active:scale-[0.98] transition-all"
          >
            <ChefHat className="w-5 h-5" />
            <span>PİŞİRME MODUNU BAŞLAT</span>
          </button>
        </div>

      </div>
    </div>
  );
};
