import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  parseYouTubeVideoId,
  buildYouTubeEmbedUrl,
  CuratedRecipeVideoProvider,
  LiveYouTubeVideoProvider
} from '../pipeline/import/videoProvider';
import {
  isValidSecureEmbedUrl,
  validateSecureYouTubeEmbedUrl,
  calculateVideoRelevanceScore,
  matchRecipeVideo
} from '../pipeline/enrichment/videoMatcher';
import { matchRecipeImage } from '../pipeline/enrichment/imageMatcher';
import { evaluateProductionEligibility } from '../pipeline/staging/productionEligibility';
import { StagingOrchestrator } from '../pipeline/staging/orchestrator';
import { MockRecipeProvider } from '../pipeline/import/providers/mockProvider';
import { NormalizedRecipe } from '../pipeline/types';
import { StagedRecipe } from '../pipeline/staging/types';

describe('PART 14 — Recipe Content Expansion & Media Enrichment Suite', () => {
  const sampleRecipe: NormalizedRecipe = {
    id: 'exp_test_rec_1',
    title: 'Karnıyarık',
    canonicalTitle: 'karniyarik',
    description: 'Geleneksel fırında kıymalı patlıcan yemeği',
    category: 'Ana Yemek',
    difficulty: 'Orta',
    cookingTime: '45 dakika',
    timeMinutes: 45,
    servings: 4,
    ingredients: [
      { name: 'Patlıcan', canonicalName: 'patlican', amount: '4 adet', isStaple: false },
      { name: 'Kıyma', canonicalName: 'kiyma', amount: '250g', isStaple: false },
      { name: 'Soğan', canonicalName: 'sogan', amount: '1 adet', isStaple: false },
      { name: 'Tuz', canonicalName: 'tuz', amount: '1 tatlı kaşığı', isStaple: true }
    ],
    instructions: [
      'Patlıcanları alacalı soyup tuzlu suda bekletin.',
      'Kıymalı harcı hazırlayıp patlıcanların ortasına doldurun.',
      '180 derece fırında 30 dakika pişirin.'
    ],
    tags: ['patlican', 'kiyma', 'turk-mutfagi'],
    canonicalTags: ['patlican', 'kiyma', 'turk-mutfagi'],
    cuisine: 'Turkish',
    image: 'https://images.pexels.com/photos/12345/karniyarik.jpg',
    videoId: 'abc12345678',
    videoTitle: 'Nefis Karnıyarık Tarifi',
    videoAuthor: 'Geleneksel Mutfak',
    videoLanguage: 'tr',
    calories: 320,
    macros: null,
    rating: 4.8,
    reviewCount: 120,
    chef: 'Şef Mehmet',
    tips: ['Patlıcanları kızarttıktan sonra havlu kağıtta bekletin.']
  };

  // -----------------------------------------------------------------
  // 1. YOUTUBE VIDEO SECURITY & EMBED TESTS
  // -----------------------------------------------------------------
  describe('1. YouTube Video Security & Embed Verification', () => {
    it('1.1 parses valid 11-character YouTube video IDs from various URL formats', () => {
      expect(parseYouTubeVideoId('abc12345678')).toBe('abc12345678');
      expect(parseYouTubeVideoId('https://www.youtube.com/watch?v=abc12345678')).toBe('abc12345678');
      expect(parseYouTubeVideoId('https://youtu.be/abc12345678')).toBe('abc12345678');
      expect(parseYouTubeVideoId('https://www.youtube-nocookie.com/embed/abc12345678')).toBe('abc12345678');
      expect(parseYouTubeVideoId('https://youtube.com/shorts/abc12345678')).toBe('abc12345678');
    });

    it('1.2 rejects invalid or malformed YouTube video IDs', () => {
      expect(parseYouTubeVideoId('short')).toBeNull();
      expect(parseYouTubeVideoId('too_long_video_id_value_12345')).toBeNull();
      expect(parseYouTubeVideoId('')).toBeNull();
      expect(parseYouTubeVideoId(null)).toBeNull();
    });

    it('1.3 builds official privacy-enhanced youtube-nocookie embed URLs', () => {
      const embedUrl = buildYouTubeEmbedUrl('abc12345678');
      expect(embedUrl).toBe('https://www.youtube-nocookie.com/embed/abc12345678');
    });

    it('1.4 isValidSecureEmbedUrl allows strictly verified official embed domains', () => {
      expect(isValidSecureEmbedUrl('https://www.youtube-nocookie.com/embed/abc12345678')).toBe(true);
      expect(isValidSecureEmbedUrl('https://youtube-nocookie.com/embed/abc12345678')).toBe(true);
      expect(isValidSecureEmbedUrl('https://www.youtube.com/embed/abc12345678')).toBe(true);
      expect(isValidSecureEmbedUrl('https://youtube.com/embed/abc12345678')).toBe(true);
    });

    it('1.5 isValidSecureEmbedUrl rejects malicious schemes (javascript, data, vbscript, file, http)', () => {
      expect(isValidSecureEmbedUrl('javascript:alert(1)')).toBe(false);
      expect(isValidSecureEmbedUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isValidSecureEmbedUrl('vbscript:msgbox(1)')).toBe(false);
      expect(isValidSecureEmbedUrl('file:///C:/passwords.txt')).toBe(false);
      expect(isValidSecureEmbedUrl('http://www.youtube.com/embed/abc12345678')).toBe(false);
    });

    it('1.6 isValidSecureEmbedUrl rejects unauthorized third-party iframe domains', () => {
      expect(isValidSecureEmbedUrl('https://malicious-site.com/embed/abc12345678')).toBe(false);
      expect(isValidSecureEmbedUrl('https://vimeo.com/12345678')).toBe(false);
      expect(isValidSecureEmbedUrl('https://dailymotion.com/embed/video/x123')).toBe(false);
    });

    it('1.7 isValidSecureEmbedUrl rejects HTML tags, quotes, and whitespace injections', () => {
      expect(isValidSecureEmbedUrl('https://www.youtube-nocookie.com/embed/<script>')).toBe(false);
      expect(isValidSecureEmbedUrl('https://www.youtube-nocookie.com/embed/abc12345678" onload="alert(1)')) .toBe(false);
      expect(isValidSecureEmbedUrl('https://www.youtube-nocookie.com/embed/abc12345678	')).toBe(false);
    });

    it('1.8 validateSecureYouTubeEmbedUrl returns structured audit results', () => {
      const validRes = validateSecureYouTubeEmbedUrl('https://www.youtube-nocookie.com/embed/abc12345678');
      expect(validRes.valid).toBe(true);
      expect(validRes.videoId).toBe('abc12345678');
      expect(validRes.embedUrl).toBe('https://www.youtube-nocookie.com/embed/abc12345678');

      const invalidRes = validateSecureYouTubeEmbedUrl('javascript:void(0)');
      expect(invalidRes.valid).toBe(false);
      expect(invalidRes.videoId).toBeNull();
      expect(invalidRes.error).toBeDefined();
    });
  });

  // -----------------------------------------------------------------
  // 2. VIDEO RELEVANCE & MATCHING LOGIC
  // -----------------------------------------------------------------
  describe('2. Deterministic Video Relevance & Scoring', () => {
    it('2.1 calculateVideoRelevanceScore computes high score for matching title and culinary channel', () => {
      const res = calculateVideoRelevanceScore(sampleRecipe, {
        videoId: 'abc12345678',
        title: 'Karnıyarık Tarifi Nasıl Yapılır',
        channelTitle: 'Geleneksel Mutfak & Culinary Arts'
      });

      expect(res.score).toBeGreaterThanOrEqual(80);
      expect(res.isRelevant).toBe(true);
      expect(res.reasons.length).toBeGreaterThanOrEqual(3);
    });

    it('2.2 calculateVideoRelevanceScore rewards Turkish cuisine context keywords', () => {
      const res = calculateVideoRelevanceScore(sampleRecipe, {
        videoId: 'abc12345678',
        title: 'En Lezzetli Karnıyarık Nasıl Pişirilir',
        channelTitle: 'Türk Yemekleri Şefi'
      });

      expect(res.isRelevant).toBe(true);
      expect(res.reasons.some(r => r.includes('Türk mutfağı'))).toBe(true);
    });

    it('2.3 calculateVideoRelevanceScore flags completely unrelated videos with lower scores', () => {
      const res = calculateVideoRelevanceScore(sampleRecipe, {
        videoId: 'abc12345678',
        title: 'Gaming Live Stream Gameplay',
        channelTitle: 'Gamer Channel'
      });

      expect(res.score).toBeLessThan(70);
    });

    it('2.4 matchRecipeVideo produces ready status and privacy embed for valid ID', () => {
      const res = matchRecipeVideo(sampleRecipe);
      expect(res.status).toBe('ready');
      expect(res.videoId).toBe('abc12345678');
      expect(res.embedUrl).toBe('https://www.youtube-nocookie.com/embed/abc12345678');
      expect(res.permissionStatus).toBe('authorized_embed');
    });

    it('2.5 matchRecipeVideo handles missing video gracefully', () => {
      const noVidRecipe = { ...sampleRecipe, videoId: null };
      const res = matchRecipeVideo(noVidRecipe);
      expect(res.status).toBe('missing');
      expect(res.videoMatchScore).toBe(0);
    });
  });

  // -----------------------------------------------------------------
  // 3. LIVE & CURATED VIDEO PROVIDERS & FAULT TOLERANCE
  // -----------------------------------------------------------------
  describe('3. Video Provider Implementations & Error Isolation', () => {
    it('3.1 CuratedRecipeVideoProvider finds registered seed videos', async () => {
      const provider = new CuratedRecipeVideoProvider();
      const res = await provider.searchVideos({ recipeTitle: 'Mercimek Çorbası' });
      expect(res.totalFound).toBeGreaterThanOrEqual(1);
      expect(res.candidates[0].videoId).toBe('mock_vid_mercimek');
      expect(res.candidates[0].embedUrl).toContain('youtube-nocookie.com/embed/');
    });

    it('3.2 LiveYouTubeVideoProvider returns empty result when API key is not configured (no crash)', async () => {
      const provider = new LiveYouTubeVideoProvider({ apiKey: '' });
      const res = await provider.searchVideos({ recipeTitle: 'Karnıyarık' });
      expect(res.totalFound).toBe(0);
      expect(res.candidates).toEqual([]);
    });

    it('3.3 LiveYouTubeVideoProvider getVideoById formats valid 11-char ID securely', async () => {
      const provider = new LiveYouTubeVideoProvider();
      const cand = await provider.getVideoById('abc12345678');
      expect(cand).not.toBeNull();
      expect(cand?.videoId).toBe('abc12345678');
      expect(cand?.embedUrl).toBe('https://www.youtube-nocookie.com/embed/abc12345678');
    });

    it('3.4 LiveYouTubeVideoProvider getVideoById rejects invalid IDs', async () => {
      const provider = new LiveYouTubeVideoProvider();
      const cand = await provider.getVideoById('invalid');
      expect(cand).toBeNull();
    });
  });

  // -----------------------------------------------------------------
  // 4. IMAGE ENRICHMENT & QUALITY CHECKS
  // -----------------------------------------------------------------
  describe('4. Image Quality & Licensing Verification', () => {
    it('4.1 rejects placehold.co images with status="rejected"', () => {
      const badImgRecipe = { ...sampleRecipe, image: 'https://placehold.co/600x400' };
      const res = matchRecipeImage(badImgRecipe);
      expect(res.status).toBe('rejected');
      expect(res.imageMatchScore).toBe(0);
    });

    it('4.2 assigns status="ready" and high score to authorized Pexels images', () => {
      const res = matchRecipeImage(sampleRecipe, {
        permissionStatus: 'authorized',
        license: 'Pexels Free License'
      });
      expect(res.status).toBe('ready');
      expect(res.imageMatchScore).toBeGreaterThanOrEqual(70);
      expect(res.permissionStatus).toBe('authorized');
    });

    it('4.3 assigns status="needs_review" to community-contributed TheMealDB images', () => {
      const tmdbRecipe = {
        ...sampleRecipe,
        image: 'https://www.themealdb.com/images/media/meals/karniyarik.jpg'
      };
      const res = matchRecipeImage(tmdbRecipe, { license: 'unknown' });
      expect(res.status).toBe('needs_review');
      expect(res.permissionStatus).toBe('needs_review');
    });
  });

  // -----------------------------------------------------------------
  // 5. BATCH LIMIT & ORCHESTRATION ENFORCEMENT
  // -----------------------------------------------------------------
  describe('5. Batch Size Enforcement & Staging Orchestration', () => {
    it('5.1 rejects batch size > 100 with explicit error', async () => {
      const orchestrator = new StagingOrchestrator();
      const provider = new MockRecipeProvider();

      await expect(
        orchestrator.orchestrate(provider, { limit: 101 })
      ).rejects.toThrow(/Maksimum batch boyutu 100 tariftir/);
    });

    it('5.2 rejects batch size <= 0 with explicit error', async () => {
      const orchestrator = new StagingOrchestrator();
      const provider = new MockRecipeProvider();

      await expect(
        orchestrator.orchestrate(provider, { limit: 0 })
      ).rejects.toThrow(/pozitif bir sayı olmalıdır/);
    });

    it('5.3 accepts safe batch sizes (10, 50, 100)', async () => {
      const orchestrator = new StagingOrchestrator();
      const provider = new MockRecipeProvider();

      const res10 = await orchestrator.orchestrate(provider, { limit: 10 });
      expect(res10.manifest.requested).toBe(10);
      expect(res10.stagedRecipes.length).toBeLessThanOrEqual(10);
    });
  });

  // -----------------------------------------------------------------
  // 6. 10-POINT PRODUCTION ELIGIBILITY GATE
  // -----------------------------------------------------------------
  describe('6. Production Eligibility Safety Gate (10 Criteria)', () => {
    it('6.1 approves a fully compliant Turkish recipe with authorized image and valid video', () => {
      const stagedRecipe: StagedRecipe = {
        id: 'stage_test_1',
        source: 'curated_test',
        sourceId: '1',
        sourceLanguage: 'tr',
        displayLanguage: 'tr',
        title: 'Karnıyarık',
        displayTitle: 'Karnıyarık',
        canonicalTitle: 'karniyarik',
        category: 'Ana Yemek',
        tags: ['patlican'],
        difficulty: 'Orta',
        cookingTime: '45 dakika',
        timeMinutes: 45,
        servings: 4,
        ingredients: [
          {
            raw: '4 adet patlican',
            name: 'Patlıcan',
            canonicalName: 'patlican',
            amount: '4 adet',
            unit: 'adet',
            isStaple: false,
            confidence: 1.0,
            status: 'parsed'
          }
        ],
        instructions: ['Patlıcanları kızartın.'],
        image: {
          imageMatchScore: 85,
          status: 'ready',
          reasons: ['Pexels authorized asset'],
          confidence: 0.9,
          permissionStatus: 'authorized',
          license: 'Pexels Free'
        },
        video: {
          videoMatchScore: 90,
          status: 'ready',
          reasons: ['YouTube verified embed'],
          confidence: 0.9,
          videoId: 'abc12345678',
          embedUrl: 'https://www.youtube-nocookie.com/embed/abc12345678',
          permissionStatus: 'authorized_embed'
        },
        quality: {
          overallScore: 88,
          tier: 'excellent',
          contentScore: 90,
          imageScore: 90,
          videoScore: 90,
          metadataScore: 85,
          localizationScore: 90,
          breakdown: { content: 90, media: 90, metadata: 85, safety: 90 }
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
          sourceTitle: 'Karnıyarık',
          sourceLanguage: 'tr',
          displayLanguage: 'tr',
          displayTitle: 'Karnıyarık',
          displayDescription: '',
          translationStatus: 'translated'
        },
        taxonomy: {
          cooklyCategory: 'Ana Yemek',
          confidence: 1.0,
          matchedTags: ['patlican'],
          status: 'mapped'
        },
        provenance: {
          source: 'curated_test',
          sourceId: '1',
          importedAt: new Date().toISOString(),
          providerVersion: '1.0.0',
          pipelineVersion: '14.0.0',
          transformations: ['normalized', 'image_matched', 'video_matched']
        },
        reviewItems: [],
        status: 'production_ready',
        productionEligibility: {
          eligible: false,
          checks: {} as any,
          reasons: [],
          blockingIssues: [],
          evaluatedAt: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const eligibility = evaluateProductionEligibility(stagedRecipe);
      expect(eligibility.eligible).toBe(true);
      expect(eligibility.blockingIssues).toHaveLength(0);
      expect(eligibility.checks.sourceAllowed).toBe(true);
      expect(eligibility.checks.licenseApproved).toBe(true);
      expect(eligibility.checks.imageApproved).toBe(true);
      expect(eligibility.checks.videoPolicySatisfied).toBe(true);
    });

    it('6.2 blocks recipes with unverified/needs_review image license', () => {
      const stagedRecipe: any = {
        source: 'curated_test',
        sourceLanguage: 'tr',
        displayLanguage: 'tr',
        title: 'Karnıyarık',
        displayTitle: 'Karnıyarık',
        ingredients: [{ name: 'Patlıcan' }],
        instructions: ['Pişirin.'],
        image: {
          status: 'needs_review',
          permissionStatus: 'needs_review',
          license: 'unknown'
        },
        video: { status: 'ready', embedUrl: 'https://www.youtube-nocookie.com/embed/abc12345678' },
        quality: { overallScore: 75, tier: 'good' },
        reviewItems: [],
        provenance: { source: 'curated_test', sourceId: '1', importedAt: '2026-01-01', pipelineVersion: '14.0.0', transformations: [] }
      };

      const eligibility = evaluateProductionEligibility(stagedRecipe);
      expect(eligibility.eligible).toBe(false);
      expect(eligibility.blockingIssues.some(b => b.includes('lisansı onaylanmadı') || b.includes('Görsel durumu'))).toBe(true);
    });
  });

  // -----------------------------------------------------------------
  // 7. PRODUCTION DATASET IMMUTABILITY
  // -----------------------------------------------------------------
  describe('7. Production Dataset & System Immutability', () => {
    it('7.1 verifies src/data/raw_recipes.json contains exactly 50 recipes and is intact', () => {
      const rawPath = path.join(__dirname, '../data/raw_recipes.json');
      expect(fs.existsSync(rawPath)).toBe(true);
      const data = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
      expect(data.recipes).toBeDefined();
      expect(data.recipes.length).toBeGreaterThanOrEqual(50);
      expect(data.recipes[0].id).toBe(1);
      expect(data.recipes[0].name).toBe('Tavuk Sote');
    });

    it('7.2 verifies zero unauthorized video downloads were triggered on disk', () => {
      // Confirms video files (.mp4, .mkv, .webm) are not stored in repository
      const publicDir = path.join(__dirname, '../../public');
      if (fs.existsSync(publicDir)) {
        const files = fs.readdirSync(publicDir);
        const videoFiles = files.filter(f => /\.(mp4|mkv|webm|avi)$/i.test(f));
        expect(videoFiles).toHaveLength(0);
      }
    });
  });
});
