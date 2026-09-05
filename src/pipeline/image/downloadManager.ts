import path from 'path';
import { ImageCandidate } from './types';
import { validateImageUrl } from './validator';
import { isPlaceholderImage } from './placeholder';
import { validateSafeDownloadUrl, SafeUrlOptions } from './urlSecurity';
import { validateImageBinary, BinaryValidationOptions, BinaryValidationResult } from './binaryValidator';
import { calculateBufferChecksum } from './checksum';
import { writeBufferAtomic } from './atomicWriter';
import { RecipeImageAsset, DownloadStatus } from './assetMetadata';

export interface DownloadPlan {
  recipeId: string;
  sourceUrl: string;
  destinationPath: string;
  expectedMimeType?: string;
  permissionPolicy: string;
  readyForDownload: boolean;
  blockReason?: string;
  source?: string;
  sourceId?: string;
  license?: string;
  attribution?: string;
  altText?: string;
}

export interface DownloadEstimate {
  estimatedSizeBytes: number;
  supportedMimeType: boolean;
  requiresNetwork: true;
}

export interface DownloadExecutionOptions {
  fetchFn?: typeof fetch;
  maxSizeBytes?: number;
  timeoutMs?: number;
  minWidth?: number;
  minHeight?: number;
  maxDimension?: number;
  allowHttp?: boolean;
  maxRedirects?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  tempDir?: string;
}

export interface DownloadResult {
  success: boolean;
  status: DownloadStatus;
  plan: DownloadPlan;
  asset?: RecipeImageAsset;
  error?: string;
  byteSize?: number;
  checksum?: string;
  durationMs?: number;
}

/**
 * Production-Grade Image Download Manager.
 * Coordinates:
 * Candidate Validation -> Plan Construction -> Safe HTTP Fetch ->
 * Magic Byte / Signature Validation -> Dimension Inspection ->
 * SHA-256 Checksum -> Atomic Storage -> Structured Metadata.
 */
export class ImageDownloadManager {
  /**
   * Validates whether an image candidate is technically and legally eligible for download.
   */
  validateDownloadCandidate(candidate: ImageCandidate): { canDownload: boolean; reason?: string } {
    if (!candidate.imageUrl || candidate.imageUrl.trim() === '') {
      return { canDownload: false, reason: 'Görsel URL adresi boş.' };
    }

    if (isPlaceholderImage(candidate.imageUrl)) {
      return { canDownload: false, reason: 'Placeholder görseller indirilmeye uygun değildir.' };
    }

    const urlCheck = validateImageUrl(candidate.imageUrl);
    if (!urlCheck.isValid) {
      return { canDownload: false, reason: urlCheck.error || 'Geçersiz görsel URL formatı.' };
    }

    // SSRF & Protocol Safety Check
    const safeUrlCheck = validateSafeDownloadUrl(candidate.imageUrl, { allowHttp: false });
    if (!safeUrlCheck.isSafe) {
      return { canDownload: false, reason: safeUrlCheck.error || 'Güvensiz URL veya SSRF riski.' };
    }

    const policy = candidate.metadata?.permissionPolicy || 'unknown';
    if (policy === 'prohibited') {
      return { canDownload: false, reason: 'Telif/kullanım şartları gereği bu kaynaktan indirme yasaktır (PROHIBITED).' };
    }

    if (policy !== 'allowed') {
      return { canDownload: false, reason: `Kaynak politikası (${policy.toUpperCase()}) onaylanmadan indirilemez.` };
    }

    return { canDownload: true };
  }

