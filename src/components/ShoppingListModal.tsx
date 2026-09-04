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
  const [nameInput, setNameInput] = useState('');
  const [amountInput, setAmountInput] = useState('');

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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Alışveriş Listesi</h2>
              <p className="text-xs text-slate-400">
                {items.length} ürün {checkedCount > 0 && `(${checkedCount} alındı)`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Add Bar */}
        <form onSubmit={handleAdd} className="flex gap-2 my-4">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Malzeme adı (örn: Süt)"
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:border-orange-500 outline-none"
          />
          <input
            type="text"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            placeholder="Miktar (örn: 1 lt)"
            className="w-24 px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-400 focus:border-orange-500 outline-none"
          />
          <button
            type="submit"
            disabled={!nameInput.trim()}
            className="px-3 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1 transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Alışveriş listen boş. Tarif detayından eksik malzemeleri tek tıkla buraya aktarabilirsin.
            </div>
          ) : (
            items.map(item => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  item.checked
                    ? 'bg-slate-900/40 border-slate-800/40 opacity-60'
                    : 'bg-slate-800/70 border-slate-700 text-slate-200'
                }`}
              >
                <div 
                  onClick={() => onToggleItem(item.id)}
                  className="flex items-center gap-3 cursor-pointer flex-1"
                >
                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                    item.checked 
                      ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                      : 'border-slate-600 bg-slate-800'
                  }`}>
                    {item.checked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div>
                    <span className={`text-sm font-semibold ${item.checked ? 'line-through text-slate-500' : 'text-white'}`}>
                      {item.name}
                    </span>
                    {item.amount && (
                      <span className="text-xs text-orange-400 ml-2 font-medium">
                        ({item.amount})
                      </span>
                    )}
                    {item.fromRecipeTitles && item.fromRecipeTitles.length > 0 && (
                      <p className="text-[10px] text-slate-400">
                        {item.fromRecipeTitles.join(', ')} için
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-700/50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        {items.length > 0 && (
          <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <button
                onClick={onClearChecked}
                className="hover:text-amber-400 transition-colors"
              >
                Alınanları Temizle
              </button>
              <button
                onClick={onClearAll}
                className="hover:text-rose-400 transition-colors"
              >
                Tümünü Sil
              </button>
            </div>

            {/* Share Export Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => ShoppingService.shareViaWhatsApp(items)}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Paylaş</span>
              </button>

              <button
                onClick={() => ShoppingService.shareViaSMS(items)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
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
