import React, { useState } from 'react';
import { X, Plus, Trash2, ChefHat, Sparkles } from 'lucide-react';
import { Recipe, RecipeIngredient, RecipeDifficulty } from '../types';

interface AddRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveRecipe: (recipe: Recipe) => void;
}

export const AddRecipeModal: React.FC<AddRecipeModalProps> = ({
  isOpen,
  onClose,
  onSaveRecipe
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cookingTime, setCookingTime] = useState('30 dk');
  const [difficulty, setDifficulty] = useState<RecipeDifficulty>('Kolay');
  const [category, setCategory] = useState('main_dish');
  const [servings, setServings] = useState(4);
  const [imageUrl, setImageUrl] = useState('');

  const [ingredients, setIngredients] = useState<{ name: string; amount: string }[]>([
    { name: '', amount: '' }
  ]);

  const [steps, setSteps] = useState<string[]>(['']);

  if (!isOpen) return null;

  const handleAddIngredientRow = () => {
    setIngredients([...ingredients, { name: '', amount: '' }]);
  };

  const handleRemoveIngredientRow = (idx: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== idx));
    }
  };

  const handleAddStepRow = () => {
    setSteps([...steps, '']);
  };

  const handleRemoveStepRow = (idx: number) => {
    if (steps.length > 1) {
      setSteps(steps.filter((_, i) => i !== idx));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const validIngredients: RecipeIngredient[] = ingredients
      .filter(i => i.name.trim())
      .map(i => ({
        name: i.name.trim(),
        amount: i.amount.trim() || '1 adet',
        isStaple: ['tuz', 'yağ', 'su', 'karabiber'].some(s => i.name.toLowerCase().includes(s))
      }));

    const validSteps = steps.filter(s => s.trim());

    const newRecipe: Recipe = {
      id: `custom_${Date.now()}`,
      title: title.trim(),
      description: description.trim() || `${title} - Kişisel özel tarifiniz.`,
      image: imageUrl.trim() || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop',
      imageUrl: imageUrl.trim(),
      ingredients: validIngredients,
      instructions: validSteps.length > 0 ? validSteps : ['Malzemeleri karıştırıp pişirin.'],
      cookingTime,
      timeMinutes: parseInt(cookingTime) || 30,
      preparationTime: '15 dk',
      difficulty,
      servings,
      category,
      tags: ['özel tarifim', 'ev yapımı'],
      cuisine: 'Ev Mutfağı',
      calories: 350,
      rating: 5.0,
      reviewCount: 1,
      chef: 'Senin Tarifin',
      isCustom: true,
      createdAt: new Date().toISOString()
    };

    onSaveRecipe(newRecipe);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white">Yeni Tarif Ekle</h2>
              <p className="text-xs text-slate-400">"Annemin Yaptığı Yemek" gibi kendi özel tarifini defterine ekle</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto py-4 space-y-4 flex-1 pr-1 text-xs">
          
          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Tarif Adı *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Örn: Annemin Meşhur Tavuklu Pilavı"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:border-orange-500 outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Açıklama / Not</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Örn: Bu yemeğin sırrı kısık ateşte tereyağıyla demlenmesidir."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs focus:border-orange-500 outline-none"
            />
          </div>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Pişirme Süresi</label>
              <input
                type="text"
                value={cookingTime}
                onChange={(e) => setCookingTime(e.target.value)}
                placeholder="30 dk"
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Zorluk</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as RecipeDifficulty)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              >
                <option value="Kolay">Kolay</option>
                <option value="Orta">Orta</option>
                <option value="Zor">Zor</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Porsiyon</label>
              <input
                type="number"
                min="1"
                max="20"
                value={servings}
                onChange={(e) => setServings(parseInt(e.target.value) || 4)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              >
                <option value="main_dish">Ana Yemek</option>
                <option value="soup">Çorba</option>
                <option value="breakfast">Kahvaltı</option>
                <option value="pastry">Hamur İşi</option>
                <option value="dessert">Tatlı</option>
                <option value="salad">Salata</option>
              </select>
            </div>
          </div>

          {/* Photo URL */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Fotoğraf URL'si (Opsiyonel)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs"
            />
          </div>

          {/* Ingredients Rows */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300">Malzemeler *</label>
              <button
                type="button"
                onClick={handleAddIngredientRow}
                className="text-orange-400 hover:text-orange-300 font-bold text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Malzeme Satırı Ekle
              </button>
            </div>

            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => {
                      const updated = [...ingredients];
                      updated[idx].name = e.target.value;
                      setIngredients(updated);
                    }}
                    placeholder="Malzeme (örn: Tavuk Göğsü)"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                  <input
                    type="text"
                    value={ing.amount}
                    onChange={(e) => {
                      const updated = [...ingredients];
                      updated[idx].amount = e.target.value;
                      setIngredients(updated);
                    }}
                    placeholder="Miktar (örn: 500 g)"
                    className="w-32 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredientRow(idx)}
                      className="p-2 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Steps Rows */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300">Hazırlanış Adımları *</label>
              <button
                type="button"
                onClick={handleAddStepRow}
                className="text-orange-400 hover:text-orange-300 font-bold text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adım Ekle
              </button>
            </div>

            <div className="space-y-2">
              {steps.map((step, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="w-7 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-orange-400 flex-shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => {
                      const updated = [...steps];
                      updated[idx] = e.target.value;
                      setSteps(updated);
                    }}
                    placeholder={`Adım ${idx + 1} açıklaması...`}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                  {steps.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveStepRow(idx)}
                      className="p-2 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-slate-800">
            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-[0.98] transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>TARİFİ DEFTERİME KAYDET</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
