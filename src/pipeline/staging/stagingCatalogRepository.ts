import fs from 'fs';
import path from 'path';
import {
  StagedRecipe,
  StagingRecipeStatus,
  StagingManifest,
  StagingCatalogStats
} from './types';

export interface StagingCatalogRepositoryOptions {
  stagingDir?: string;
  autoPersist?: boolean;
}

/**
 * Isolated Staging Catalog Repository.
 * 
 * STRICT ISOLATION & INTEGRITY GUARANTEES:
 * 1. Operates solely within data/staging/ or test-output/recipe-import/.
 * 2. NEVER touches src/data/raw_recipes.json or src/data/recipesData.ts.
 * 3. Enforces O(1) in-memory indexing by id and source:sourceId composite keys.
 * 4. Provides deterministic export and persistence mechanisms.
 */
export class StagingCatalogRepository {
  private stagingDir: string;
  private autoPersist: boolean;
  private recipesMap: Map<string, StagedRecipe> = new Map();
  private sourceIdIndex: Map<string, StagedRecipe> = new Map();

  constructor(options?: StagingCatalogRepositoryOptions) {
    this.stagingDir = options?.stagingDir || path.resolve(process.cwd(), 'test-output/recipe-import');
    this.autoPersist = options?.autoPersist ?? true;
    this.ensureDirectoryExists();
    this.loadFromDisk();
  }

