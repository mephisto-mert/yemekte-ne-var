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

const RecipeCardComponent: React.FC<RecipeCardProps> = ({
  recipe,
  match,
  isFavorite,
  onToggleFavorite,
  onSelectRecipe,
  onStartCooking
}) => {
  const isCanMake = match?.tier === 'can_make_now';
  const isAlmostThere = match?.tier === 'almost_there';

  const [heartBurst, setHeartBurst] = React.useState(false);

  const handleHeartClick = (e: React.MouseEvent) => {
    setHeartBurst(true);
    setTimeout(() => setHeartBurst(false), 450);
    onToggleFavorite(e, recipe.id);
  };

  return (
    <article 
      onClick={() => onSelectRecipe(recipe)}
      className="group relative bg-white dark:bg-slate-900/90 rounded-3xl overflow-hidden border border-stone-200/90 dark:border-slate-800/90 hover:border-orange-500/60 food-card-hover cursor-pointer flex flex-col shadow-sm dark:shadow-md backdrop-blur-sm animate-tab-enter transition-colors"
    >
      {/* Recipe Image Container */}
      <div className="relative aspect-[16/10] overflow-hidden bg-stone-100 dark:bg-slate-800">
        <img
          src={recipe.image}
          alt={recipe.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          onError={(e) => {
            // Fallback image if image fails
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Match Percentage Badge */}
        {match && (
          <div className="absolute top-3 left-3 z-10">
            {isCanMake ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 border border-emerald-400/40 animate-pulse-subtle">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>%100 Dolabında Var</span>
              </span>
            ) : isAlmostThere ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-400/40">
                <span>%{match.matchPercentage} Eşleşme</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-950/80 text-slate-300 border border-slate-700/80 backdrop-blur-md">
                <span>%{match.matchPercentage} Eşleşme</span>
              </span>
            )}
          </div>
        )}

        {/* Favorite Heart Button with Burst Effect */}
        <button
          onClick={handleHeartClick}
          className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all shadow-md z-10 active:scale-90 magnetic-spring ${
            heartBurst ? 'animate-heart-burst ring-4 ring-rose-500/40' : ''
          } ${
            isFavorite 
              ? 'bg-rose-500 text-white shadow-rose-500/30' 
              : 'bg-black/40 hover:bg-black/60 text-white/90 hover:text-rose-400 border border-white/20'
          }`}
          title={isFavorite ? "Favorilerden Çıkar" : "Favorilere Ekle"}
        >
          <Heart className={`w-4 h-4 transition-transform ${isFavorite ? 'fill-current scale-110' : ''}`} />
        </button>

        {/* Quick Difficulty, Calories & Video Overlay */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-bold text-white z-10">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center gap-1 bg-slate-950/85 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-700/60 text-slate-200">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              {recipe.cookingTime}
            </span>
            <span className="flex items-center gap-1 bg-slate-950/85 backdrop-blur-md px-2 py-0.5 rounded-lg border border-slate-700/60 text-slate-200">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              {recipe.calories} kcal
            </span>
            {recipe.videoId && (
              <span className="flex items-center gap-1 bg-rose-500/30 backdrop-blur-md text-rose-200 border border-rose-500/50 px-2 py-0.5 rounded-lg text-[11px] font-black shadow-sm" title="Canlı Video Tarif">
                <Video className="w-3.5 h-3.5 text-rose-400" />
                <span>Video</span>
              </span>
            )}
          </div>

          <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold bg-slate-950/85 backdrop-blur-md text-slate-300 border border-slate-700/60">
            {recipe.difficulty}
          </span>
        </div>
      </div>

      {/* Card Body & Macro Pills */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-extrabold text-stone-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors line-clamp-1 mb-1 font-heading">
            {recipe.title}
          </h3>
          <p className="text-xs text-stone-600 dark:text-slate-400 line-clamp-2 mb-3 leading-relaxed">
            {recipe.description}
          </p>

          {/* Macro Nutrient Pills with Micro-Hover Zoom */}
          {recipe.macros && (
            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-500/20 hover:scale-105 transition-transform">
                🍗 {recipe.macros.protein}g Protein
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 hover:scale-105 transition-transform">
                🌾 {recipe.macros.carbs}g Karb
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:scale-105 transition-transform">
                🥑 {recipe.macros.fat}g Yağ
              </span>
            </div>
          )}
        </div>

        {/* Missing / Matched Ingredient Summary */}
        <div className="pt-2.5 border-t border-stone-100 dark:border-slate-800/80 flex items-center justify-between">
          {match ? (
            match.missingIngredients.length === 0 ? (
              <span className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                Tüm malzemeler tam!
              </span>
            ) : match.missingIngredients.length <= 3 ? (
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 truncate max-w-[170px]" title={`${match.missingIngredients.length} eksik: ${match.missingIngredients.map(i => i.name).join(', ')}`}>
                <Plus className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{match.missingIngredients.length} eksik: {match.missingIngredients[0]?.name}</span>
              </span>
            ) : (
              <span className="text-[11px] font-medium text-stone-500 dark:text-slate-400">
                {match.missingIngredients.length} malzeme eksik
              </span>
            )
          ) : (
            <span className="text-[11px] text-stone-500 dark:text-slate-400 font-medium">
              {recipe.ingredients.length} malzeme
            </span>
          )}

          {/* Quick Cook Button */}
          <button
            onClick={(e) => onStartCooking(e, recipe)}
            className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 shadow-md shadow-orange-500/20 active:scale-95 magnetic-spring transition-all flex items-center gap-1.5 whitespace-nowrap"
          >
            <ChefHat className="w-3.5 h-3.5 text-slate-950" />
            <span>Pişir</span>
          </button>
        </div>
      </div>
    </article>
  );
};

export const RecipeCard = React.memo(RecipeCardComponent);
