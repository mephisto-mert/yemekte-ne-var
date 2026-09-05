import { describe, it, expect, beforeEach } from 'vitest';
import {
  ImageProviderRegistry,
  LocalImageProvider,
  MockImageProvider,
  buildImageSearchQuery,
  rankCandidates,
  calculateCandidateScore,
  acquireImageForRecipe,
  ImageDownloadManager,
  ImageCandidate
} from '../pipeline/image';
import fs from 'fs';
import path from 'path';

describe('Recipe Image Acquisition Engine Tests', () => {
  let registry: ImageProviderRegistry;

  beforeEach(() => {
    registry = new ImageProviderRegistry();
  });

  // Test 1: provider registration
  it('Test 1: Provider başarıyla registry\'ye kaydedilir ve listelenir', () => {
    const mock = new MockImageProvider({ name: 'custom_mock' });
    registry.registerProvider(mock);

    expect(registry.listProviders().length).toBe(1);
    expect(registry.listProviders()[0].name).toBe('custom_mock');
  });

  // Test 2: provider lookup
  it('Test 2: Kayıtlı provider adına göre başarıyla bulunur', () => {
    const local = new LocalImageProvider();
    registry.registerProvider(local);

    const found = registry.getProvider('local_curated');
    expect(found).toBeDefined();
    expect(found?.type).toBe('local');
  });

  // Test 3: unknown provider
  it('Test 3: Bilinmeyen provider arandığında undefined veya kontrollü hata fırlatılır', () => {
    expect(registry.getProvider('non_existent_provider')).toBeUndefined();
    expect(() => registry.requireProvider('non_existent_provider')).toThrow(
      'Bilinmeyen ImageProvider'
    );
  });

  // Test 4: mock provider result
  it('Test 4: Mock provider deterministik sonuçlar döner', () => {
    const mock = new MockImageProvider();
    const results = mock.search('çorba');

    expect(results.length).toBeGreaterThan(0);
    expect(results[0].source).toBe('mock_local');
    expect(results[0].permissionPolicy).toBe('allowed');
  });

  // Test 5: local provider
  it('Test 5: LocalImageProvider çevrimdışı yerel tarif görsellerini doğru filtreler', () => {
    const local = new LocalImageProvider();
    const results = local.search('mercimek');

    expect(results.length).toBe(1);
    expect(results[0].sourceId).toBe('mercimek_corbasi');
    expect(results[0].imageUrl).toContain('/assets/images/mercimek_corbasi.webp');
  });

  // Test 6: query builder Turkish title
  it('Test 6: Query builder Türkçe karakterleri ve parantez temizliğini doğru yapar', () => {
    expect(buildImageSearchQuery('Mercimek Çorbası')).toBe('Mercimek Çorbası yemek');
    expect(buildImageSearchQuery('  İskender Kebabı (Tereyağlı Özel)  ')).toBe('İskender Kebabı yemek');
    expect(buildImageSearchQuery('Karnıyarık [Fırında]')).toBe('Karnıyarık yemek');
  });

  // Test 7: query builder empty title
  it('Test 7: Query builder boş veya geçersiz başlıkta güvenli fallback üretir', () => {
    expect(buildImageSearchQuery('')).toBe('Yemek tarifi');
    expect(buildImageSearchQuery(null)).toBe('Yemek tarifi');
    expect(buildImageSearchQuery('   ')).toBe('Yemek tarifi');
  });

  // Test 8: candidate metadata
  it('Test 8: Provider sonuçları adaya dönüştürülürken metadata eksiksiz korunur', async () => {
    const mock = new MockImageProvider();
    registry.registerProvider(mock);

    const result = await acquireImageForRecipe(
      { id: 'rec_1', title: 'Mercimek Çorbası' },
      { registry, providerNames: ['mock_provider'] }
    );

    expect(result.bestCandidate).toBeDefined();
    expect(result.bestCandidate?.imageUrl).toBeDefined();
    expect(result.usedProvider).toBeDefined();
  });

  // Test 9: allowed permission
  it('Test 9: "allowed" izin politikasına sahip görsel candidate kullanılabilir (usable) olur', async () => {
    const allowedMock = new MockImageProvider({
      results: [
        {
          source: 'allowed_source',
          sourceId: 'img_1',
          imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd',
          sourceName: 'Allowed Source',
          permissionPolicy: 'allowed',
          retrievedAt: '2026-09-05T00:00:00.000Z'
        }
      ]
    });

    const res = await acquireImageForRecipe(
      { id: '1', title: 'Yayla Çorbası' },
      { providers: [allowedMock] }
    );

    expect(res.decision).toBe('usable');
    expect(res.bestCandidate?.decision).toBe('usable');
  });

  // Test 10: unknown permission
  it('Test 10: "unknown" izin durumundaki görsel candidate "needs_review" kararı alır', async () => {
    const unknownMock = new MockImageProvider({
      results: [
        {
          source: 'unknown_source',
          sourceId: 'img_2',
          imageUrl: 'https://unknown-domain.com/photo.jpg',
          sourceName: 'Unknown Source',
          permissionPolicy: 'unknown',
          retrievedAt: '2026-09-05T00:00:00.000Z'
        }
      ]
    });

    const res = await acquireImageForRecipe(
      { id: '2', title: 'Tas Kebabı' },
      { providers: [unknownMock] }
    );

    expect(res.decision).toBe('needs_review');
  });

  // Test 11: prohibited permission
  it('Test 11: "prohibited" izin durumundaki görsel candidate "rejected" kararı alır', async () => {
    const prohibitedMock = new MockImageProvider({
      results: [
        {
          source: 'proh_source',
          sourceId: 'img_3',
          imageUrl: 'https://prohibited.com/photo.jpg',
          sourceName: 'Prohibited Site',
          permissionPolicy: 'prohibited',
          retrievedAt: '2026-09-05T00:00:00.000Z'
        }
      ]
    });

    const res = await acquireImageForRecipe(
      { id: '3', title: 'Sarma' },
      { providers: [prohibitedMock] }
    );

    expect(res.decision).toBe('rejected');
    expect(res.decisionReason).toContain('PROHIBITED');
  });

  // Test 12: invalid candidate
  it('Test 12: Geçersiz URL adresi taşıyan aday reddedilir ("rejected")', async () => {
    const invalidMock = new MockImageProvider({
      results: [
        {
          source: 'corrupt',
          sourceId: 'inv_1',
          imageUrl: 'invalid-url-string',
          sourceName: 'Corrupt',
          permissionPolicy: 'allowed',
          retrievedAt: '2026-09-05T00:00:00.000Z'
        }
      ]
    });

    const res = await acquireImageForRecipe(
      { id: '4', title: 'Baklava' },
      { providers: [invalidMock] }
    );

    expect(res.decision).toBe('rejected');
    expect(res.bestCandidate?.qualityStatus).toBe('INVALID');
  });

  // Test 13: candidate ranking
  it('Test 13: Candidate ranking yerel onaylı görseli harici görselin önünde sıralar', () => {
    const localCandidate: ImageCandidate = {
      recipeId: '1', recipeTitle: 'A', imageUrl: '/assets/soup.jpg', source: 'local',
      metadata: { sourceType: 'local', permissionPolicy: 'allowed' }
    };
    const externalCandidate: ImageCandidate = {
      recipeId: '1', recipeTitle: 'A', imageUrl: 'https://images.unsplash.com/soup', source: 'ext',
      metadata: { sourceType: 'external', permissionPolicy: 'allowed' }
    };

    const ranked = rankCandidates([externalCandidate, localCandidate]);
    expect(ranked[0].metadata?.sourceType).toBe('local');
    expect(ranked[1].metadata?.sourceType).toBe('external');
  });

  // Test 14: prohibited candidate never becomes usable
  it('Test 14: Yasaklı (prohibited) aday hiçbir koşulda onaylı adayın önüne geçemez ve usable olamaz', () => {
    const allowed: ImageCandidate = {
      recipeId: '1', recipeTitle: 'A', imageUrl: 'https://images.unsplash.com/soup', source: 'ext',
      metadata: { sourceType: 'external', permissionPolicy: 'allowed' }
    };
    const prohibited: ImageCandidate = {
      recipeId: '1', recipeTitle: 'A', imageUrl: 'https://scraped.com/soup.jpg', source: 'scraped',
      metadata: { sourceType: 'external', permissionPolicy: 'prohibited', width: 4000, height: 4000 } // High res but prohibited
    };

    const scoreProh = calculateCandidateScore(prohibited);
    const scoreAllowed = calculateCandidateScore(allowed);

    expect(scoreProh).toBeLessThan(0);
    expect(scoreAllowed).toBeGreaterThan(0);

    const ranked = rankCandidates([prohibited, allowed]);
    expect(ranked[0].source).toBe('ext'); // Allowed always wins
  });

  // Test 15: unknown candidate never automatically becomes usable
  it('Test 15: İzin durumu "unknown" olan aday asla otomatik "usable" yapılamaz', async () => {
    const unknownMock = new MockImageProvider({
      results: [
        {
          source: 'unknown_vendor',
          sourceId: 'unk_1',
          imageUrl: 'https://images.unsplash.com/photo-valid-format',
          sourceName: 'Unknown Vendor',
          permissionPolicy: 'unknown',
          retrievedAt: '2026-09-05T00:00:00.000Z'
        }
      ]
    });

    const res = await acquireImageForRecipe(
      { id: '10', title: 'Pilav' },
      { providers: [unknownMock] }
    );

    expect(res.decision).not.toBe('usable');
    expect(res.decision).toBe('needs_review');
  });

  // Test 16: duplicate URL
  it('Test 16: Aynı görsel URL adresi geldiğinde score ve ranking tutarlı çalışır', () => {
    const cand1: ImageCandidate = {
      recipeId: '1', recipeTitle: 'Mercimek', imageUrl: 'https://images.unsplash.com/photo-1', source: 'u1',
      metadata: { sourceType: 'external', permissionPolicy: 'allowed' }
    };
    const cand2: ImageCandidate = {
      recipeId: '2', recipeTitle: 'Ezogelin', imageUrl: 'https://images.unsplash.com/photo-1', source: 'u1',
      metadata: { sourceType: 'external', permissionPolicy: 'allowed' }
    };

    const ranked = rankCandidates([cand1, cand2]);
    expect(ranked.length).toBe(2);
    expect(ranked[0].imageUrl).toBe(ranked[1].imageUrl);
  });

  // Test 17: source + sourceId duplicate
  it('Test 17: Aynı source + sourceId adayları sıralamada tutarlı tie-breaker ile sıralanır', () => {
    const candA: ImageCandidate = {
      recipeId: '1', recipeTitle: 'A', imageUrl: 'https://images.unsplash.com/a', source: 'p', sourceId: '100',
      metadata: { sourceType: 'external', permissionPolicy: 'allowed' }
    };
    const candB: ImageCandidate = {
      recipeId: '2', recipeTitle: 'B', imageUrl: 'https://images.unsplash.com/b', source: 'p', sourceId: '100',
      metadata: { sourceType: 'external', permissionPolicy: 'allowed' }
    };

    const ranked1 = rankCandidates([candA, candB]);
    const ranked2 = rankCandidates([candB, candA]);

    expect(ranked1[0].imageUrl).toBe(ranked2[0].imageUrl);
  });

  // Test 18: deterministic ranking
  it('Test 18: Ranking motoru aynı girdi listesi için her zaman aynı sırayı üretir (deterministik)', () => {
    const list: ImageCandidate[] = [
      { recipeId: '1', recipeTitle: 'A', imageUrl: 'https://images.unsplash.com/1', source: 's1', metadata: { sourceType: 'external', permissionPolicy: 'allowed' } },
      { recipeId: '2', recipeTitle: 'B', imageUrl: '/assets/local.jpg', source: 'local', metadata: { sourceType: 'local', permissionPolicy: 'allowed' } },
      { recipeId: '3', recipeTitle: 'C', imageUrl: 'https://unknown.com/3', source: 'unk', metadata: { sourceType: 'external', permissionPolicy: 'unknown' } }
    ];

    const r1 = rankCandidates(list);
    const r2 = rankCandidates(list);

    expect(r1.map(x => x.imageUrl)).toEqual(r2.map(x => x.imageUrl));
  });

  // Test 19: dry-run dataset immutability
  it('Test 19: Acquisition engine çalışırken production dataset dosyaları (raw_recipes.json) ASLA değişmez', async () => {
    const rawPath = path.join(__dirname, '../data/raw_recipes.json');
    const beforeContent = fs.readFileSync(rawPath, 'utf8');

    const mock = new MockImageProvider();
    await acquireImageForRecipe({ id: '1', title: 'Tavuk Sote' }, { providers: [mock] });

    const afterContent = fs.readFileSync(rawPath, 'utf8');
    expect(afterContent).toBe(beforeContent);
  });

  // Test 20: no network request in mock provider
  it('Test 20: MockProvider ve LocalProvider network çağrısı yapmadan senkron/yerel çalışır', () => {
    const local = new LocalImageProvider();
    const mock = new MockImageProvider();

    // Direct search execution without any network latency
    const localRes = local.search('mercimek');
    const mockRes = mock.search('karniyarik');

    expect(localRes).toBeDefined();
    expect(mockRes).toBeDefined();
  });

  // Test 21: provider requires API key metadata
  it('Test 21: Provider metadata API anahtarı zorunluluğunu ve env değişken adını doğru bildirir', () => {
    const pexelsMock = new MockImageProvider({
      name: 'pexels_provider',
      type: 'pexels',
      requiresApiKey: true,
      apiKeyEnvVar: 'PEXELS_API_KEY'
    });

    expect(pexelsMock.metadata.requiresApiKey).toBe(true);
    expect(pexelsMock.metadata.apiKeyEnvVar).toBe('PEXELS_API_KEY');
  });

  // Test 22: rate-limit metadata
  it('Test 22: Provider metadata rate-limit sınırlarını doğru modeller', () => {
    const rateLimited = new MockImageProvider({
      rateLimit: { requestsPerMinute: 30, requestsPerMonth: 2000 }
    });

    expect(rateLimited.metadata.rateLimit?.requestsPerMinute).toBe(30);
    expect(rateLimited.metadata.rateLimit?.requestsPerMonth).toBe(2000);
  });

  // Test 23: license remains unknown
  it('Test 23: Lisans bilgisi bilinmeyen aday için yapay lisans ("royalty-free" vb.) uydurulmaz', async () => {
    const noLicenseMock = new MockImageProvider({
      results: [
        {
          source: 'no_license',
          sourceId: '1',
          imageUrl: 'https://images.unsplash.com/valid',
          sourceName: 'No License',
          license: null,
          attribution: null,
          permissionPolicy: 'unknown',
          retrievedAt: '2026-09-05T00:00:00.000Z'
        }
      ]
    });

    const res = await acquireImageForRecipe({ id: '1', title: 'Mantı' }, { providers: [noLicenseMock] });
    expect(res.bestCandidate?.warnings.some(w => w.includes('lisans bilgisi belirtilmemiş'))).toBe(true);
  });

  // Test 24: attribution preservation
  it('Test 24: Sağlayıcıdan gelen fotoğrafçı ve kaynak atıfı (attribution) eksiksiz korunur', () => {
    const mock = new MockImageProvider();
    const results = mock.search('çorba');
    const withAttribution = results.find(r => r.attribution !== null);

    expect(withAttribution).toBeDefined();
    expect(withAttribution?.attribution).toBe('Cookly Şefleri');
  });

  // Test 25: fallback integration & download manager plan
  it('Test 25: DownloadManager ağ çağrısı yapmadan indirme planı ve kısıt kontrolü oluşturur', () => {
    const dm = new ImageDownloadManager();
    const candidate: ImageCandidate = {
      recipeId: 'rec_dm_1',
      recipeTitle: 'Mercimek Çorbası',
      imageUrl: 'https://images.unsplash.com/photo-1',
      source: 'unsplash',
      metadata: { sourceType: 'external', permissionPolicy: 'allowed', mimeType: 'image/webp' }
    };

    const plan = dm.buildDownloadPlan(candidate);
    expect(plan.readyForDownload).toBe(true);
    expect(plan.destinationPath).toContain('rec_dm_1.webp');

    const estimate = dm.estimateDownload(plan);
    expect(estimate.supportedMimeType).toBe(true);
    expect(estimate.estimatedSizeBytes).toBeGreaterThan(0);
  });

});
