import { describe, it, expect } from 'vitest';
import { MockRecipeAdapter } from '../pipeline/import/mockAdapter';
import { coordinateImport } from '../pipeline/import/importCoordinator';
import { RawRecipe } from '../pipeline/types';
import fs from 'fs';
import path from 'path';

describe('Recipe Source Adapter & Import Foundation Tests', () => {

  // Test 1: Mock adapter produces correct RawRecipe
  it('Test 1: Mock adapter doğru RawRecipe formatında veri üretir', () => {
    const adapter = new MockRecipeAdapter();
    const rawRecipes = adapter.fetchRawRecipes();

    expect(rawRecipes).toBeDefined();
    expect(Array.isArray(rawRecipes)).toBe(true);
    expect(rawRecipes.length).toBe(3);

    const first = rawRecipes[0];
    expect(first.id).toBe('mock_yayla_1');
    expect(first.name).toBe('Test Yayla Çorbası');
    expect(first.ingredients?.length).toBeGreaterThan(0);
    expect(first.steps?.length).toBeGreaterThan(0);
  });

  // Test 2: RawRecipe correctly passed into pipeline
  it('Test 2: RawRecipe import coordinator üzerinden pipeline akışına doğru aktarılır', async () => {
    const adapter = new MockRecipeAdapter();
    const report = await coordinateImport(adapter);

    expect(report.fetched).toBe(3);
    expect(report.candidates.length).toBe(3);
    expect(report.candidates[0].rawRecipe.id).toBe('mock_yayla_1');
  });

  // Test 3: Normalization works properly during import
  it('Test 3: Normalizasyon işlemi Türkçe karakterleri ve kanonik başlığı doğru üretir', async () => {
    const adapter = new MockRecipeAdapter();
    const report = await coordinateImport(adapter);

    const yayla = report.candidates.find(c => c.sourceId === 'mock_yayla_1');
    expect(yayla).toBeDefined();
    expect(yayla?.normalizedRecipe.title).toBe('Test Yayla Çorbası');
    expect(yayla?.normalizedRecipe.canonicalTitle).toBe('test yayla corbasi');
  });

  // Test 4: Validation works properly during import
  it('Test 4: Doğrulama kuralları (VALID, WARNING, INVALID) doğru atanır', async () => {
    const adapter = new MockRecipeAdapter();
    const report = await coordinateImport(adapter);

    const validCandidate = report.candidates.find(c => c.sourceId === 'mock_yayla_1');
    const warningCandidate = report.candidates.find(c => c.sourceId === 'mock_sehriye_2');
    const invalidCandidate = report.candidates.find(c => c.sourceId === 'mock_invalid_3');

    expect(validCandidate?.validationStatus).toBe('VALID');
    expect(warningCandidate?.validationStatus).toBe('WARNING');
    expect(invalidCandidate?.validationStatus).toBe('INVALID');
  });

  // Test 5: Duplicate candidate correctly caught
  it('Test 5: Aynı veya benzer tarif geldiğinde duplicate candidate olarak yakalanır ve needs_review atanır', async () => {
    const customRecipes: RawRecipe[] = [
      {
        id: 'dup_1',
        name: 'Ezogelin Çorbası',
        ingredients: ['Mercimek', 'Bulgur', 'Salça'],
        steps: ['Pişirin'],
        servings: 4,
        image: 'https://images.unsplash.com/photo-1'
      },
      {
        id: 'dup_2',
        name: 'ezogelin corbasi', // Same canonical title
        ingredients: ['Mercimek', 'Bulgur', 'Salça'],
        steps: ['Pişirin'],
        servings: 4,
        image: 'https://images.unsplash.com/photo-2'
      }
    ];

    const adapter = new MockRecipeAdapter(customRecipes);
    const report = await coordinateImport(adapter);

    expect(report.duplicateCandidates).toBe(2);
    const candidate2 = report.candidates.find(c => c.sourceId === 'dup_2');
    expect(candidate2?.duplicateStatus).toBe('duplicate_candidate');
    expect(candidate2?.decision).toBe('needs_review');
  });

  // Test 6: Invalid recipe is not importable (rejected)
  it('Test 6: Invalid recipe ASLA importable olamaz, "rejected" olarak işaretlenir', async () => {
    const adapter = new MockRecipeAdapter();
    const report = await coordinateImport(adapter);

    const invalid = report.candidates.find(c => c.sourceId === 'mock_invalid_3');
    expect(invalid?.validationStatus).toBe('INVALID');
    expect(invalid?.decision).toBe('rejected');
    expect(invalid?.errors.length).toBeGreaterThan(0);
  });

  // Test 7: Warning recipe can be an import candidate (importable with warning)
  it('Test 7: Warning durumundaki tarif importable candidate olabilir fakat uyarıları saklar', async () => {
    const adapter = new MockRecipeAdapter();
    const report = await coordinateImport(adapter);

    const warningCandidate = report.candidates.find(c => c.sourceId === 'mock_sehriye_2');
    expect(warningCandidate?.validationStatus).toBe('WARNING');
    expect(warningCandidate?.decision).toBe('importable');
    expect(warningCandidate?.warnings.length).toBeGreaterThan(0);
    expect(warningCandidate?.decisionReason).toContain('Uyarılarla birlikte');
  });

  // Test 8: source + sourceId are preserved
  it('Test 8: Kaynak adı (source) ve kaynak kimliği (sourceId) eksiksiz korunur', async () => {
    const adapter = new MockRecipeAdapter();
    const report = await coordinateImport(adapter);

    report.candidates.forEach(c => {
      expect(c.source).toBe('mock_local_source');
      expect(c.sourceId).toBeDefined();
      expect(c.sourceId.length).toBeGreaterThan(0);
    });
  });

  // Test 9: Same sourceId re-import detected
  it('Test 9: Aynı batch içinde aynı sourceId tekrar geldiğinde çakışma yakalanır', async () => {
    const collisionRecipes: RawRecipe[] = [
      {
        id: 'unique_source_id_100',
        name: 'Tarif A',
        ingredients: ['Malzeme A'],
        steps: ['Adım A'],
        servings: 2,
        image: 'https://images.unsplash.com/photo-1'
      },
      {
        id: 'unique_source_id_100', // Colliding sourceId!
        name: 'Tarif B Farklı İsim',
        ingredients: ['Malzeme B'],
        steps: ['Adım B'],
        servings: 2,
        image: 'https://images.unsplash.com/photo-2'
      }
    ];

    const adapter = new MockRecipeAdapter(collisionRecipes);
    const report = await coordinateImport(adapter);

    const colliding = report.candidates.filter(c => c.sourceId === 'unique_source_id_100');
    expect(colliding.length).toBe(2);
    expect(colliding[0].decision).toBe('needs_review');
    expect(colliding[1].decision).toBe('needs_review');
    expect(colliding[0].decisionReason).toContain('birden fazla kez tespit edildi');
  });

  // Test 10: Fake rating/calorie/chef values are not produced
  it('Test 10: Import sistemi eksik alanlar için fake rating, chef, calories üretmez', async () => {
    const adapter = new MockRecipeAdapter();
    const report = await coordinateImport(adapter);

    report.candidates.forEach(c => {
      // If raw didn't have real values, normalized must be null
      if (!c.rawRecipe.calories) expect(c.normalizedRecipe.calories).toBeNull();
      if (!c.rawRecipe.chef) expect(c.normalizedRecipe.chef).toBeNull();
      if (!c.rawRecipe.rating) expect(c.normalizedRecipe.rating).toBeNull();
      if (!c.rawRecipe.reviewCount) expect(c.normalizedRecipe.reviewCount).toBeNull();
    });
  });

  // Test 11: Dry-run does not modify production dataset
  it('Test 11: Import ve dry-run işlemleri production dataset dosyalarını ASLA değiştirmez', async () => {
    const rawRecipesPath = path.join(__dirname, '../data/raw_recipes.json');
    const beforeStats = fs.statSync(rawRecipesPath);
    const beforeContent = fs.readFileSync(rawRecipesPath, 'utf8');

    const adapter = new MockRecipeAdapter();
    const report = await coordinateImport(adapter);

    expect(report.productionDatabaseModified).toBe(false);

    const afterStats = fs.statSync(rawRecipesPath);
    const afterContent = fs.readFileSync(rawRecipesPath, 'utf8');

    expect(afterStats.size).toBe(beforeStats.size);
    expect(afterContent).toBe(beforeContent);
  });

  // Test 12: Import report produces correct counts
  it('Test 12: ImportReport toplam sayıları ve alt kategorileri tutarlı şekilde üretir', async () => {
    const adapter = new MockRecipeAdapter();
    const report = await coordinateImport(adapter);

    expect(report.fetched).toBe(3);
    expect(report.valid).toBe(1);
    expect(report.warnings).toBe(1);
    expect(report.invalid).toBe(1);
    expect(report.importable).toBe(2); // 1 VALID + 1 WARNING
    expect(report.rejected).toBe(1);   // 1 INVALID
    expect(report.needsReview).toBe(0);
    expect(report.importable + report.rejected + report.needsReview).toBe(report.fetched);
  });

});