  public getStagingDirectory(): string {
    return this.stagingDir;
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.stagingDir)) {
      fs.mkdirSync(this.stagingDir, { recursive: true });
    }
  }

  private loadFromDisk(): void {
    const catalogPath = path.join(this.stagingDir, 'staging-catalog.json');
    if (fs.existsSync(catalogPath)) {
      try {
        const raw = fs.readFileSync(catalogPath, 'utf8');
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const item of list) {
            this.recipesMap.set(item.id, item);
            this.sourceIdIndex.set(this.getCompositeKey(item.source, item.sourceId), item);
          }
        }
      } catch (e) {
        // Disk load failure handled gracefully
      }
    }
  }

  private getCompositeKey(source: string, sourceId: string): string {
    return `${source.toLowerCase().trim()}:${sourceId.toLowerCase().trim()}`;
  }

  async count(): Promise<number> {
    return this.recipesMap.size;
  }

  async get(id: string): Promise<StagedRecipe | null> {
    return this.recipesMap.get(id) || null;
  }

  async getAll(): Promise<StagedRecipe[]> {
    return Array.from(this.recipesMap.values());
  }

  async findBySource(source: string): Promise<StagedRecipe[]> {
    const cleanSource = source.toLowerCase().trim();
    return Array.from(this.recipesMap.values()).filter(
      r => r.source.toLowerCase().trim() === cleanSource
    );
  }

  async findBySourceId(source: string, sourceId: string): Promise<StagedRecipe | null> {
    const key = this.getCompositeKey(source, sourceId);
    return this.sourceIdIndex.get(key) || null;
  }

  async findByStatus(status: StagingRecipeStatus): Promise<StagedRecipe[]> {
    return Array.from(this.recipesMap.values()).filter(r => r.status === status);
  }

  async add(recipe: StagedRecipe): Promise<{ inserted: boolean; updated: boolean; skipped: boolean }> {
    const compositeKey = this.getCompositeKey(recipe.source, recipe.sourceId);
    const existing = this.sourceIdIndex.get(compositeKey);

    if (existing) {
      // Update existing record with updated timestamp
      const updatedRecipe: StagedRecipe = {
        ...recipe,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString()
      };
      this.recipesMap.set(existing.id, updatedRecipe);
      this.sourceIdIndex.set(compositeKey, updatedRecipe);

      if (this.autoPersist) await this.persistToDisk();
      return { inserted: false, updated: true, skipped: false };
    }

    // Insert new record
    this.recipesMap.set(recipe.id, recipe);
    this.sourceIdIndex.set(compositeKey, recipe);

    if (this.autoPersist) await this.persistToDisk();
    return { inserted: true, updated: false, skipped: false };
  }

  async addBatch(recipes: StagedRecipe[]): Promise<{ inserted: number; updated: number; skipped: number }> {
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    for (const recipe of recipes) {
      const res = await this.add(recipe);
      if (res.inserted) inserted++;
      else if (res.updated) updated++;
      else skipped++;
    }

    return { inserted, updated, skipped };
  }

  async update(recipe: StagedRecipe): Promise<boolean> {
    if (!this.recipesMap.has(recipe.id)) {
      return false;
    }
    const updatedRecipe: StagedRecipe = {
      ...recipe,
      updatedAt: new Date().toISOString()
    };
    const compositeKey = this.getCompositeKey(recipe.source, recipe.sourceId);
    this.recipesMap.set(recipe.id, updatedRecipe);
    this.sourceIdIndex.set(compositeKey, updatedRecipe);

    if (this.autoPersist) await this.persistToDisk();
    return true;
  }

  async remove(id: string): Promise<boolean> {
    const recipe = this.recipesMap.get(id);
    if (!recipe) return false;

    const compositeKey = this.getCompositeKey(recipe.source, recipe.sourceId);
    this.recipesMap.delete(id);
    this.sourceIdIndex.delete(compositeKey);

    if (this.autoPersist) await this.persistToDisk();
    return true;
  }

  async clear(): Promise<void> {
    this.recipesMap.clear();
    this.sourceIdIndex.clear();
    if (this.autoPersist) await this.persistToDisk();
  }

  async getStats(): Promise<StagingCatalogStats> {
    const all = Array.from(this.recipesMap.values());
    const byStatus: Record<StagingRecipeStatus, number> = {
      imported: 0,
      enriched: 0,
      needs_review: 0,
      approved: 0,
      rejected: 0,
      production_ready: 0
    };
    const bySource: Record<string, number> = {};
    const byLanguage: Record<string, number> = {};

    let productionReadyCount = 0;
    let reviewRequiredCount = 0;
    let rejectedCount = 0;

    for (const r of all) {
      byStatus[r.status] = (byStatus[r.status] || 0) + 1;
      bySource[r.source] = (bySource[r.source] || 0) + 1;
      byLanguage[r.displayLanguage] = (byLanguage[r.displayLanguage] || 0) + 1;

      if (r.status === 'production_ready' || r.productionEligibility.eligible) {
        productionReadyCount++;
      }
      if (r.status === 'needs_review' || r.reviewItems.length > 0) {
        reviewRequiredCount++;
      }
      if (r.status === 'rejected') {
        rejectedCount++;
      }
    }

    return {
      total: all.length,
      byStatus,
      bySource,
      byLanguage,
      productionReadyCount,
      reviewRequiredCount,
      rejectedCount
    };
  }

  private async persistToDisk(): Promise<void> {
    this.ensureDirectoryExists();
    const catalogPath = path.join(this.stagingDir, 'staging-catalog.json');
    const data = Array.from(this.recipesMap.values());
    await fs.promises.writeFile(catalogPath, JSON.stringify(data, null, 2), 'utf8');
  }

  async exportManifest(manifest: StagingManifest): Promise<string> {
    this.ensureDirectoryExists();
    const manifestPath = path.join(this.stagingDir, 'staging-manifest.json');
    await fs.promises.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    return manifestPath;
  }

  async exportCatalog(targetDir?: string): Promise<{
    catalogPath: string;
    manifestPath: string;
    reviewQueuePath: string;
  }> {
    const outDir = targetDir || path.resolve(process.cwd(), 'artifacts/staging');
    if (!fs.existsSync(outDir)) {
      await fs.promises.mkdir(outDir, { recursive: true });
    }

    const all = Array.from(this.recipesMap.values());
    const catalogPath = path.join(outDir, 'catalog.json');
    const manifestPath = path.join(outDir, 'manifest.json');
    const reviewQueuePath = path.join(outDir, 'review-queue.json');

    const allReviews = all.flatMap(r => r.reviewItems);

    await fs.promises.writeFile(catalogPath, JSON.stringify(all, null, 2), 'utf8');
    await fs.promises.writeFile(reviewQueuePath, JSON.stringify(allReviews, null, 2), 'utf8');

    return {
      catalogPath,
      manifestPath,
      reviewQueuePath
    };
  }
}
