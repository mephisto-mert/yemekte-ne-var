import { describe, it, expect } from 'vitest';
import { MockRecipeAdapter } from '../pipeline/import/mockAdapter';
import { coordinateImport } from '../pipeline/import/importCoordinator';
import { evaluateSourcePolicy } from '../pipeline/import/policy';
import { RecipeSourceAdapter, SourceMetadata } from '../pipeline/import/types';
import { RawRecipe } from '../pipeline/types';
import fs from 'fs';
import path from 'path';

describe('Recipe Source Permission Policy Tests', () => {

  const sampleRaw: RawRecipe = {
    id: 'test_item_1',
    name: 'Mercimek Çorbası',
    ingredients: ['Kırmızı Mercimek', 'Su', 'Tuz'],
    steps: ['Kaynatın ve blenderdan geçirin'],
    servings: 4,
    image: 'https://images.unsplash.com/photo-1'
  };

  // Helper to create mock adapter with custom metadata
  function createAdapterWithMetadata(metadata: Partial<SourceMetadata>): RecipeSourceAdapter {
    return {
      name: metadata.sourceName || 'test_source',
      metadata: {
        sourceName: metadata.sourceName || 'Test Source',
        sourceType: metadata.sourceType || 'external',
        sourceUrl: metadata.sourceUrl || null,
        retrievedAt: new Date().toISOString(),
        attribution: metadata.attribution || null,
        license: metadata.license || null,
        contentPermissionStatus: metadata.contentPermissionStatus || 'unknown',
        permissionPolicy: metadata.permissionPolicy
      },
      fetchRawRecipes: () => [sampleRaw]
    };
  }

  // Test 1: allowed source -> importable olabilir
  it('Test 1: "allowed" politikasına sahip kaynak importable olabilir', async () => {
    const adapter = createAdapterWithMetadata({
      permissionPolicy: 'allowed',
      contentPermissionStatus: 'authorized'
    });

    const report = await coordinateImport(adapter);
    expect(report.permissionPolicy).toBe('allowed');
    expect(report.candidates[0].decision).toBe('importable');
    expect(report.importable).toBe(1);
  });

  // Test 2: review_required -> needs_review
  it('Test 2: "review_required" politikasına sahip kaynak needs_review kararı alır', async () => {
    const adapter = createAdapterWithMetadata({
      permissionPolicy: 'review_required',
      contentPermissionStatus: 'pending_review'
    });

    const report = await coordinateImport(adapter);
    expect(report.permissionPolicy).toBe('review_required');
    expect(report.candidates[0].decision).toBe('needs_review');
    expect(report.needsReview).toBe(1);
    expect(report.candidates[0].decisionReason).toContain('REVIEW_REQUIRED');
  });

  // Test 3: unknown -> needs_review
  it('Test 3: "unknown" izin durumuna sahip kaynak güvenli olarak needs_review kararı alır', async () => {
    const adapter = createAdapterWithMetadata({
      permissionPolicy: 'unknown',
      contentPermissionStatus: 'unknown'
    });

    const report = await coordinateImport(adapter);
    expect(report.permissionPolicy).toBe('unknown');
    expect(report.candidates[0].decision).toBe('needs_review');
    expect(report.needsReview).toBe(1);
  });

  // Test 4: prohibited -> rejected
  it('Test 4: "prohibited" (yasaklanmış) kaynak doğrudan rejected kararı alır', async () => {
    const adapter = createAdapterWithMetadata({
      permissionPolicy: 'prohibited',
      contentPermissionStatus: 'unknown'
    });

    const report = await coordinateImport(adapter);
    expect(report.permissionPolicy).toBe('prohibited');
    expect(report.candidates[0].decision).toBe('rejected');
    expect(report.rejected).toBe(1);
    expect(report.candidates[0].decisionReason).toContain('PROHIBITED');
  });

  // Test 5: permission bilgisi olmayan source -> güvenli default (needs_review)
  it('Test 5: İzin veya metadata bilgisi eksik kaynak güvenli varsayılan olarak needs_review atanır', async () => {
    const adapter: RecipeSourceAdapter = {
      name: 'unspecified_source',
      // @ts-ignore testing undefined metadata fallback
      metadata: undefined,
      fetchRawRecipes: () => [sampleRaw]
    };

    const evaluation = evaluateSourcePolicy(adapter.metadata);
    expect(evaluation.policy).toBe('unknown');

    const report = await coordinateImport(adapter);
    expect(report.permissionPolicy).toBe('unknown');
    expect(report.candidates[0].decision).toBe('needs_review');
  });

  // Test 6: source metadata korunur
  it('Test 6: Kaynak üstverileri (metadata) ve izin politikası rapor üzerinde eksiksiz korunur', async () => {
    const adapter = createAdapterWithMetadata({
      sourceName: 'Vikikitap Mutfak',
      sourceType: 'external',
      sourceUrl: 'https://tr.wikibooks.org',
      license: 'CC-BY-SA 3.0',
      contentPermissionStatus: 'authorized',
      permissionPolicy: 'allowed'
    });

    const report = await coordinateImport(adapter);
    expect(report.source).toBe('Vikikitap Mutfak');
    expect(report.sourceType).toBe('external');
    expect(report.permissionPolicy).toBe('allowed');
  });

  // Test 7: mevcut Mock adapter davranışı bozulmaz
  it('Test 7: Mevcut MockRecipeAdapter varsayılan olarak allowed/public_domain ile çalışır', async () => {
    const mock = new MockRecipeAdapter();
    const report = await coordinateImport(mock);

    expect(report.permissionPolicy).toBe('allowed');
    expect(report.fetched).toBe(3);
    expect(report.importable).toBe(2); // 1 VALID + 1 WARNING
    expect(report.rejected).toBe(1);   // 1 INVALID
  });

  // Test 8: mevcut duplicate sistemi bozulmaz
  it('Test 8: İzin verilen kaynakta dahi duplicate tespit edildiğinde needs_review atanır', async () => {
    const dupBatch: RawRecipe[] = [
      { id: '1', name: 'Yayla Çorbası', ingredients: ['Pirinç'], steps: ['Pişir'], servings: 4, image: 'https://img.com/1' },
      { id: '2', name: 'yayla corbasi', ingredients: ['Pirinç'], steps: ['Pişir'], servings: 4, image: 'https://img.com/2' }
    ];

    const adapter: RecipeSourceAdapter = {
      name: 'allowed_dup_source',
      metadata: {
        sourceName: 'Allowed Source',
        sourceType: 'mock',
        retrievedAt: new Date().toISOString(),
        contentPermissionStatus: 'authorized',
        permissionPolicy: 'allowed'
      },
      fetchRawRecipes: () => dupBatch
    };

    const report = await coordinateImport(adapter);
    expect(report.duplicateCandidates).toBe(2);
    expect(report.candidates[1].decision).toBe('needs_review');
    expect(report.candidates[1].decisionReason).toContain('Benzer tarif tespit edildi');
  });

  // Test 9: fake data üretilmez
  it('Test 9: Politika kontrolleri sırasında asla sahte rating, chef, calories üretilmez', async () => {
    const rawNoFake: RawRecipe = {
      id: 'item_no_fake',
      name: 'Kuru Fasulye',
      ingredients: ['Fasulye', 'Soğan'],
      steps: ['Düdüklüde pişirin'],
      servings: 4
    };

    const adapter = createAdapterWithMetadata({
      permissionPolicy: 'allowed',
      contentPermissionStatus: 'authorized'
    });
    adapter.fetchRawRecipes = () => [rawNoFake];

    const report = await coordinateImport(adapter);
    const candidate = report.candidates[0];

    expect(candidate.normalizedRecipe.rating).toBeNull();
    expect(candidate.normalizedRecipe.chef).toBeNull();
    expect(candidate.normalizedRecipe.calories).toBeNull();
    expect(candidate.normalizedRecipe.reviewCount).toBeNull();
  });

  // Test 10: production dataset değişmez
  it('Test 10: Politika değerlendirme ve import kontrolleri production dataset dosyalarını değiştirmez', async () => {
    const rawRecipesPath = path.join(__dirname, '../data/raw_recipes.json');
    const beforeContent = fs.readFileSync(rawRecipesPath, 'utf8');

    const adapter = createAdapterWithMetadata({
      permissionPolicy: 'prohibited',
      contentPermissionStatus: 'unknown'
    });

    const report = await coordinateImport(adapter);
    expect(report.productionDatabaseModified).toBe(false);

    const afterContent = fs.readFileSync(rawRecipesPath, 'utf8');
    expect(afterContent).toBe(beforeContent);
  });

});
