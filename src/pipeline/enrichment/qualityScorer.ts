import {
  EnrichedQualityScore,
  CompletenessEvaluation,
  ImageMatchingResult,
  VideoMatchingResult,
  TaxonomyMappingResult,
  LocalizedRecipeData
} from './types';
import { NormalizedRecipe } from '../types';

export function calculateEnrichedQualityScore(options: {
  recipe: NormalizedRecipe;
  completeness: CompletenessEvaluation;
  imageData: ImageMatchingResult;
  videoData: VideoMatchingResult;
  taxonomyData: TaxonomyMappingResult;
  localizedData: LocalizedRecipeData;
}): EnrichedQualityScore {
  const { recipe, imageData, videoData, taxonomyData, localizedData } = options;

  let contentScore = 0;
  // Content scoring (0-35 points)
  if (recipe.title && recipe.title.trim().length >= 3) contentScore += 10;
  if (recipe.ingredients && recipe.ingredients.length >= 3) contentScore += 15;
  else if (recipe.ingredients && recipe.ingredients.length >= 1) contentScore += 8;
  if (recipe.instructions && recipe.instructions.length >= 2) contentScore += 10;
  else if (recipe.instructions && recipe.instructions.length >= 1) contentScore += 5;

  // Image scoring (0-20 points)
  const imageScore = Math.round((imageData.imageMatchScore / 100) * 20);

  // Video scoring (0-15 points)
  const videoScore = Math.round((videoData.videoMatchScore / 100) * 15);

  // Metadata scoring (0-15 points)
  let metadataScore = 0;
  if (taxonomyData.status === 'mapped') metadataScore += 8;
  if (recipe.timeMinutes && recipe.timeMinutes > 0) metadataScore += 4;
  if (recipe.servings && recipe.servings > 0) metadataScore += 3;

  // Localization scoring (0-15 points)
  let localizationScore = 0;
  if (localizedData.sourceLanguage === 'tr' || localizedData.translationStatus === 'translated') {
    localizationScore = 15;
  } else if (localizedData.sourceLanguage === 'en') {
    localizationScore = 8; // Preserved English display title
  }

  const overallScore = Math.min(
    100,
    contentScore + imageScore + videoScore + metadataScore + localizationScore
  );

  let tier: 'excellent' | 'good' | 'review' | 'reject' = 'good';
  if (overallScore >= 85) tier = 'excellent';
  else if (overallScore >= 70) tier = 'good';
  else if (overallScore >= 50) tier = 'review';
  else tier = 'reject';

  return {
    overallScore,
    tier,
    contentScore,
    imageScore,
    videoScore,
    metadataScore,
    localizationScore,
    breakdown: {
      content: contentScore,
      image: imageScore,
      video: videoScore,
      metadata: metadataScore,
      localization: localizationScore
    }
  };
}
