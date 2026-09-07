/**
 * Centralized Search Query Builder for Recipe Image Acquisition.
 * Builds clean, focused, semantic queries without keyword stuffing or advertising fluff.
 */

/**
 * Strips parentheses, special characters, and excessive noise from recipe titles.
 * Preserves Turkish diacritics and letters.
 * 
 * Example:
 *  "  İskender Kebabı (Tereyağlı Özel)  " -> "İskender Kebabı yemek"
 *  "Mercimek Çorbası" -> "Mercimek Çorbası yemek"
 *  "" -> "Yemek tarifi"
 */
export function buildImageSearchQuery(recipeTitle?: string | null): string {
  if (!recipeTitle || typeof recipeTitle !== 'string') {
    return 'Yemek tarifi';
  }

  // 1. Remove bracketed notes like (Tereyağlı), (Pratik), [Özel]
  let cleaned = recipeTitle
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\{[^}]*\}/g, '');

  // 2. Remove punctuation noise
  cleaned = cleaned.replace(/[!?,;:#*+~=_/\\|<>]/g, ' ');

  // 3. Collapse whitespace and trim
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  if (cleaned.length < 2) {
    return 'Yemek tarifi';
  }

  // 4. Return clean, focused culinary query
  return `${cleaned} yemek`;
}
