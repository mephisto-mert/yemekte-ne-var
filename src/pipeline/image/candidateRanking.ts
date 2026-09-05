import { ImageCandidate } from './types';
import { isPlaceholderImage } from './placeholder';
import { validateImageUrl } from './validator';

/**
 * Calculates a deterministic ranking score for an ImageCandidate.
 * 
 * CRITICAL SAFETY RULES:
 * 1. Prohibited sources receive extreme negative penalties and can NEVER outrank allowed images.
 * 2. Invalid URLs and placeholders are heavily penalized.
 * 3. Permitted sources rank in strict accordance with the fallback hierarchy:
 *    Local Approved > Licensed External > Approved Generated > User Uploaded.
 */
export function calculateCandidateScore(candidate: ImageCandidate): number {
  const policy = candidate.metadata?.permissionPolicy || 'unknown';
  const sourceType = candidate.metadata?.sourceType || 'unknown';
  const url = candidate.imageUrl;

  // 1. Catastrophic Penalties
  if (policy === 'prohibited') {
    return -10000;
  }

  const urlValidation = validateImageUrl(url);
  if (!urlValidation.isValid) {
    return -5000;
  }

  if (isPlaceholderImage(url)) {
    return -2000;
  }

  // 2. Base Hierarchy Scoring for Approved / Permitted Sources
  let score = 0;

  if (policy === 'allowed') {
    switch (sourceType) {
      case 'local':
        score += 1000; // Tier 1: Approved existing
        break;
      case 'external':
      case 'api':
      case 'unsplash':
      case 'pexels':
      case 'open_licensed':
        score += 800; // Tier 2: Licensed external
        break;
      case 'generated':
        score += 600; // Tier 3: Approved generated
        break;
      case 'user_uploaded':
        score += 400; // Tier 4: User uploaded
        break;
      default:
        score += 300;
    }
  } else if (policy === 'review_required') {
    score += 100;
  } else {
    // unknown policy
    score += 50;
  }

  // 3. Technical Quality & Metadata Bonuses
  const width = candidate.metadata?.width;
  const height = candidate.metadata?.height;
  if (typeof width === 'number' && typeof height === 'number' && width >= 800 && height >= 600) {
    score += 50;
  }

  if (candidate.metadata?.attribution) {
    score += 20;
  }

  if (candidate.metadata?.license) {
    score += 20;
  }

  return score;
}

/**
 * Deterministically sorts image candidates from highest to lowest quality.
 * Ties are broken using a stable alphabetical comparator.
 */
export function rankCandidates(candidates: ImageCandidate[]): ImageCandidate[] {
  return [...candidates].sort((a, b) => {
    const scoreA = calculateCandidateScore(a);
    const scoreB = calculateCandidateScore(b);

    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    // Stable tie-breaker
    const idA = `${a.source}:${a.sourceId || ''}:${a.imageUrl || ''}`;
    const idB = `${b.source}:${b.sourceId || ''}:${b.imageUrl || ''}`;
    return idA.localeCompare(idB);
  });
}