  /**
   * Builds a safe staging download plan with traversal protection and deterministic paths.
   */
  buildDownloadPlan(candidate: ImageCandidate, destinationDir = 'public/images/recipes'): DownloadPlan {
    const validation = this.validateDownloadCandidate(candidate);

    // Path traversal prevention: strip any path navigation characters
    const sanitizedId = String(candidate.recipeId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const extension = candidate.metadata?.mimeType === 'image/webp' ? 'webp' : 'jpg';

    // Normalize destination directory to prevent ../ escapes
    const safeDestDir = destinationDir.replace(/\\/g, '/').replace(/\.\.+/g, '');
    const destinationPath = `${safeDestDir}/${sanitizedId}.${extension}`;

    return {
      recipeId: String(candidate.recipeId),
      sourceUrl: candidate.imageUrl || '',
      destinationPath,
      expectedMimeType: candidate.metadata?.mimeType || 'image/jpeg',
      permissionPolicy: candidate.metadata?.permissionPolicy || 'unknown',
      readyForDownload: validation.canDownload,
      blockReason: validation.reason,
      source: candidate.source,
      sourceId: candidate.sourceId || undefined,
      license: candidate.metadata?.license || undefined,
      attribution: candidate.metadata?.attribution || undefined,
      altText: candidate.altText || undefined
    };
  }

  /**
   * Estimates network transfer cost and constraints without performing the request.
   */
  estimateDownload(plan: DownloadPlan): DownloadEstimate {
    return {
      estimatedSizeBytes: 350 * 1024, // Standard 350KB target food photo
      supportedMimeType: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(plan.expectedMimeType || ''),
      requiresNetwork: true
    };
  }

  /**
   * Simulated safe download runner for pipeline dry-runs and tests.
   * NEVER makes real network calls in this foundation phase.
   */
  async downloadDryRun(plan: DownloadPlan): Promise<{ success: boolean; message: string }> {
    if (!plan.readyForDownload) {
      return { success: false, message: `İndirme engellendi: ${plan.blockReason}` };
    }
    return {
      success: true,
      message: `[Simülasyon] ${plan.sourceUrl} -> ${plan.destinationPath} indirme planı hazır (gerçek ağ çağrısı yapılmadı).`
    };
  }

  /**
   * Executes a resilient, SSRF-safe, verified binary download with atomic storage.
   */
  async downloadImage(plan: DownloadPlan, options?: DownloadExecutionOptions): Promise<DownloadResult> {
    const startTime = Date.now();

    // 1. Check Plan Readiness
    if (!plan.readyForDownload) {
      return {
        success: false,
        status: 'rejected',
        plan,
        error: plan.blockReason || 'Plan indirme için onaylanmadı.'
      };
    }

    const fetchImpl = options?.fetchFn || globalThis.fetch;
    const maxSizeBytes = options?.maxSizeBytes ?? 10 * 1024 * 1024; // 10 MB
    const timeoutMs = options?.timeoutMs ?? 10000;
    const maxRedirects = options?.maxRedirects ?? 3;
    const maxRetries = options?.maxRetries ?? 2;
    const retryDelayMs = options?.retryDelayMs ?? 100;
    const allowHttp = options?.allowHttp ?? false;

    let currentUrl = plan.sourceUrl;
    let redirectCount = 0;
    let attempts = 0;
    let response: Response | null = null;

    // 2. Fetch Loop with Safe Redirect & Controlled Retries
    while (attempts <= maxRetries) {
      attempts++;

      // Validate URL against SSRF and protocol before EVERY request/redirect
      const urlCheck = validateSafeDownloadUrl(currentUrl, { allowHttp });
      if (!urlCheck.isSafe) {
        return {
          success: false,
          status: 'rejected',
          plan,
          error: `URL Güvenlik İhlali: ${urlCheck.error}`
        };
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        response = await fetchImpl(currentUrl, {
          method: 'GET',
          headers: {
            'Accept': 'image/webp,image/jpeg,image/png;q=0.9,*/*;q=0.8',
            'User-Agent': 'CooklyRecipeImageBot/1.0'
          },
          signal: controller.signal,
          redirect: 'manual' // Handle redirects manually for strict SSRF validation
        });
        clearTimeout(timeoutId);

        // Handle Redirects (301, 302, 307, 308)
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          redirectCount++;
          if (redirectCount > maxRedirects) {
            return {
              success: false,
              status: 'failed',
              plan,
              error: `Maksimum yönlendirme sınırı aşıldı (maxRedirects: ${maxRedirects})`
            };
          }

          const location = response.headers.get('location');
          if (!location) {
            return {
              success: false,
              status: 'failed',
              plan,
              error: 'Yönlendirme yanıtında Location başlığı bulunamadı.'
            };
          }

          // Resolve relative redirect URL against current URL
          currentUrl = new URL(location, currentUrl).toString();
          continue; // Next hop
        }

        // Non-transient errors -> DO NOT RETRY
        if (response.status === 401 || response.status === 403 || response.status === 404) {
          return {
            success: false,
            status: 'failed',
            plan,
            error: `HTTP ${response.status} hatası: Kaynağa erişilemedi.`
          };
        }

        // 429 Rate Limit
        if (response.status === 429) {
          if (attempts <= maxRetries) {
            const retryAfter = response.headers.get('retry-after');
            const waitSeconds = retryAfter ? parseInt(retryAfter, 10) : 1;
            await new Promise(r => setTimeout(r, Math.min(waitSeconds * 1000, 2000)));
            continue;
          }
          return {
            success: false,
            status: 'failed',
            plan,
            error: 'HTTP 429: Hız sınırı aşıldı (Rate limit exceeded).'
          };
        }

        // 5xx Server Errors
        if (response.status >= 500 && response.status < 600) {
          if (attempts <= maxRetries) {
            await new Promise(r => setTimeout(r, retryDelayMs * attempts));
            continue;
          }
          return {
            success: false,
            status: 'failed',
            plan,
            error: `HTTP ${response.status}: Sunucu geçici olarak kullanılamıyor.`
          };
        }

        if (!response.ok) {
          return {
            success: false,
            status: 'failed',
            plan,
            error: `HTTP isteği başarısız oldu (Status: ${response.status}).`
          };
        }

        // We have a successful response! Break out of retry loop.
        break;
      } catch (err: any) {
        clearTimeout(timeoutId);
        const isTimeout = err?.name === 'AbortError' || String(err).includes('aborted');

        if (attempts <= maxRetries) {
          await new Promise(r => setTimeout(r, retryDelayMs * attempts));
          continue;
        }

        return {
          success: false,
          status: 'failed',
          plan,
          error: isTimeout ? `İstek zaman aşımına uğradı (${timeoutMs}ms)` : (err?.message || 'Ağ bağlantı hatası')
        };
      }
    }

    if (!response || !response.ok) {
      return {
        success: false,
        status: 'failed',
        plan,
        error: 'İndirme yanıtı alınamadı.'
      };
    }

    // 3. Content-Type Header Validation
    const contentType = response.headers.get('content-type') || '';
    const cleanContentType = contentType.split(';')[0].trim().toLowerCase();

    if (cleanContentType.includes('text/html') || cleanContentType.includes('application/json')) {
      return {
        success: false,
        status: 'failed',
        plan,
        error: `Geçersiz Content-Type (${contentType}). Görsel beklenirken metin/veri yanıtı alındı.`
      };
    }

    // 4. Content-Length Header Check
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      const declaredSize = parseInt(contentLength, 10);
      if (!isNaN(declaredSize) && declaredSize > maxSizeBytes) {
        return {
          success: false,
          status: 'failed',
          plan,
          error: `İçerik boyutu izin verilen sınırı aşıyor (${(declaredSize / 1024 / 1024).toFixed(2)} MB > ${(maxSizeBytes / 1024 / 1024).toFixed(2)} MB)`
        };
      }
    }

