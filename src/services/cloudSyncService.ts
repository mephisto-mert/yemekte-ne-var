import { supabase, isSupabaseConfigured } from './supabaseClient';
import { StorageService } from './storageService';
import { PantryItem, ShoppingItem, DailyMealPlan, Recipe } from '../types';

export type SyncStateMode = 'idle' | 'syncing' | 'success' | 'error';

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  hasConflicts: boolean;
  status: SyncStateMode;
  lastError: string | null;
}

type SyncListener = (status: SyncStatus) => void;

function normalizeIngredientName(name: string): string {
  return (name || '')
    .toLowerCase()
    .replace(/i̇/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}

function isValidUUID(str?: string): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
}

export class CloudSyncService {
  private client: any = null;
  private status: SyncStatus = {
    isSyncing: false,
    lastSyncedAt: null,
    hasConflicts: false,
    status: 'idle',
    lastError: null,
  };
  private listeners: Set<SyncListener> = new Set();
  private realtimeChannel: any = null;

  constructor(customClient?: any) {
    this.client = customClient || null;
  }

  private getClient() {
    return this.client || supabase;
  }

  private isConfigured(): boolean {
    if (this.client) return true;
    return Boolean(isSupabaseConfigured && supabase);
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatus());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l(this.getStatus()));
  }

  public getStatus(): SyncStatus {
    return { ...this.status };
  }

  private setError(err: any) {
    const message = typeof err === 'string' ? err : err?.message || 'Bilinmeyen senkronizasyon hatası';
    this.status.status = 'error';
    this.status.lastError = message;
    this.status.isSyncing = false;
    this.notify();
  }

  private setSuccess() {
    this.status.status = 'success';
    this.status.lastError = null;
    this.status.lastSyncedAt = new Date().toISOString();
    this.status.isSyncing = false;
    this.notify();
  }

  /**
   * Pulls all user data directly from cloud database
   */
  public async pullCloudData(userId: string): Promise<{
    pantry: any[];
    favorites: any[];
    shopping: any[];
    customRecipes: any[];
    userStats: any;
  } | null> {
    const sb = this.getClient();
    if (!this.isConfigured() || !userId) {
      this.setError('Cloud database client is not configured');
      return null;
    }

    this.status.isSyncing = true;
    this.status.status = 'syncing';
    this.status.lastError = null;
    this.notify();

    try {
      const [pantryRes, favsRes, shopRes, customRes, statsRes] = await Promise.all([
        sb.from('pantry_items').select('*').eq('user_id', userId),
        sb.from('favorites').select('*').eq('user_id', userId),
        sb.from('shopping_items').select('*').eq('user_id', userId),
        sb.from('custom_recipes').select('*').eq('user_id', userId),
        sb.from('user_stats').select('*').eq('user_id', userId).maybeSingle ? 
          sb.from('user_stats').select('*').eq('user_id', userId).maybeSingle() : 
          sb.from('user_stats').select('*').eq('user_id', userId)
      ]);

      if (pantryRes.error) throw pantryRes.error;
      if (favsRes.error) throw favsRes.error;
      if (shopRes.error) throw shopRes.error;
      if (customRes.error) throw customRes.error;

      this.setSuccess();
      return {
        pantry: pantryRes.data || [],
        favorites: favsRes.data || [],
        shopping: shopRes.data || [],
        customRecipes: customRes.data || [],
        userStats: statsRes?.data || null
      };
    } catch (err: any) {
      this.setError(err);
      return null;
    }
  }

  /**
   * Reconciles guest data with cloud database when a user signs in.
   * Merges local state with remote database state safely without data loss.
   */
  public async reconcileOnLogin(userId: string): Promise<{
    pantry: PantryItem[];
    favorites: string[];
    shopping: ShoppingItem[];
    mealPlan: DailyMealPlan[];
    customRecipes: Recipe[];
  }> {
    const localPantry = StorageService.getPantry();
    const localFavs = StorageService.getFavorites();
    const localShopping = StorageService.getShoppingList();
    const localMealPlan = StorageService.getMealPlan();
    const localCustom = StorageService.getCustomRecipes();
    const sb = this.getClient();

    if (!this.isConfigured() || !userId) {
      return {
        pantry: localPantry,
        favorites: localFavs,
        shopping: localShopping,
        mealPlan: localMealPlan,
        customRecipes: localCustom,
      };
    }

    this.status.isSyncing = true;
    this.status.status = 'syncing';
    this.status.lastError = null;
    this.notify();

    let encounteredErrors = false;

    try {
      // 1. Reconcile Pantry
      let mergedPantry: PantryItem[] = [...localPantry];
      const { data: remotePantry, error: pantryError } = await sb
        .from('pantry_items')
        .select('*')
        .eq('user_id', userId);

      if (pantryError) {
        console.warn('Pantry sync error:', pantryError.message);
        encounteredErrors = true;
      } else {
        const remoteNormNames = new Set((remotePantry || []).map((r: any) => normalizeIngredientName(r.ingredient_id)));
        const localNameToItem = new Map(localPantry.map((i) => [normalizeIngredientName(i.name), i]));

        // Upload local items not present in remote
        const itemsToUpload = localPantry
          .filter((item) => !remoteNormNames.has(normalizeIngredientName(item.name)))
          .map((item) => ({
            user_id: userId,
            ingredient_id: normalizeIngredientName(item.name),
          }));

        if (itemsToUpload.length > 0) {
          const { error: uploadError } = await sb
            .from('pantry_items')
            .upsert(itemsToUpload, { onConflict: 'user_id,ingredient_id' });
          if (uploadError) {
            console.warn('Pantry upload error:', uploadError.message);
            encounteredErrors = true;
          }
        }

        // Reconstruct merged pantry
        (remotePantry || []).forEach((rem: any) => {
          const norm = normalizeIngredientName(rem.ingredient_id);
          if (!localNameToItem.has(norm)) {
            mergedPantry.push({
              id: rem.id || Date.now().toString() + Math.random().toString(36).substr(2, 4),
              name: rem.ingredient_id.charAt(0).toUpperCase() + rem.ingredient_id.slice(1),
              addedDate: rem.added_at || new Date().toISOString(),
            });
          }
        });
        StorageService.savePantry(mergedPantry);
      }

      // 2. Reconcile Favorites
      let mergedFavs = [...localFavs];
      const { data: remoteFavs, error: favsError } = await sb
        .from('favorites')
        .select('recipe_id')
        .eq('user_id', userId);

      if (favsError) {
        console.warn('Favorites sync error:', favsError.message);
        encounteredErrors = true;
      } else {
        const remoteFavIds = new Set<string>((remoteFavs || []).map((f: any) => String(f.recipe_id)));
        const localFavIds = new Set<string>(localFavs);

        const favsToUpload = localFavs
          .filter((id) => !remoteFavIds.has(id))
          .map((recipe_id) => ({ user_id: userId, recipe_id }));

        if (favsToUpload.length > 0) {
          const { error: favUploadError } = await sb
            .from('favorites')
            .upsert(favsToUpload, { onConflict: 'user_id,recipe_id' });
          if (favUploadError) {
            console.warn('Favorites upload error:', favUploadError.message);
            encounteredErrors = true;
          }
        }

        mergedFavs = Array.from(new Set<string>([...Array.from(localFavIds), ...Array.from(remoteFavIds)]));
        localStorage.setItem('favorite_recipes_v2', JSON.stringify(mergedFavs));
      }

      // 3. Reconcile Shopping List
      let mergedShopping: ShoppingItem[] = [...localShopping];
      const { data: remoteShopping, error: shopError } = await sb
        .from('shopping_items')
        .select('*')
        .eq('user_id', userId);

      if (shopError) {
        console.warn('Shopping sync error:', shopError.message);
        encounteredErrors = true;
      } else {
        const remoteShopIds = new Set((remoteShopping || []).map((s: any) => s.id));
        const remoteShopNames = new Set((remoteShopping || []).map((s: any) => s.name.toLowerCase().trim()));

        const shopToUpload = localShopping
          .filter((s) => !remoteShopIds.has(s.id) && !remoteShopNames.has(s.name.toLowerCase().trim()))
          .map((s) => ({
            user_id: userId,
            id: isValidUUID(s.id) ? s.id : undefined,
            name: s.name,
            checked: s.checked,
          }));

        if (shopToUpload.length > 0) {
          const { error: shopUploadError } = await sb.from('shopping_items').insert(shopToUpload);
          if (shopUploadError) {
            console.warn('Shopping upload error:', shopUploadError.message);
            encounteredErrors = true;
          }
        }

        (remoteShopping || []).forEach((rem: any) => {
          if (!mergedShopping.some((l) => l.id === rem.id || l.name.toLowerCase().trim() === rem.name.toLowerCase().trim())) {
            mergedShopping.push({
              id: rem.id,
              name: rem.name,
              amount: rem.amount ? `${rem.amount} ${rem.unit || ''}`.trim() : '1 adet',
              checked: rem.checked || false,
              addedAt: rem.created_at || new Date().toISOString(),
            });
          }
        });
        StorageService.saveShoppingList(mergedShopping);
      }

      // 4. Reconcile Custom Recipes
      let mergedCustom: Recipe[] = [...localCustom];
      const { data: remoteCustom, error: customError } = await sb
        .from('custom_recipes')
        .select('*')
        .eq('user_id', userId);

      if (customError) {
        console.warn('Custom recipes sync error:', customError.message);
        encounteredErrors = true;
      } else {
        const remoteCustomIds = new Set((remoteCustom || []).map((r: any) => r.recipe_id || r.recipe_data?.id));
        const customToUpload = localCustom
          .filter((r) => !remoteCustomIds.has(r.id))
          .map((r) => ({
            user_id: userId,
            recipe_id: r.id,
            recipe_data: r,
          }));

        if (customToUpload.length > 0) {
          const { error: customUploadError } = await sb
            .from('custom_recipes')
            .upsert(customToUpload, { onConflict: 'user_id,recipe_id' });
          if (customUploadError) {
            console.warn('Custom recipes upload error:', customUploadError.message);
            encounteredErrors = true;
          }
        }

        (remoteCustom || []).forEach((rem: any) => {
          const recipeObj = rem.recipe_data;
          if (recipeObj && !mergedCustom.some((c) => c.id === recipeObj.id)) {
            mergedCustom.push(recipeObj);
          }
        });
        localStorage.setItem('custom_recipes_v2', JSON.stringify(mergedCustom));
      }

      // 5. Reconcile XP & Streak
      const localXP = StorageService.getXP();
      const localStreak = StorageService.getStreak();
      const { data: userStats, error: statsError } = await sb
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (statsError) {
        console.warn('User stats sync error:', statsError.message);
        encounteredErrors = true;
      } else if (userStats) {
        const mergedXP = Math.max(localXP, userStats.xp || 0);
        const mergedStreak = Math.max(localStreak, userStats.streak || 0);
        localStorage.setItem('chef_xp_v2', mergedXP.toString());
        localStorage.setItem('chef_streak_v2', mergedStreak.toString());

        await sb
          .from('user_stats')
          .update({ xp: mergedXP, streak: mergedStreak, updated_at: new Date().toISOString() })
          .eq('user_id', userId);
      } else {
        await sb.from('user_stats').insert({
          user_id: userId,
          xp: localXP,
          streak: localStreak,
        });
      }

      if (encounteredErrors) {
        this.status.status = 'error';
        this.status.lastError = 'Bazı veri öğeleri sunucu ile eşitlenirken uyarı alındı.';
        this.status.isSyncing = false;
        this.notify();
      } else {
        this.setSuccess();
      }

      // Subscribe to Realtime Updates
      this.initRealtime(userId);

      return {
        pantry: mergedPantry,
        favorites: mergedFavs,
        shopping: mergedShopping,
        mealPlan: localMealPlan,
        customRecipes: mergedCustom,
      };
    } catch (err: any) {
      console.error('Data reconciliation fatal error:', err);
      this.setError(err);
      return {
        pantry: localPantry,
        favorites: localFavs,
        shopping: localShopping,
        mealPlan: localMealPlan,
        customRecipes: localCustom,
      };
    }
  }

  /**
   * Sync single pantry addition or deletion to cloud
   */
  public async syncPantryChange(userId: string, ingredientName: string, action: 'add' | 'remove'): Promise<boolean> {
    const sb = this.getClient();
    if (!this.isConfigured() || !userId) return false;

    const norm = normalizeIngredientName(ingredientName);
    try {
      if (action === 'add') {
        const { error } = await sb.from('pantry_items').upsert({
          user_id: userId,
          ingredient_id: norm,
        }, { onConflict: 'user_id,ingredient_id' });
        if (error) throw error;
      } else {
        const { error } = await sb.from('pantry_items')
          .delete()
          .eq('user_id', userId)
          .eq('ingredient_id', norm);
        if (error) throw error;
      }
      this.status.lastSyncedAt = new Date().toISOString();
      this.notify();
      return true;
    } catch (err: any) {
      console.warn('Cloud pantry sync failed:', err?.message || err);
      this.status.lastError = err?.message || 'Pantry senkronizasyon hatası';
      this.notify();
      return false;
    }
  }

  /**
   * Sync favorite toggles to cloud
   */
  public async syncFavoriteChange(userId: string, recipeId: string, isFav: boolean): Promise<boolean> {
    const sb = this.getClient();
    if (!this.isConfigured() || !userId) return false;

    try {
      if (isFav) {
        const { error } = await sb.from('favorites').upsert({
          user_id: userId,
          recipe_id: recipeId,
        }, { onConflict: 'user_id,recipe_id' });
        if (error) throw error;
      } else {
        const { error } = await sb.from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('recipe_id', recipeId);
        if (error) throw error;
      }
      this.status.lastSyncedAt = new Date().toISOString();
      this.notify();
      return true;
    } catch (err: any) {
      console.warn('Cloud favorite sync failed:', err?.message || err);
      this.status.lastError = err?.message || 'Favori senkronizasyon hatası';
      this.notify();
      return false;
    }
  }

  /**
   * Sync shopping list changes to cloud using item ID identity
   */
  public async syncShoppingChange(userId: string, item: ShoppingItem, action: 'add' | 'update' | 'remove'): Promise<boolean> {
    const sb = this.getClient();
    if (!this.isConfigured() || !userId) return false;

    try {
      if (action === 'add') {
        const { error } = await sb.from('shopping_items').insert({
          id: isValidUUID(item.id) ? item.id : undefined,
          user_id: userId,
          name: item.name,
          checked: item.checked,
        });
        if (error) throw error;
      } else if (action === 'update') {
        let updateQuery = sb.from('shopping_items').update({ checked: item.checked }).eq('user_id', userId);
        if (isValidUUID(item.id)) {
          updateQuery = updateQuery.eq('id', item.id);
        } else {
          updateQuery = updateQuery.eq('name', item.name);
        }
        const { error } = await updateQuery;
        if (error) throw error;
      } else if (action === 'remove') {
        let deleteQuery = sb.from('shopping_items').delete().eq('user_id', userId);
        if (isValidUUID(item.id)) {
          deleteQuery = deleteQuery.eq('id', item.id);
        } else {
          deleteQuery = deleteQuery.eq('name', item.name);
        }
        const { error } = await deleteQuery;
        if (error) throw error;
      }
      this.status.lastSyncedAt = new Date().toISOString();
      this.notify();
      return true;
    } catch (err: any) {
      console.warn('Cloud shopping sync failed:', err?.message || err);
      this.status.lastError = err?.message || 'Alışveriş listesi senkronizasyon hatası';
      this.notify();
      return false;
    }
  }

  /**
   * Sync custom recipe to cloud
   */
  public async syncCustomRecipe(userId: string, recipe: Recipe, action: 'save' | 'delete'): Promise<boolean> {
    const sb = this.getClient();
    if (!this.isConfigured() || !userId) return false;

    try {
      if (action === 'save') {
        const { error } = await sb.from('custom_recipes').upsert({
          user_id: userId,
          recipe_id: recipe.id,
          title: recipe.title,
          recipe_data: recipe,
        }, { onConflict: 'user_id,recipe_id' });
        if (error) {
          // Fallback if recipe_id column does not exist yet
          const fallbackRes = await sb.from('custom_recipes').insert({
            user_id: userId,
            recipe_id: recipe.id,
            title: recipe.title,
            recipe_data: recipe,
          });
          if (fallbackRes.error) throw fallbackRes.error;
        }
      } else if (action === 'delete') {
        const { error } = await sb
          .from('custom_recipes')
          .delete()
          .eq('user_id', userId)
          .eq('recipe_id', recipe.id);

        if (error) {
          // Fallback delete by searching JSONB
          const { data } = await sb
            .from('custom_recipes')
            .select('id, recipe_data')
            .eq('user_id', userId);
          const match = (data || []).find((d: any) => d.recipe_data?.id === recipe.id);
          if (match) {
            await sb.from('custom_recipes').delete().eq('id', match.id);
          }
        }
      }
      this.status.lastSyncedAt = new Date().toISOString();
      this.notify();
      return true;
    } catch (err: any) {
      console.warn('Cloud custom recipe sync failed:', err?.message || err);
      this.status.lastError = err?.message || 'Özel tarif senkronizasyon hatası';
      this.notify();
      return false;
    }
  }

  /**
   * Sync user XP and cooking streak
   */
  public async syncUserStats(userId: string, xp: number, streak: number): Promise<boolean> {
    const sb = this.getClient();
    if (!this.isConfigured() || !userId) return false;

    try {
      const { error } = await sb.from('user_stats').upsert({
        user_id: userId,
        xp,
        streak,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
      if (error) throw error;
      this.status.lastSyncedAt = new Date().toISOString();
      this.notify();
      return true;
    } catch (err: any) {
      console.warn('Cloud user stats sync failed:', err?.message || err);
      return false;
    }
  }

  /**
   * Listen to multi-device realtime changes
   */
  private initRealtime(userId: string) {
    const sb = this.getClient();
    if (!this.isConfigured() || !sb) return;
    if (this.realtimeChannel) {
      sb.removeChannel(this.realtimeChannel);
    }

    this.realtimeChannel = sb
      .channel(`user-sync-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', filter: `user_id=eq.${userId}` },
        () => {
          this.status.lastSyncedAt = new Date().toISOString();
          this.status.status = 'success';
          this.notify();
        }
      )
      .subscribe();
  }

  public cleanup() {
    const sb = this.getClient();
    if (this.realtimeChannel && sb) {
      sb.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
  }
}

export const cloudSync = new CloudSyncService();
