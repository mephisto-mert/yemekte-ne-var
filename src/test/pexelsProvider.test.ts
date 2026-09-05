import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PexelsImageProvider,
  SafeHttpClient,
  ImageProviderRegistry,
  acquireImageForRecipe,
  calculateCandidateScore,
  rankCandidates,
  ImageCandidate
} from '../pipeline/image';
import fs from 'fs';
import path from 'path';

describe('Pexels Image Provider Tests (100% Mocked - Zero Network)', () => {
  const samplePhoto = {
    id: 123456,
    width: 1920,
    height: 1080,
    url: 'https://www.pexels.com/photo/delicious-food-123456/',
    photographer: 'Ayşe Şef',
    photographer_url: 'https://www.pexels.com/@ayse-sef',
    photographer_id: 999,
    avg_color: '#A52A2A',
    src: {
      original: 'https://images.pexels.com/photos/123456/pexels-photo-123456.jpeg',
      large2x: 'https://images.pexels.com/photos/123456/pexels-photo-123456.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
      large: 'https://images.pexels.com/photos/123456/pexels-photo-123456.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      medium: 'https://images.pexels.com/photos/123456/pexels-photo-123456.jpeg?auto=compress&cs=tinysrgb&h=350',
      small: 'https://images.pexels.com/photos/123456/pexels-photo-123456.jpeg?auto=compress&cs=tinysrgb&h=130'
    },
    alt: 'Lezzetli Mercimek Çorbası'
  };

  const sampleSearchResponse = {
    page: 1,
    per_page: 1,
    photos: [samplePhoto],
    total_results: 100
  };

  // Helper to create a mock fetch function
  function createMockFetch(status: number, data: any, headers: Record<string, string> = {}) {
    return vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      const headerMap = new Map<string, string>();
      Object.entries(headers).forEach(([k, v]) => headerMap.set(k.toLowerCase(), v));

      return {
        ok: status >= 200 && status < 300,
        status,
        statusText: status === 200 ? 'OK' : 'Error',
        headers: {
          get: (key: string) => headerMap.get(key.toLowerCase()) || null,
          forEach: (cb: (val: string, key: string) => void) => {
            headerMap.forEach((val, key) => cb(val, key));
          }
        },
        text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
        json: async () => data
      } as unknown as Response;
    });
  }

  // Test 1: Metadata compliance
  it('Test 1: Metadata Pexels spesifikasyonlarına ve PART 5/6 kurallarına uygundur', () => {
    const provider = new PexelsImageProvider({ apiKey: 'dummy_key' });
    expect(provider.name).toBe('pexels');
    expect(provider.type).toBe('pexels');
    expect(provider.metadata.permissionPolicy).toBe('allowed');
    expect(provider.metadata.requiresApiKey).toBe(true);
    expect(provider.metadata.apiKeyEnvVar).toBe('PEXELS_API_KEY');
    expect(provider.metadata.supportsSearch).toBe(true);
    expect(provider.metadata.supportsIdLookup).toBe(true);
    expect(provider.metadata.defaultLicense).toContain('Pexels License');
  });

  // Test 2: Unconfigured check
  it('Test 2: API anahtarı boş veya undefined olduğunda isConfigured false döner', () => {
    const provider1 = new PexelsImageProvider({ apiKey: undefined });
    const provider2 = new PexelsImageProvider({ apiKey: '' });
    const provider3 = new PexelsImageProvider({ apiKey: '   ' });

    expect(provider1.isConfigured()).toBe(false);
    expect(provider2.isConfigured()).toBe(false);
    expect(provider3.isConfigured()).toBe(false);
  });

  // Test 3: Configured check
  it('Test 3: Geçerli API anahtarı sağlandığında isConfigured true döner', () => {
    const provider = new PexelsImageProvider({ apiKey: 'valid_pexels_api_token' });
    expect(provider.isConfigured()).toBe(true);
  });

  // Test 4: Unconfigured search returns empty
  it('Test 4: Yapılandırılmamış provider search() çağrısında hata fırlatmaz, boş liste döner', async () => {
    const provider = new PexelsImageProvider({ apiKey: '' });
    const results = await provider.search('çorba');
    expect(results).toEqual([]);
  });

  // Test 5: Unconfigured getById returns null
  it('Test 5: Yapılandırılmamış provider getById() çağrısında null döner', async () => {
    const provider = new PexelsImageProvider({ apiKey: '' });
    const result = await provider.getById('123456');
    expect(result).toBeNull();
  });

  // Test 6: Empty query handling
  it('Test 6: Boş veya yalnızca boşluk içeren arama sorguları boş liste döner', async () => {
    const mockFetch = createMockFetch(200, sampleSearchResponse);
    const provider = new PexelsImageProvider({
      apiKey: 'test_key',
      httpClient: new SafeHttpClient({ fetchFn: mockFetch })
    });

    const res1 = await provider.search('');
    const res2 = await provider.search('   ');
    expect(res1).toEqual([]);
    expect(res2).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // Test 7: Secret redaction in SafeHttpClient
  it('Test 7: SafeHttpClient hata mesajlarındaki ve metinlerdeki API anahtarlarını maskeler', () => {
    const client = new SafeHttpClient();
    const sensitiveKey = 'secret_pexels_9988776655';
    const rawError = `Failed to fetch from https://api.pexels.com with ${sensitiveKey}`;
    const redacted = client.redactSecrets(rawError, sensitiveKey);

    expect(redacted).not.toContain(sensitiveKey);
    expect(redacted).toContain('[REDACTED_API_KEY]');
  });

  // Test 8: Query parameter secret redaction
  it('Test 8: URL parametrelerindeki api_key ve token parametreleri otomatik maskelenir', () => {
    const client = new SafeHttpClient();
    const url = 'https://example.com/api?api_key=super_secret_val&format=json';
    const redacted = client.redactSecrets(url);

    expect(redacted).not.toContain('super_secret_val');
    expect(redacted).toContain('api_key=[REDACTED]');
  });

  // Test 9: Auth header never leaked in thrown error
  it('Test 9: HTTP istemcisi bağlantı hatasında Authorization başlığını sızdırmaz', async () => {
    const sensitiveKey = 'SUPER_SECRET_TOKEN_XYZ';
    const failingFetch = vi.fn().mockRejectedValue(new Error(`Connection failed with ${sensitiveKey}`));
    const client = new SafeHttpClient({ fetchFn: failingFetch, defaultMaxRetries: 0 });

    await expect(
      client.get('https://api.pexels.com/v1/search?query=test', {
        headers: { Authorization: sensitiveKey }
      })
    ).rejects.toThrow();

    try {
      await client.get('https://api.pexels.com/v1/search?query=test', {
        headers: { Authorization: sensitiveKey }
      });
    } catch (err: any) {
      expect(err.message).not.toContain(sensitiveKey);
      expect(err.message).toContain('[REDACTED_API_KEY]');
    }
  });

  // Test 10: Successful search mapping
  it('Test 10: Başarılı Pexels yanıtı ImageProviderResult formatına eksiksiz dönüştürülür', async () => {
    const mockFetch = createMockFetch(200, sampleSearchResponse);
    const provider = new PexelsImageProvider({
      apiKey: 'test_key',
      httpClient: new SafeHttpClient({ fetchFn: mockFetch })
    });

    const results = await provider.search('Mercimek Çorbası');
    expect(results.length).toBe(1);
    const item = results[0];

    expect(item.source).toBe('pexels');
    expect(item.sourceId).toBe('123456');
    expect(item.sourceName).toBe('Pexels');
    expect(item.permissionPolicy).toBe('allowed');
    expect(item.width).toBe(1920);
    expect(item.height).toBe(1080);
    expect(item.attribution).toBe('Ayşe Şef (Pexels)');
    expect(item.license).toContain('Pexels License');
    expect(item.altText).toBe('Lezzetli Mercimek Çorbası');
    expect(item.imageUrl).toBe(samplePhoto.src.large);
  });

  // Test 11: Authorization header format
  it('Test 11: Pexels API\'sine giden Authorization başlığında Bearer prefix\'i yer almaz', async () => {
    let capturedHeaders: any = null;
    const mockFetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      capturedHeaders = init?.headers;
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify(sampleSearchResponse)
      } as Response;
    });

    const provider = new PexelsImageProvider({
      apiKey: 'my_raw_pexels_key',
      httpClient: new SafeHttpClient({ fetchFn: mockFetch })
    });

    await provider.search('Köfte');
    expect(capturedHeaders['Authorization']).toBe('my_raw_pexels_key');
  });

  // Test 12: Query URI encoding
  it('Test 12: Türkçe karakterli sorgular doğru URL encode edilir', async () => {
    let requestedUrl = '';
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      requestedUrl = url;
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify(sampleSearchResponse)
      } as Response;
    });

    const provider = new PexelsImageProvider({
      apiKey: 'test_key',
      httpClient: new SafeHttpClient({ fetchFn: mockFetch })
    });

    await provider.search('İzmir Köftesi & Çorba');
    expect(requestedUrl).toContain(encodeURIComponent('İzmir Köftesi & Çorba'));
  });

  // Test 13: Limit clamping
  it('Test 13: Arama limiti güvenli şekilde en fazla 15 ile sınırlandırılır', async () => {
    let requestedUrl = '';
    const mockFetch = vi.fn().mockImplementation(async (url: string) => {
      requestedUrl = url;
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify(sampleSearchResponse)
      } as Response;
    });

    const provider = new PexelsImageProvider({
      apiKey: 'test_key',
      httpClient: new SafeHttpClient({ fetchFn: mockFetch })
    });

    await provider.search('Pilav', { limit: 100 });
    expect(requestedUrl).toContain('per_page=15');
  });

  // Test 14: Preferred size selection
  it('Test 14: preferredSize original veya large2x olarak belirlendiğinde ilgili URL seçilir', async () => {
    const mockFetch = createMockFetch(200, sampleSearchResponse);
    const provider = new PexelsImageProvider({
      apiKey: 'test_key',
      preferredSize: 'original',
      httpClient: new SafeHttpClient({ fetchFn: mockFetch })
    });

    const results = await provider.search('Salata');
    expect(results[0].imageUrl).toBe(samplePhoto.src.original);
  });

  // Test 15: Fallback size resolution
  it('Test 15: İstenen boyut bulunamadığında diğer boyutlara güvenli fallback yapılır', async () => {
    const photoMissingLarge = {
      ...samplePhoto,
      src: {
        medium: 'https://images.pexels.com/photos/123456/medium.jpg'
      }
    };
    const mockFetch = createMockFetch(200, { photos: [photoMissingLarge] });
    const provider = new PexelsImageProvider({
      apiKey: 'test_key',
      preferredSize: 'large',
      httpClient: new SafeHttpClient({ fetchFn: mockFetch })
    });

    const results = await provider.search('Börek');
    expect(results[0].imageUrl).toBe('https://images.pexels.com/photos/123456/medium.jpg');
  });

  // Test 16: Invalid photo filtering
  it('Test 16: ID\'si veya görsel URL\'si eksik olan geçersiz fotoğraflar filtrelenir', async () => {
    const invalidPhotos = [
      { id: null, url: 'invalid' },
      { id: 999, src: {} }, // no URLs
      samplePhoto
    ];
    const mockFetch = createMockFetch(200, { photos: invalidPhotos });
    const provider = new PexelsImageProvider({
      apiKey: 'test_key',
      httpClient: new SafeHttpClient({ fetchFn: mockFetch })
    });

    const results = await provider.search('Tatlı');
    expect(results.length).toBe(1);
    expect(results[0].sourceId).toBe('123456');
  });

  // Test 17: Empty photos array
  it('Test 17: Pexels photos dizisi boş döndüğünde boş dizi döner', async () => {
    const mockFetch = createMockFetch(200, { photos: [] });
    const provider = new PexelsImageProvider({
      apiKey: 'test_key',
      httpClient: new SafeHttpClient({ fetchFn: mockFetch })
    });

    const results = await provider.search('Bilinmeyen Yemek XYZ');
    expect(results).toEqual([]);
  });

  // Test 18: Malformed JSON handling
  it('Test 18: Yanıt bozuk JSON içerdiğinde provider çökmez, boş sonuç döner', async () => {
    const mockFetch = createMockFetch(200, '<html>Bozuk Yanıt</html>');
    const provider = new PexelsImageProvider({
      apiKey: 'test_key',
      httpClient: new SafeHttpClient({ fetchFn: mockFetch })
    });

    const results = await provider.search('Çorba');
    expect(results).toEqual([]);
  });

  // Test 19: 401 Unauthorized - No Retry
  it('Test 19: 401 Unauthorized durumunda yeniden deneme yapılmaz ve boş liste döner', async () => {
    const mockFetch = createMockFetch(401, { error: 'Invalid API key' });
    const provider = new PexelsImageProvider({
      apiKey: 'invalid_key',
      httpClient: new SafeHttpClient({ fetchFn: mockFetch, defaultMaxRetries: 3 })
    });

    const results = await provider.search('Çorba');
    expect(results).toEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(1); // Kesinlikle retry yapılmamalı
  });

  // Test 20: 403 Forbidden - No Retry
  it('Test 20: 403 Forbidden durumunda yeniden deneme yapılmaz ve boş liste döner', async () => {
    const mockFetch = createMockFetch(403, { error: 'Forbidden' });
    const provider = new PexelsImageProvider({
      apiKey: 'blocked_key',
      httpClient: new SafeHttpClient({ fetchFn: mockFetch, defaultMaxRetries: 3 })
    });

    const results = await provider.search('Makarna');
    expect(results).toEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  // Test 21: 429 Rate Limit backoff
  it('Test 21: 429 Too Many Requests durumunda Retry-After başlığı dikkate alınır', async () => {
    let callCount = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        const headerMap = new Map([['retry-after', '0']]);
        return {
          ok: false,
          status: 429,
          headers: {
            forEach: (cb: any) => headerMap.forEach((v, k) => cb(v, k))
          },
          text: async () => 'Rate limit exceeded'
        } as unknown as Response;
      }
      return {
        ok: true,
        status: 200,
        headers: { forEach: () => {} },
        text: async () => JSON.stringify(sampleSearchResponse)
      } as unknown as Response;
    });

    const provider = new PexelsImageProvider({
      apiKey: 'test_key',
      httpClient: new SafeHttpClient({ fetchFn: mockFetch, defaultMaxRetries: 1, defaultRetryDelayMs: 1 })
    });

    const results = await provider.search('Sote');
    expect(results.length).toBe(1);
    expect(callCount).toBe(2);
  });

  // Test 22: 500 Server Error retries up to maxRetries
  it('Test 22: 500 Sunucu hatasında belirtilen maxRetries kadar denenir', async () => {
    const mockFetch = createMockFetch(500, { error: 'Internal Server Error' });
    const client = new SafeHttpClient({ fetchFn: mockFetch, defaultMaxRetries: 2 });

    const res = await client.get('https://api.pexels.com/v1/search?query=test', { retryDelayMs: 1 });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(500);
    expect(mockFetch).toHaveBeenCalledTimes(3); // 1 ilk istek + 2 yeniden deneme
  });

  // Test 23: Timeout handling
  it('Test 23: İstek zaman aşımına uğradığında güvenli şekilde yönetilir', async () => {
    const timeoutFetch = vi.fn().mockImplementation(async () => {
      const err: any = new Error('The operation was aborted');
      err.name = 'AbortError';
      throw err;
    });

    const provider = new PexelsImageProvider({
      apiKey: 'test_key',
      httpClient: new SafeHttpClient({ fetchFn: timeoutFetch, defaultMaxRetries: 0, defaultTimeoutMs: 10 })
    });

    const results = await provider.search('Çorba');
    expect(results).toEqual([]);
  });

  // Test 24: getById success
  it('Test 24: getById geçerli fotoğraf ID ile fotoğrafı başarıyla çeker', async () => {
    const mockFetch = createMockFetch(200, samplePhoto);
    const provider = new PexelsImageProvider({
      apiKey: 'test_key',
      httpClient: new SafeHttpClient({ fetchFn: mockFetch })
    });

    const result = await provider.getById('123456');
    expect(result).not.toBeNull();
    expect(result?.sourceId).toBe('123456');
    expect(result?.attribution).toContain('Ayşe Şef');
  });

  // Test 25: getById 404
  it('Test 25: getById bulunamayan ID için null döner', async () => {
    const mockFetch = createMockFetch(404, { error: 'Not Found' });
    const provider = new PexelsImageProvider({
      apiKey: 'test_key',
      httpClient: new SafeHttpClient({ fetchFn: mockFetch })
    });

    const result = await provider.getById('999999999');
    expect(result).toBeNull();
  });

  // Test 26: getById empty ID
  it('Test 26: getById boş ID gönderildiğinde istek yapmadan null döner', async () => {
    const mockFetch = createMockFetch(200, samplePhoto);
    const provider = new PexelsImageProvider({
      apiKey: 'test_key',
      httpClient: new SafeHttpClient({ fetchFn: mockFetch })
    });

    const result = await provider.getById('');
    expect(result).toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // Test 27: Attribution photographer format
  it('Test 27: Fotoğrafçı adı mevcut olduğunda "<İsim> (Pexels)" formatı kullanılır', async () => {
    const mockFetch = createMockFetch(200, sampleSearchResponse);
    const provider = new PexelsImageProvider({
      apiKey: 'test_key',
      httpClient: new SafeHttpClient({ fetchFn: mockFetch })
    });

    const results = await provider.search('Çorba');
    expect(results[0].attribution).toBe('Ayşe Şef (Pexels)');
  });

  // Test 28: Attribution fallback
  it('Test 28: Fotoğrafçı bilgisi olmadığında atıf doğrudan "Pexels" olur', async () => {
    const photoNoPhotographer = { ...samplePhoto, photographer: '' };
    const mockFetch = createMockFetch(200, { photos: [photoNoPhotographer] });
    const provider = new PexelsImageProvider({
      apiKey: 'test_key',
      httpClient: new SafeHttpClient({ fetchFn: mockFetch })
    });

    const results = await provider.search('Pilav');
    expect(results[0].attribution).toBe('Pexels');
  });

  // Test 29: License format
  it('Test 29: Lisans Pexels Commercial & Personal Free License olarak belirlenir', async () => {
    const mockFetch = createMockFetch(200, sampleSearchResponse);
    const provider = new PexelsImageProvider({
      apiKey: 'test_key',
      httpClient: new SafeHttpClient({ fetchFn: mockFetch })
    });

    const results = await provider.search('Sarma');
    expect(results[0].license).toBe('Pexels License (Free Commercial & Personal Use)');
  });

  // Test 30: Permission policy strictly allowed
  it('Test 30: Pexels görselleri için permissionPolicy daima "allowed" dir', async () => {
    const mockFetch = createMockFetch(200, sampleSearchResponse);
    const provider = new PexelsImageProvider({
      apiKey: 'test_key',
      httpClient: new SafeHttpClient({ fetchFn: mockFetch })
    });

    const results = await provider.search('Güveç');
    expect(results[0].permissionPolicy).toBe('allowed');
  });

  // Test 31: Provider Registry Integration
  it('Test 31: PexelsImageProvider ImageProviderRegistry\'ye başarıyla kaydedilebilir', () => {
    const registry = new ImageProviderRegistry();
    const pexels = new PexelsImageProvider({ apiKey: 'test_key' });
    registry.registerProvider(pexels);

    expect(registry.listProviders().length).toBe(1);
    expect(registry.getProvider('pexels')).toBeDefined();
    expect(registry.getProvider('pexels')?.type).toBe('pexels');
  });

  // Test 32: Candidate Ranking Integration
  it('Test 32: Pexels adayı candidateRanking motoru tarafından yüksek skorla puanlanır', () => {
    const candidate: ImageCandidate = {
      recipeId: '1',
      recipeTitle: 'Ezogelin Çorbası',
      source: 'pexels',
      sourceId: '123456',
      imageUrl: 'https://images.pexels.com/photos/123456/pexels-photo-123456.jpeg',
      metadata: {
        permissionPolicy: 'allowed',
        sourceType: 'pexels',
        sourceName: 'Pexels',
        attribution: 'Ayşe Şef (Pexels)',
        license: 'Pexels License',
        width: 1920,
        height: 1080
      }
    };

    const score = calculateCandidateScore(candidate);
    expect(score).toBeGreaterThan(800); // 800 (Tier 2) + 50 (width/height) + 20 (attr) + 20 (license) = 890
  });

  // Test 33: Multi-Provider Acquisition Engine Integration
  it('Test 33: acquireImageForRecipe Pexels sağlayıcısından gelen adayı başarıyla değerlendirir', async () => {
    const mockFetch = createMockFetch(200, sampleSearchResponse);
    const pexels = new PexelsImageProvider({
      apiKey: 'test_key',
      httpClient: new SafeHttpClient({ fetchFn: mockFetch })
    });

    const registry = new ImageProviderRegistry();
    registry.registerProvider(pexels);

    const recipe = { id: 'test_101', title: 'Ezogelin Çorbası' };
    const decision = await acquireImageForRecipe(recipe, { registry });

    expect(decision.recipeId).toBe('test_101');
    expect(decision.decision).toBe('usable');
    expect(decision.bestCandidate).not.toBeNull();
    expect(decision.usedProvider).toBe('pexels');
    expect(decision.bestCandidate?.imageUrl).toBe(samplePhoto.src.large);
  });

  // Test 34: Rate limit metadata specification
  it('Test 34: Pexels metadata saatlik/aylık kota limitlerini içerir', () => {
    const provider = new PexelsImageProvider({ apiKey: 'test_key' });
    expect(provider.metadata.rateLimit?.requestsPerMinute).toBe(200);
    expect(provider.metadata.rateLimit?.requestsPerMonth).toBe(20000);
  });

  // Test 35: Production dataset immutability verification
  it('Test 35: Testler ve Pexels entegrasyonu üretim veri setini (raw_recipes.json) asla değiştirmez', () => {
    const rawPath = path.join(__dirname, '../data/raw_recipes.json');
    const content = fs.readFileSync(rawPath, 'utf8');
    const parsed = JSON.parse(content);

    expect(parsed.recipes).toBeDefined();
    expect(parsed.recipes.length).toBe(50);
    expect(parsed.recipes[0].id).toBe(1);
    expect(parsed.recipes[0].name).toBe('Tavuk Sote');
  });
});
