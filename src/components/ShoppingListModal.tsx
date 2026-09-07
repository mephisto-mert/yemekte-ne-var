import React, { useState } from 'react';
import { 
  X, 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Check, 
  Share2, 
  MessageSquare, 
  Smartphone 
} from 'lucide-react';
import { ShoppingItem } from '../types';
import { ShoppingService } from '../services/shoppingService';
import { useEscapeKey } from '../hooks/useEscapeKey';

interface ShoppingListModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ShoppingItem[];
  onToggleItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onAddItem: (name: string, amount: string) => void;
  onClearChecked: () => void;
  onClearAll: () => void;
}

export const ShoppingListModal: React.FC<ShoppingListModalProps> = ({
  isOpen,
  onClose,
  items,
  onToggleItem,
  onRemoveItem,
  onAddItem,
  onClearChecked,
  onClearAll
}) => {
  useEscapeKey(onClose, isOpen);

  const [nameInput, setNameInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [viewMode, setViewMode] = useState<'standard' | 'aisles' | 'receipt'>('aisles');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onAddItem(nameInput.trim(), amountInput.trim() || '1 adet');
      setNameInput('');
      setAmountInput('');
    }
  };

  const checkedCount = items.filter(i => i.checked).length;

  // Categorize items into supermarket aisles
  const categorizeItem = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes('tuz') || n.includes('karabiber') || n.includes('pul biber') || n.includes('kekik') || n.includes('nane') || n.includes('kimyon') || n.includes('salça') || n.includes('sıvı yağ') || n.includes('zeytinyağ') || n.includes('sirke') || n.includes('sos') || n.includes('mayonez') || n.includes('ketçap') || n.includes('baharat')) {
      return '🧂 Baharat, Yağ & Sos';
    }
    if (n.includes('domates') || n.includes('biber') || n.includes('soğan') || n.includes('patates') || n.includes('sarımsak') || n.includes('maydanoz') || n.includes('roka') || n.includes('marul') || n.includes('limon') || n.includes('havuç') || n.includes('kabak') || n.includes('patlıcan') || n.includes('ıspanak') || n.includes('elma') || n.includes('portakal')) {
      return '🥦 Manav & Yeşillik';
    }
    if (n.includes('et') || n.includes('kıyma') || n.includes('tavuk') || n.includes('balık') || n.includes('köfte') || n.includes('sucuk') || n.includes('salam') || n.includes('sosis') || n.includes('pastırma') || n.includes('kuşbaşı') || n.includes('bonfile') || n.includes('pirzola')) {
      return '🥩 Kasap & Şarküteri';
    }
    if (n.includes('süt') || n.includes('peynir') || n.includes('yoğurt') || n.includes('tereyağ') || n.includes('yumurta') || n.includes('kaymak') || n.includes('kaşar') || n.includes('labne') || n.includes('zeytin')) {
      return '🧀 Süt & Kahvaltılık';
    }
    if (n.includes('un') || n.includes('şeker') || n.includes('pirinç') || n.includes('bulgur') || n.includes('makarna') || n.includes('mercimek') || n.includes('nohut') || n.includes('fasulye') || n.includes('irmik') || n.includes('erişte')) {
      return '🌾 Kuru Gıda & Bakliyat';
    }
    return '🛒 Diğer İhtiyaçlar';
  };

  const aisleGroups = items.reduce((acc, item) => {
    const aisle = categorizeItem(item.name);
    if (!acc[aisle]) acc[aisle] = [];
    acc[aisle].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 border-0 sm:border border-stone-200 dark:border-slate-800 rounded-none sm:rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden h-full sm:h-auto max-h-screen sm:max-h-[90vh] flex flex-col transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/25 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-stone-900 dark:text-white font-heading">Alışveriş Listesi</h2>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                {items.length} ürün {checkedCount > 0 && `(${checkedCount} alındı)`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:text-slate-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 dark:bg-slate-950 rounded-2xl border border-stone-200 dark:border-slate-800 my-3 text-xs font-bold">
          <button
            type="button"
            onClick={() => setViewMode('aisles')}
            className={`py-1.5 rounded-xl transition-all ${
              viewMode === 'aisles'
                ? 'bg-orange-500 text-slate-950 shadow-md'
                : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            🏬 Reyonlar
          </button>
          <button
            type="button"
            onClick={() => setViewMode('receipt')}
            className={`py-1.5 rounded-xl transition-all ${
              viewMode === 'receipt'
                ? 'bg-orange-500 text-slate-950 shadow-md'
                : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            🧾 Fiş Görünümü
          </button>
          <button
            type="button"
            onClick={() => setViewMode('standard')}
            className={`py-1.5 rounded-xl transition-all ${
              viewMode === 'standard'
                ? 'bg-orange-500 text-slate-950 shadow-md'
                : 'text-stone-600 dark:text-slate-400 hover:text-stone-900 dark:hover:text-white'
            }`}
          >
            📋 Düz Liste
          </button>
        </div>

        {/* Quick Add Bar */}
        <form onSubmit={handleAdd} className="flex gap-2 mb-3">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Malzeme adı (örn: Süt)"
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-400 focus:border-orange-500 outline-none transition-colors"
          />
          <input
            type="text"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="Miktar (örn: 1 lt)"
            className="w-24 px-3 py-2.5 rounded-xl bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs text-stone-900 dark:text-white placeholder-stone-400 dark:placeholder-slate-400 focus:border-orange-500 outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!nameInput.trim()}
            className="px-3 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-1 transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {items.length === 0 ? (
            <div className="py-12 text-center text-stone-400 dark:text-slate-400 text-xs">
              Alışveriş listen boş. Tarif detayından eksik malzemeleri tek tıkla buraya aktarabilirsin.
            </div>
          ) : viewMode === 'receipt' ? (
            /* Digital Paper Receipt View */
            <div className="p-4 sm:p-6 bg-amber-50/95 dark:bg-stone-100 text-stone-900 rounded-2xl shadow-xl font-mono text-xs border border-stone-300">
              <div className="text-center pb-3 border-b-2 border-dashed border-stone-400">
                <p className="font-black text-sm tracking-wider uppercase">COOKLY GURME MARKET</p>
                <p className="text-[10px] text-stone-600">Mutfak Alışveriş Fişi</p>
                <p className="text-[9px] text-stone-500 mt-1">
                  {new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="py-3 space-y-2 border-b-2 border-dashed border-stone-400">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => onToggleItem(item.id)}
                    className="flex items-center justify-between cursor-pointer group hover:bg-stone-200/60 p-1 rounded transition-colors"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`w-3.5 h-3.5 rounded border border-stone-600 flex items-center justify-center text-[10px] ${item.checked ? 'bg-stone-900 text-white' : ''}`}>
                        {item.checked ? '✓' : idx + 1}
                      </span>
                      <span className={`font-bold truncate ${item.checked ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                        {item.name}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-stone-700 ml-2 whitespace-nowrap">
                      {item.amount || '1 adet'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex items-center justify-between font-black text-xs">
                <span>TOPLAM KALEM:</span>
                <span>{items.length} ÜRÜN</span>
              </div>
              <div className="flex items-center justify-between text-[11px] text-stone-600">
                <span>SEPETTE TAMAMLANAN:</span>
                <span className="text-emerald-700 font-bold">{checkedCount} / {items.length}</span>
              </div>

              {/* Monospace Barcode Simulator */}
              <div className="mt-4 pt-3 border-t border-dashed border-stone-400 text-center">
                <div className="font-mono text-base tracking-[0.25em] text-stone-800 select-none">
                  ||| | |||| | || |||| || |
                </div>
                <p className="text-[9px] text-stone-500 mt-1">#CKL-SHOP-{items.length * 9142}</p>
              </div>
            </div>
          ) : viewMode === 'aisles' ? (
            /* Supermarket Aisles Categorized View */
            <div className="space-y-4">
              {Object.entries(aisleGroups).map(([aisleName, aisleItems]) => (
                <div key={aisleName} className="p-3 rounded-2xl bg-stone-50/90 dark:bg-slate-950/60 border border-stone-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-extrabold text-orange-600 dark:text-orange-400 uppercase tracking-wider font-heading">
                      {aisleName}
                    </h3>
                    <span className="text-[10px] text-stone-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded-full bg-stone-200/80 dark:bg-slate-800">
                      {aisleItems.filter(i => i.checked).length}/{aisleItems.length}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {aisleItems.map(item => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          item.checked
                            ? 'bg-stone-100/60 dark:bg-slate-900/40 border-stone-200/50 dark:border-slate-800/40 opacity-60'
                            : 'bg-white dark:bg-slate-800/70 border-stone-200 dark:border-slate-700 text-stone-900 dark:text-slate-200 shadow-xs'
                        }`}
                      >
                        <div 
                          onClick={() => onToggleItem(item.id)}
                          className="flex items-center gap-2.5 cursor-pointer flex-1"
                        >
                          <div className={`w-4 h-4 rounded-lg border flex items-center justify-center transition-colors ${
                            item.checked 
                              ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                              : 'border-stone-300 dark:border-slate-600 bg-stone-50 dark:bg-slate-800'
                          }`}>
                            {item.checked && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>

                          <div>
                            <span className={`text-xs font-semibold ${item.checked ? 'line-through text-stone-400 dark:text-slate-500' : 'text-stone-900 dark:text-white'}`}>
                              {item.name}
                            </span>
                            {item.amount && (
                              <span className="text-[11px] text-orange-600 dark:text-orange-400 ml-2 font-medium">
                                ({item.amount})
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="p-1 rounded-lg text-stone-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-slate-700/50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Standard Flat List View */
            items.map(item => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  item.checked
                    ? 'bg-stone-100/60 dark:bg-slate-900/40 border-stone-200/50 dark:border-slate-800/40 opacity-60'
                    : 'bg-white dark:bg-slate-800/70 border-stone-200 dark:border-slate-700 text-stone-900 dark:text-slate-200 shadow-xs'
                }`}
              >
                <div 
                  onClick={() => onToggleItem(item.id)}
                  className="flex items-center gap-3 cursor-pointer flex-1"
                >
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                    item.checked 
                      ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                      : 'border-stone-300 dark:border-slate-600 bg-stone-50 dark:bg-slate-800'
                  }`}>
                    {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div>
                    <span className={`text-sm font-semibold ${item.checked ? 'line-through text-stone-400 dark:text-slate-500' : 'text-stone-900 dark:text-white'}`}>
                      {item.name}
                    </span>
                    {item.amount && (
                      <span className="text-xs text-orange-600 dark:text-orange-400 ml-2 font-medium">
                        ({item.amount})
                      </span>
                    )}
                    {item.fromRecipeTitles && item.fromRecipeTitles.length > 0 && (
                      <p className="text-[10px] text-stone-500 dark:text-slate-400">
                        {item.fromRecipeTitles.join(', ')} için
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 dark:text-slate-500 dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {items.length > 0 && (
          <div className="pt-4 border-t border-stone-200 dark:border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-slate-400">
              <button
                onClick={onClearChecked}
                className="hover:text-amber-500 transition-colors font-medium"
              >
                Alınanları Temizle
              </button>
              <button
                onClick={onClearAll}
                className="hover:text-rose-500 transition-colors font-medium"
              >
                Tümünü Sil
              </button>
            </div>

            {/* Share Export Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => ShoppingService.shareViaWhatsApp(items)}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Paylaş</span>
              </button>

              <button
                onClick={() => ShoppingService.shareViaSMS(items)}
                className="py-2.5 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-stone-800 dark:text-slate-200 border border-stone-300 dark:border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Smartphone className="w-4 h-4" />
                <span>SMS Gönder</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

