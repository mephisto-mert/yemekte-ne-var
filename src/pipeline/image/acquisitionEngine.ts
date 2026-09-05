import { ImageProvider, ImageProviderRegistry, defaultProviderRegistry } from './providers';
import { ImageCandidate, ImagePipelineResult, ImageDecision } from './types';
import { buildImageSearchQuery } from './queryBuilder';
import { rankCandidates } from './candidateRanking';
import { processImageCandidate } from './pipeline';

export interface RecipeAcquisitionInput {
  id: string;
  title: string;
  currentImageUrl?: string | null;
}

export interface AcquisitionOptions {
  registry?: ImageProviderRegistry;
  providerNames?: string[];
  providers?: ImageProvider[];
  maxCandidatesPerProvider?: number;
}

export interface AcquisitionDecisionResult {
  recipeId: string;
  recipeTitle: string;
  searchQuery: string;
  bestCandidate: ImagePipelineResult | null;
  rankedCandidates: ImagePipelineResult[];
  decision: ImageDecision;
  decisionReason: string;
  usedProvider: string | null;
}

/**
 * Recipe Image Acquisition Decision Engine.
 * Coordinates:
 * Recipe -> Query Builder -> Provider Search -> Candidates -> Ranking -> Policy/Quality Validation -> Best Candidate
 */
export async function acquireImageForRecipe(
  recipe: RecipeAcquisitionInput,
  options?: AcquisitionOptions
): Promise<AcquisitionDecisionResult> {
  const query = buildImageSearchQuery(recipe.title);
  const registry = options?.registry || defaultProviderRegistry;

  // Determine providers to query
  let providers: ImageProvider[] = [];
  if (options?.providers && options.providers.length > 0) {
    providers = options.providers;
  } else if (options?.providerNames && options.providerNames.length > 0) {
    providers = options.providerNames
      .map(name => registry.getProvider(name))
      .filter((p): p is ImageProvider => !!p);
  } else {
    providers = registry.listProviders();
  }

  // 1. Gather raw results from providers
  const rawCandidates: ImageCandidate[] = [];

  for (const provider of providers) {
    try {
      const results = await Promise.resolve(
        provider.search(query, { limit: options?.maxCandidatesPerProvider || 5 })
      );

      for (const res of results) {
        rawCandidates.push({
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          imageUrl: res.imageUrl,
          source: res.source,
          sourceId: res.sourceId,
          altText: res.altText,
          metadata: {
            sourceName: res.sourceName,
            sourceType: provider.type,
            sourceUrl: res.sourceUrl,
            license: res.license,
            attribution: res.attribution,
            permissionPolicy: res.permissionPolicy,
            retrievedAt: res.retrievedAt,
            width: res.width,
            height: res.height,
            mimeType: res.mimeType
          }
        });
      }
    } catch {
      // Graceful provider failure handling (no unhandled rejections)
    }
  }

  // 2. If no candidate found from providers, check current image if any
  if (rawCandidates.length === 0) {
    if (recipe.currentImageUrl) {
      rawCandidates.push({
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        imageUrl: recipe.currentImageUrl,
        source: 'existing_dataset',
        metadata: {
          sourceName: 'Existing Dataset',
          sourceType: 'unknown',
          permissionPolicy: 'unknown',
          retrievedAt: new Date().toISOString()
        }
      });
    } else {
      return {
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        searchQuery: query,
        bestCandidate: null,
        rankedCandidates: [],
        decision: 'missing',
        decisionReason: 'Hiçbir sağlayıcıdan görsel adayı bulunamadı (missing image state).',
        usedProvider: null
      };
    }
  }

  // 3. Rank Candidates deterministically
  const rankedInputs = rankCandidates(rawCandidates);

  // 4. Run through PART 6 Image Pipeline Validation
  const validatedCandidates: ImagePipelineResult[] = rankedInputs.map(c =>
    processImageCandidate(c)
  );

  // 5. Select the Best Safe Candidate
  // Prefer usable > needs_review > missing > rejected
  const usableCandidate = validatedCandidates.find(c => c.decision === 'usable');
  const reviewCandidate = validatedCandidates.find(c => c.decision === 'needs_review');
  const bestCandidate = usableCandidate || reviewCandidate || validatedCandidates[0] || null;

  let overallDecision: ImageDecision = 'missing';
  let decisionReason = '';
  let usedProvider: string | null = null;

  if (bestCandidate) {
    overallDecision = bestCandidate.decision;
    decisionReason = bestCandidate.decisionReason;
    const matchingInput = rankedInputs.find(i => i.imageUrl === bestCandidate.imageUrl);
    usedProvider = matchingInput?.source || null;
  }

  return {
    recipeId: recipe.id,
    recipeTitle: recipe.title,
    searchQuery: query,
    bestCandidate,
    rankedCandidates: validatedCandidates,
    decision: overallDecision,
    decisionReason,
    usedProvider
  };
}
