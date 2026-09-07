import { StagedRecipe } from '../staging/types';

export const DEFAULT_PRODUCTION_TARGET = 100;

export interface ProductionImportOptions {
  targetCount?: number;
  rawRecipesPath?: string;
  recipesDataPath?: string;
  stagingCatalogPath?: string;
  dryRun?: boolean;
  allowCandidates?: StagedRecipe[];
}

export interface ProductionImportItem {
  id: number | string;
  name: string;
  title: string;
  source: string;
  sourceId: string;
  category: string;
  qualityScore: number;
  status: string;
  reasons: string[];
}

export interface ProductionImportResult {
  success: boolean;
  dryRun: boolean;
  initialProductionCount: number;
  finalProductionCount: number;
  targetCount: number;
  importedCount: number;
  skippedCount: number;
  eligibleCandidatesCount: number;
  duplicateCount: number;
  rejectedCount: number;
  importedRecipes: ProductionImportItem[];
  manifest: {
    runId: string;
    timestamp: string;
    durationMs: number;
    version: string;
  };
  errors: string[];
}
