import React from 'react';

interface RecipeStoryRingsProps {
  instructions: string[];
  onStepSelect?: (index: number) => void;
}

const STEP_ICONS = ['🔪', '🍳', '🧂', '🥘', '⏱️', '🔥', '🍽️', '✨'];

export const RecipeStoryRings: React.FC<RecipeStoryRingsProps> = ({ instructions, onStepSelect }) => {
  const handleScrollToStep = (idx: number) => {
    if (onStepSelect) {
      onStepSelect(idx);
    }
    const el = document.getElementById(`recipe-step-${idx}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-orange-500', 'bg-orange-500/20');
      setTimeout(() => el.classList.remove('ring-2', 'ring-orange-500', 'bg-orange-500/20'), 1500);
    }
  };

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-3 mb-3 scrollbar-none">
      {instructions.map((_, idx) => {
        const icon = STEP_ICONS[idx % STEP_ICONS.length];
        return (
          <button
            key={idx}
            type="button"
            onClick={() => handleScrollToStep(idx)}
            className="flex flex-col items-center gap-1 flex-shrink-0 group focus:outline-none"
            title={`Adım ${idx + 1}'e git`}
          >
            <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-tr from-orange-500 via-amber-400 to-rose-500 group-hover:scale-105 transition-all shadow-md">
              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-base font-bold">
                <span>{icon}</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-slate-400 group-hover:text-orange-400 transition-colors">
              Adım {idx + 1}
            </span>
          </button>
        );
      })}
    </div>
  );
};