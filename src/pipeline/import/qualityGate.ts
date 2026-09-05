import { NormalizedRecipe } from '../types';
import { SourceMetadata, SourcePermissionPolicy } from './types';

export interface RecipeCompleteness {
  contentComplete: boolean;
  imageComplete: boolean;
  videoComplete: boolean;
  licenseComplete: boolean;
  importReady: boolean;
}

export interface RecipeQualityScore {
  score: number;
  tier: 'excellent' | 'good' | 'review' | 'reject';
  breakdown: {
    title: number;
    ingredients: number;
    instructions: number;
    category: number;
    image: number;
    video: number;
    license: number;
  };
}

export type GateDecision = 'VALID' | 'WARNING' | 'REVIEW_REQUIRED' | 'REJECTED';

export interface QualityGateResult {
  decision: GateDecision;
  reasons: string[];
  qualityScore: RecipeQualityScore;
  completeness: RecipeCompleteness;
  imageStatus: 'ready' | 'missing' | 'needs_review';
  videoStatus: 'ready' | 'missing' | 'needs_review';
}

/**
 * Calculates a rigorous, deterministic recipe quality score (0-100).
 */
export function calculateRecipeQualityScore(
  recipe: NormalizedRecipe,
  metadata?: SourceMetadata | null
): RecipeQualityScore {
  let titleScore = 0;
  let ingScore = 0;
  let instScore = 0;
  let catScore = 0;
  let imgScore = 0;
  let vidScore = 0;
  let licScore = 0;

  // 1. Title (Max 15)
  if (recipe.title && recipe.title.trim().length >= 3) {
    titleScore = 15;
  }

  // 2. Ingredients (Max 25)
  if (recipe.ingredients && recipe.ingredients.length >= 2) {
    const hasValidAmounts = recipe.ingredients.every(i => i.amount && i.amount.trim().length > 0);
    ingScore = hasValidAmounts ? 25 : 15;
  } else if (recipe.ingredients && recipe.ingredients.length === 1) {
    ingScore = 10;
  }

  // 3. Instructions / Steps (Max 25)
  if (recipe.instructions && recipe.instructions.length >= 2) {
    instScore = 25;
  } else if (recipe.instructions && recipe.instructions.length === 1) {
    instScore = 15;
  }

  // 4. Category (Max 10)
  if (recipe.category && recipe.category.trim().length > 0 && recipe.category !== 'Genel') {
    catScore = 10;
  }

  // 5. Image Candidate (Max 10)
  if (recipe.image && recipe.image.trim().startsWith('http')) {
    imgScore = 10;
  }

  // 6. Video Candidate (Max 10)
  if (recipe.videoId && recipe.videoId.trim().length >= 3) {
    vidScore = 10;
  }

  // 7. License & Source Permission (Max 5)
  if (metadata?.license || metadata?.permissionPolicy === 'allowed') {
    licScore = 5;
  }

  const total = titleScore + ingScore + instScore + catScore + imgScore + vidScore + licScore;

  let tier: RecipeQualityScore['tier'] = 'reject';
  if (total >= 85) tier = 'excellent';
  else if (total >= 70) tier = 'good';
  else if (total >= 50) tier = 'review';

  return {
    score: total,
    tier,
    breakdown: {
      title: titleScore,
      ingredients: ingScore,
      instructions: instScore,
      category: catScore,
      image: imgScore,
      video: vidScore,
      license: licScore
    }
  };
}

/**
 * Production Import Quality Gate.
 * Evaluates candidate against technical completeness, licensing, and media readiness.
 */
export function evaluateImportQualityGate(options: {
  recipe: NormalizedRecipe;
  sourceMetadata?: SourceMetadata | null;
  duplicateCandidate?: boolean;
  duplicateReason?: string;
}): QualityGateResult {
  const { recipe, sourceMetadata, duplicateCandidate, duplicateReason } = options;
  const reasons: string[] = [];

  const qualityScore = calculateRecipeQualityScore(recipe, sourceMetadata);

  // Content completeness
  const hasTitle = Boolean(recipe.title && recipe.title.trim().length >= 2);
  const hasIngredients = Boolean(recipe.ingredients && recipe.ingredients.length >= 2);
  const hasSteps = Boolean(recipe.instructions && recipe.instructions.length >= 1);
  const contentComplete = hasTitle && hasIngredients && hasSteps;

  // Image & Video readiness
  const imageComplete = Boolean(recipe.image && recipe.image.trim().startsWith('http'));
  const imageStatus: 'ready' | 'missing' | 'needs_review' = imageComplete ? 'ready' : 'missing';

  const videoComplete = Boolean(recipe.videoId && recipe.videoId.trim().length >= 3);
  const videoStatus: 'ready' | 'missing' | 'needs_review' = videoComplete ? 'ready' : 'missing';

  const policy = sourceMetadata?.permissionPolicy || 'unknown';
  const licenseComplete = policy === 'allowed' && Boolean(sourceMetadata?.license);

  // Determine Gate Decision
  let decision: GateDecision = 'VALID';

  // 1. Catastrophic Rejection
  if (policy === 'prohibited') {
    decision = 'REJECTED';
    reasons.push(`Yasaklanmış kaynak (PROHIBITED): Kaynak telif politikası gereği engellenmiştir.`);
  } else if (!hasTitle) {
    decision = 'REJECTED';
    reasons.push('Tarif başlığı eksik veya geçersiz.');
  } else if (!hasIngredients) {
    decision = 'REJECTED';
    reasons.push('Yetersiz malzeme listesi (en az 2 malzeme gereklidir).');
  } else if (!hasSteps) {
    decision = 'REJECTED';
    reasons.push('Hazırlanış adımları eksik veya boş.');
  } else if (qualityScore.tier === 'reject') {
    decision = 'REJECTED';
    reasons.push(`Kalite puanı kabul sınırının altında (${qualityScore.score}/100).`);
  }

  // 2. Review Required
  if (decision !== 'REJECTED') {
    if (duplicateCandidate) {
      decision = 'REVIEW_REQUIRED';
      reasons.push(`Mükerrer tarif şüphesi: ${duplicateReason || 'Benzer tarif bulundu.'}`);
    } else if (policy === 'review_required' || policy === 'unknown') {
      decision = 'REVIEW_REQUIRED';
      reasons.push(`Kaynak izin politikası (${policy.toUpperCase()}): Hukuki/lisans incelemesi gereklidir.`);
    } else if (qualityScore.tier === 'review') {
      decision = 'REVIEW_REQUIRED';
      reasons.push(`Tarif veri eksikliği nedeniyle inceleme gerektiriyor (${qualityScore.score}/100).`);
    }
  }

  // 3. Warning (Usable content, but missing optional media)
  if (decision === 'VALID') {
    if (!imageComplete || !videoComplete) {
      decision = 'WARNING';
      if (!imageComplete) reasons.push('Görsel adayı eksik (sonradan edinilmeli).');
      if (!videoComplete) reasons.push('Video adayı eksik (sonradan edinilmeli).');
    } else {
      reasons.push('Tüm kalite ve içerik standartlarına uygun, içe aktarılmaya hazır.');
    }
  }

  const importReady = decision === 'VALID' || decision === 'WARNING';

  const completeness: RecipeCompleteness = {
    contentComplete,
    imageComplete,
    videoComplete,
    licenseComplete,
    importReady
  };

  return {
    decision,
    reasons,
    qualityScore,
    completeness,
    imageStatus,
    videoStatus
  };
}
