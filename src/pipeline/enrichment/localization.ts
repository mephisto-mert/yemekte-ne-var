import { NormalizedRecipe } from '../types';
import {
  LocalizedRecipeData,
  RecipeTranslator,
  TranslationRequest,
  TranslationResult,
  TranslationStatus
} from './types';

/**
 * Detects whether text or recipe originates from Turkish or English/Global culinary source.
 */
export function detectLanguage(text?: string | null, areaHint?: string | null): string {
  if (areaHint && areaHint.toLowerCase() === 'turkish') {
    return 'tr';
  }

  if (!text) return 'en';

  // Specific Turkish characters
  const turkishCharsRegex = /[çğışöüÇĞİŞÖÜ]/;
  if (turkishCharsRegex.test(text)) {
    return 'tr';
  }

  return 'en';
}

/**
 * Safe Mock Recipe Translator.
 * CRITICAL RULE: NEVER injects fake translated text into production or claims translated.
 * Marks translations as 'pending' with provider: 'none' and confidence: 0.
 */
export class MockRecipeTranslator implements RecipeTranslator {
  readonly id = 'mock_translator';
  readonly name = 'Mock Recipe Translator (Pending Foundation)';

  async translateText(request: TranslationRequest): Promise<TranslationResult> {
    const isSameLanguage = request.fromLang.toLowerCase() === request.toLang.toLowerCase();

    return {
      sourceText: request.text,
      translatedText: request.text, // Retains original text; no fake automated translation
      fromLang: request.fromLang,
      toLang: request.toLang,
      confidence: isSameLanguage ? 1.0 : 0.0,
      status: isSameLanguage ? 'translated' : 'pending',
      provider: 'none',
      model: 'none'
    };
  }

  async translateBatch(requests: TranslationRequest[]): Promise<TranslationResult[]> {
    return Promise.all(requests.map(r => this.translateText(r)));
  }
}

/**
 * Enriches a normalized recipe with localization metadata.
 * Strictly avoids automated machine translation into Turkish for English sources.
 */
export async function localizeRecipe(
  recipe: NormalizedRecipe,
  translator?: RecipeTranslator
): Promise<LocalizedRecipeData> {
  const activeTranslator = translator || new MockRecipeTranslator();
  const sourceLang = recipe.cuisine.toLowerCase() === 'turkish' ? 'tr' : detectLanguage(recipe.title, recipe.cuisine);
  const isTurkish = sourceLang === 'tr';

  if (isTurkish) {
    return {
      sourceTitle: recipe.title,
      sourceLanguage: 'tr',
      displayTitle: recipe.title,
      displayLanguage: 'tr',
      translationStatus: 'translated',
      translationMeta: {
        provider: 'native',
        model: 'native_turkish_source',
        translatedAt: new Date().toISOString(),
        confidence: 1.0,
        reviewStatus: 'approved'
      }
    };
  }

  // Non-Turkish recipes (e.g. English TheMealDB):
  // Preserve original title as display title; flag as not_translated / pending
  const translationRes = await activeTranslator.translateText({
    text: recipe.title,
    fromLang: sourceLang,
    toLang: 'tr',
    context: 'title'
  });

  const translationStatus: TranslationStatus = translationRes.status === 'translated'
    ? 'translated'
    : 'not_translated';

  return {
    sourceTitle: recipe.title,
    sourceLanguage: sourceLang,
    displayTitle: recipe.title, // Preserves original title without automated machine translation
    displayLanguage: sourceLang,
    translationStatus,
    translationMeta: {
      provider: translationRes.provider,
      model: translationRes.model,
      translatedAt: new Date().toISOString(),
      confidence: translationRes.confidence,
      reviewStatus: 'pending'
    }
  };
}
