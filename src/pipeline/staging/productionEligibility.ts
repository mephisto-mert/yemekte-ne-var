import {
  StagedRecipe,
  ProductionImportEligibility,
  ProductionImportEligibilityChecks
} from './types';

/**
 * Strict Production Import Safety Gate.
 * Evaluates 10 independent quality, licensing, security, and completeness criteria.
 * 
 * CRITICAL RULE: A recipe is NEVER eligible for production import if:
 * 1. License is unknown or unapproved (especially user-contributed content)
 * 2. Localization is unapproved / pending / not translated
 * 3. Image is unverified / needs_review / missing
 * 4. Any blocking human review item remains unresolved
 * 5. Overall quality score is below the strict threshold (70)
 */
export function evaluateProductionEligibility(recipe: StagedRecipe): ProductionImportEligibility {
  const reasons: string[] = [];
  const blockingIssues: string[] = [];

  // 1. Source Allowed Check
  const isSourceProhibited =
    recipe.source.toLowerCase().includes('nefis') ||
    recipe.source.toLowerCase().includes('scraper') ||
    Boolean(recipe.provenance?.source?.toLowerCase().includes('nefis'));
  const sourceAllowed = !isSourceProhibited && recipe.source.length > 0;
  if (!sourceAllowed) {
    blockingIssues.push(`Kaynak izinli değil veya yasaklı: ${recipe.source}`);
  }

  // 2. License Approved Check (unknown licenses are strictly unapproved)
  const isLicenseUnknown =
    !recipe.image.license ||
    recipe.image.license.toLowerCase() === 'unknown' ||
    recipe.image.license.toLowerCase() === 'none' ||
    recipe.image.license.toLowerCase() === 'placeholder' ||
    recipe.image.permissionStatus !== 'authorized';
  const licenseApproved = !isLicenseUnknown;
  if (!licenseApproved) {
    blockingIssues.push('Görsel veya içerik lisansı onaylanmadı (License unverified/unknown).');
  }

  // 3. Localization Approved Check (untranslated English recipes are not eligible)
  const isTurkishNative = recipe.sourceLanguage === 'tr' && recipe.displayLanguage === 'tr';
  const isTranslated = recipe.localization?.translationStatus === 'translated';
  const localizationApproved =
    (isTurkishNative || isTranslated) &&
    recipe.displayLanguage === 'tr' &&
    recipe.localization?.translationStatus !== 'not_translated' &&
    recipe.localization?.translationStatus !== 'failed';
  if (!localizationApproved) {
    blockingIssues.push('Tarif Türkçe yerelleştirme onayından geçmedi (Localization pending/not_translated).');
  }

  // 4. Content Complete Check
  const hasTitle = Boolean(recipe.title && recipe.title.trim().length >= 2);
  const hasDisplayTitle = Boolean(recipe.displayTitle && recipe.displayTitle.trim().length >= 2);
  const hasIngredients = Boolean(recipe.ingredients && recipe.ingredients.length >= 1);
  const hasInstructions = Boolean(recipe.instructions && recipe.instructions.length >= 1);
  const contentComplete = hasTitle && hasDisplayTitle && hasIngredients && hasInstructions;
  if (!contentComplete) {
    blockingIssues.push('Tarif başlığı, malzemeleri veya adımları eksik (Content incomplete).');
  }

  // 5. Image Approved Check
  const imageApproved = recipe.image.status === 'ready' && recipe.image.permissionStatus === 'authorized';
  if (!imageApproved) {
    blockingIssues.push('Görsel durumu "ready" değil veya izin durumu yetersiz (Image missing or needs_review).');
  }

  // 6. Video Policy Satisfied Check
  const hasValidEmbed =
    !recipe.video.embedUrl ||
    recipe.video.embedUrl.startsWith('https://www.youtube-nocookie.com/embed/') ||
    recipe.video.embedUrl.startsWith('https://www.youtube.com/embed/');
  const videoPolicySatisfied =
    (recipe.video.status === 'ready' || recipe.video.status === 'missing') &&
    hasValidEmbed;
  if (!videoPolicySatisfied) {
    blockingIssues.push('Video bağlantısı güvenlik filtresini geçemedi (Video rejected or invalid embed).');
  }

  // 7. No Blocking Review Items Check
  const blockingReviews = recipe.reviewItems.filter(
    item => item.severity === 'blocking' && item.status === 'pending'
  );
  const noBlockingReview = blockingReviews.length === 0;
  if (!noBlockingReview) {
    blockingIssues.push(`Çözümlenmemiş ${blockingReviews.length} adet kritik (blocking) inceleme maddesi mevcut.`);
  }

  // 8. No Duplicate Check
  const hasDuplicateReview = recipe.reviewItems.some(
    item => item.type === 'duplicate' && item.status === 'pending'
  );
  const noDuplicate = !hasDuplicateReview && recipe.status !== 'rejected';
  if (!noDuplicate) {
    blockingIssues.push('Mükerrer tarif şüphesi tespit edildi (Duplicate detected).');
  }

  // 9. Quality Threshold Met (Minimum 70/100)
  const overallScore = recipe.quality?.overallScore ?? 0;
  const qualityThresholdMet = overallScore >= 70 && recipe.quality?.tier !== 'reject';
  if (!qualityThresholdMet) {
    blockingIssues.push(`Kalite puanı (${overallScore}) üretim eşiğinin (70) altında.`);
  }

  // 10. Provenance Complete Check
  const provenanceComplete = Boolean(
    recipe.provenance?.source &&
    recipe.provenance?.sourceId &&
    recipe.provenance?.importedAt &&
    recipe.provenance?.pipelineVersion &&
    Array.isArray(recipe.provenance?.transformations)
  );
  if (!provenanceComplete) {
    blockingIssues.push('Veri kaynağı izlenebilirlik bilgisi eksik (Provenance incomplete).');
  }

  const checks: ProductionImportEligibilityChecks = {
    sourceAllowed,
    licenseApproved,
    localizationApproved,
    contentComplete,
    imageApproved,
    videoPolicySatisfied,
    noBlockingReview,
    noDuplicate,
    qualityThresholdMet,
    provenanceComplete
  };

  const eligible = Object.values(checks).every(Boolean);

  if (eligible) {
    reasons.push('Tüm üretim kabul kriterleri eksiksiz sağlandı (10/10 checks PASS).');
  } else {
    reasons.push(...blockingIssues);
  }

  return {
    eligible,
    checks,
    reasons,
    blockingIssues,
    evaluatedAt: new Date().toISOString()
  };
}
