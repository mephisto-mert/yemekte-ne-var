import { NormalizedRecipe } from '../types';
import {
  CompletenessEvaluation,
  CompletenessIssue,
  LocalizedRecipeData,
  ImageMatchingResult,
  VideoMatchingResult,
  TaxonomyMappingResult
} from './types';

export interface CompletenessInput {
  recipe: NormalizedRecipe;
  localizedData: LocalizedRecipeData;
  taxonomyData: TaxonomyMappingResult;
  imageData: ImageMatchingResult;
  videoData: VideoMatchingResult;
}

/**
 * Evaluates the full completeness and production readiness of an enriched recipe.
 * Accurately categorizes missing fields by severity (blocking vs warning vs optional).
 */
export function evaluateRecipeCompleteness(input: CompletenessInput): CompletenessEvaluation {
  const issues: CompletenessIssue[] = [];
  const missingFields: string[] = [];

  const { recipe, localizedData, taxonomyData, imageData, videoData } = input;

  // 1. Content Evaluation (Blocking criteria)
  let contentComplete = true;

  if (!recipe.title || recipe.title.trim().length < 2) {
    contentComplete = false;
    missingFields.push('title');
    issues.push({
      field: 'title',
      severity: 'blocking',
      message: 'Tarif başlığı eksik veya çok kısa.'
    });
  }

  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    contentComplete = false;
    missingFields.push('ingredients');
    issues.push({
      field: 'ingredients',
      severity: 'blocking',
      message: 'Tarif en az 1 geçerli malzeme içermelidir.'
    });
  }

  if (!recipe.instructions || recipe.instructions.length === 0) {
    contentComplete = false;
    missingFields.push('instructions');
    issues.push({
      field: 'instructions',
      severity: 'blocking',
      message: 'Tarif en az 1 hazırlanış adımı içermelidir.'
    });
  }

  // 2. Taxonomy Evaluation
  if (taxonomyData.status === 'unknown' || taxonomyData.cooklyCategory === 'unknown') {
    missingFields.push('category');
    issues.push({
      field: 'category',
      severity: 'warning',
      message: 'Kategori Cookly taksonomisine tam eşlenemedi (unknown).'
    });
  }

  // 3. Image Evaluation (Warning criteria - good recipes are not blocked from staging)
  let imageComplete = false;
  if (imageData.status === 'ready') {
    imageComplete = true;
  } else if (imageData.status === 'needs_review') {
    issues.push({
      field: 'image',
      severity: 'warning',
      message: 'Görsel mevcut fakat lisansı inceleme bekliyor (needs_review).'
    });
  } else if (imageData.status === 'missing' || imageData.status === 'rejected') {
    missingFields.push('image');
    issues.push({
      field: 'image',
      severity: 'warning',
      message: 'Tarifin geçerli bir görseli bulunmuyor.'
    });
  }

  // 4. Video Evaluation (Warning/Optional criteria)
  let videoComplete = false;
  if (videoData.status === 'ready') {
    videoComplete = true;
  } else {
    missingFields.push('video');
    issues.push({
      field: 'video',
      severity: 'optional',
      message: 'Tarife ait YouTube hazırlama videosu henüz atanmadı.'
    });
  }

  // 5. License Evaluation
  let licenseComplete = false;
  if (imageData.license && imageData.license !== 'none' && imageData.license !== 'placeholder') {
    licenseComplete = true;
  } else {
    missingFields.push('license');
    issues.push({
      field: 'license',
      severity: 'warning',
      message: 'Lisans bilgisi doğrulanmadı veya eksik.'
    });
  }

  // 6. Localization Evaluation
  let localizationComplete = false;
  if (localizedData.translationStatus === 'translated' || localizedData.sourceLanguage === 'tr') {
    localizationComplete = true;
  } else {
    missingFields.push('localization');
    issues.push({
      field: 'localization',
      severity: 'warning',
      message: 'Tarif henüz Türkçe yerelleştirmesi yapılmamış yabancı kaynaktır (not_translated).'
    });
  }

  // Production Readiness Decision:
  // A recipe is productionReady if content is 100% complete and there are ZERO blocking issues.
  const hasBlockingIssues = issues.some(issue => issue.severity === 'blocking');
  const productionReady = contentComplete && !hasBlockingIssues;

  return {
    contentComplete,
    imageComplete,
    videoComplete,
    licenseComplete,
    localizationComplete,
    productionReady,
    issues,
    missingFields
  };
}
