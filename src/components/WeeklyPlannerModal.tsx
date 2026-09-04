import React from 'react';
import { 
  X, 
  CalendarDays, 
  Sparkles, 
  Trash2, 
  ChefHat, 
  ExternalLink,
  Clock
} from 'lucide-react';
import { DailyMealPlan, Recipe, DayOfWeek } from '../types';
import { PlannerService } from '../services/plannerService';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface WeeklyPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: DailyMealPlan[];
  recipes: Recipe[];
  pantryItems: string[];
  onUpdatePlan: (newPlan: DailyMealPlan[]) => void;
  onSelectRecipe: (recipe: Recipe) => void;
}

export const WeeklyPlannerModal: React.FC<WeeklyPlannerModalProps> = ({
  isOpen,
  onClose,
  plan,
  recipes,
  pantryItems,
  onUpdatePlan,
  onSelectRecipe
}) => {
  useEscapeKey(onClose, isOpen);

  if (!isOpen) return null;

  const handleAutoFill = () => {
    const newPlan = PlannerService.autoFillWeek(recipes, pantryItems);
    onUpdatePlan(newPlan);
  };

  const handleClearDay = (day: DayOfWeek) => {
    const updated = plan.map(p => p.day === day ? { ...p, dinnerRecipeId: undefined } : p);
    onUpdatePlan(updated);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Haftalık Yemek Takvimi</h2>
              <p className="text-xs text-slate-400">Pazartesi'den Pazar'a ne pişireceğini önceden planla</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoFill}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>⚡ Fill My Week (Otomatik Doldur)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 7-Day Grid */}
        <div className="flex-1 overflow-y-auto py-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {plan.map((item) => {
            const recipe = recipes.find(r => r.id === item.dinnerRecipeId);

            return (
              <div
                key={item.day}
                className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black tracking-wider uppercase text-orange-400 bg-orange-500/10 px-2.5 py-0.5 rounded-md border border-orange-500/20">
                    {item.day}
                  </span>
                  {recipe && (
                    <button
                      onClick={() => handleClearDay(item.day)}
                      className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      title="Günü Boşalt"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {recipe ? (
                  <div 
                    onClick={() => {
                      onClose();
                      onSelectRecipe(recipe);
                    }}
                    className="cursor-pointer group flex-1 flex flex-col justify-between"
                  >
                    <div>
                      <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-slate-800 mb-2">
                        <img
                          src={recipe.image}
                          alt={recipe.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h4 className="text-sm font-extrabold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                        {recipe.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-orange-400" />
                        {recipe.cookingTime}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-orange-400 font-bold">
                      <span>Tarifi Gör</span>
                      <ExternalLink className="w-3 h-3" />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-800/80 rounded-xl">
                    <ChefHat className="w-6 h-6 text-slate-600 mb-1" />
                    <p className="text-xs text-slate-500 font-medium">Yemek atanmadı</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};
