import { NormalizedRecipe, DuplicateCandidate } from './types';

/**
 * Basic duplicate detection engine:
 * Identifies recipes that share the exact canonical title or high similarity.
 * Does NOT auto-delete or modify records; returns structured candidate reports.
 */
export function detectDuplicates(recipes: NormalizedRecipe[]): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = [];
  const canonicalMap = new Map<string, NormalizedRecipe[]>();

  for (const recipe of recipes) {
    const key = recipe.canonicalTitle;
    if (!key) continue;

    const existing = canonicalMap.get(key) || [];
    existing.push(recipe);
    canonicalMap.set(key, existing);
  }

  for (const [canonicalTitle, group] of canonicalMap.entries()) {
    if (group.length > 1) {
      // Multiple recipes share the same canonical title
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const source = group[i];
          const target = group[j];
          candidates.push({
            sourceId: source.id,
            targetId: target.id,
            sourceTitle: source.title,
            targetTitle: target.title,
            canonicalTitle,
            reason: `Aynı kanonik başlık eşleşmesi: "${canonicalTitle}"`
          });
        }
      }
    }
  }

  return candidates;
}
