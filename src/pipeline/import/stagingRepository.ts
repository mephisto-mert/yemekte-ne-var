import fs from 'fs';
import path from 'path';
import { NormalizedRecipe } from '../types';
import { RecipeRepository } from './repository';
import { BatchManifest } from './batchEngine';

export interface StagingRepositoryOptions {
  stagingDir?: string;
}

export interface StagingArtifactsData {
  manifest: BatchManifest;
  recipes: NormalizedRecipe[];
  report: {
    summary: Record<string, any>;
    qualityDecisions: Array<{
      id: string;
      title: string;
      decision: string;
      score: number;
      reasons: string[];
    }>;
  };
}

export interface SaveBatchResult {
  savedCount: number;
  duplicateCount: number;
  totalStaged: number;
}

/**
 * Isolated Staging Recipe Repository.
 * 
 * STRICT ISOLATION GUARANTEES:
 * 1. Writes ONLY to test-output/recipe-import/ (or custom test sandbox).
 * 2. NEVER mutates src/data/raw_recipes.json or src/data/recipesData.ts.
 * 3. Enforces idempotency via source:sourceId and canonicalTitle indexing.
 * 4. Outputs reproducible manifest.json, recipes.json, and report.json artifacts.
 */
export class StagingRecipeRepository implements RecipeRepository {
  private stagingDir: string;
  private stagedRecipesMap: Map<string, NormalizedRecipe> = new Map();
  private canonicalTitleMap: Map<string, NormalizedRecipe> = new Map();
  private sourceIdMap: Map<string, NormalizedRecipe> = new Map();

  constructor(options?: StagingRepositoryOptions) {
    this.stagingDir = options?.stagingDir || path.resolve(process.cwd(), 'test-output/recipe-import');
    this.ensureDirectoryExists();
  }

  public getStagingDirectory(): string {
    return this.stagingDir;
  }

  private ensureDirectoryExists(): void {
    if (!fs.existsSync(this.stagingDir)) {
      fs.mkdirSync(this.stagingDir, { recursive: true });
    }
  }

  async exists(id: string): Promise<boolean> {
    return this.stagedRecipesMap.has(String(id));
  }

  async findById(id: string): Promise<NormalizedRecipe | null> {
    return this.stagedRecipesMap.get(String(id)) || null;
  }

  async findByCanonicalTitle(canonicalTitle: string): Promise<NormalizedRecipe | null> {
    const key = (canonicalTitle || '').toLowerCase().trim();
    return this.canonicalTitleMap.get(key) || null;
  }

  async findBySourceAndId(source: string, sourceId: string): Promise<NormalizedRecipe | null> {
    const key = `${source}:${sourceId}`;
    return this.sourceIdMap.get(key) || null;
  }

  async saveRecipe(recipe: NormalizedRecipe, metadata?: { source?: string; sourceId?: string }): Promise<void> {
    await this.saveBatch([recipe], metadata);
  }

  /**
   * Idempotent batch save into staging sandbox.
   */
  async saveBatch(
    recipes: NormalizedRecipe[],
    metadata?: { source?: string; sourceId?: string }
  ): Promise<SaveBatchResult> {
    this.ensureDirectoryExists();

    let savedCount = 0;
    let duplicateCount = 0;

    for (const recipe of recipes) {
      const source = metadata?.source || 'themealdb';
      const sourceId = metadata?.sourceId || recipe.id;
      const compositeKey = `${source}:${sourceId}`;
      const cTitle = (recipe.canonicalTitle || recipe.title || '').toLowerCase().trim();

      // Check idempotency by composite source ID or canonical title
      if (this.sourceIdMap.has(compositeKey) || (cTitle && this.canonicalTitleMap.has(cTitle))) {
        duplicateCount++;
        continue;
      }

      this.stagedRecipesMap.set(recipe.id, recipe);
      if (cTitle) {
        this.canonicalTitleMap.set(cTitle, recipe);
      }
      this.sourceIdMap.set(compositeKey, recipe);
      savedCount++;
    }

    // Persist current staging state
    const recipesFilePath = path.join(this.stagingDir, 'recipes.json');
    const allStaged = Array.from(this.stagedRecipesMap.values());
    await fs.promises.writeFile(recipesFilePath, JSON.stringify(allStaged, null, 2), 'utf8');

    return {
      savedCount,
      duplicateCount,
      totalStaged: allStaged.length
    };
  }

  /**
   * Writes complete staging execution artifacts: manifest.json, recipes.json, and report.json.
   */
  async saveStagingArtifacts(data: StagingArtifactsData): Promise<{
    manifestPath: string;
    recipesPath: string;
    reportPath: string;
  }> {
    this.ensureDirectoryExists();

    const manifestPath = path.join(this.stagingDir, 'manifest.json');
    const recipesPath = path.join(this.stagingDir, 'recipes.json');
    const reportPath = path.join(this.stagingDir, 'report.json');

    await fs.promises.writeFile(manifestPath, JSON.stringify(data.manifest, null, 2), 'utf8');
    await fs.promises.writeFile(recipesPath, JSON.stringify(data.recipes, null, 2), 'utf8');
    await fs.promises.writeFile(reportPath, JSON.stringify(data.report, null, 2), 'utf8');

    return {
      manifestPath,
      recipesPath,
      reportPath
    };
  }

  async loadStagedRecipes(): Promise<NormalizedRecipe[]> {
    const recipesFilePath = path.join(this.stagingDir, 'recipes.json');
    if (!fs.existsSync(recipesFilePath)) {
      return [];
    }
    try {
      const content = await fs.promises.readFile(recipesFilePath, 'utf8');
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  async clearStaging(): Promise<void> {
    this.stagedRecipesMap.clear();
    this.canonicalTitleMap.clear();
    this.sourceIdMap.clear();

    const files = ['manifest.json', 'recipes.json', 'report.json'];
    for (const f of files) {
      const fullPath = path.join(this.stagingDir, f);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    }
  }
}
