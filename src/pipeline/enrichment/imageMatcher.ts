import { NormalizedRecipe } from '../types';
import { ImageMatchingResult, MediaReadinessStatus, RecipeImageCandidate } from './types';
import { isPlaceholderImage } from '../image/placeholder';
import { buildImageSearchQuery } from '../image/queryBuilder';

export interface ImageMatchingOptions {
  existingCandidate?: RecipeImageCandidate;
  rawImageUrl?: string | null;
  permissionStatus?: string;
  license?: string | null;
  attribution?: string | null;
}

/**
 * Evaluates and matches candidate food images for a recipe without downloading.
 * Computes a transparent 0-100 image match score based on relevance, quality, and licensing.
 */
export function matchRecipeImage(
  recipe: NormalizedRecipe,
  options?: ImageMatchingOptions
): ImageMatchingResult {
  const reasons: string[] = [];
  const candidateUrl = options?.existingCandidate?.url || options?.rawImageUrl || recipe.image;

  // 1. Missing or Null Check
  if (!candidateUrl || candidateUrl.trim().length === 0) {
    return {
      imageMatchScore: 0,
      status: 'missing',
      reasons: ['Tarife atanmış herhangi bir görsel adayı bulunamadı.'],
      confidence: 1.0,
      permissionStatus: 'none',
      license: 'none'
    };
  }

  // 2. Placeholder Check
  if (isPlaceholderImage(candidateUrl)) {
    return {
      imageMatchScore: 0,
      status: 'rejected',
      reasons: ['Sentetik veya placeholder görsel tespit edildi (placehold.co veya dummy URL).'],
      confidence: 1.0,
      sourceUrl: candidateUrl,
      permissionStatus: 'rejected',
      license: 'placeholder'
    };
  }

  let score = 0;

  // 3. Relevance & Query match (0-35 points)
  const query = buildImageSearchQuery(recipe.title).toLowerCase();
  const cTitle = (recipe.canonicalTitle || recipe.title).toLowerCase();
  const cleanUrl = candidateUrl.toLowerCase();

  const titleTokens = cTitle.split(/\s+/).filter(t => t.length > 2);
  let matchedTokens = 0;
  for (const token of titleTokens) {
    if (cleanUrl.includes(token) || query.includes(token)) {
      matchedTokens++;
    }
  }

  const tokenRatio = titleTokens.length > 0 ? matchedTokens / titleTokens.length : 0;
  const relevancePoints = Math.round(tokenRatio * 35);
  score += relevancePoints;
  reasons.push(`Başlık ve sorgu anahtar kelime uyumu: ${relevancePoints}/35 puan`);

  // 4. Recipe Category / Cuisine Relevance (0-15 points)
  if (recipe.category && recipe.category !== 'Genel' && recipe.category !== 'unknown') {
    score += 15;
    reasons.push('Kategori bağlamı geçerli: 15/15 puan');
  } else {
    score += 5;
    reasons.push('Kategori bağlamı genel: 5/15 puan');
  }

  // 5. Technical Quality / CDN Reliability (0-20 points)
  if (cleanUrl.startsWith('https://')) {
    score += 10;
  }
  if (cleanUrl.includes('pexels.com') || cleanUrl.includes('unsplash.com') || cleanUrl.includes('wikimedia.org')) {
    score += 10;
    reasons.push('Onaylı yüksek çözünürlüklü CDN kaynağı: 20/20 puan');
  } else if (cleanUrl.includes('themealdb.com')) {
    score += 10;
    reasons.push('TheMealDB orijinal tarif görseli: 20/20 puan');
  } else {
    score += 5;
    reasons.push('Harici görsel kaynağı: 15/20 puan');
  }

  // 6. License & Permission Safety (0-30 points)
  const permissionStatus = options?.permissionStatus ||
    (cleanUrl.includes('themealdb.com') ? 'needs_review' : 'authorized');
  const license = options?.license ||
    (cleanUrl.includes('themealdb.com') ? 'unknown' : 'Pexels/Open License');

  let permissionPoints = 0;
  if (permissionStatus === 'authorized') {
    permissionPoints = 30;
    reasons.push('Lisans ve izin durumu onaylı (CC0/Pexels Free): 30/30 puan');
  } else if (permissionStatus === 'needs_review' || license === 'unknown') {
    permissionPoints = 15;
    reasons.push('Lisans kullanıcı katkılı/doğrulama bekliyor (needs_review): 15/30 puan');
  } else {
    permissionPoints = 0;
    reasons.push('Lisans durumu belirsiz veya yetkisiz: 0/30 puan');
  }
  score += permissionPoints;

  // Clamping score between 0 and 100
  const finalScore = Math.min(Math.max(score, 0), 100);

  // Status determination
  let status: MediaReadinessStatus = 'ready';
  if (permissionStatus === 'needs_review' || license === 'unknown') {
    status = 'needs_review';
  } else if (finalScore < 60) {
    status = 'needs_review';
  }

  const candidate: RecipeImageCandidate = options?.existingCandidate || {
    id: `img_${recipe.id}`,
    provider: cleanUrl.includes('pexels.com') ? 'pexels' : (cleanUrl.includes('themealdb.com') ? 'themealdb' : 'external'),
    url: candidateUrl,
    previewUrl: candidateUrl,
    format: 'jpeg',
    width: 1280,
    height: 720,
    license,
    attribution: options?.attribution || (cleanUrl.includes('themealdb.com') ? 'TheMealDB Open Recipe Database' : 'Approved Kitchen Asset'),
    permissionStatus: permissionStatus as any,
    isPlaceholder: false
  };

  return {
    candidate,
    imageMatchScore: finalScore,
    status,
    reasons,
    confidence: finalScore / 100,
    sourceUrl: candidateUrl,
    permissionStatus,
    license,
    attribution: candidate.attribution
  };
}
