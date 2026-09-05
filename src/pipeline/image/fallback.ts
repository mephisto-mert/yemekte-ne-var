import { ImageCandidate, ImageFallbackPriority } from './types';
import { isPlaceholderImage } from './placeholder';

/**
 * Resolves the fallback strategy priority for a recipe image candidate.
 * 
 * STRICT RULE:
 * Third-party unauthorized screenshots or scraping images (e.g. from Nefis Yemek Tarifleri)
 * are NEVER eligible for any fallback tier.
 */
export function resolveImageFallback(candidate: ImageCandidate): ImageFallbackPriority {
  const url = candidate.imageUrl;
  const isPlaceholder = isPlaceholderImage(url);
  const sourceType = candidate.metadata?.sourceType || 'unknown';
  const policy = candidate.metadata?.permissionPolicy || 'unknown';

  // If URL is missing, invalid, or placeholder, determine next available fallback
  if (isPlaceholder || !url) {
    if (sourceType === 'generated') return 'generated';
    if (sourceType === 'user_uploaded') return 'user_uploaded';
    return 'missing_state';
  }

  // If prohibited source, discard immediately to missing_state
  if (policy === 'prohibited') {
    return 'missing_state';
  }

  // Tier 1: Approved existing local or curated assets
  if (sourceType === 'local') {
    return 'approved_existing';
  }

  // Tier 2: Licensed external source (Unsplash, Pexels, Wikimedia, API)
  if (sourceType === 'external' || sourceType === 'api') {
    return 'licensed_external';
  }

  // Tier 3: AI Generated image
  if (sourceType === 'generated') {
    return 'generated';
  }

  // Tier 4: User uploaded
  if (sourceType === 'user_uploaded') {
    return 'user_uploaded';
  }

  // Default fallback
  return 'missing_state';
}
