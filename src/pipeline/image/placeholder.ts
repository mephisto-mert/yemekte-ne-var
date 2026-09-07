/**
 * Centralized Placeholder Image Detector.
 * Identifies demo / synthetic placeholder URLs while protecting genuine food photography.
 */

const KNOWN_PLACEHOLDER_DOMAINS = [
  'placehold.co',
  'via.placeholder.com',
  'placeholder.com',
  'dummyimage.com'
];

const KNOWN_PLACEHOLDER_KEYWORDS = [
  'placeholder',
  'default-food',
  'recipe-placeholder',
  'no-image',
  'missing-image',
  'default_recipe'
];

/**
 * Checks if a given image URL represents a placeholder or missing image.
 * 
 * Returns true for:
 * - null, undefined, empty string
 * - URLs from placeholder domains (e.g. placehold.co/400x300...)
 * - URLs containing placeholder keywords
 * 
 * Returns false for:
 * - Legitimate photos from CDNs (Unsplash, Pexels, Wikimedia, local assets)
 */
export function isPlaceholderImage(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;

  const trimmed = url.trim().toLowerCase();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return true;

  // Check known placeholder domains
  for (const domain of KNOWN_PLACEHOLDER_DOMAINS) {
    if (trimmed.includes(domain)) return true;
  }

  // Check placeholder keywords in URL path or query
  for (const kw of KNOWN_PLACEHOLDER_KEYWORDS) {
    if (trimmed.includes(kw)) return true;
  }

  return false;
}
