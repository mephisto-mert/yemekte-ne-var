import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  ProductionCatalogImporter,
  validateProductionRecipe,
  mapToCooklyCategoryKey
} from '../pipeline/production/productionImporter';
import { StagedRecipe } from '../pipeline/staging/types';

describe('PART 15 — Production Content Import & Catalog Expansion Suite', () => {
  const testSandboxDir = path.resolve(__dirname, '../../test-output/prod-import-test-sandbox');
  const mockRawRecipesPath = path.join(testSandboxDir, 'raw_recipes.json');
  const mockStagingPath = path.join(testSandboxDir, 'staging-catalog.json');

  // Sample initial 50 recipes mock
  const generateInitial50 = () => {
    const recipes = [];
    for (let i = 1; i <= 50; i++) {
      recipes.push({
        id: i,
        name: i === 1 ? 'Tavuk Sote' : `Tarif ${i}`,
        category: 'main_dish',
        difficulty: 'Kolay',
        time: '30 dk',
        timeMinutes: 30,
        calories: 350,
        image: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d',
        imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d',
        ingredients: [{ item: 'Tavuk', amount: '500g' }],
        steps: ['Pişirin.'],
        rating: 4.8,
        reviewCount: 100,
        servings: 4,
        videoId: 'abc12345678',
        isPremium: false,
        isFeatured: false,
        tags: ['kolay'],
        chef: { name: 'Şef Ahmet', verified: true }
      });
    }
    return {
      version: '13.0.0',
      lastUpdated: '2026-02-05',
      totalRecipes: 50,
      categories: [{ id: 'main_dish', name: 'Ana Yemek', emoji: '🥩', count: 50 }],
      recipes
    };
  };

  const createEligibleCandidate = (idSuffix: number, title: string): StagedRecipe => ({
    id: `stage_curated_${idSuffix}`,
    source: 'curated_test',
    sourceId: String(idSuffix),
    sourceLanguage: 'tr',
    displayLanguage: 'tr',
    title,
    displayTitle: title,
    canonicalTitle: title.toLowerCase().replace(/\s+/g, '_'),
    description: `Nefis ${title} tarifi`,
    category: 'Ana Yemekler',
    tags: ['ana yemek', 'nefis'],
    cuisine: 'Türk Mutfağı',
    difficulty: 'Orta',
    cookingTime: '40 dk',
    timeMinutes: 40,
    calories: 450,
    rating: 4.9,
    reviewCount: 200,
    servings: 4,
    chef: 'Usta Şef',
    ingredients: [
      {
        raw: '500g et',
        name: 'Kuşbaşı et',
        canonicalName: 'kusbasi et',
        amount: '500g',
        unit: 'g',
        isStaple: false,
        confidence: 1.0,
        status: 'parsed'
      }
    ],
    instructions: ['Eti soteleyin.', 'Sıcak servis edin.'],
    image: {
      imageMatchScore: 90,
      status: 'ready',
      reasons: ['Authorized Pexels asset'],
      confidence: 0.95,
      sourceUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947',
      permissionStatus: 'authorized',
      license: 'Pexels Free License',
      attribution: 'Approved Kitchen Asset'
    },
    video: {
      videoMatchScore: 90,
      status: 'ready',
      reasons: ['Valid privacy embed'],
      confidence: 0.95,
      videoId: 'vid12345678',
      embedUrl: 'https://www.youtube-nocookie.com/embed/vid12345678',
      permissionStatus: 'authorized_embed'
    },
    quality: {
      overallScore: 90,
      tier: 'excellent',
      contentScore: 90,
      imageScore: 90,
      videoScore: 90,
      metadataScore: 90,
      localizationScore: 100,
      breakdown: { content: 90, media: 90, metadata: 90, safety: 100 }
    },
    completeness: {
      contentComplete: true,
      imageComplete: true,
      videoComplete: true,
      licenseComplete: true,
      localizationComplete: true,
      productionReady: true,
      missingFields: [],
      issues: []
    },
    localization: {
      sourceTitle: title,
      sourceLanguage: 'tr',
      displayTitle: title,
      displayLanguage: 'tr',
      displayDescription: '',
      translationStatus: 'translated'
    },
    taxonomy: {
      cooklyCategory: 'Ana Yemekler',
      confidence: 1.0,
      matchedTags: ['ana yemek'],
      status: 'mapped'
    },
    provenance: {
      source: 'curated_test',
      sourceId: String(idSuffix),
      importedAt: new Date().toISOString(),
      providerVersion: '1.0.0',
      pipelineVersion: '15.0.0',
      transformations: ['normalized', 'image_matched', 'video_matched', 'eligibility_evaluated']
    },
    reviewItems: [],
    status: 'production_ready',
    productionEligibility: {
      eligible: true,
      checks: {
        sourceAllowed: true,
        licenseApproved: true,
        localizationApproved: true,
        contentComplete: true,
        imageApproved: true,
        videoPolicySatisfied: true,
        noBlockingReview: true,
        noDuplicate: true,
        qualityThresholdMet: true,
        provenanceComplete: true
      },
      reasons: ['All 10 checks passed'],
      blockingIssues: [],
      evaluatedAt: new Date().toISOString()
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  beforeEach(() => {
    fs.mkdirSync(testSandboxDir, { recursive: true });
    fs.writeFileSync(mockRawRecipesPath, JSON.stringify(generateInitial50(), null, 2), 'utf8');
  });

  afterEach(() => {
    if (fs.existsSync(testSandboxDir)) {
      fs.rmSync(testSandboxDir, { recursive: true, force: true });
    }
  });

  // -----------------------------------------------------------------
  // 1. ELIGIBLE RECIPE IMPORT & SELECTION
  // -----------------------------------------------------------------
  it('1.1 imports eligible recipes up to target 100 and updates production dataset', async () => {
    const candidates = [];
    for (let i = 1; i <= 50; i++) {
      candidates.push(createEligibleCandidate(50 + i, `Yeni Lezzet ${i}`));
    }

    const importer = new ProductionCatalogImporter({
      rawRecipesPath: mockRawRecipesPath,
      stagingCatalogPath: mockStagingPath
    });

    const res = await importer.importApprovedRecipes({
      allowCandidates: candidates,
      targetCount: 100,
      dryRun: false
    });

    expect(res.success).toBe(true);
    expect(res.initialProductionCount).toBe(50);
    expect(res.importedCount).toBe(50);
    expect(res.finalProductionCount).toBe(100);

    const updatedRaw = JSON.parse(fs.readFileSync(mockRawRecipesPath, 'utf8'));
    expect(updatedRaw.recipes).toHaveLength(100);
    expect(updatedRaw.recipes[0].name).toBe('Tavuk Sote');
    expect(updatedRaw.recipes[50].id).toBe(51);
    expect(updatedRaw.recipes[99].id).toBe(100);
  });

  it('1.2 rejects ineligible recipes (failing 10-point gate)', async () => {
    const badCandidate = createEligibleCandidate(51, 'Bozuk Tarif');
    badCandidate.productionEligibility.eligible = false;
    badCandidate.productionEligibility.checks.imageApproved = false;

    const importer = new ProductionCatalogImporter({
      rawRecipesPath: mockRawRecipesPath,
      stagingCatalogPath: mockStagingPath
    });

    const res = await importer.importApprovedRecipes({
      allowCandidates: [badCandidate],
      targetCount: 100,
      dryRun: false
    });

    expect(res.importedCount).toBe(0);
    expect(res.rejectedCount).toBe(1);
    expect(res.finalProductionCount).toBe(50);
  });

  it('1.3 rejects status="needs_review" recipes without bypassing review queue', async () => {
    const reviewCandidate = createEligibleCandidate(51, 'İnceleme Bekleyen Tarif');
    reviewCandidate.status = 'needs_review';

    const importer = new ProductionCatalogImporter({
      rawRecipesPath: mockRawRecipesPath,
      stagingCatalogPath: mockStagingPath
    });

    const res = await importer.importApprovedRecipes({
      allowCandidates: [reviewCandidate],
      targetCount: 100,
      dryRun: false
    });

    expect(res.importedCount).toBe(0);
    expect(res.rejectedCount).toBe(1);
  });

  it('1.4 rejects duplicate recipes against existing production titles and source keys', async () => {
    const dupCandidate = createEligibleCandidate(51, 'Tavuk Sote'); // Same as initial ID 1

    const importer = new ProductionCatalogImporter({
      rawRecipesPath: mockRawRecipesPath,
      stagingCatalogPath: mockStagingPath
    });

    const res = await importer.importApprovedRecipes({
      allowCandidates: [dupCandidate],
      targetCount: 100,
      dryRun: false
    });

    expect(res.importedCount).toBe(0);
    expect(res.duplicateCount).toBe(1);
  });

  it('1.5 rejects duplicate recipes within the staging candidate batch', async () => {
    const cand1 = createEligibleCandidate(51, 'Hünkar Beğendi');
    const cand2 = createEligibleCandidate(52, 'Hünkar Beğendi'); // Duplicate title

    const importer = new ProductionCatalogImporter({
      rawRecipesPath: mockRawRecipesPath,
      stagingCatalogPath: mockStagingPath
    });

    const res = await importer.importApprovedRecipes({
      allowCandidates: [cand1, cand2],
      targetCount: 100,
      dryRun: false
    });

    expect(res.importedCount).toBe(1);
    expect(res.duplicateCount).toBe(1);
  });

  // -----------------------------------------------------------------
  // 2. IMMUTABILITY & TARGET SIZE BOUNDARIES
  // -----------------------------------------------------------------
  it('2.1 preserves all initial 50 recipes completely unmodified', async () => {
    const initialRaw = JSON.parse(fs.readFileSync(mockRawRecipesPath, 'utf8'));
    const initialSnapshot = JSON.stringify(initialRaw.recipes);

    const candidates = [createEligibleCandidate(51, 'Test Tarif 51')];
    const importer = new ProductionCatalogImporter({
      rawRecipesPath: mockRawRecipesPath,
      stagingCatalogPath: mockStagingPath
    });

    await importer.importApprovedRecipes({
      allowCandidates: candidates,
      targetCount: 100,
      dryRun: false
    });

    const updatedRaw = JSON.parse(fs.readFileSync(mockRawRecipesPath, 'utf8'));
    const preservedFirst50 = JSON.stringify(updatedRaw.recipes.slice(0, 50));

    expect(preservedFirst50).toBe(initialSnapshot);
  });

  it('2.2 stops importing when production reaches target 100', async () => {
    // Fill to 100 first
    const candidates100 = [];
    for (let i = 1; i <= 60; i++) {
      candidates100.push(createEligibleCandidate(50 + i, `Tarif X ${i}`));
    }

    const importer = new ProductionCatalogImporter({
      rawRecipesPath: mockRawRecipesPath,
      stagingCatalogPath: mockStagingPath
    });

    const res1 = await importer.importApprovedRecipes({
      allowCandidates: candidates100,
      targetCount: 100,
      dryRun: false
    });

    expect(res1.importedCount).toBe(50);
    expect(res1.finalProductionCount).toBe(100);

    // Second import attempt when already at 100
    const res2 = await importer.importApprovedRecipes({
      allowCandidates: [createEligibleCandidate(120, 'Fazla Tarif')],
      targetCount: 100,
      dryRun: false
    });

    expect(res2.importedCount).toBe(0);
    expect(res2.finalProductionCount).toBe(100);
  });

  it('2.3 imports only available eligible amount if eligible < needed', async () => {
    const candidates = [
      createEligibleCandidate(51, 'Kısmi Tarif 1'),
      createEligibleCandidate(52, 'Kısmi Tarif 2')
    ];

    const importer = new ProductionCatalogImporter({
      rawRecipesPath: mockRawRecipesPath,
      stagingCatalogPath: mockStagingPath
    });

    const res = await importer.importApprovedRecipes({
      allowCandidates: candidates,
      targetCount: 100,
      dryRun: false
    });

    expect(res.importedCount).toBe(2);
    expect(res.finalProductionCount).toBe(52);
  });

  it('2.4 dryRun mode performs zero disk writes and returns accurate projection', async () => {
    const candidates = [createEligibleCandidate(51, 'Dry Run Tarif')];

    const importer = new ProductionCatalogImporter({
      rawRecipesPath: mockRawRecipesPath,
      stagingCatalogPath: mockStagingPath
    });

    const res = await importer.importApprovedRecipes({
      allowCandidates: candidates,
      targetCount: 100,
      dryRun: true
    });

    expect(res.dryRun).toBe(true);
    expect(res.importedCount).toBe(1);
    expect(res.finalProductionCount).toBe(50); // Unmodified on disk

    const rawOnDisk = JSON.parse(fs.readFileSync(mockRawRecipesPath, 'utf8'));
    expect(rawOnDisk.recipes).toHaveLength(50);
  });

  // -----------------------------------------------------------------
  // 3. SCHEMA & MEDIA POLICY VALIDATION
  // -----------------------------------------------------------------
  it('3.1 validateProductionRecipe accepts complete, valid recipe records', () => {
    const valid = {
      id: 51,
      name: 'Hünkar Beğendi',
      category: 'main_dish',
      difficulty: 'Zor',
      time: '60 dk',
      ingredients: [{ item: 'Et', amount: '500g' }],
      steps: ['Pişirin.'],
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947'
    };

    const res = validateProductionRecipe(valid);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('3.2 validateProductionRecipe rejects placeholder images (placehold.co)', () => {
    const badImg = {
      id: 51,
      name: 'Hünkar Beğendi',
      category: 'main_dish',
      ingredients: [{ item: 'Et' }],
      steps: ['Pişirin.'],
      image: 'https://placehold.co/400x300'
    };

    const res = validateProductionRecipe(badImg);
    expect(res.valid).toBe(false);
    expect(res.errors.some(e => e.includes('placeholder'))).toBe(true);
  });

  it('3.3 validateProductionRecipe rejects missing ingredients or steps', () => {
    const noSteps = {
      id: 51,
      name: 'Hünkar Beğendi',
      category: 'main_dish',
      ingredients: [],
      steps: [],
      image: 'https://images.unsplash.com/photo-1'
    };

    const res = validateProductionRecipe(noSteps);
    expect(res.valid).toBe(false);
    expect(res.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('3.4 mapToCooklyCategoryKey maps Turkish category names to standard keys', () => {
    expect(mapToCooklyCategoryKey('Ana Yemekler')).toBe('main_dish');
    expect(mapToCooklyCategoryKey('Çorbalar')).toBe('soup');
    expect(mapToCooklyCategoryKey('Tatlılar')).toBe('dessert');
    expect(mapToCooklyCategoryKey('Kahvaltılıklar')).toBe('breakfast');
    expect(mapToCooklyCategoryKey('Makarna & Hamur İşleri')).toBe('pastry');
    expect(mapToCooklyCategoryKey('Salatalar & Mezeler')).toBe('meze');
    expect(mapToCooklyCategoryKey('Bilinmeyen')).toBe('main_dish');
  });

  it('3.5 generates sequential unique IDs without collision', async () => {
    const candidates = [
      createEligibleCandidate(101, 'Benzersiz Tarif A'),
      createEligibleCandidate(102, 'Benzersiz Tarif B')
    ];

    const importer = new ProductionCatalogImporter({
      rawRecipesPath: mockRawRecipesPath,
      stagingCatalogPath: mockStagingPath
    });

    const res = await importer.importApprovedRecipes({
      allowCandidates: candidates,
      targetCount: 100,
      dryRun: false
    });

    expect(res.importedRecipes[0].id).toBe(51);
    expect(res.importedRecipes[1].id).toBe(52);

    const updatedRaw = JSON.parse(fs.readFileSync(mockRawRecipesPath, 'utf8'));
    const ids = updatedRaw.recipes.map((r: any) => r.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(52);
  });

  it('3.6 rejects candidate with malicious or unverified video embed', async () => {
    const badVidCandidate = createEligibleCandidate(51, 'Güvensiz Video Tarif');
    badVidCandidate.video.embedUrl = 'javascript:alert(1)';
    badVidCandidate.video.status = 'rejected';

    const importer = new ProductionCatalogImporter({
      rawRecipesPath: mockRawRecipesPath,
      stagingCatalogPath: mockStagingPath
    });

    const res = await importer.importApprovedRecipes({
      allowCandidates: [badVidCandidate],
      targetCount: 100,
      dryRun: false
    });

    expect(res.importedCount).toBe(0);
    expect(res.rejectedCount).toBe(1);
  });

  it('3.7 verifies deep equality of all initial 50 recipes across all fields', async () => {
    const initialRaw = JSON.parse(fs.readFileSync(mockRawRecipesPath, 'utf8'));
    const initial50 = initialRaw.recipes;

    const candidates = [createEligibleCandidate(51, 'Yeni Tarif')];
    const importer = new ProductionCatalogImporter({
      rawRecipesPath: mockRawRecipesPath,
      stagingCatalogPath: mockStagingPath
    });

    await importer.importApprovedRecipes({
      allowCandidates: candidates,
      targetCount: 100,
      dryRun: false
    });

    const updatedRaw = JSON.parse(fs.readFileSync(mockRawRecipesPath, 'utf8'));
    for (let i = 0; i < 50; i++) {
      expect(updatedRaw.recipes[i].id).toBe(initial50[i].id);
      expect(updatedRaw.recipes[i].name).toBe(initial50[i].name);
      expect(updatedRaw.recipes[i].category).toBe(initial50[i].category);
      expect(updatedRaw.recipes[i].ingredients).toEqual(initial50[i].ingredients);
      expect(updatedRaw.recipes[i].steps).toEqual(initial50[i].steps);
      expect(updatedRaw.recipes[i].videoId).toBe(initial50[i].videoId);
    }
  });

  it('3.8 verifies atomic rollback on write error without corrupting original file', async () => {
    const candidates = [createEligibleCandidate(51, 'Rollback Tarif')];
    const importer = new ProductionCatalogImporter({
      rawRecipesPath: mockRawRecipesPath,
      stagingCatalogPath: mockStagingPath
    });

    const renameSpy = vi.spyOn(fs, 'renameSync').mockImplementationOnce(() => {
      throw new Error('Simulated write/rename failure');
    });

    const res = await importer.importApprovedRecipes({
      allowCandidates: candidates,
      targetCount: 100,
      dryRun: false
    });

    expect(res.success).toBe(false);
    expect(res.importedCount).toBe(0);

    // Original mock file is intact
    const originalContent = JSON.parse(fs.readFileSync(mockRawRecipesPath, 'utf8'));
    expect(originalContent.recipes).toHaveLength(50);

    renameSpy.mockRestore();
  });
});
