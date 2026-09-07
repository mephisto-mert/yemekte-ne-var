import React from 'react';
import { Recipe } from '../../types';

interface RecipeChefPairingProps {
  recipe: Recipe;
}

export const RecipeChefPairing: React.FC<RecipeChefPairingProps> = ({ recipe }) => {
  const text = (recipe.title + ' ' + (recipe.category || '') + ' ' + (recipe.cuisine || '')).toLowerCase();
  
  let pairing = {
    side: 'Mevsim yeşillikleri salatası veya hafif yoğurtlu garnitür',
    drink: 'Taze nane yapraklı soğuk ayran veya doğal maden suyu',
    flavorNote: 'Dengeli mutfak baharatları ve fırın/ocak pişirme lezzeti',
    tags: ['✨ Ev Yapımı', '👌 Dengeli Tabak', '🌿 Taze Otlar']
  };

  if (text.includes('kebap') || text.includes('köfte') || text.includes('et') || text.includes('pirzola') || text.includes('kavurma') || text.includes('döner')) {
    pairing = {
      side: 'Sumaklı maydanozlu soğan salatası, lavaş & közlenmiş sivri biber',
      drink: 'Buz gibi köpüklü yayık ayranı veya Acılı Şalgam',
      flavorNote: 'Yoğun köz kokusu ve etin sulu dokusunu asitli salata dengeler',
      tags: ['🔥 Köz Kokulu', '🥩 Zengin Protein', '🌾 Anadolu Ziyafeti']
    };
  } else if (text.includes('balık') || text.includes('levrek') || text.includes('somon') || text.includes('çupra') || text.includes('hamsi')) {
    pairing = {
      side: 'Taze roka, mor soğan halkaları ve taze sıkılmış zeytinyağlı limon',
      drink: 'Limonlu maden suyu veya taze zencefilli limonata',
      flavorNote: 'Deniz minerallerinin tazeliği turunçgil dokunuşuyla parlar',
      tags: ['🌊 Hafif & Taze', '🍋 Narenciye Dengesi', '🐟 Omega-3']
    };
  } else if (text.includes('çorba') || text.includes('mercimek') || text.includes('tarhana') || text.includes('yayla')) {
    pairing = {
      side: 'Fırınlanmış tereyağlı kruton ekmek veya sıcak ramazan pidesi',
      drink: 'Limonlu ılık su veya ev yapımı elma kompostosu',
      flavorNote: 'Mideyi ısıtan ipeksi kıvam ve tereyağlı dağ nanesi kokusu',
      tags: ['🍲 Şifalı & Isıtıcı', '🌿 İpeksi Kıvam', '🌾 Doyurucu']
    };
  } else if (text.includes('makarna') || text.includes('mantı') || text.includes('pasta') || text.includes('erişte') || text.includes('lazanya')) {
    pairing = {
      side: 'Sarımsaklı süzme yoğurt & tereyağlı pul biberli kızgın sos',
      drink: 'Fesleğenli soğuk maden suyu veya ev yapımı buzlu çay',
      flavorNote: 'Al dente hamur dokusu ile zengin tereyağı ve sarımsak uyumu',
      tags: ['🍝 İtalyan & Anadolu', '🧄 Sarımsaklı Yoğurt', '🧈 Tereyağlı']
    };
  } else if (text.includes('tatlı') || text.includes('baklava') || text.includes('sütlaç') || text.includes('revani') || text.includes('kek') || text.includes('brownie')) {
    pairing = {
      side: 'Bir top hakiki Maraş kesme dondurması veya kaymak',
      drink: 'Taze çekilmiş orta şekerli Türk kahvesi veya ince belli tavşan kanı çay',
      flavorNote: 'Şerbet ve sütün uyumu, kahvenin asil acılığı ile dengelenir',
      tags: ['🍰 Tatlı & Keyifli', '☕ Türk Kahvesi Eşleşmesi', '✨ Ziyafet Sonu']
    };
  }

  return (
    <div id="recipe-section-pairing" className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-slate-800/40 border border-amber-500/30">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-heading">
          <span>👨‍🍳 Şefin Tadım & Eşleşme Notları</span>
        </h4>
        <div className="flex gap-1">
          {pairing.tags.map((t, idx) => (
            <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {t}
            </span>
          ))}
        </div>
      </div>

      <p className="text-xs text-slate-300 italic mb-3">
        "{pairing.flavorNote}"
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">🥗 Önerilen Garnitür / Yan Lezzet:</span>
          <span className="font-semibold text-slate-200">{pairing.side}</span>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-700/50">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">🥤 Uyumlu İçecek Eşleşmesi:</span>
          <span className="font-semibold text-slate-200">{pairing.drink}</span>
        </div>
      </div>
    </div>
  );
};