    // 5. Read Binary Stream / Buffer
    let buffer: Buffer;
    try {
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
    } catch (err: any) {
      return {
        success: false,
        status: 'failed',
        plan,
        error: `Görsel akışı okunurken hata oluştu: ${err.message}`
      };
    }

    // Secondary byte limit check on actual buffer
    if (buffer.length > maxSizeBytes) {
      return {
        success: false,
        status: 'failed',
        plan,
        error: `İndirilen veri boyutu sınırı aştı (${(buffer.length / 1024 / 1024).toFixed(2)} MB > ${(maxSizeBytes / 1024 / 1024).toFixed(2)} MB)`
      };
    }

    // 6. Binary Validation (Magic bytes, Content-Type match, real dimensions)
    const binaryCheck = validateImageBinary(buffer, {
      expectedMimeType: cleanContentType || plan.expectedMimeType,
      minWidth: options?.minWidth,
      minHeight: options?.minHeight,
      maxDimension: options?.maxDimension,
      maxByteSize: maxSizeBytes
    });

    if (!binaryCheck.isValid) {
      return {
        success: false,
        status: 'failed',
        plan,
        error: binaryCheck.error || 'Görsel binary doğrulaması başarısız.'
      };
    }

    // 7. Calculate SHA-256 Checksum
    const checksum = calculateBufferChecksum(buffer);

    // 8. Atomic Write to Disk
    try {
      await writeBufferAtomic(plan.destinationPath, buffer, { tempDir: options?.tempDir });
    } catch (err: any) {
      return {
        success: false,
        status: 'failed',
        plan,
        error: `Görsel diske yazılamadı: ${err.message}`
      };
    }

    // 9. Build Structured Asset Metadata
    const asset: RecipeImageAsset = {
      recipeId: plan.recipeId,
      assetPath: plan.destinationPath,
      source: plan.source || 'unknown',
      sourceId: plan.sourceId || '',
      sourceUrl: plan.sourceUrl,
      originalUrl: plan.sourceUrl,
      license: plan.license || 'Unknown License',
      attribution: plan.attribution || 'Unknown Attribution',
      checksum,
      mimeType: binaryCheck.mimeType!,
      format: binaryCheck.format!,
      width: binaryCheck.dimensions!.width,
      height: binaryCheck.dimensions!.height,
      byteSize: buffer.length,
      downloadedAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      status: 'stored'
    };

    const durationMs = Date.now() - startTime;

    return {
      success: true,
      status: 'stored',
      plan,
      asset,
      checksum,
      byteSize: buffer.length,
      durationMs
    };
  }
}
