import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  StagedRecipe,
  PIPELINE_VERSION,
  MAX_STAGING_BATCH_SIZE,
  DEFAULT_STAGING_BATCH_SIZE
} from '../pipeline/staging/types';
import { evaluateProductionEligibility } from '../pipeline/staging/productionEligibility';
import { StagingCatalogRepository } from '../pipeline/staging/stagingCatalogRepository';
import { StagingOrchestrator } from '../pipeline/staging/orchestrator';
import { RecipeProvider } from '../pipeline/import/providers/types';

describe('PART 13 — Staging Catalog Builder & Controlled Expansion Suite', () => {
  let testOutputDir: string;

  beforeEach(() => {
    testOutputDir = path.resolve(process.cwd(), `test-output/test-staging-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  const createMockStagedRecipe = (overrides?: Partial<StagedRecipe>): StagedRecipe => {
    const base: StagedRecipe = {
      id: 'stage_mock_101',
      source: 'themealdb',
      sourceId: '101',
      sourceUrl: 'https://www.themealdb.com/meal/101',
      sourceLanguage: 'tr',
      displayLanguage: 'tr',
      title: 'Mercimek Çorbası',
      displayTitle: 'Mercimek Çorbası',
      canonicalTitle: 'mercimek corbasi',
      description: 'Klasik Türk mercimek çorbası',
      category: 'Çorbalar',
      tags: ['Çorba', 'Geleneksel'],
      cuisine: 'Turkish',
      difficulty: 'Kolay',
      cookingTime: '30 dk',
      timeMinutes: 30,
      servings: 4,
      ingredients: [
        {
          raw: '1 su bardağı kırmızı mercimek',
          name: 'kırmızı mercimek',
          canonicalName: 'kirmizi mercimek',
          amount: '1',
          amountValue: 1,
          unit: 'su bardağı',
          confidence: 0.95,
          status: 'parsed',
          isStaple: false
        },
        {
          raw: '1 adet soğan',
          name: 'soğan',
          canonicalName: 'sogan',
          amount: '1',
          amountValue: 1,
          unit: 'adet',
          confidence: 0.95,
          status: 'parsed',
          isStaple: true
        }
      ],
      instructions: ['Mercimekleri yıkayın.', 'Soğanla birlikte kaynatıp blenderdan geçirin.'],
      image: {
        candidate: {
          provider: 'pexels',
          url: 'https://images.pexels.com/photos/123/lentil-soup.jpg',
          license: 'Pexels Free License',
          permissionStatus: 'authorized'
        },
        imageMatchScore: 90,
        status: 'ready',
        reasons: [],
        confidence: 0.9,
        permissionStatus: 'authorized',
        license: 'Pexels Free License'
      },
      video: {
        candidate: {
          videoId: 'sample123',
          provider: 'youtube',
          url: 'https://www.youtube.com/watch?v=sample123',
          embedUrl: 'https://www.youtube-nocookie.com/embed/sample123',
          title: 'Mercimek Çorbası',
          channelTitle: 'Cookly',
          language: 'tr',
          permissionStatus: 'authorized_embed',
          isOfficialRecipeVideo: true
        },
        videoMatchScore: 95,
        status: 'ready',
        reasons: [],
        confidence: 0.95,
        videoId: 'sample123',
        embedUrl: 'https://www.youtube-nocookie.com/embed/sample123',
        permissionStatus: 'embed_only'
      },
      quality: {
        overallScore: 90,
        tier: 'excellent',
        contentScore: 90,
        imageScore: 90,
        videoScore: 95,
        metadataScore: 90,
        localizationScore: 90,
        breakdown: {}
      },
      completeness: {
        contentComplete: true,
        imageComplete: true,
        videoComplete: true,
        licenseComplete: true,
        localizationComplete: true,
        productionReady: true,
        issues: [],
        missingFields: []
      },
      localization: {
        sourceTitle: 'Lentil Soup',
        sourceLanguage: 'tr',
        displayLanguage: 'tr',
        displayTitle: 'Mercimek Çorbası',
        translationStatus: 'translated'
      },
      taxonomy: {
        cooklyCategory: 'Çorbalar',
        sourceCategory: 'Soup',
        matchedTags: ['Çorba'],
        confidence: 0.95,
        status: 'mapped'
      },
      provenance: {
        source: 'themealdb',
        sourceId: '101',
        sourceUrl: 'https://www.themealdb.com/meal/101',
        importedAt: new Date().toISOString(),
        providerVersion: '1.0.0',
        pipelineVersion: PIPELINE_VERSION,
        transformations: ['normalized', 'validated', 'taxonomy_mapped', 'ingredients_parsed']
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
        reasons: ['Tarif tüm üretim kriterlerini eksiksiz karşılamaktadır.'],
        blockingIssues: [],
        evaluatedAt: new Date().toISOString()
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return { ...base, ...overrides };
  };

  describe('1. Production Eligibility Gate (10-Point Check)', () => {
    it('1.1 should approve fully compliant staged recipe', () => {
      const recipe = createMockStagedRecipe();
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(true);
      expect(result.blockingIssues).toHaveLength(0);
      expect(result.checks.sourceAllowed).toBe(true);
      expect(result.checks.licenseApproved).toBe(true);
      expect(result.checks.localizationApproved).toBe(true);
      expect(result.checks.contentComplete).toBe(true);
      expect(result.checks.imageApproved).toBe(true);
      expect(result.checks.videoPolicySatisfied).toBe(true);
      expect(result.checks.noBlockingReview).toBe(true);
      expect(result.checks.noDuplicate).toBe(true);
      expect(result.checks.qualityThresholdMet).toBe(true);
      expect(result.checks.provenanceComplete).toBe(true);
    });

    it('1.2 should block prohibited source (e.g. nefisyemektarifleri)', () => {
      const recipe = createMockStagedRecipe({ source: 'nefisyemektarifleri' });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(false);
      expect(result.checks.sourceAllowed).toBe(false);
      expect(result.blockingIssues).toContain('Kaynak izinli değil veya yasaklı: nefisyemektarifleri');
    });

    it('1.3 should block prohibited source in provenance', () => {
      const recipe = createMockStagedRecipe({
        provenance: {
          source: 'nefisyemektarifleri',
          sourceId: '999',
          importedAt: new Date().toISOString(),
          providerVersion: '1.0.0',
          pipelineVersion: PIPELINE_VERSION,
          transformations: []
        }
      });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(false);
      expect(result.checks.sourceAllowed).toBe(false);
    });

    it('1.4 should block unapproved/missing license', () => {
      const recipe = createMockStagedRecipe({
        image: {
          imageMatchScore: 0,
          status: 'ready',
          reasons: [],
          confidence: 0,
          permissionStatus: 'unknown',
          license: 'unknown'
        }
      });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(false);
      expect(result.checks.licenseApproved).toBe(false);
    });

    it('1.5 should block rejected license in image', () => {
      const recipe = createMockStagedRecipe({
        image: {
          imageMatchScore: 0,
          status: 'rejected',
          reasons: ['No license'],
          confidence: 0,
          permissionStatus: 'rejected',
          license: 'All Rights Reserved'
        }
      });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(false);
      expect(result.checks.imageApproved).toBe(false);
    });

    it('1.6 should block non-Turkish display language', () => {
      const recipe = createMockStagedRecipe({ displayLanguage: 'en' });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(false);
      expect(result.checks.localizationApproved).toBe(false);
    });

    it('1.7 should block translationStatus not_translated', () => {
      const recipe = createMockStagedRecipe({
        localization: {
          sourceTitle: 'Lentil Soup',
          sourceLanguage: 'en',
          displayLanguage: 'tr',
          displayTitle: 'Lentil Soup',
          translationStatus: 'not_translated'
        }
      });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(false);
      expect(result.checks.localizationApproved).toBe(false);
    });

    it('1.8 should block translationStatus failed', () => {
      const recipe = createMockStagedRecipe({
        localization: {
          sourceTitle: 'Lentil Soup',
          sourceLanguage: 'en',
          displayLanguage: 'tr',
          displayTitle: 'Lentil Soup',
          translationStatus: 'failed'
        }
      });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(false);
      expect(result.checks.localizationApproved).toBe(false);
    });

    it('1.9 should block recipe with empty title', () => {
      const recipe = createMockStagedRecipe({ title: '   ' });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(false);
      expect(result.checks.contentComplete).toBe(false);
    });

    it('1.10 should block recipe with empty displayTitle', () => {
      const recipe = createMockStagedRecipe({ displayTitle: '' });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(false);
      expect(result.checks.contentComplete).toBe(false);
    });

    it('1.11 should block recipe with no ingredients', () => {
      const recipe = createMockStagedRecipe({ ingredients: [] });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(false);
      expect(result.checks.contentComplete).toBe(false);
    });

    it('1.12 should block recipe with no instructions', () => {
      const recipe = createMockStagedRecipe({ instructions: [] });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(false);
      expect(result.checks.contentComplete).toBe(false);
    });

    it('1.13 should block unready image with status missing', () => {
      const recipe = createMockStagedRecipe({
        image: {
          imageMatchScore: 0,
          status: 'missing',
          reasons: ['No image'],
          confidence: 0,
          permissionStatus: 'unverified',
          license: 'None'
        }
      });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(false);
      expect(result.checks.imageApproved).toBe(false);
    });

    it('1.14 should block image with permissionStatus rejected', () => {
      const recipe = createMockStagedRecipe({
        image: {
          imageMatchScore: 50,
          status: 'ready',
          reasons: [],
          confidence: 0.5,
          permissionStatus: 'rejected',
          license: 'Commercial'
        }
      });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(false);
      expect(result.checks.imageApproved).toBe(false);
    });

    it('1.15 should block invalid video embed URL (direct watch url instead of embed)', () => {
      const recipe = createMockStagedRecipe({
        video: {
          videoMatchScore: 80,
          status: 'ready',
          reasons: [],
          confidence: 0.8,
          videoId: 'sample123',
          embedUrl: 'https://www.youtube.com/watch?v=sample123',
          permissionStatus: 'embed_only'
        }
      });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(false);
      expect(result.checks.videoPolicySatisfied).toBe(false);
    });

    it('1.16 should block video from non-approved domain', () => {
      const recipe = createMockStagedRecipe({
        video: {
          videoMatchScore: 80,
          status: 'ready',
          reasons: [],
          confidence: 0.8,
          videoId: 'sample123',
          embedUrl: 'https://vimeo.com/embed/12345',
          permissionStatus: 'embed_only'
        }
      });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(false);
      expect(result.checks.videoPolicySatisfied).toBe(false);
    });

    it('1.17 should allow optional/missing video without blocking', () => {
      const recipe = createMockStagedRecipe({
        video: {
          videoMatchScore: 0,
          status: 'missing',
          reasons: [],
          confidence: 0,
          permissionStatus: 'none'
        }
      });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(true);
      expect(result.checks.videoPolicySatisfied).toBe(true);
    });

    it('1.18 should block unresolved blocking review items', () => {
      const recipe = createMockStagedRecipe({
        reviewItems: [
          {
            id: 'rev_1',
            recipeId: 'stage_mock_101',
            type: 'license',
            severity: 'blocking',
            reason: 'Lisans belirsiz',
            source: 'mock',
            createdAt: new Date().toISOString(),
            status: 'pending'
          }
        ]
      });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(false);
      expect(result.checks.noBlockingReview).toBe(false);
      expect(result.blockingIssues).toContain('Çözümlenmemiş 1 adet kritik (blocking) inceleme maddesi mevcut.');
    });

    it('1.19 should NOT block resolved blocking review items', () => {
      const recipe = createMockStagedRecipe({
        reviewItems: [
          {
            id: 'rev_1',
            recipeId: 'stage_mock_101',
            type: 'license',
            severity: 'blocking',
            reason: 'Lisans belirsiz',
            source: 'mock',
            createdAt: new Date().toISOString(),
            status: 'approved'
          }
        ]
      });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(true);
      expect(result.checks.noBlockingReview).toBe(true);
    });

    it('1.20 should NOT block warning-level review items', () => {
      const recipe = createMockStagedRecipe({
        reviewItems: [
          {
            id: 'rev_w1',
            recipeId: 'stage_mock_101',
            type: 'content',
            severity: 'warning',
            reason: 'Açıklama kısa',
            source: 'mock',
            createdAt: new Date().toISOString(),
            status: 'pending'
          }
        ]
      });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(true);
      expect(result.checks.noBlockingReview).toBe(true);
    });

    it('1.21 should block pending duplicate review items', () => {
      const recipe = createMockStagedRecipe({
        reviewItems: [
          {
            id: 'rev_dup1',
            recipeId: 'stage_mock_101',
            type: 'duplicate',
            severity: 'warning',
            reason: 'Olası benzer tarif',
            source: 'mock',
            createdAt: new Date().toISOString(),
            status: 'pending'
          }
        ]
      });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(false);
      expect(result.checks.noDuplicate).toBe(false);
    });

    it('1.22 should block quality score below 70 threshold', () => {
      const recipe = createMockStagedRecipe({
        quality: {
          overallScore: 65,
          tier: 'review',
          contentScore: 60,
          imageScore: 70,
          videoScore: 0,
          metadataScore: 60,
          localizationScore: 60,
          breakdown: {}
        }
      });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(false);
      expect(result.checks.qualityThresholdMet).toBe(false);
      expect(result.blockingIssues).toContain('Kalite puanı (65) üretim eşiğinin (70) altında.');
    });

    it('1.23 should block reject tier quality', () => {
      const recipe = createMockStagedRecipe({
        quality: {
          overallScore: 75,
          tier: 'reject',
          contentScore: 70,
          imageScore: 70,
          videoScore: 0,
          metadataScore: 70,
          localizationScore: 70,
          breakdown: {}
        }
      });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(false);
      expect(result.checks.qualityThresholdMet).toBe(false);
    });

    it('1.24 should block incomplete provenance (missing sourceId)', () => {
      const recipe = createMockStagedRecipe({
        provenance: {
          source: 'themealdb',
          sourceId: '',
          importedAt: new Date().toISOString(),
          providerVersion: '1.0.0',
          pipelineVersion: PIPELINE_VERSION,
          transformations: []
        }
      });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(false);
      expect(result.checks.provenanceComplete).toBe(false);
    });

    it('1.25 should block incomplete provenance (missing importedAt)', () => {
      const recipe = createMockStagedRecipe({
        provenance: {
          source: 'themealdb',
          sourceId: '101',
          importedAt: '',
          providerVersion: '1.0.0',
          pipelineVersion: PIPELINE_VERSION,
          transformations: []
        }
      });
      const result = evaluateProductionEligibility(recipe);
      expect(result.eligible).toBe(false);
      expect(result.checks.provenanceComplete).toBe(false);
    });
  });

  describe('2. Staging Catalog Repository & Disk Persistence', () => {
    it('2.1 should initialize empty repository and files', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      expect(await repo.count()).toBe(0);
      expect(fs.existsSync(testOutputDir)).toBe(true);
    });

    it('2.2 should save and retrieve recipe by composite key', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      const recipe = createMockStagedRecipe({ source: 'themealdb', sourceId: '52772' });
      await repo.add(recipe);

      expect(await repo.count()).toBe(1);
      const retrieved = await repo.findBySourceId('themealdb', '52772');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.sourceId).toBe('52772');
      expect(retrieved?.canonicalTitle).toBe('mercimek corbasi');
    });

    it('2.3 should check existence by source and sourceId', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      const recipe = createMockStagedRecipe({ source: 'themealdb', sourceId: '52772' });
      await repo.add(recipe);

      const found = await repo.findBySourceId('themealdb', '52772');
      const notFound = await repo.findBySourceId('themealdb', '99999');
      expect(found).not.toBeNull();
      expect(notFound).toBeNull();
    });

    it('2.4 should update existing recipe on re-save', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      const recipe = createMockStagedRecipe({ source: 'themealdb', sourceId: '52772', title: 'İlk Başlık' });
      await repo.add(recipe);

      const updatedRecipe = createMockStagedRecipe({ source: 'themealdb', sourceId: '52772', title: 'Güncel Başlık' });
      const updateRes = await repo.add(updatedRecipe);

      expect(updateRes.updated).toBe(true);
      expect(await repo.count()).toBe(1);
      const retrieved = await repo.findBySourceId('themealdb', '52772');
      expect(retrieved?.title).toBe('Güncel Başlık');
    });

    it('2.5 should save batch and flush to disk', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      const recipes = [
        createMockStagedRecipe({ id: 's1', source: 'themealdb', sourceId: '1' }),
        createMockStagedRecipe({ id: 's2', source: 'themealdb', sourceId: '2' }),
        createMockStagedRecipe({ id: 's3', source: 'mock', sourceId: '3' })
      ];

      await repo.addBatch(recipes);
      expect(await repo.count()).toBe(3);

      // Verify files created on disk
      expect(fs.existsSync(path.join(testOutputDir, 'staging-catalog.json'))).toBe(true);
    });

    it('2.6 should reload persisted catalog from disk', async () => {
      const repo1 = new StagingCatalogRepository({ stagingDir: testOutputDir });
      await repo1.add(createMockStagedRecipe({ source: 'themealdb', sourceId: '42', title: 'Kalıcı Tarif' }));

      // New instance pointing to same directory
      const repo2 = new StagingCatalogRepository({ stagingDir: testOutputDir });
      expect(await repo2.count()).toBe(1);
      const item = await repo2.findBySourceId('themealdb', '42');
      expect(item?.title).toBe('Kalıcı Tarif');
    });

    it('2.7 should compute accurate catalog statistics', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      await repo.add(createMockStagedRecipe({ id: 's1', source: 'themealdb', sourceId: '1', status: 'production_ready' }));
      await repo.add(createMockStagedRecipe({
        id: 's2',
        source: 'themealdb',
        sourceId: '2',
        status: 'needs_review',
        productionEligibility: {
          eligible: false,
          checks: {} as any,
          reasons: [],
          blockingIssues: [],
          evaluatedAt: new Date().toISOString()
        },
        reviewItems: [{ id: 'r1', recipeId: 's2', type: 'image', severity: 'warning', reason: 'rev', source: 'themealdb', createdAt: '', status: 'pending' }]
      }));
      await repo.add(createMockStagedRecipe({
        id: 's3',
        source: 'mock',
        sourceId: '3',
        status: 'rejected',
        productionEligibility: {
          eligible: false,
          checks: {} as any,
          reasons: [],
          blockingIssues: [],
          evaluatedAt: new Date().toISOString()
        }
      }));

      const stats = await repo.getStats();
      expect(stats.total).toBe(3);
      expect(stats.productionReadyCount).toBe(1);
      expect(stats.reviewRequiredCount).toBe(1);
      expect(stats.rejectedCount).toBe(1);
      expect(stats.bySource['themealdb']).toBe(2);
      expect(stats.bySource['mock']).toBe(1);
    });

    it('2.8 should export catalog and review queue', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      await repo.add(createMockStagedRecipe({ id: 's1', source: 'themealdb', sourceId: '1', status: 'production_ready' }));
      await repo.add(createMockStagedRecipe({ id: 's2', source: 'themealdb', sourceId: '2', status: 'needs_review' }));

      const exportResult = await repo.exportCatalog(path.join(testOutputDir, 'exports'));
      expect(fs.existsSync(exportResult.catalogPath)).toBe(true);
      expect(fs.existsSync(exportResult.reviewQueuePath)).toBe(true);
    });

    it('2.9 should delete recipe and persist deletion', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      await repo.add(createMockStagedRecipe({ id: 'stage_mock_101', source: 'themealdb', sourceId: '1' }));
      expect(await repo.count()).toBe(1);

      const deleted = await repo.remove('stage_mock_101');
      expect(deleted).toBe(true);
      expect(await repo.count()).toBe(0);
      expect(await repo.findBySourceId('themealdb', '1')).toBeNull();
    });

    it('2.10 should export valid manifest file', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      const recipe = createMockStagedRecipe();
      await repo.add(recipe);

      const manifestPath = await repo.exportManifest({
        runId: 'run_123',
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: 50,
        pipelineVersion: PIPELINE_VERSION,
        provider: 'themealdb',
        providerVersion: '1.0.0',
        requested: 1,
        fetched: 1,
        normalized: 1,
        valid: 1,
        warning: 0,
        reviewRequired: 0,
        rejected: 0,
        failed: 0,
        inserted: 1,
        updated: 0,
        skipped: 0,
        productionReady: 1,
        localizationStats: { translated: 1, pending: 0, reviewRequired: 0, notTranslated: 0 },
        imageStats: { ready: 1, needsReview: 0, missing: 0, rejected: 0 },
        videoStats: { ready: 1, needsReview: 0, missing: 0, rejected: 0 },
        completenessStats: { complete: 1, partial: 0, incomplete: 0 },
        qualityStats: { averageScore: 90, excellent: 1, good: 0, review: 0, reject: 0 },
        reviewStats: { totalReviews: 0, blocking: 0, warning: 0, optional: 0 },
        recipesSummary: []
      });

      expect(fs.existsSync(manifestPath)).toBe(true);
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      expect(manifest.pipelineVersion).toBe(PIPELINE_VERSION);
      expect(manifest.productionReady).toBe(1);
    });
  });

  describe('3. Batch Expansion & Orchestrator Flow', () => {
    const createMockProvider = (id: string, count: number): RecipeProvider => {
      return {
        id,
        name: `Mock ${id}`,
        metadata: {
          id,
          name: `Mock ${id}`,
          sourceType: 'api',
          permissionStatus: 'authorized',
          permissionPolicy: 'allowed',
          license: 'CC0-1.0',
          attributionRequired: false,
          requiresApiKey: false,
          capabilities: {
            search: true,
            pagination: true,
            batch: true,
            recipeDetail: true,
            images: true,
            videos: true
          }
        },
        isConfigured: () => true,
        fetchBatch: async (options) => {
          const limit = options?.pageSize || count;
          const recipes = Array.from({ length: Math.min(limit, count) }, (_, i) => ({
            id: `${id}_${i + 1}`,
            title: `Mock Recipe ${i + 1}`,
            instructions: ['Cook it well.'],
            ingredients: ['1 cup rice', '2 cups water'],
            category: 'Main',
            cuisine: 'International',
            image: 'https://images.pexels.com/photos/123/dish.jpg',
            sourceUrl: `https://mock.example.com/recipe/${i + 1}`
          }));
          return {
            recipes,
            pageSize: recipes.length,
            totalAvailable: count,
            hasMore: false,
            provider: id,
            retrievedAt: new Date().toISOString()
          };
        },
        search: async () => ({
          recipes: [],
          pageSize: 0,
          totalAvailable: 0,
          hasMore: false,
          provider: id,
          retrievedAt: new Date().toISOString()
        }),
        fetchById: async (externalId) => ({
          id: externalId,
          title: `Mock Recipe ${externalId}`,
          instructions: ['Cook it well.'],
          ingredients: ['1 cup rice'],
          category: 'Main'
        })
      };
    };

    it('3.1 should reject batch size exceeding hard limit (101 > 100)', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      const orchestrator = new StagingOrchestrator({ repository: repo });
      const provider = createMockProvider('test_prov', 5);

      await expect(
        orchestrator.orchestrate(provider, {
          limit: 101
        })
      ).rejects.toThrow('Maksimum batch boyutu 100 tariftir');
    });

    it('3.2 should default to batch size 10 if not specified', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      const orchestrator = new StagingOrchestrator({ repository: repo });
      const provider = createMockProvider('test_prov', 20);

      const result = await orchestrator.orchestrate(provider);

      expect(result.manifest.requested).toBe(DEFAULT_STAGING_BATCH_SIZE);
      expect(result.manifest.fetched).toBe(10);
    });

    it('3.3 should accept batch size 100', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      const orchestrator = new StagingOrchestrator({ repository: repo });
      const provider = createMockProvider('test_prov', 5);

      const result = await orchestrator.orchestrate(provider, {
        limit: MAX_STAGING_BATCH_SIZE
      });

      expect(result.manifest.requested).toBe(100);
      expect(result.manifest.fetched).toBe(5);
    });

    it('3.4 should isolate individual recipe failures without halting batch', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      const orchestrator = new StagingOrchestrator({ repository: repo });
      const brokenProvider: RecipeProvider = {
        id: 'broken',
        name: 'Broken Provider',
        metadata: {
          id: 'broken',
          name: 'Broken Provider',
          sourceType: 'api',
          permissionStatus: 'authorized',
          permissionPolicy: 'allowed',
          license: 'CC0-1.0',
          attributionRequired: false,
          requiresApiKey: false,
          capabilities: {
            search: true,
            pagination: true,
            batch: true,
            recipeDetail: true,
            images: true,
            videos: true
          }
        },
        isConfigured: () => true,
        fetchBatch: async () => ({
          recipes: [
            { id: 'ok_1', title: 'Valid Recipe 1', instructions: ['Cook.'], ingredients: ['Rice'] },
            null as any, // Invalid item causing catch block
            { id: 'ok_2', title: 'Valid Recipe 2', instructions: ['Bake.'], ingredients: ['Flour'] }
          ],
          pageSize: 3,
          totalAvailable: 3,
          hasMore: false,
          provider: 'broken',
          retrievedAt: new Date().toISOString()
        }),
        search: async () => ({
          recipes: [],
          pageSize: 0,
          totalAvailable: 0,
          hasMore: false,
          provider: 'broken',
          retrievedAt: new Date().toISOString()
        }),
        fetchById: async () => null
      };

      const result = await orchestrator.orchestrate(brokenProvider, {
        limit: 10
      });

      expect(result.manifest.fetched).toBe(3);
      expect(result.failedRecipes.length).toBeGreaterThan(0);
      expect(result.stagedRecipes.length).toBe(2);
    });

    it('3.5 should perform intra-batch and cross-catalog deduplication', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      const orchestrator = new StagingOrchestrator({ repository: repo });
      const dupProvider: RecipeProvider = {
        id: 'dup_prov',
        name: 'Dup Provider',
        metadata: {
          id: 'dup_prov',
          name: 'Dup Provider',
          sourceType: 'api',
          permissionStatus: 'authorized',
          permissionPolicy: 'allowed',
          license: 'CC0-1.0',
          attributionRequired: false,
          requiresApiKey: false,
          capabilities: {
            search: true,
            pagination: true,
            batch: true,
            recipeDetail: true,
            images: true,
            videos: true
          }
        },
        isConfigured: () => true,
        fetchBatch: async () => ({
          recipes: [
            { id: '1', title: 'Domates Çorbası', instructions: ['Pişirin.'], ingredients: ['Domates', 'Su'], category: 'Çorbalar', cuisine: 'Turkish', image: 'https://images.pexels.com/photos/123/soup.jpg' },
            { id: '2', title: 'Domates Çorbası', instructions: ['Pişirin.'], ingredients: ['Domates', 'Su'], category: 'Çorbalar', cuisine: 'Turkish', image: 'https://images.pexels.com/photos/123/soup.jpg' }
          ],
          pageSize: 2,
          totalAvailable: 2,
          hasMore: false,
          provider: 'dup_prov',
          retrievedAt: new Date().toISOString()
        }),
        search: async () => ({
          recipes: [],
          pageSize: 0,
          totalAvailable: 0,
          hasMore: false,
          provider: 'dup_prov',
          retrievedAt: new Date().toISOString()
        }),
        fetchById: async () => null
      };

      const result = await orchestrator.orchestrate(dupProvider, {
        limit: 5
      });

      expect(result.manifest.fetched).toBe(2);
      expect(result.stagedRecipes.length).toBe(2);
      const stagedRecipes = await orchestrator.getRepository().getAll();
      const dupFlagged = stagedRecipes.filter(r => r.reviewItems.some(i => i.type === 'duplicate'));
      expect(dupFlagged.length).toBeGreaterThanOrEqual(1);
    });

    it('3.6 should provide complete summary report with all stats', async () => {
      const repo = new StagingCatalogRepository({ stagingDir: testOutputDir });
      const orchestrator = new StagingOrchestrator({ repository: repo });
      const provider = createMockProvider('stat_prov', 3);

      const result = await orchestrator.orchestrate(provider, { limit: 3 });

      expect(result.manifest).toBeDefined();
      expect(result.manifest.requested).toBe(3);
      expect(result.manifest.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.manifest.pipelineVersion).toBe(PIPELINE_VERSION);
    });
  });

  describe('4. Immutability & Guard Rails', () => {
    it('4.1 should never alter production raw_recipes.json', () => {
      const prodPath = path.resolve('src/data/raw_recipes.json');
      const content = fs.readFileSync(prodPath, 'utf8');
      const parsed = JSON.parse(content);
      expect(Array.isArray(parsed.recipes)).toBe(true);
      expect(parsed.recipes.length).toBe(50);
      expect(parsed.recipes[0].id).toBe(1);
    });

    it('4.2 should never alter production recipesData.ts', () => {
      const prodDataPath = path.resolve('src/data/recipesData.ts');
      const content = fs.readFileSync(prodDataPath, 'utf8');
      expect(content).toContain('RECIPES_DATA');
      expect(content).not.toContain('stage_');
    });
  });
});
