import { describe, it, expect } from 'vitest';
import {
  isPlaceholderImage,
  validateImageUrl,
  generateAltText,
  evaluateImageQuality,
  resolveImageFallback,
  processImageCandidate,
  runImagePipeline,
  MOCK_IMAGE_CANDIDATES,
  ImageCandidate
} from '../pipeline/image';
import fs from 'fs';
import path from 'path';

describe('Recipe Image Pipeline — Foundation Tests', () => {

  // Test 1: image URL validation
  it('Test 1: Görsel URL doğrulayıcı geçerli ve geçersiz URL formatlarını doğru ayrıştırır', () => {
    expect(validateImageUrl('https://images.unsplash.com/photo-1').isValid).toBe(true);
    expect(validateImageUrl('http://example.com/food.jpg').isValid).toBe(true);
    expect(validateImageUrl('/assets/images/soup.png').isValid).toBe(true);
    expect(validateImageUrl('data:image/png;base64,iVBORw0KGgo').isValid).toBe(true);

    expect(validateImageUrl('not-a-valid-url').isValid).toBe(false);
    expect(validateImageUrl('ftp://invalid-protocol.com/pic.jpg').isValid).toBe(false);
    expect(validateImageUrl('').isValid).toBe(false);
    expect(validateImageUrl(null).isValid).toBe(false);
  });

  // Test 2: placeholder detection
  it('Test 2: Placeholder dedektörü sahte/demo görselleri yakalarken gerçek fotoğrafları korur', () => {
    // Should detect as placeholders
    expect(isPlaceholderImage('https://placehold.co/400x300?text=Kofte')).toBe(true);
    expect(isPlaceholderImage('https://via.placeholder.com/150')).toBe(true);
    expect(isPlaceholderImage('https://cdn.site.com/default-food.png')).toBe(true);
    expect(isPlaceholderImage('https://site.com/recipe-placeholder.jpg')).toBe(true);
    expect(isPlaceholderImage('')).toBe(true);
    expect(isPlaceholderImage(null)).toBe(true);

    // Should NOT flag legitimate food photos
    expect(isPlaceholderImage('https://images.unsplash.com/photo-1625938145744-e380515399b7')).toBe(false);
    expect(isPlaceholderImage('https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg')).toBe(false);
    expect(isPlaceholderImage('/assets/images/mercimek.jpg')).toBe(false);
  });

  // Test 3: valid image candidate
  it('Test 3: Eksiksiz metadata ve geçerli URL\'ye sahip görsel adayı VALID ve usable olur', () => {
    const candidate: ImageCandidate = {
      recipeId: 'rec_valid_1',
      recipeTitle: 'Ezogelin Çorbası',
      imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd',
      source: 'unsplash_curated',
      sourceId: 'unsplash_123',
      metadata: {
        sourceName: 'Unsplash Food Collection',
        sourceType: 'external',
        permissionPolicy: 'allowed',
        attribution: 'Food Photographer',
        license: 'Unsplash License'
      }
    };

    const result = processImageCandidate(candidate);
    expect(result.qualityStatus).toBe('VALID');
    expect(result.decision).toBe('usable');
    expect(result.errors.length).toBe(0);
  });

  // Test 4: missing image
  it('Test 4: Görseli bulunmayan tarif "missing" kararı alır ve missing_state fallback priority atanır', () => {
    const candidate: ImageCandidate = {
      recipeId: 'rec_missing_1',
      recipeTitle: 'Tarhana Çorbası',
      imageUrl: null,
      source: 'none'
    };

    const result = processImageCandidate(candidate);
    expect(result.decision).toBe('missing');
    expect(result.fallbackPriority).toBe('missing_state');
    expect(result.qualityStatus).toBe('INVALID');
  });

  // Test 5: unknown permission
  it('Test 5: İzin durumu "unknown" olan görsel adayı güvenli olarak "needs_review" kararı alır', () => {
    const candidate: ImageCandidate = {
      recipeId: 'rec_unknown_1',
      recipeTitle: 'Ali Nazik Kebabı',
      imageUrl: 'https://external-unknown.com/alinazik.jpg',
      source: 'external_site',
      metadata: {
        sourceName: 'Unknown Blog',
        sourceType: 'external',
        permissionPolicy: 'unknown'
      }
    };

    const result = processImageCandidate(candidate);
    expect(result.decision).toBe('needs_review');
    expect(result.decisionReason).toContain('UNKNOWN');
  });

  // Test 6: prohibited permission
  it('Test 6: İzin durumu "prohibited" olan görsel kesinlikle reddedilir ("rejected")', () => {
    const candidate: ImageCandidate = {
      recipeId: 'rec_proh_1',
      recipeTitle: 'Karnıyarık',
      imageUrl: 'https://unauthorized-scraper.com/karniyarik.jpg',
      source: 'forbidden_scraper',
      metadata: {
        sourceName: 'Scraped Website',
        sourceType: 'external',
        permissionPolicy: 'prohibited',
        license: 'All Rights Reserved'
      }
    };

    const result = processImageCandidate(candidate);
    expect(result.decision).toBe('rejected');
    expect(result.decisionReason).toContain('PROHIBITED');
    expect(result.qualityStatus).toBe('INVALID');
  });

  // Test 7: allowed permission
  it('Test 7: "allowed" politikasına ve geçerli formata sahip görsel "usable" kararı alır', () => {
    const candidate: ImageCandidate = {
      recipeId: 'rec_allowed_1',
      recipeTitle: 'Menemen',
      imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8',
      source: 'unsplash',
      metadata: {
        sourceName: 'Unsplash',
        sourceType: 'external',
        permissionPolicy: 'allowed',
        attribution: 'Chef John',
        license: 'Free Commercial License'
      }
    };

    const result = processImageCandidate(candidate);
    expect(result.decision).toBe('usable');
  });

  // Test 8: warning status
  it('Test 8: Demo placeholder veya eksik atıf içeren görsel adayı WARNING kalitesine atanır', () => {
    const candidate: ImageCandidate = {
      recipeId: 'rec_warn_1',
      recipeTitle: 'Peynir Tabağı',
      imageUrl: 'https://placehold.co/400x300?text=Peynir',
      source: 'demo',
      metadata: {
        sourceName: 'Demo Source',
        sourceType: 'unknown',
        permissionPolicy: 'allowed'
      }
    };

    const quality = evaluateImageQuality(candidate);
    expect(quality.status).toBe('WARNING');
    expect(quality.isPlaceholder).toBe(true);
    expect(quality.warnings.some(w => w.includes('placeholder'))).toBe(true);
  });

  // Test 9: invalid status
  it('Test 9: Bozuk URL adresi INVALID durumuna düşer ve hata listelenir', () => {
    const candidate: ImageCandidate = {
      recipeId: 'rec_inv_1',
      recipeTitle: 'Baklava',
      imageUrl: 'htp://broken-url-with-typo',
      source: 'corrupted'
    };

    const quality = evaluateImageQuality(candidate);
    expect(quality.status).toBe('INVALID');
    expect(quality.errors.length).toBeGreaterThan(0);
  });

  // Test 10: fallback priority
  it('Test 10: Fallback stratejisi hiyerarşik olarak doğru önceliği belirler', () => {
    // 1. Approved existing local
    const local = resolveImageFallback({
      recipeId: '1', recipeTitle: 'A', imageUrl: '/assets/soup.jpg', source: 'local',
      metadata: { sourceType: 'local', permissionPolicy: 'allowed', retrievedAt: '', sourceName: '' }
    });
    expect(local).toBe('approved_existing');

    // 2. Licensed external
    const external = resolveImageFallback({
      recipeId: '2', recipeTitle: 'B', imageUrl: 'https://unsplash.com/photo', source: 'ext',
      metadata: { sourceType: 'external', permissionPolicy: 'allowed', retrievedAt: '', sourceName: '' }
    });
    expect(external).toBe('licensed_external');

    // 3. AI Generated
    const generated = resolveImageFallback({
      recipeId: '3', recipeTitle: 'C', imageUrl: 'https://gen.ai/food.jpg', source: 'gen',
      metadata: { sourceType: 'generated', permissionPolicy: 'allowed', retrievedAt: '', sourceName: '' }
    });
    expect(generated).toBe('generated');

    // 4. User uploaded
    const userUp = resolveImageFallback({
      recipeId: '4', recipeTitle: 'D', imageUrl: 'https://uploads.com/my-dish.jpg', source: 'user',
      metadata: { sourceType: 'user_uploaded', permissionPolicy: 'allowed', retrievedAt: '', sourceName: '' }
    });
    expect(userUp).toBe('user_uploaded');

    // 5. Missing state (placeholder / empty / prohibited)
    const missing = resolveImageFallback({
      recipeId: '5', recipeTitle: 'E', imageUrl: 'https://placehold.co/400x300', source: 'none'
    });
    expect(missing).toBe('missing_state');
  });

  // Test 11: alt text generation
  it('Test 11: Erişilebilir alt metni tarif başlığından doğru ve temiz üretilir', () => {
    expect(generateAltText('Mercimek Çorbası')).toBe('Mercimek Çorbası yemeği sunumu');
    expect(generateAltText('  Karnıyarık   ')).toBe('Karnıyarık yemeği sunumu');
    expect(generateAltText('Menemen', 'Tavada pişirilmiş sıcak menemen')).toBe('Tavada pişirilmiş sıcak menemen');
    expect(generateAltText('')).toBe('Yemek tarifi görseli');
    expect(generateAltText(null)).toBe('Yemek tarifi görseli');
  });

  // Test 12: duplicate image URL
  it('Test 12: Aynı görsel URL adresi farklı tariflerde kullanıldığında duplicate tespit edilir', () => {
    const batch: ImageCandidate[] = [
      {
        recipeId: 'rec_dup_1',
        recipeTitle: 'Mercimek Çorbası',
        imageUrl: 'https://images.unsplash.com/photo-same-soup',
        source: 'unsplash',
        metadata: { sourceType: 'external', permissionPolicy: 'allowed', retrievedAt: '', sourceName: '' }
      },
      {
        recipeId: 'rec_dup_2',
        recipeTitle: 'Ezogelin Çorbası',
        imageUrl: 'https://images.unsplash.com/photo-same-soup', // Duplicate URL!
        source: 'unsplash',
        metadata: { sourceType: 'external', permissionPolicy: 'allowed', retrievedAt: '', sourceName: '' }
      }
    ];

    const report = runImagePipeline(batch);
    expect(report.duplicates.length).toBe(1);
    expect(report.duplicates[0].reason).toContain('Aynı görsel URL adresi');
    expect(report.duplicates[0].imageUrl).toBe('https://images.unsplash.com/photo-same-soup');
  });

  // Test 13: source + sourceId duplicate
  it('Test 13: Aynı kaynak ve kaynak ID\'si tekrarlandığında duplicate olarak yakalanır', () => {
    const batch: ImageCandidate[] = [
      {
        recipeId: 'rec_s1',
        recipeTitle: 'Köfte A',
        imageUrl: 'https://images.unsplash.com/kofte-1',
        source: 'pexels',
        sourceId: 'photo_999',
        metadata: { sourceType: 'external', permissionPolicy: 'allowed', retrievedAt: '', sourceName: '' }
      },
      {
        recipeId: 'rec_s2',
        recipeTitle: 'Köfte B',
        imageUrl: 'https://images.unsplash.com/kofte-2',
        source: 'pexels',
        sourceId: 'photo_999', // Colliding source + sourceId
        metadata: { sourceType: 'external', permissionPolicy: 'allowed', retrievedAt: '', sourceName: '' }
      }
    ];

    const report = runImagePipeline(batch);
    expect(report.duplicates.some(d => d.reason.includes('kaynak görsel kimliği'))).toBe(true);
  });

  // Test 14: fake license generation prevention
  it('Test 14: Pipeline eksik lisans bilgisi durumunda ASLA sahte lisans uydurmaz', () => {
    const candidate: ImageCandidate = {
      recipeId: 'rec_no_fake',
      recipeTitle: 'Güveç',
      imageUrl: 'https://images.unsplash.com/guvec',
      source: 'test',
      metadata: {
        sourceName: 'Unknown Source',
        sourceType: 'unknown',
        license: null,
        attribution: null
      }
    };

    const result = processImageCandidate(candidate);
    expect(candidate.metadata?.license).toBeNull();
    expect(candidate.metadata?.attribution).toBeNull();
    expect(result.warnings.some(w => w.includes('lisans bilgisi belirtilmemiş'))).toBe(true);
  });

  // Test 15: production dataset unchanged
  it('Test 15: Image pipeline kontrolleri production dataset dosyalarını ASLA değiştirmez', () => {
    const rawPath = path.join(__dirname, '../data/raw_recipes.json');
    const beforeContent = fs.readFileSync(rawPath, 'utf8');

    runImagePipeline(MOCK_IMAGE_CANDIDATES);

    const afterContent = fs.readFileSync(rawPath, 'utf8');
    expect(afterContent).toBe(beforeContent);
  });

  // Test 16: image dry-run report
  it('Test 16: runImagePipeline doğru metrik toplamları ve dry-run raporu üretir', () => {
    const report = runImagePipeline(MOCK_IMAGE_CANDIDATES);

    expect(report.total).toBe(MOCK_IMAGE_CANDIDATES.length);
    expect(report.productionDatasetModified).toBe(false);
    expect(report.placeholders).toBe(1); // MOCK 5: placehold.co
    expect(report.invalid).toBe(2);      // MOCK 4: prohibited, MOCK 6: malformed url
    expect(report.usable).toBe(2);       // MOCK 1: allowed local, MOCK 2: allowed generated
    expect(report.needsReview).toBe(2);  // MOCK 3: unknown external, MOCK 5: placeholder
  });

  // Test 17: mock image source behavior
  it('Test 17: MOCK_IMAGE_CANDIDATES 6 temel senaryoyu deterministik olarak sağlar', () => {
    expect(MOCK_IMAGE_CANDIDATES.length).toBe(6);
    const [local, gen, unknown, proh, place, inv] = MOCK_IMAGE_CANDIDATES;

    expect(local.metadata?.permissionPolicy).toBe('allowed');
    expect(gen.metadata?.sourceType).toBe('generated');
    expect(unknown.metadata?.permissionPolicy).toBe('unknown');
    expect(proh.metadata?.permissionPolicy).toBe('prohibited');
    expect(isPlaceholderImage(place.imageUrl)).toBe(true);
    expect(validateImageUrl(inv.imageUrl).isValid).toBe(false);
  });

});
