import React, { useState } from 'react';

interface RecipeDetailNavTabsProps {
  hasVideo?: boolean;
}

export const RecipeDetailNavTabs: React.FC<RecipeDetailNavTabsProps> = ({ hasVideo = false }) => {
  const [activeTab, setActiveTab] = useState<string>('ingredients');

  const tabs = [
    { id: 'ingredients', targetId: 'recipe-section-ingredients', label: 'Malzemeler', icon: '📋' },
    { id: 'nutrition', targetId: 'recipe-section-nutrition', label: 'Besin', icon: '📊' },
    { id: 'pairing', targetId: 'recipe-section-pairing', label: 'Şef Notu', icon: '👨‍🍳' },
    { id: 'steps', targetId: 'recipe-section-steps', label: 'Adımlar', icon: '🔪' },
    ...(hasVideo ? [{ id: 'video', targetId: 'recipe-section-video', label: 'Video', icon: '🎬' }] : []),
  ];

  const handleTabClick = (tabId: string, targetId: string) => {
    setActiveTab(tabId);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav aria-label="Tarif Hızlı Navigasyon" className="sticky top-0 z-20 py-2.5 px-4 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 -mx-6 mb-4 flex items-center gap-2 overflow-x-auto scrollbar-none">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => handleTabClick(tab.id, tab.targetId)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              isActive
                ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};