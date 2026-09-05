import {
  ImageCandidate,
  ImagePipelineResult,
  ImagePipelineReport,
  ImageDecision,
  ImageDuplicateMatch
} from './types';
import { evaluateImageQuality, generateAltText } from './validator';
import { resolveImageFallback } from './fallback';

/**
 * Evaluates a single image candidate through the pipeline.
 */
export function processImageCandidate(candidate: ImageCandidate): ImagePipelineResult {
  const altText = generateAltText(candidate.recipeTitle, candidate.altText);
  const fallbackPriority = resolveImageFallback(candidate);

  const { status, errors, warnings, isPlaceholder } = evaluateImageQuality(candidate);

  let decision: ImageDecision = 'usable';
  let decisionReason = '';

  const policy = candidate.metadata?.permissionPolicy || 'unknown';

  if (!candidate.imageUrl || candidate.imageUrl.trim() === '') {
    decision = 'missing';
    decisionReason = 'Tarif için görsel tanımlanmamış (missing image state).';
  } else if (policy === 'prohibited') {
    decision = 'rejected';
    decisionReason = 'Yasaklanmış kaynak politikası (PROHIBITED): Görsel telif veya kullanım şartları gereği kullanılamaz.';
  } else if (status === 'INVALID') {
    decision = 'rejected';
    decisionReason = `Geçersiz görsel verisi: ${errors.join(', ')}`;
  } else if (policy === 'review_required' || policy === 'unknown') {
    decision = 'needs_review';
    decisionReason = `Kaynak izin politikası (${policy.toUpperCase()}) onay gerektiriyor.`;
  } else if (isPlaceholder) {
    decision = 'needs_review';
    decisionReason = 'Görsel bir placeholder/demo görselidir, gerçek yemek fotoğrafı ile güncellenmelidir.';
  } else {
    decision = 'usable';
    decisionReason = warnings.length > 0
      ? `Kullanılabilir (Uyarılar: ${warnings.join(', ')})`
      : 'Görsel onaylandı ve kullanıma uygun.';
  }

  return {
    recipeId: candidate.recipeId,
    recipeTitle: candidate.recipeTitle,
    imageUrl: candidate.imageUrl || null,
    altText,
    qualityStatus: status,
    isPlaceholder,
    decision,
    decisionReason,
    errors,
    warnings,
    fallbackPriority
  };
}

/**
 * Runs a batch of image candidates through the Image Pipeline,
 * performing quality checks, policy validation, and deduplication.
 */
export function runImagePipeline(candidates: ImageCandidate[]): ImagePipelineReport {
  const startedAt = new Date().toISOString();
  const results: ImagePipelineResult[] = [];
  const duplicates: ImageDuplicateMatch[] = [];

  const urlMap = new Map<string, string>(); // url -> recipeId
  const sourceIdMap = new Map<string, string>(); // source:sourceId -> recipeId

  let imagesPresent = 0;
  let missingImages = 0;
  let placeholders = 0;
  let validImages = 0;
  let warnings = 0;
  let invalid = 0;
  let usable = 0;
  let needsReview = 0;
  let rejected = 0;

  for (const candidate of candidates) {
    const result = processImageCandidate(candidate);

    // Duplicate detection by URL
    if (candidate.imageUrl && candidate.imageUrl.trim().length > 0 && !result.isPlaceholder) {
      const cleanUrl = candidate.imageUrl.trim();
      if (urlMap.has(cleanUrl)) {
        duplicates.push({
          sourceRecipeId: candidate.recipeId,
          targetRecipeId: urlMap.get(cleanUrl)!,
          imageUrl: cleanUrl,
          reason: 'Aynı görsel URL adresi başka bir tarifte daha kullanılıyor.'
        });
      } else {
        urlMap.set(cleanUrl, candidate.recipeId);
      }
    }

    // Duplicate detection by source + sourceId
    if (candidate.source && candidate.sourceId) {
      const sourceKey = `${candidate.source}:${candidate.sourceId}`;
      if (sourceIdMap.has(sourceKey)) {
        duplicates.push({
          sourceRecipeId: candidate.recipeId,
          targetRecipeId: sourceIdMap.get(sourceKey)!,
          imageUrl: candidate.imageUrl || '',
          reason: `Aynı kaynak görsel kimliği (${sourceKey}) tekrarlandı.`
        });
      } else {
        sourceIdMap.set(sourceKey, candidate.recipeId);
      }
    }

    // Metric aggregation
    if (result.imageUrl) imagesPresent++;
    else missingImages++;

    if (result.isPlaceholder) placeholders++;

    if (result.qualityStatus === 'VALID') validImages++;
    else if (result.qualityStatus === 'WARNING') warnings++;
    else if (result.qualityStatus === 'INVALID') invalid++;

    if (result.decision === 'usable') usable++;
    else if (result.decision === 'needs_review') needsReview++;
    else if (result.decision === 'rejected') rejected++;

    results.push(result);
  }

  const completedAt = new Date().toISOString();

  return {
    total: candidates.length,
    imagesPresent,
    missingImages,
    placeholders,
    validImages,
    warnings,
    invalid,
    usable,
    needsReview,
    rejected,
    duplicates,
    productionDatasetModified: false,
    results,
    startedAt,
    completedAt
  };
}
