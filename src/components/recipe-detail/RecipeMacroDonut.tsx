import React from 'react';
import { Recipe } from '../../types';

interface RecipeMacroDonutProps {
  recipe: Recipe;
}

export const RecipeMacroDonut: React.FC<RecipeMacroDonutProps> = ({ recipe }) => {
  const baseKcal = recipe.calories || 350;
  let p = recipe.macros?.protein;
  let c = recipe.macros?.carbs;
  let f = recipe.macros?.fat;

  if (!p || !c || !f) {
    const text = (recipe.title + ' ' + (recipe.category || '')).toLowerCase();
    if (text.includes('kebap') || text.includes('köfte') || text.includes('et') || text.includes('tavuk') || text.includes('balık')) {
      p = Math.round((baseKcal * 0.35) / 4);
      c = Math.round((baseKcal * 0.30) / 4);
      f = Math.round((baseKcal * 0.35) / 9);
    } else if (text.includes('börek') || text.includes('çorba') || text.includes('makarna') || text.includes('pilav') || text.includes('tatlı')) {
      p = Math.round((baseKcal * 0.15) / 4);
      c = Math.round((baseKcal * 0.60) / 4);
      f = Math.round((baseKcal * 0.25) / 9);
    } else {
      p = Math.round((baseKcal * 0.22) / 4);
      c = Math.round((baseKcal * 0.48) / 4);
      f = Math.round((baseKcal * 0.30) / 9);
    }
  }

  const totalGrams = (p * 4) + (c * 4) + (f * 9);
  const pPct = Math.round(((p * 4) / totalGrams) * 100) || 25;
  const cPct = Math.round(((c * 4) / totalGrams) * 100) || 50;
  const fPct = Math.max(0, 100 - pPct - cPct);

  // SVG Donut geometry
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashProtein = `${(pPct / 100) * circumference} ${circumference}`;
  const strokeDashCarb = `${(cPct / 100) * circumference} ${circumference}`;
  const strokeDashFat = `${(fPct / 100) * circumference} ${circumference}`;
  const offsetCarb = -((pPct / 100) * circumference);
  const offsetFat = -(((pPct + cPct) / 100) * circumference);

  return (
    <div id="recipe-section-nutrition" className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700/60 flex flex-col sm:flex-row items-center gap-5">
      <div className="relative flex-shrink-0 w-24 h-24 flex items-center justify-center">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 80 80" aria-label="Besin Değeri Dağılımı">
          <circle
            cx="40"
            cy="40"
            r={radius}
            className="text-slate-800 stroke-current"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Protein Arc (Emerald) */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="#10b981"
            strokeWidth="8"
            strokeDasharray={strokeDashProtein}
            strokeDashoffset="0"
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700"
          />
          {/* Carb Arc (Amber) */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="#f59e0b"
            strokeWidth="8"
            strokeDasharray={strokeDashCarb}
            strokeDashoffset={offsetCarb}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700"
          />
          {/* Fat Arc (Rose) */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            stroke="#f43f5e"
            strokeWidth="8"
            strokeDasharray={strokeDashFat}
            strokeDashoffset={offsetFat}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-xs font-black text-white">{baseKcal}</span>
          <span className="text-[9px] font-bold text-slate-400">kcal/por</span>
        </div>
      </div>

      <div className="flex-1 w-full grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-extrabold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Protein
          </div>
          <p className="text-sm font-black text-white mt-0.5">{p}g</p>
          <p className="text-[10px] text-emerald-300 font-semibold">%{pPct}</p>
        </div>

        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-extrabold text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Karb
          </div>
          <p className="text-sm font-black text-white mt-0.5">{c}g</p>
          <p className="text-[10px] text-amber-300 font-semibold">%{cPct}</p>
        </div>

        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
          <div className="flex items-center justify-center gap-1 text-[11px] font-extrabold text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            Yağ
          </div>
          <p className="text-sm font-black text-white mt-0.5">{f}g</p>
          <p className="text-[10px] text-rose-300 font-semibold">%{fPct}</p>
        </div>
      </div>
    </div>
  );
};