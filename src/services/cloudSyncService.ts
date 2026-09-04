import { supabase, isSupabaseConfigured } from './supabaseClient';
import { StorageService } from './storageService';
import { PantryItem, ShoppingItem, DailyMealPlan, Recipe, CookedHistoryEntry } from '../types';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  hasConflicts: boolean;
}

type SyncListener = (status: SyncStatus) => void;

class CloudSyncService {
  private status: SyncStatus = {
    isSyncing: false,
    lastSyncedAt: null,
    hasConflicts: false,
  };
  private listeners: Set<SyncListener> = new Set();
  private realtimeChannel: any = null;

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l({ ...this.status }));
  }

  public getStatus(): SyncStatus {
    return { ...this.status };
  }

  /**
   * Reconciles guest data with cloud database when a user signs in.
   * Merges local state with remote database state using union & deduplication.
   */
  public async reconcileOnLogin(userId: string): Promise<{
    pantry: PantryItem[];
    favorites: string[];
    shopping: ShoppingItem[];
    mealPlan: DailyMealPlan[];
    customRecipes: Recipe[];
  }> {
    if (!isSupabaseConfigured || !supabase) {
      return {
        pantry: StorageService.getPantry(),
        favorites: StorageService.getFavorites(),
        shopping: StorageService.getShoppingList(),
        mealPlan: StorageService.getMealPlan(),
        customRecipes: StorageService.getCustomRecipes(),
      };
    }

    this.status.isSyncing = true;
    this.notify();

    try {
      // 1. Reconcile Pantry
      const localPantry = StorageService.getPantry();
      const { data: remotePantry } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', userId);

      const remoteNames = new Set((remotePantry || []).map((r: any) => r.ingredient_id));
      const localNameToItem = new Map(localPantry.map((i) => [i.name.toLowerCase(), i]));

      // Upload local items not present in remote
      const itemsToUpload = localPantry
        .filter((item) => !remoteNames.has(item.name.toLowerCase()))
        .map((item) => ({
          user_id: userId,
          ingredient_id: item.name.toLowerCase(),
        }));

      if (itemsToUpload.length > 0) {
        await supabase.from('pantry_items').upsert(itemsToUpload, { onConflict: 'user_id,ingredient_id' });
      }

      // Reconstruct merged pantry
      const mergedPantry: PantryItem[] = [...localPantry];
      (remotePantry || []).forEach((rem: any) => {
        const ingName = rem.ingredient_id;
        if (!localNameToItem.has(ingName.toLowerCase())) {
          mergedPantry.push({
            id: rem.id || Date.now().toString() + Math.random().toString(36).substr(2, 4),
            name: ingName.charAt(0).toUpperCase() + ingName.slice(1),
            addedDate: rem.added_at || new Date().toISOString(),
          });
        }
      });
      StorageService.savePantry(mergedPantry);

      // 2. Reconcile Favorites
      const localFavs = StorageService.getFavorites();
      const { data: remoteFavs } = await supabase
        .from('favorites')
        .select('recipe_id')
        .eq('user_id', userId);

      const remoteFavIds = new Set((remoteFavs || []).map((f: any) => f.recipe_id));
      const localFavIds = new Set(localFavs);

      const favsToUpload = localFavs
        .filter((id) => !remoteFavIds.has(id))
        .map((recipe_id) => ({ user_id: userId, recipe_id }));

      if (favsToUpload.length > 0) {
        await supabase.from('favorites').upsert(favsToUpload, { onConflict: 'user_id,recipe_id' });
      }

      const mergedFavs = Array.from(new Set([...localFavIds, ...remoteFavIds]));
      localStorage.setItem('favorite_recipes_v2', JSON.stringify(mergedFavs));

      // 3. Reconcile Shopping List
      const localShopping = StorageService.getShoppingList();
      const { data: remoteShopping } = await supabase
        .from('shopping_items')
        .select('*')
        .eq('user_id', userId);

      const remoteShopNames = new Set((remoteShopping || []).map((s: any) => s.name.toLowerCase()));
      const shopToUpload = localShopping
        .filter((s) => !remoteShopNames.has(s.name.toLowerCase()))
        .map((s) => ({
          user_id: userId,
          name: s.name,
          checked: s.checked,
        }));

      if (shopToUpload.length > 0) {
        await supabase.from('shopping_items').insert(shopToUpload);
      }

      const mergedShopping: ShoppingItem[] = [...localShopping];
      (remoteShopping || []).forEach((rem: any) => {
        if (!mergedShopping.some((l) => l.name.toLowerCase() === rem.name.toLowerCase())) {
          mergedShopping.push({
            id: rem.id,
            name: rem.name,
            amount: rem.amount ? `${rem.amount} ${rem.unit || ''}` : '1 adet',
            checked: rem.checked || false,
            addedAt: rem.created_at || new Date().toISOString(),
          });
        }
      });
      StorageService.saveShoppingList(mergedShopping);

      // 4. Reconcile Custom Recipes
      const localCustom = StorageService.getCustomRecipes();
      const { data: remoteCustom } = await supabase
        .from('custom_recipes')
        .select('*')
        .eq('user_id', userId);

      const remoteCustomIds = new Set((remoteCustom || []).map((r: any) => r.recipe_data?.id));
      const customToUpload = localCustom
        .filter((r) => !remoteCustomIds.has(r.id))
        .map((r) => ({
          user_id: userId,
          recipe_data: r,
        }));

      if (customToUpload.length > 0) {
        await supabase.from('custom_recipes').insert(customToUpload);
      }

      const mergedCustom: Recipe[] = [...localCustom];
      (remoteCustom || []).forEach((rem: any) => {
        if (rem.recipe_data && !mergedCustom.some((c) => c.id === rem.recipe_data.id)) {
          mergedCustom.push(rem.recipe_data);
        }
      });
      localStorage.setItem('custom_recipes_v2', JSON.stringify(mergedCustom));

      // 5. Reconcile XP & Streak
      const localXP = StorageService.getXP();
      const localStreak = StorageService.getStreak();
      const { data: userStats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (userStats) {
        const mergedXP = Math.max(localXP, userStats.xp || 0);
        const mergedStreak = Math.max(localStreak, userStats.streak || 0);
        localStorage.setItem('chef_xp_v2', mergedXP.toString());
        localStorage.setItem('chef_streak_v2', mergedStreak.toString());

        await supabase
          .from('user_stats')
          .update({ xp: mergedXP, streak: mergedStreak, updated_at: new Date().toISOString() })
          .eq('user_id', userId);
      } else {
        await supabase.from('user_stats').insert({
          user_id: userId,
          xp: localXP,
          streak: localStreak,
        });
      }

      this.status.lastSyncedAt = new Date().toISOString();
      this.status.isSyncing = false;
      this.notify();

      // Subscribe to Realtime Updates
      this.initRealtime(userId);

      return {
        pantry: mergedPantry,
        favorites: mergedFavs,
        shopping: mergedShopping,
        mealPlan: StorageService.getMealPlan(),
        customRecipes: mergedCustom,
      };
    } catch (err) {
      console.error('Data reconciliation error:', err);
      this.status.isSyncing = false;
      this.notify();
      return {
        pantry: StorageService.getPantry(),
        favorites: StorageService.getFavorites(),
        shopping: StorageService.getShoppingList(),
        mealPlan: StorageService.getMealPlan(),
        customRecipes: StorageService.getCustomRecipes(),
      };
    }
  }

  /**
   * Sync single pantry addition or deletion to cloud
   */
  public async syncPantryChange(userId: string, ingredientName: string, action: 'add' | 'remove') {
    if (!isSupabaseConfigured || !supabase || !userId) return;

    try {
      if (action === 'add') {
        await supabase.from('pantry_items').upsert({
          user_id: userId,
          ingredient_id: ingredientName.toLowerCase(),
        }, { onConflict: 'user_id,ingredient_id' });
      } else {
        await supabase.from('pantry_items')
          .delete()
          .eq('user_id', userId)
          .eq('ingredient_id', ingredientName.toLowerCase());
      }
    } catch (err) {
      console.warn('Cloud pantry sync failed:', err);
    }
  }

  /**
   * Sync favorite toggles to cloud
   */
  public async syncFavoriteChange(userId: string, recipeId: string, isFav: boolean) {
    if (!isSupabaseConfigured || !supabase || !userId) return;

    try {
      if (isFav) {
        await supabase.from('favorites').upsert({
          user_id: userId,
          recipe_id: recipeId,
        }, { onConflict: 'user_id,recipe_id' });
      } else {
        await supabase.from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('recipe_id', recipeId);
      }
    } catch (err) {
      console.warn('Cloud favorite sync failed:', err);
    }
  }

  /**
   * Sync shopping list changes to cloud
   */
  public async syncShoppingChange(userId: string, item: ShoppingItem, action: 'add' | 'update' | 'remove') {
    if (!isSupabaseConfigured || !supabase || !userId) return;

    try {
      if (action === 'add') {
        await supabase.from('shopping_items').insert({
          user_id: userId,
          name: item.name,
          checked: item.checked,
        });
      } else if (action === 'update') {
        await supabase.from('shopping_items')
          .update({ checked: item.checked })
          .eq('user_id', userId)
          .eq('name', item.name);
      } else if (action === 'remove') {
        await supabase.from('shopping_items')
          .delete()
          .eq('user_id', userId)
          .eq('name', item.name);
      }
    } catch (err) {
      console.warn('Cloud shopping sync failed:', err);
    }
  }

  /**
   * Sync custom recipe to cloud
   */
  public async syncCustomRecipe(userId: string, recipe: Recipe, action: 'save' | 'delete') {
    if (!isSupabaseConfigured || !supabase || !userId) return;

    try {
      if (action === 'save') {
        await supabase.from('custom_recipes').upsert({
          user_id: userId,
          recipe_data: recipe,
        });
      } else if (action === 'delete') {
        // Find and delete
        const { data } = await supabase
          .from('custom_recipes')
          .select('id, recipe_data')
          .eq('user_id', userId);
        const match = (data || []).find((d: any) => d.recipe_data?.id === recipe.id);
        if (match) {
          await supabase.from('custom_recipes').delete().eq('id', match.id);
        }
      }
    } catch (err) {
      console.warn('Cloud custom recipe sync failed:', err);
    }
  }

  /**
   * Listen to multi-device realtime changes
   */
  private initRealtime(userId: string) {
    if (!isSupabaseConfigured || !supabase) return;
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
    }

    this.realtimeChannel = supabase
      .channel(`user-sync-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', filter: `user_id=eq.${userId}` },
        () => {
          this.status.lastSyncedAt = new Date().toISOString();
          this.notify();
        }
      )
      .subscribe();
  }

  public cleanup() {
    if (this.realtimeChannel && supabase) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }
}

export const cloudSync = new CloudSyncService();
