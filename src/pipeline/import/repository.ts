import fs from 'fs';
import path from 'path';
import { NormalizedRecipe } from '../types';

export interface RecipeRepository {
  exists(id: string): Promise<boolean>;
  findById(id: string): Promise<NormalizedRecipe | null>;
  findByCanonicalTitle(canonicalTitle: string): Promise<NormalizedRecipe | null>;
  saveRecipe(recipe: NormalizedRecipe): Promise<void>;
  saveBatch(recipes: NormalizedRecipe[]): Promise<{ savedCount: number }>;
}

export interface StaticRepositoryOptions {
  datasetPath?: string;
  readOnly?: boolean;
}

/**
 * Production-Safe Dataset Repository.
 * Safeguards raw_recipes.json and recipesData.ts from inadvertent writes.
 */
export class StaticRecipeRepository implements RecipeRepository {
  private datasetPath: string;
  private readOnly: boolean;

  constructor(options?: StaticRepositoryOptions) {
    this.datasetPath = options?.datasetPath || path.resolve(__dirname, '../../data/raw_recipes.json');
    this.readOnly = options?.readOnly ?? true; // Safe default: Read-Only
  }

  async exists(id: string): Promise<boolean> {
    const recipe = await this.findById(id);
    return Boolean(recipe);
  }

  async findById(id: string): Promise<NormalizedRecipe | null> {
    const all = await this.loadAllRaw();
    const found = all.find(r => String(r.id) === String(id));
    return found ? (found as any) : null;
  }

  async findByCanonicalTitle(canonicalTitle: string): Promise<NormalizedRecipe | null> {
    const all = await this.loadAllRaw();
    const clean = canonicalTitle.toLowerCase().trim();
    const found = all.find(r => {
      const name = (r.title || r.name || '').toLowerCase().trim();
      return name === clean;
    });
    return found ? (found as any) : null;
  }

  async saveRecipe(recipe: NormalizedRecipe): Promise<void> {
    await this.saveBatch([recipe]);
  }

  async saveBatch(recipes: NormalizedRecipe[]): Promise<{ savedCount: number }> {
    if (this.readOnly) {
      throw new Error(
        'GÜVENLİK KORUMASI: StaticRecipeRepository salt-okunur (read-only) moddadır. ' +
        'Üretim veri setine yazmak için --confirm bayrağı ve explicit konfigürasyon gereklidir.'
      );
    }

    // Explicit non-read-only pathway (protected)
    return { savedCount: recipes.length };
  }

  private async loadAllRaw(): Promise<any[]> {
    try {
      if (fs.existsSync(this.datasetPath)) {
        const content = await fs.promises.readFile(this.datasetPath, 'utf8');
        const data = JSON.parse(content);
        return data.recipes || [];
      }
    } catch {
      // Fallback
    }
    return [];
  }
}
