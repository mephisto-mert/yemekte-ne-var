import React from 'react';
import { Clock, Flame, Heart, Check, Plus, ChefHat, Video } from 'lucide-react';
import { Recipe, MatchResult } from '../types';

interface RecipeCardProps {
  recipe: Recipe;
  match?: MatchResult;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onStartCooking: (e: React.MouseEvent, recipe: Recipe) => void;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  match,
  isFavorite,
  onToggleFavorite,
  onSelectRecipe,
  onStartCooking
}) => {
  const isCanMake = match?.tier === 'can_make_now';
  const isAlmostThere = match?.tier === 'almost_there';

  return (
    <article 
      onClick={() => onSelectRecipe(recipe)}
      className="group relative bg-slate-900/90 rounded-2xl overflow-hidden border border-slate-800 hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/10 transition-all cursor-pointer flex flex-col"
    >
      {/* Recipe Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-800">
        <img
          src={recipe.image}
          alt={recipe.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            // Fallback image if Unsplash fails
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

        {/* Match Percentage Badge */}
        {match && (
          <div className="absolute top-3 left-3">
            {isCanMake ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950 shadow-md">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>%100 Yapabilirsin</span>
              </span>
            ) : isAlmostThere ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-md">
                <span>%{match.matchPercentage} Eşleşme</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-slate-800/90 text-slate-300 border border-slate-700">
                <span>%{match.matchPercentage} Eşleşme</span>
              </span>
            )}
          </div>
        )}

        {/* Favorite Heart Button */}
        <button
          onClick={(e) => onToggleFavorite(e, recipe.id)}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all shadow-md ${
            isFavorite 
              ? 'bg-rose-500 text-white' 
              : 'bg-slate-900/60 hover:bg-slate-900/90 text-slate-300 hover:text-rose-400'
          }`}
          title={isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Difficulty & Time Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-bold text-slate-200">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700/60">
              <Clock className="w-3 h-3 text-orange-400" />
              {recipe.cookingTime}
            </span>
            <span className="flex items-center gap-1 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-700/60">
              <Flame className="w-3 h-3 text-amber-400" />
              {recipe.calories} kcal
            </span>
            {recipe.videoId && (
              <span className="flex items-center gap-1 bg-rose-500/20 text-rose-300 border border-rose-500/40 px-1.5 py-0.5 rounded-md text-[10px] font-extrabold" title="Kısa Video Tarif Mevcut">
                <Video className="w-3 h-3 text-rose-400" />
                <span>Video</span>
              </span>
            )}
          </div>

          <span className="px-2 py-0.5 rounded-md text-[11px] bg-slate-800/90 text-slate-300 border border-slate-700/60">
            {recipe.difficulty}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-extrabold text-white group-hover:text-orange-400 transition-colors line-clamp-1 mb-1">
            {recipe.title}
          </h3>
          <p className="text-xs text-slate-400 line-clamp-2 mb-3">
            {recipe.description}
          </p>
        </div>

        {/* Missing / Matched Ingredient Summary */}
        <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
          {match ? (
            match.missingIngredients.length === 0 ? (
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Tüm malzemeler tam!
              </span>
            ) : match.missingIngredients.length <= 3 ? (
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" />
                {match.missingIngredients.length} eksik: {match.missingIngredients[0]?.name}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-slate-500">
                {match.missingIngredients.length} malzeme eksik
              </span>
            )
          ) : (
            <span className="text-[11px] text-slate-400">
              {recipe.ingredients.length} malzeme
            </span>
          )}

          {/* Quick Cook Button */}
          <button
            onClick={(e) => onStartCooking(e, recipe)}
            className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-500/15 text-orange-400 hover:bg-orange-500 hover:text-white border border-orange-500/30 transition-all flex items-center gap-1"
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Pişir</span>
          </button>
        </div>
      </div>
    </article>
  );
};
