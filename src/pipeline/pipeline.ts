import { RawRecipe, ValidatedRecipe, PipelineReport } from './types';
import { normalizeRecipe } from './normalizer';
import { validateRecipe } from './validator';
import { detectDuplicates } from './duplicateDetector';

/**
 * Processes a single raw recipe through normalization and validation.
 */
export function processRawRecipe(raw: RawRecipe, defaultId?: string): ValidatedRecipe {
  const normalized = normalizeRecipe(raw, defaultId);
  return validateRecipe(normalized);
}

/**
 * Executes the complete Recipe Data Pipeline:
 * RAW -> NORMALIZED -> VALIDATED -> DUPLICATE DETECTION -> PIPELINE REPORT
 */
export function runRecipePipeline(rawRecipes: RawRecipe[]): PipelineReport {
  const validatedList: ValidatedRecipe[] = [];
  const normalizedList = rawRecipes.map((raw, idx) => {
    const defaultId = `recipe_${idx + 1}`;
    const normalized = normalizeRecipe(raw, defaultId);
    const validated = validateRecipe(normalized);
    validatedList.push(validated);
    return normalized;
  });

  const duplicateCandidates = detectDuplicates(normalizedList);

  let valid = 0;
  let warnings = 0;
  let invalid = 0;

  for (const v of validatedList) {
    if (v.status === 'VALID') valid++;
    else if (v.status === 'WARNING') warnings++;
    else if (v.status === 'INVALID') invalid++;
  }

  return {
    total: rawRecipes.length,
    valid,
    warnings,
    invalid,
    duplicateCandidates,
    results: validatedList
  };
}

export * from './types';
export * from './normalizer';
export * from './validator';
export * from './duplicateDetector';
