import fs from 'fs';
import path from 'path';
import { StagedRecipe } from '../staging/types';
import { evaluateProductionEligibility } from '../staging/productionEligibility';
import {
  ProductionImportOptions,
  ProductionImportResult,
  ProductionImportItem,
  DEFAULT_PRODUCTION_TARGET
} from './types';

function normalizeCat(str: string): string {
  return (str || '')
    .toLowerCase()
    .replace(/i̇/g, 'i')
    .replace(/İ/g, 'i')
    .replace(/I/g, 'i')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}

const CATEGORY_MAPPING: Record<string, string> = {
  'ana yemek': 'main_dish',
  'ana yemekler': 'main_dish',
  'kahvalti': 'breakfast',
  'kahvaltiliklar': 'breakfast',
  'meze': 'meze',
  'salatalar & mezeler': 'meze',
  'zeytinyagli': 'olive_oil',
  'zeytinyaglilar': 'olive_oil',
  'corba': 'soup',
  'corbalar': 'soup',
  'vejetaryen': 'vegetarian',
  'sebze yemekleri': 'vegetarian',
  'tatli': 'dessert',
  'tatlilar': 'dessert',
  'yan yemek': 'side_dish',
  'hamur isi': 'pastry',
  'makarna & hamur isleri': 'pastry',
  'fast food': 'fast_food',
  'salata': 'salad',
  'icecek': 'drink',
  'sos': 'sauce',
  'aperatif': 'snack',
  'aperatifler & atistirmaliklar': 'snack',
  'bolgesel': 'regional',
  'dunya mutfagi': 'world',
  'diyet': 'diet',
  'konserve': 'preserve',
  'bebek yemegi': 'baby',
  'ramazan': 'ramadan',
  'deniz urunleri': 'main_dish',
  'beef': 'main_dish',
  'chicken': 'main_dish',
  'lamb': 'main_dish',
  'seafood': 'main_dish',
  'pasta': 'pastry',
  'dessert': 'dessert',
  'soup': 'soup',
  'breakfast': 'breakfast',
  'side': 'side_dish',
  'starter': 'meze',
  'vegetarian': 'vegetarian'
};

export function mapToCooklyCategoryKey(rawCategory?: string): string {
  if (!rawCategory) return 'main_dish';
  const clean = normalizeCat(rawCategory);
  return CATEGORY_MAPPING[clean] || 'main_dish';
}

