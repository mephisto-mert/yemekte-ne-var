import { ImageCandidate, ImageQualityStatus } from './types';
import { isPlaceholderImage } from './placeholder';

/**
 * Validates the technical structure of an image URL.
 */
export function validateImageUrl(url?: string | null): { isValid: boolean; error?: string } {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return { isValid: false, error: 'Görsel URL adresi eksik veya boş.' };
  }

  const trimmed = url.trim();

  // Local assets or data URLs
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('data:image/')) {
    return { isValid: true };
  }

  // HTTP/HTTPS URLs
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, error: `Desteklenmeyen protokol: ${parsed.protocol}` };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Geçersiz URL biçimi.' };
  }
}

/**
 * Generates clean, accessible alt text from a recipe title.
 * Prevents promotional fluff or fabricated descriptions.
 */
export function generateAltText(recipeTitle?: string | null, providedAlt?: string | null): string {
  if (providedAlt && providedAlt.trim().length >= 3) {
    return providedAlt.replace(/\s+/g, ' ').trim();
  }

  if (recipeTitle && recipeTitle.trim().length >= 2) {
    const cleanTitle = recipeTitle.replace(/\s+/g, ' ').trim();
    return `${cleanTitle} yemeği sunumu`;
  }

  return 'Yemek tarifi görseli';
}

/**
 * Evaluates the quality status and metadata completeness of an image candidate.
 */
export function evaluateImageQuality(candidate: ImageCandidate): {
  status: ImageQualityStatus;
  errors: string[];
  warnings: string[];
  isPlaceholder: boolean;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const url = candidate.imageUrl;

  const isPlaceholder = isPlaceholderImage(url);

  // 1. URL Check
  if (!url || url.trim() === '') {
    errors.push('Görsel URL adresi bulunmuyor (missing image).');
    return { status: 'INVALID', errors, warnings, isPlaceholder: true };
  }

  const urlValidation = validateImageUrl(url);
  if (!urlValidation.isValid) {
    errors.push(urlValidation.error || 'Geçersiz görsel URL adresi.');
    return { status: 'INVALID', errors, warnings, isPlaceholder };
  }

  // 2. Prohibited Source Check
  if (candidate.metadata?.permissionPolicy === 'prohibited') {
    errors.push('Telif veya kullanım şartları gereği bu kaynaktan görsel kullanımı yasaklanmıştır (PROHIBITED).');
    return { status: 'INVALID', errors, warnings, isPlaceholder };
  }

  // 3. Placeholder Warning
  if (isPlaceholder) {
    warnings.push('Görsel bir demo/placeholder gıda görselidir (placehold.co vb.).');
  }

  // 4. Metadata Warnings
  if (!candidate.metadata?.attribution && candidate.metadata?.sourceType !== 'local') {
    warnings.push('Görsel kaynak atıfı (attribution) belirtilmemiş.');
  }

  if (!candidate.metadata?.license && candidate.metadata?.sourceType !== 'local') {
    warnings.push('Görsel lisans bilgisi belirtilmemiş.');
  }

  if (!candidate.altText && (!candidate.recipeTitle || candidate.recipeTitle.trim().length < 2)) {
    warnings.push('Erişilebilir görsel alt metni (alt text) eksik.');
  }

  const status: ImageQualityStatus = errors.length > 0
    ? 'INVALID'
    : warnings.length > 0
      ? 'WARNING'
      : 'VALID';

  return { status, errors, warnings, isPlaceholder };
}
