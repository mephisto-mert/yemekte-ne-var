import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  ImageDownloadManager,
  validateSafeDownloadUrl,
  isPrivateOrLocalIpV4,
  isPrivateOrLocalIpV6,
  validateImageBinary,
  detectMagicBytes,
  calculateBufferChecksum,
  verifyBufferChecksum,
  writeBufferAtomic,
  createEmptyManifest,
  saveManifest,
  loadManifest,
  DownloadPlan,
  ImageCandidate
} from '../pipeline/image';

describe('Recipe Image Acquisition & Safe Download Pipeline Tests', () => {
  const sandboxDir = path.join(__dirname, 'sandbox_test_images');

  // Binary Fixtures Generators
  function createValidPngBuffer(width = 800, height = 600): Buffer {
    const buf = Buffer.alloc(33);
    // PNG Signature
    buf.writeUInt8(0x89, 0);
    buf.write('PNG', 1);
    buf.writeUInt8(0x0D, 4);
    buf.writeUInt8(0x0A, 5);
    buf.writeUInt8(0x1A, 6);
    buf.writeUInt8(0x0A, 7);
    // IHDR Chunk
    buf.writeUInt32BE(13, 8); // length
    buf.write('IHDR', 12);
    buf.writeUInt32BE(width, 16);
    buf.writeUInt32BE(height, 20);
    buf.writeUInt8(8, 24); // 8-bit
    buf.writeUInt8(2, 25); // RGB
    return buf;
  }

  function createValidJpegBuffer(width = 800, height = 600): Buffer {
    const buf = Buffer.alloc(24);
    buf.writeUInt8(0xFF, 0);
    buf.writeUInt8(0xD8, 1); // SOI
    buf.writeUInt8(0xFF, 2);
    buf.writeUInt8(0xC0, 3); // SOF0
    buf.writeUInt16BE(17, 4); // Length
    buf.writeUInt8(8, 6); // precision
    buf.writeUInt16BE(height, 7); // height
    buf.writeUInt16BE(width, 9); // width
    buf.writeUInt8(3, 11); // components
    buf.writeUInt8(0xFF, 22);
    buf.writeUInt8(0xD9, 23); // EOI
    return buf;
  }

  function createValidWebpBuffer(width = 800, height = 600): Buffer {
    const buf = Buffer.alloc(30);
    buf.write('RIFF', 0);
    buf.writeUInt32LE(22, 4);
    buf.write('WEBP', 8);
    buf.write('VP8 ', 12);
    buf.writeUInt32LE(14, 16);
    buf.writeUInt8(0x00, 20);
    buf.writeUInt8(0x00, 21);
    buf.writeUInt8(0x00, 22);
    buf.writeUInt8(0x9D, 23);
    buf.writeUInt8(0x01, 24);
    buf.writeUInt8(0x2A, 25);
    buf.writeUInt16LE(width & 0x3FFF, 26);
    buf.writeUInt16LE(height & 0x3FFF, 28);
    return buf;
  }

  beforeEach(() => {
    if (fs.existsSync(sandboxDir)) {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    }
    fs.mkdirSync(sandboxDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(sandboxDir)) {
      fs.rmSync(sandboxDir, { recursive: true, force: true });
    }
  });

  // Test 1: Download Plan Creation
  it('Test 1: DownloadManager onaylı aday için geçerli indirme planı oluşturur', () => {
    const dm = new ImageDownloadManager();
    const candidate: ImageCandidate = {
      recipeId: '101',
      recipeTitle: 'Ezogelin Çorbası',
      imageUrl: 'https://images.pexels.com/photos/101/food.jpg',
      source: 'pexels',
      sourceId: '101',
      metadata: { permissionPolicy: 'allowed', mimeType: 'image/webp', license: 'Pexels License' }
    };

    const plan = dm.buildDownloadPlan(candidate, 'public/images/recipes');
    expect(plan.readyForDownload).toBe(true);
    expect(plan.recipeId).toBe('101');
    expect(plan.destinationPath).toBe('public/images/recipes/101.webp');
    expect(plan.permissionPolicy).toBe('allowed');
  });

  // Test 2: Deterministic Asset Path
  it('Test 2: Hedef dosya yolu deterministik olarak recipeId üzerinden oluşturulur', () => {
    const dm = new ImageDownloadManager();
    const candidate: ImageCandidate = {
      recipeId: 'recipe_42',
      recipeTitle: 'Karnıyarık',
      imageUrl: 'https://images.pexels.com/photos/42/food.jpg',
      source: 'pexels',
      metadata: { permissionPolicy: 'allowed' }
    };

    const plan = dm.buildDownloadPlan(candidate, 'public/images/recipes');
    expect(plan.destinationPath).toBe('public/images/recipes/recipe_42.jpg');
  });

  // Test 3: Path Traversal Prevention
  it('Test 3: Path traversal karakterleri (../ veya ..\\) dosya yolundan temizlenir', () => {
    const dm = new ImageDownloadManager();
    const maliciousCandidate: ImageCandidate = {
      recipeId: '../../etc/passwd',
      recipeTitle: 'Hacked Recipe',
      imageUrl: 'https://images.pexels.com/photos/99/food.jpg',
      source: 'pexels',
      metadata: { permissionPolicy: 'allowed' }
    };

    const plan = dm.buildDownloadPlan(maliciousCandidate, 'public/images/recipes');
    expect(plan.destinationPath).not.toContain('..');
    expect(plan.destinationPath).toBe('public/images/recipes/______etc_passwd.jpg');
  });

  // Test 4: Valid HTTPS URL
  it('Test 4: Standart HTTPS URL başarıyla doğrulanır', () => {
    const res = validateSafeDownloadUrl('https://images.pexels.com/photos/123/food.jpg');
    expect(res.isSafe).toBe(true);
    expect(res.protocol).toBe('https:');
  });

  // Test 5: Invalid or Empty URL
  it('Test 5: Boş veya geçersiz sözdizimine sahip URL reddedilir', () => {
    expect(validateSafeDownloadUrl('').isSafe).toBe(false);
    expect(validateSafeDownloadUrl('not-a-valid-url').isSafe).toBe(false);
  });

  // Test 6: Localhost Rejection (SSRF)
  it('Test 6: Localhost ve *.localhost alan adları SSRF korumasıyla engellenir', () => {
    expect(validateSafeDownloadUrl('https://localhost/image.jpg').isSafe).toBe(false);
    expect(validateSafeDownloadUrl('https://app.localhost/image.jpg').isSafe).toBe(false);
    expect(validateSafeDownloadUrl('https://loopback/image.jpg').isSafe).toBe(false);
  });

  // Test 7: Private IPv4 Rejection (SSRF)
  it('Test 7: RFC 1918 özel IP blokları (10.x, 172.16.x, 192.168.x) engellenir', () => {
    expect(validateSafeDownloadUrl('https://10.0.0.1/image.jpg').isSafe).toBe(false);
    expect(validateSafeDownloadUrl('https://172.16.0.5/image.jpg').isSafe).toBe(false);
    expect(validateSafeDownloadUrl('https://192.168.1.1/image.jpg').isSafe).toBe(false);
  });

  // Test 8: Loopback Rejection (SSRF)
  it('Test 8: 127.0.0.1 ve 0.0.0.0 adresleri engellenir', () => {
    expect(validateSafeDownloadUrl('https://127.0.0.1/secret.jpg').isSafe).toBe(false);
    expect(validateSafeDownloadUrl('https://0.0.0.0/secret.jpg').isSafe).toBe(false);
  });

  // Test 9: Cloud Metadata Rejection (169.254.169.254)
  it('Test 9: AWS/GCP meta veri IP adresi (169.254.169.254) engellenir', () => {
    expect(validateSafeDownloadUrl('https://169.254.169.254/latest/meta-data').isSafe).toBe(false);
  });

  // Test 10: Safe Redirect Handling
  it('Test 10: Güvenli HTTPS yönlendirmeleri (301/302) başarıyla takip edilir', async () => {
    const pngBuffer = createValidPngBuffer();
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        status: 302,
        ok: false,
        headers: new Map([['location', 'https://cdn.pexels.com/target.png']])
      })
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        headers: new Map([['content-type', 'image/png']]),
        arrayBuffer: async () => pngBuffer.buffer
      });

    const dm = new ImageDownloadManager();
    const plan: DownloadPlan = {
      recipeId: '1',
      sourceUrl: 'https://api.pexels.com/redirect-me',
      destinationPath: path.join(sandboxDir, 'redirect_test.png'),
      permissionPolicy: 'allowed',
      readyForDownload: true
    };

    const result = await dm.downloadImage(plan, { fetchFn: mockFetch as any });
    expect(result.success).toBe(true);
    expect(result.status).toBe('stored');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  // Test 11: Redirect to Private IP Blocked
  it('Test 11: Yönlendirilen hedef özel IP veya localhost ise işlem durdurulur', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      status: 302,
      ok: false,
      headers: new Map([['location', 'https://192.168.1.1/internal.jpg']])
    });

    const dm = new ImageDownloadManager();
    const plan: DownloadPlan = {
      recipeId: '1',
      sourceUrl: 'https://example.com/safe.jpg',
      destinationPath: path.join(sandboxDir, 'ssrf_redirect.jpg'),
      permissionPolicy: 'allowed',
      readyForDownload: true
    };

    const result = await dm.downloadImage(plan, { fetchFn: mockFetch as any });
    expect(result.success).toBe(false);
    expect(result.error).toContain('SSRF Koruması');
  });

  // Test 12: Max Redirects Limit
  it('Test 12: Belirtilen maksimum yönlendirme sayısı aşıldığında işlem kesilir', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 302,
      ok: false,
      headers: new Map([['location', 'https://example.com/loop']])
    });

    const dm = new ImageDownloadManager();
    const plan: DownloadPlan = {
      recipeId: '1',
      sourceUrl: 'https://example.com/start',
      destinationPath: path.join(sandboxDir, 'loop.jpg'),
      permissionPolicy: 'allowed',
      readyForDownload: true
    };

    const result = await dm.downloadImage(plan, { fetchFn: mockFetch as any, maxRedirects: 2 });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Maksimum yönlendirme sınırı aşıldı');
  });

  // Test 13: Content-Type Validation (JPEG/PNG/WEBP)
  it('Test 13: Onaylı görsel mime-tipleri başarıyla kabul edilir', () => {
    const png = createValidPngBuffer();
    const res = validateImageBinary(png, { expectedMimeType: 'image/png' });
    expect(res.isValid).toBe(true);
    expect(res.format).toBe('png');
  });

  // Test 14: Invalid Content-Type Rejection
  it('Test 14: text/html veya geçersiz content-type doğrudan reddedilir', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: new Map([['content-type', 'text/html; charset=utf-8']]),
      arrayBuffer: async () => Buffer.from('<html>Error</html>').buffer
    });

    const dm = new ImageDownloadManager();
    const plan: DownloadPlan = {
      recipeId: '1',
      sourceUrl: 'https://example.com/fake.jpg',
      destinationPath: path.join(sandboxDir, 'fake.jpg'),
      permissionPolicy: 'allowed',
      readyForDownload: true
    };

    const result = await dm.downloadImage(plan, { fetchFn: mockFetch as any });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Geçersiz Content-Type');
  });

  // Test 15: JPEG Magic Bytes
  it('Test 15: JPEG dosya imzası (FF D8 FF) doğru tespit edilir', () => {
    const jpeg = createValidJpegBuffer();
    const detected = detectMagicBytes(jpeg);
    expect(detected.format).toBe('jpeg');
    expect(detected.mimeType).toBe('image/jpeg');
  });

  // Test 16: PNG Magic Bytes
  it('Test 16: PNG dosya imzası (89 50 4E 47 ...) doğru tespit edilir', () => {
    const png = createValidPngBuffer();
    const detected = detectMagicBytes(png);
    expect(detected.format).toBe('png');
    expect(detected.mimeType).toBe('image/png');
  });

  // Test 17: WEBP Magic Bytes
  it('Test 17: WEBP dosya imzası (RIFF ... WEBP) doğru tespit edilir', () => {
    const webp = createValidWebpBuffer();
    const detected = detectMagicBytes(webp);
    expect(detected.format).toBe('webp');
    expect(detected.mimeType).toBe('image/webp');
  });

  // Test 18: Mismatched MIME and Signature
  it('Test 18: Content-Type JPEG beyan edilip dosya PNG olduğunda reddedilir', () => {
    const png = createValidPngBuffer();
    const res = validateImageBinary(png, { expectedMimeType: 'image/jpeg' });
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('uyuşmuyor');
  });

  // Test 19: HTML disguised as image
  it('Test 19: Görsel uzantısıyla servis edilen HTML içeriği binary aşamasında reddedilir', () => {
    const htmlBuf = Buffer.from('<!DOCTYPE html><html><body>Access Denied</body></html>');
    const res = validateImageBinary(htmlBuf);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('HTML');
  });

  // Test 20: Empty Response
  it('Test 20: 0 byte boş tamponlar reddedilir', () => {
    const res = validateImageBinary(Buffer.alloc(0));
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('boş');
  });

  // Test 21: Max Byte Limit
  it('Test 21: Belirlenen maksimum boyutu aşan yanıtlar reddedilir', () => {
    const oversized = Buffer.alloc(11 * 1024 * 1024); // 11MB
    const res = validateImageBinary(oversized, { maxByteSize: 10 * 1024 * 1024 });
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('maksimum sınırı aştı');
  });

  // Test 22: Minimum Dimensions
  it('Test 22: Minimum çözünürlüğün (200x200) altındaki görseller reddedilir', () => {
    const smallJpeg = createValidJpegBuffer(150, 100);
    const res = validateImageBinary(smallJpeg, { minWidth: 200, minHeight: 200 });
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('minimum kalitenin altında');
  });

  // Test 23: 1x1 Tracking Pixel Rejection
  it('Test 23: 1x1 piksel boyutundaki takip pikselleri reddedilir', () => {
    const pixel = createValidPngBuffer(1, 1);
    const res = validateImageBinary(pixel, { minWidth: 200, minHeight: 200 });
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('minimum kalitenin altında');
  });

  // Test 24: Corrupt Image Header
  it('Test 24: Bozuk veya eksik binary başlıkları reddedilir', () => {
    // Valid JPEG magic bytes but missing SOF dimension headers
    const corrupt = Buffer.from([
      0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00
    ]);
    const res = validateImageBinary(corrupt);
    expect(res.isValid).toBe(false);
    expect(res.error).toContain('okunamadı');
  });

  // Test 25: Successful Download & Storage
  it('Test 25: Tam akış (indirme -> doğrulama -> checksum -> atomik kayıt) başarıyla tamamlanır', async () => {
    const webpBuffer = createValidWebpBuffer(1280, 720);
    const mockFetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: new Map([
        ['content-type', 'image/webp'],
        ['content-length', String(webpBuffer.length)]
      ]),
      arrayBuffer: async () => webpBuffer.buffer
    });

    const dm = new ImageDownloadManager();
    const destPath = path.join(sandboxDir, 'recipe_55.webp');
    const plan: DownloadPlan = {
      recipeId: '55',
      sourceUrl: 'https://images.pexels.com/photos/55/photo.webp',
      destinationPath: destPath,
      permissionPolicy: 'allowed',
      readyForDownload: true,
      source: 'pexels',
      sourceId: '55',
      license: 'Pexels License',
      attribution: 'Şef Ahmet (Pexels)'
    };

    const result = await dm.downloadImage(plan, { fetchFn: mockFetch as any });
    expect(result.success).toBe(true);
    expect(result.status).toBe('stored');
    expect(fs.existsSync(destPath)).toBe(true);
    expect(result.asset).toBeDefined();
    expect(result.asset?.width).toBe(1280);
    expect(result.asset?.height).toBe(720);
    expect(result.asset?.checksum).toBe(calculateBufferChecksum(webpBuffer));
  });

  // Test 26: Timeout Handling
  it('Test 26: İndirme zaman aşımına uğradığında güvenli şekilde yönetilir', async () => {
    const timeoutFetch = vi.fn().mockImplementation(() => {
      const err: any = new Error('The operation was aborted');
      err.name = 'AbortError';
      return Promise.reject(err);
    });

    const dm = new ImageDownloadManager();
    const plan: DownloadPlan = {
      recipeId: '1',
      sourceUrl: 'https://images.pexels.com/timeout.jpg',
      destinationPath: path.join(sandboxDir, 'timeout.jpg'),
      permissionPolicy: 'allowed',
      readyForDownload: true
    };

    const result = await dm.downloadImage(plan, { fetchFn: timeoutFetch as any, maxRetries: 0, timeoutMs: 10 });
    expect(result.success).toBe(false);
    expect(result.error).toContain('zaman aşımına');
  });

  // Test 27: 404 Not Found (No Retry)
  it('Test 27: 404 Not Found durumunda yeniden deneme yapılmaz', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 404,
      ok: false,
      headers: new Map()
    });

    const dm = new ImageDownloadManager();
    const plan: DownloadPlan = {
      recipeId: '1',
      sourceUrl: 'https://images.pexels.com/notfound.jpg',
      destinationPath: path.join(sandboxDir, 'notfound.jpg'),
      permissionPolicy: 'allowed',
      readyForDownload: true
    };

    const result = await dm.downloadImage(plan, { fetchFn: mockFetch as any, maxRetries: 2 });
    expect(result.success).toBe(false);
    expect(result.error).toContain('404');
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  // Test 28: 403 Forbidden (No Retry)
  it('Test 28: 403 Forbidden durumunda yeniden deneme yapılmaz', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 403,
      ok: false,
      headers: new Map()
    });

    const dm = new ImageDownloadManager();
    const plan: DownloadPlan = {
      recipeId: '1',
      sourceUrl: 'https://images.pexels.com/forbidden.jpg',
      destinationPath: path.join(sandboxDir, 'forbidden.jpg'),
      permissionPolicy: 'allowed',
      readyForDownload: true
    };

    const result = await dm.downloadImage(plan, { fetchFn: mockFetch as any, maxRetries: 2 });
    expect(result.success).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  // Test 29: 401 Unauthorized (No Retry)
  it('Test 29: 401 Unauthorized durumunda yeniden deneme yapılmaz', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 401,
      ok: false,
      headers: new Map()
    });

    const dm = new ImageDownloadManager();
    const plan: DownloadPlan = {
      recipeId: '1',
      sourceUrl: 'https://images.pexels.com/auth.jpg',
      destinationPath: path.join(sandboxDir, 'auth.jpg'),
      permissionPolicy: 'allowed',
      readyForDownload: true
    };

    const result = await dm.downloadImage(plan, { fetchFn: mockFetch as any, maxRetries: 2 });
    expect(result.success).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  // Test 30: 429 Rate Limit
  it('Test 30: 429 Rate Limit durumunda Retry-After başlığına uygun beklenir', async () => {
    const jpeg = createValidJpegBuffer();
    let calls = 0;
    const mockFetch = vi.fn().mockImplementation(async () => {
      calls++;
      if (calls === 1) {
        return {
          status: 429,
          ok: false,
          headers: new Map([['retry-after', '0']])
        };
      }
      return {
        status: 200,
        ok: true,
        headers: new Map([['content-type', 'image/jpeg']]),
        arrayBuffer: async () => jpeg.buffer
      };
    });

    const dm = new ImageDownloadManager();
    const plan: DownloadPlan = {
      recipeId: '1',
      sourceUrl: 'https://images.pexels.com/rate.jpg',
      destinationPath: path.join(sandboxDir, 'rate.jpg'),
      permissionPolicy: 'allowed',
      readyForDownload: true
    };

    const result = await dm.downloadImage(plan, { fetchFn: mockFetch as any, maxRetries: 1 });
    expect(result.success).toBe(true);
    expect(calls).toBe(2);
  });

  // Test 31: 5xx Server Error Retry
  it('Test 31: 5xx Sunucu hatasında belirtilen maxRetries kadar denenir', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      status: 500,
      ok: false,
      headers: new Map()
    });

    const dm = new ImageDownloadManager();
    const plan: DownloadPlan = {
      recipeId: '1',
      sourceUrl: 'https://images.pexels.com/error.jpg',
      destinationPath: path.join(sandboxDir, 'error.jpg'),
      permissionPolicy: 'allowed',
      readyForDownload: true
    };

    const result = await dm.downloadImage(plan, { fetchFn: mockFetch as any, maxRetries: 2, retryDelayMs: 1 });
    expect(result.success).toBe(false);
    expect(mockFetch).toHaveBeenCalledTimes(3); // 1 + 2 retries
  });

  // Test 32: SHA-256 Checksum Generation
  it('Test 32: SHA-256 sağlama toplamı deterministik ve doğru üretilir', () => {
    const buf = Buffer.from('cookly_test_image_data_123');
    const hash = calculateBufferChecksum(buf);
    expect(hash).toHaveLength(64);
    expect(verifyBufferChecksum(buf, hash)).toBe(true);
  });

  // Test 33: Duplicate Checksum Detection
  it('Test 33: Aynı içeriğe sahip iki dosyanın checksum değeri eşleşir', () => {
    const buf1 = createValidPngBuffer(500, 500);
    const buf2 = createValidPngBuffer(500, 500);
    expect(calculateBufferChecksum(buf1)).toBe(calculateBufferChecksum(buf2));
  });

  // Test 34: Metadata Preservation
  it('Test 34: Varlık metaverisinde tüm teknik ve operasyonel bilgiler korunur', async () => {
    const jpeg = createValidJpegBuffer(800, 600);
    const mockFetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: new Map([['content-type', 'image/jpeg']]),
      arrayBuffer: async () => jpeg.buffer
    });

    const dm = new ImageDownloadManager();
    const plan: DownloadPlan = {
      recipeId: '77',
      sourceUrl: 'https://images.pexels.com/77.jpg',
      destinationPath: path.join(sandboxDir, '77.jpg'),
      permissionPolicy: 'allowed',
      readyForDownload: true,
      source: 'pexels',
      sourceId: 'px_77',
      license: 'Pexels Commercial License',
      attribution: 'Fatma Şef (Pexels)'
    };

    const res = await dm.downloadImage(plan, { fetchFn: mockFetch as any });
    expect(res.asset?.license).toBe('Pexels Commercial License');
    expect(res.asset?.attribution).toBe('Fatma Şef (Pexels)');
    expect(res.asset?.sourceId).toBe('px_77');
    expect(res.asset?.mimeType).toBe('image/jpeg');
  });

  // Test 35: Atomic Write Staging & Rename
  it('Test 35: Atomik yazma sırasında geçici dosya kullanılıp nihai yola taşınır', async () => {
    const testFile = path.join(sandboxDir, 'atomic.bin');
    const testData = Buffer.from('atomic_data');

    await writeBufferAtomic(testFile, testData);
    expect(fs.existsSync(testFile)).toBe(true);
    expect(fs.readFileSync(testFile, 'utf8')).toBe('atomic_data');
  });

  // Test 36: Partial File Cleanup on Failure
  it('Test 36: İndirme veya doğrulama başarısız olduğunda geçici dosyalar temizlenir', async () => {
    const corruptBuf = Buffer.from('corrupt_header_data');
    const mockFetch = vi.fn().mockResolvedValueOnce({
      status: 200,
      ok: true,
      headers: new Map([['content-type', 'image/jpeg']]),
      arrayBuffer: async () => corruptBuf.buffer
    });

    const dm = new ImageDownloadManager();
    const destPath = path.join(sandboxDir, 'corrupt.jpg');
    const plan: DownloadPlan = {
      recipeId: '99',
      sourceUrl: 'https://example.com/corrupt.jpg',
      destinationPath: destPath,
      permissionPolicy: 'allowed',
      readyForDownload: true
    };

    const res = await dm.downloadImage(plan, { fetchFn: mockFetch as any });
    expect(res.success).toBe(false);
    expect(fs.existsSync(destPath)).toBe(false);

    // Ensure no staging .tmp file remained in sandboxDir
    const files = fs.readdirSync(sandboxDir);
    expect(files.filter(f => f.includes('.tmp'))).toHaveLength(0);
  });

  // Test 37: Prohibited Candidate Cannot Download
  it('Test 37: Prohibited politikasına sahip adayların indirilmesi engellenir', () => {
    const dm = new ImageDownloadManager();
    const candidate: ImageCandidate = {
      recipeId: '1',
      recipeTitle: 'Telifli Yemek',
      imageUrl: 'https://prohibited-site.example.com/food.jpg',
      source: 'illegal_scraper',
      metadata: { permissionPolicy: 'prohibited' }
    };

    const plan = dm.buildDownloadPlan(candidate);
    expect(plan.readyForDownload).toBe(false);
    expect(plan.blockReason).toContain('yasaktır');
  });

  // Test 38: Unknown Candidate Cannot Download
  it('Test 38: İzin durumu bilinmeyen (unknown) adayların indirilmesi engellenir', () => {
    const dm = new ImageDownloadManager();
    const candidate: ImageCandidate = {
      recipeId: '2',
      recipeTitle: 'Bilinmeyen Kaynak',
      imageUrl: 'https://unknown.example.com/food.jpg',
      source: 'unknown',
      metadata: { permissionPolicy: 'unknown' }
    };

    const plan = dm.buildDownloadPlan(candidate);
    expect(plan.readyForDownload).toBe(false);
    expect(plan.blockReason).toContain('onaylanmadan');
  });

  // Test 39: Review Required Candidate Cannot Download
  it('Test 39: İnceleme gerektiren (review_required) adaylar onaylanmadan indirilemez', () => {
    const dm = new ImageDownloadManager();
    const candidate: ImageCandidate = {
      recipeId: '3',
      recipeTitle: 'İnceleme Bekleyen',
      imageUrl: 'https://review.example.com/food.jpg',
      source: 'pending',
      metadata: { permissionPolicy: 'review_required' }
    };

    const plan = dm.buildDownloadPlan(candidate);
    expect(plan.readyForDownload).toBe(false);
  });

  // Test 40: Non-Standard Port Rejection
  it('Test 40: 80 ve 443 dışındaki portlar güvenlik nedeniyle reddedilir', () => {
    expect(validateSafeDownloadUrl('https://example.com:8080/image.jpg').isSafe).toBe(false);
    expect(validateSafeDownloadUrl('https://example.com:22/image.jpg').isSafe).toBe(false);
  });

  // Test 41: Credentials in URL Rejection
  it('Test 41: URL içinde kullanıcı adı/şifre barındıran adresler reddedilir', () => {
    expect(validateSafeDownloadUrl('https://admin:password@example.com/image.jpg').isSafe).toBe(false);
  });

  // Test 42: Dangerous Pseudo-Protocols Rejection
  it('Test 42: file:, javascript:, data:, blob: protokolleri kesinlikle reddedilir', () => {
    expect(validateSafeDownloadUrl('file:///etc/passwd').isSafe).toBe(false);
    expect(validateSafeDownloadUrl('javascript:alert(1)').isSafe).toBe(false);
    expect(validateSafeDownloadUrl('data:image/png;base64,iVBORw==').isSafe).toBe(false);
  });

  // Test 43: Manifest Generation & Persistence
  it('Test 43: Varlık manifestosu oluşturulabilir, diske kaydedilebilir ve okunabilir', async () => {
    const manifestPath = path.join(sandboxDir, 'test-manifest.json');
    const manifest = createEmptyManifest();
    manifest.assets['recipe_1'] = {
      recipeId: '1',
      assetPath: 'public/images/recipes/1.webp',
      source: 'pexels',
      sourceId: 'px_1',
      sourceUrl: 'https://pexels.com/1',
      originalUrl: 'https://pexels.com/1',
      license: 'Pexels License',
      attribution: 'Pexels',
      checksum: 'fakehash123',
      mimeType: 'image/webp',
      format: 'webp',
      width: 800,
      height: 600,
      byteSize: 15000,
      downloadedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      status: 'stored'
    };

    await saveManifest(manifestPath, manifest);
    expect(fs.existsSync(manifestPath)).toBe(true);

    const loaded = await loadManifest(manifestPath);
    expect(loaded.totalAssets).toBe(1);
    expect(loaded.assets['recipe_1'].recipeId).toBe('1');
  });

  // Test 44: Production Dataset Immutability
  it('Test 44: İndirme boru hattı üretim veri setini (raw_recipes.json) asla değiştirmez', () => {
    const rawPath = path.join(__dirname, '../data/raw_recipes.json');
    const content = fs.readFileSync(rawPath, 'utf8');
    const parsed = JSON.parse(content);

    expect(parsed.recipes).toBeDefined();
    expect(parsed.recipes.length).toBeGreaterThanOrEqual(50);
    expect(parsed.recipes[0].id).toBe(1);
    expect(parsed.recipes[0].name).toBe('Tavuk Sote');
  });
});