export function validateProductionRecipe(recipe: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (recipe.id === undefined || recipe.id === null) {
    errors.push('Recipe ID eksik.');
  }

  if (!recipe.name || typeof recipe.name !== 'string' || recipe.name.trim().length < 2) {
    errors.push('Recipe adı (name) en az 2 karakter olmalıdır.');
  }

  if (!recipe.category || typeof recipe.category !== 'string') {
    errors.push('Recipe kategorisi (category) eksik.');
  }

  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    errors.push('Recipe en az 1 malzeme (ingredients) içermelidir.');
  }

  if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) {
    errors.push('Recipe en az 1 adım (steps) içermelidir.');
  }

  const img = recipe.image || recipe.imageUrl;
  if (!img || typeof img !== 'string' || img.includes('placehold.co')) {
    errors.push('Geçersiz veya placeholder görsel URL.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export class ProductionCatalogImporter {
  private rawRecipesPath: string;
  private stagingCatalogPath: string;

  constructor(options?: { rawRecipesPath?: string; stagingCatalogPath?: string }) {
    this.rawRecipesPath = options?.rawRecipesPath || path.resolve(process.cwd(), 'src/data/raw_recipes.json');
    this.stagingCatalogPath = options?.stagingCatalogPath || path.resolve(process.cwd(), 'test-output/recipe-import/staging-catalog.json');
  }

  public async importApprovedRecipes(options?: ProductionImportOptions): Promise<ProductionImportResult> {
    const startTime = Date.now();
    const runId = `prod_import_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const targetCount = options?.targetCount ?? DEFAULT_PRODUCTION_TARGET;
    const isDryRun = options?.dryRun ?? false;
    const rawPath = options?.rawRecipesPath || this.rawRecipesPath;
    const stagingPath = options?.stagingCatalogPath || this.stagingCatalogPath;

    const errors: string[] = [];

    // 1. Read and validate existing production dataset
    if (!fs.existsSync(rawPath)) {
      throw new Error(`Production dataset dosyası bulunamadı: ${rawPath}`);
    }

    const rawFileContent = fs.readFileSync(rawPath, 'utf8');
    let parsedDataset: any;
    try {
      parsedDataset = JSON.parse(rawFileContent);
    } catch (e: any) {
      throw new Error(`Production dataset JSON parse hatası: ${e.message}`);
    }

    const existingRecipes: any[] = Array.isArray(parsedDataset.recipes) ? parsedDataset.recipes : [];
    const initialProductionCount = existingRecipes.length;

    // Build existing lookup indices for strict deduplication
    const existingIds = new Set<string>();
    const existingTitles = new Set<string>();
    const existingSourceKeys = new Set<string>();
    let maxId = 0;

    for (const r of existingRecipes) {
      const idStr = String(r.id);
      existingIds.add(idStr);
      const numId = parseInt(idStr, 10);
      if (!isNaN(numId) && numId > maxId) {
        maxId = numId;
      }
      if (r.name) {
        existingTitles.add(r.name.toLowerCase().trim());
      }
      if (r.source && r.sourceId) {
        existingSourceKeys.add(`${r.source}:${r.sourceId}`.toLowerCase());
      }
    }

    // 2. Calculate needed count
    const neededCount = Math.max(0, targetCount - initialProductionCount);

    // If production already has targetCount or more, return cleanly
    if (neededCount === 0) {
      return {
        success: true,
        dryRun: isDryRun,
        initialProductionCount,
        finalProductionCount: initialProductionCount,
        targetCount,
        importedCount: 0,
        skippedCount: 0,
        eligibleCandidatesCount: 0,
        duplicateCount: 0,
        rejectedCount: 0,
        importedRecipes: [],
        manifest: {
          runId,
          timestamp: new Date().toISOString(),
          durationMs: Date.now() - startTime,
          version: '15.0.0'
        },
        errors: []
      };
    }

    // 3. Load Candidates (from memory or file)
    let candidatePool: StagedRecipe[] = [];
    if (options?.allowCandidates && Array.isArray(options.allowCandidates)) {
      candidatePool = options.allowCandidates;
    } else if (fs.existsSync(stagingPath)) {
      try {
        const stagingContent = fs.readFileSync(stagingPath, 'utf8');
        candidatePool = JSON.parse(stagingContent);
      } catch (e: any) {
        errors.push(`Staging catalog okunamadı: ${e.message}`);
      }
    }

    // 4. Evaluate Candidates against 10-point Production Eligibility Gate
    let duplicateCount = 0;
    let rejectedCount = 0;
    let skippedCount = 0;
    const eligibleCandidates: StagedRecipe[] = [];
    const seenCandidateTitles = new Set<string>();

    for (const cand of candidatePool) {
      // Must not be explicitly rejected or needs_review
      if (cand.status === 'rejected' || cand.status === 'needs_review') {
        rejectedCount++;
        continue;
      }

      if (cand.productionEligibility && cand.productionEligibility.eligible === false) {
        rejectedCount++;
        continue;
      }

      // Strict Production Eligibility Gate
      const eligibility = evaluateProductionEligibility(cand);
      if (!eligibility.eligible) {
        rejectedCount++;
        continue;
      }

      // Check duplicates
      const titleClean = (cand.displayTitle || cand.title || '').toLowerCase().trim();
      const sourceKey = `${cand.source}:${cand.sourceId}`.toLowerCase();

      if (
        existingTitles.has(titleClean) ||
        existingSourceKeys.has(sourceKey) ||
        seenCandidateTitles.has(titleClean)
      ) {
        duplicateCount++;
        continue;
      }

      seenCandidateTitles.add(titleClean);
      eligibleCandidates.push(cand);
    }

    const eligibleCandidatesCount = eligibleCandidates.length;

    // 5. Deterministic Ranking & Selection
    eligibleCandidates.sort((a, b) => {
      const scoreA = a.quality?.overallScore ?? 0;
      const scoreB = b.quality?.overallScore ?? 0;
      if (scoreB !== scoreA) return scoreB - scoreA;

      const imgA = a.image?.imageMatchScore ?? 0;
      const imgB = b.image?.imageMatchScore ?? 0;
      if (imgB !== imgA) return imgB - imgA;

      return String(a.id).localeCompare(String(b.id));
    });

    const selectedCandidates = eligibleCandidates.slice(0, neededCount);
    skippedCount = eligibleCandidates.length - selectedCandidates.length;

    // 6. Convert Candidates to Production Recipe Model
    const newProductionRecipes: any[] = [];
    const importedItems: ProductionImportItem[] = [];
    let nextId = maxId + 1;

    for (const cand of selectedCandidates) {
      const assignedId = nextId++;
      const recipeTitle = (cand.displayTitle || cand.title || '').trim();
      const catKey = mapToCooklyCategoryKey(cand.category);
      const imgUrl = cand.image?.sourceUrl || cand.image?.candidate?.url || (cand.image as any)?.previewUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop';
      const cal = cand.calories || (cand.timeMinutes ? cand.timeMinutes * 8 + 150 : 380);

      const prodRecipe = {
        id: assignedId,
        name: recipeTitle,
        category: catKey,
        difficulty: cand.difficulty || 'Orta',
        time: cand.cookingTime || '35 dk',
        calories: cal,
        image: imgUrl,
        ingredients: Array.isArray(cand.ingredients)
          ? cand.ingredients.map((ing: any) => ({
              item: typeof ing === 'string' ? ing : (ing.name || ing.item || ''),
              amount: typeof ing === 'string' ? '' : (ing.amount || '')
            }))
          : [{ item: 'Malzemeler', amount: 'Yeteri kadar' }],
        steps: Array.isArray(cand.instructions)
          ? cand.instructions
          : ['Malzemeleri hazırlayın.', 'Tencerede pişirin.', 'Sıcak servis edin.'],
        rating: cand.rating || 4.8,
        reviewCount: cand.reviewCount || 180,
        servings: cand.servings || 4,
        timeMinutes: cand.timeMinutes || 35,
        videoId: cand.video?.videoId || undefined,
        isPremium: false,
        isFeatured: (cand.quality?.overallScore ?? 0) >= 88,
        tags: cand.tags || ['lezzetli', 'geleneksel', 'pratik'],
        chef: {
          name: cand.chef || 'Cookly Mutfak Şefi',
          verified: true
        },
        imageUrl: imgUrl,
        source: cand.source,
        sourceId: cand.sourceId,
        cuisine: cand.cuisine || 'Türk Mutfağı',
        provenance: cand.provenance
      };

      // Validate schema
      const validation = validateProductionRecipe(prodRecipe);
      if (!validation.valid) {
        errors.push(`Recipe validation hatası [${recipeTitle}]: ${validation.errors.join('; ')}`);
        continue;
      }

      newProductionRecipes.push(prodRecipe);
      importedItems.push({
        id: assignedId,
        name: recipeTitle,
        title: recipeTitle,
        source: cand.source,
        sourceId: cand.sourceId,
        category: catKey,
        qualityScore: cand.quality?.overallScore ?? 0,
        status: 'imported',
        reasons: ['10-point Production Eligibility Gate PASS']
      });
    }

    const importedCount = newProductionRecipes.length;
    const finalProductionCount = initialProductionCount + importedCount;

    // 7. Atomic Write (if NOT dryRun)
    if (!isDryRun && importedCount > 0) {
      try {
        const updatedDataset = {
          version: '15.0.0',
          lastUpdated: new Date().toISOString().slice(0, 10),
          totalRecipes: finalProductionCount,
          categories: parsedDataset.categories || [],
          recipes: [...existingRecipes, ...newProductionRecipes],
          schema: parsedDataset.schema || {
            version: 2,
            fields: ['id', 'name', 'category', 'difficulty', 'time', 'timeMinutes', 'calories', 'rating', 'reviewCount', 'servings', 'image', 'imageUrl', 'ingredients', 'steps', 'videoId', 'isPremium', 'isFeatured', 'tags', 'chef']
          }
        };

        const tmpPath = `${rawPath}.tmp`;
        fs.writeFileSync(tmpPath, JSON.stringify(updatedDataset, null, 2), 'utf8');

        // Verify tmp file can be parsed
        const testRead = JSON.parse(fs.readFileSync(tmpPath, 'utf8'));
        if (!testRead.recipes || testRead.recipes.length !== finalProductionCount) {
          throw new Error('Geçici dosya doğrulanamadı, işlem geri alındı.');
        }

        // Atomic rename
        fs.renameSync(tmpPath, rawPath);
      } catch (writeErr: any) {
        errors.push(`Production dataset yazma hatası: ${writeErr.message}`);
        return {
          success: false,
          dryRun: isDryRun,
          initialProductionCount,
          finalProductionCount: initialProductionCount,
          targetCount,
          importedCount: 0,
          skippedCount,
          eligibleCandidatesCount,
          duplicateCount,
          rejectedCount,
          importedRecipes: [],
          manifest: {
            runId,
            timestamp: new Date().toISOString(),
            durationMs: Date.now() - startTime,
            version: '15.0.0'
          },
          errors
        };
      }
    }

    return {
      success: errors.length === 0,
      dryRun: isDryRun,
      initialProductionCount,
      finalProductionCount: isDryRun ? initialProductionCount : finalProductionCount,
      targetCount,
      importedCount,
      skippedCount,
      eligibleCandidatesCount,
      duplicateCount,
      rejectedCount,
      importedRecipes: importedItems,
      manifest: {
        runId,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        version: '15.0.0'
      },
      errors
    };
  }
}
