import { RecipeSourceAdapter, ImportCandidate, ImportReport } from './types';
import { RawRecipe, NormalizedRecipe } from '../types';
import { normalizeRecipe } from '../normalizer';
import { validateRecipe } from '../validator';
import { detectDuplicates } from '../duplicateDetector';

export interface ImportOptions {
  existingRecipes?: NormalizedRecipe[];
}

/**
 * Coordinates the import process for a given RecipeSourceAdapter:
 * SOURCE -> RawRecipe[] -> Normalization -> Validation -> Duplicate Detection -> Staging Decision
 * 
 * GUARANTEES:
 * 1. NEVER modifies the production database.
 * 2. NEVER invents fake rating, chef, calories, or reviews.
 * 3. Categorizes candidates into: 'importable' | 'needs_review' | 'rejected'.
 */
export async function coordinateImport(
  adapter: RecipeSourceAdapter,
  options?: ImportOptions
): Promise<ImportReport> {
  const startedAt = new Date().toISOString();
  const rawRecipes = await Promise.resolve(adapter.fetchRawRecipes());
  const existingRecipes = options?.existingRecipes || [];

  const candidates: ImportCandidate[] = [];
  const normalizedBatch: NormalizedRecipe[] = [];
  const seenSourceIds = new Set<string>();
  const duplicateSourceIds = new Set<string>();

  // 1. Normalize and Validate
  for (let idx = 0; idx < rawRecipes.length; idx++) {
    const raw = rawRecipes[idx];
    const sourceId = String(raw.id || `item_${idx + 1}`);

    // Check duplicate sourceId within the same batch
    if (seenSourceIds.has(sourceId)) {
      duplicateSourceIds.add(sourceId);
    } else {
      seenSourceIds.add(sourceId);
    }

    const normalized = normalizeRecipe(raw, sourceId);
    normalizedBatch.push(normalized);

    const validation = validateRecipe(normalized);

    candidates.push({
      source: adapter.name,
      sourceId,
      rawRecipe: raw,
      normalizedRecipe: normalized,
      validationStatus: validation.status,
      duplicateStatus: 'unique',
      errors: validation.errors,
      warnings: validation.warnings,
      duplicateMatches: [],
      decision: 'importable',
      decisionReason: ''
    });
  }

  // 2. Duplicate Detection (Batch-internal + Existing Database)
  const allForDeduplication = [...existingRecipes, ...normalizedBatch];
  const allDuplicates = detectDuplicates(allForDeduplication);

  // Map duplicate matches to candidates
  for (const candidate of candidates) {
    const matches = allDuplicates.filter(
      d => d.sourceId === candidate.normalizedRecipe.id || d.targetId === candidate.normalizedRecipe.id
    );

    if (matches.length > 0) {
      candidate.duplicateStatus = 'duplicate_candidate';
      candidate.duplicateMatches = matches;
    }

    // 3. Staging Decision Logic
    if (candidate.validationStatus === 'INVALID') {
      candidate.decision = 'rejected';
      candidate.decisionReason = `Geçersiz veri: ${candidate.errors.join(', ')}`;
    } else if (duplicateSourceIds.has(candidate.sourceId)) {
      candidate.duplicateStatus = 'duplicate_candidate';
      candidate.decision = 'needs_review';
      candidate.decisionReason = `Aynı kaynak kimliği (${candidate.sourceId}) birden fazla kez tespit edildi.`;
    } else if (candidate.duplicateStatus === 'duplicate_candidate') {
      candidate.decision = 'needs_review';
      candidate.decisionReason = `Benzer tarif tespit edildi (${matches.map(m => m.canonicalTitle).join(', ')}) — Manuel inceleme gerekli.`;
    } else if (candidate.validationStatus === 'VALID') {
      candidate.decision = 'importable';
      candidate.decisionReason = 'Tüm kurallara uygun, içe aktarılmaya hazır.';
    } else {
      // WARNING
      candidate.decision = 'importable';
      candidate.decisionReason = `Uyarılarla birlikte içe aktarılabilir: ${candidate.warnings.join(', ')}`;
    }
  }

  // 4. Compute Metrics
  let validCount = 0;
  let warningCount = 0;
  let invalidCount = 0;
  let duplicateCount = 0;
  let importableCount = 0;
  let rejectedCount = 0;
  let needsReviewCount = 0;

  for (const c of candidates) {
    if (c.validationStatus === 'VALID') validCount++;
    else if (c.validationStatus === 'WARNING') warningCount++;
    else if (c.validationStatus === 'INVALID') invalidCount++;

    if (c.duplicateStatus === 'duplicate_candidate') duplicateCount++;

    if (c.decision === 'importable') importableCount++;
    else if (c.decision === 'rejected') rejectedCount++;
    else if (c.decision === 'needs_review') needsReviewCount++;
  }

  const completedAt = new Date().toISOString();

  return {
    source: adapter.name,
    sourceType: adapter.metadata.sourceType,
    fetched: rawRecipes.length,
    valid: validCount,
    warnings: warningCount,
    invalid: invalidCount,
    duplicateCandidates: duplicateCount,
    importable: importableCount,
    rejected: rejectedCount,
    needsReview: needsReviewCount,
    productionDatabaseModified: false,
    candidates,
    startedAt,
    completedAt
  };
}
