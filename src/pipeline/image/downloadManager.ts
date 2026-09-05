import { ImageCandidate } from './types';
import { validateImageUrl } from './validator';
import { isPlaceholderImage } from './placeholder';

export interface DownloadPlan {
  recipeId: string;
  sourceUrl: string;
  destinationPath: string;
  expectedMimeType?: string;
  permissionPolicy: string;
  readyForDownload: boolean;
  blockReason?: string;
}

export interface DownloadEstimate {
  estimatedSizeBytes: number;
  supportedMimeType: boolean;
  requiresNetwork: true;
}

/**
 * Image Download Manager — Foundation Abstraction.
 * Prepares plans and checks permissions for future download execution
 * WITHOUT making active HTTP network requests during testing or audit.
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
   * Builds a safe staging download plan without executing any network traffic.
   */
  buildDownloadPlan(candidate: ImageCandidate, destinationDir = 'public/images/recipes'): DownloadPlan {
    const validation = this.validateDownloadCandidate(candidate);
    const sanitizedId = candidate.recipeId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const extension = candidate.metadata?.mimeType === 'image/webp' ? 'webp' : 'jpg';
    const destinationPath = `${destinationDir}/${sanitizedId}.${extension}`;

    return {
      recipeId: candidate.recipeId,
      sourceUrl: candidate.imageUrl || '',
      destinationPath,
      expectedMimeType: candidate.metadata?.mimeType || 'image/jpeg',
      permissionPolicy: candidate.metadata?.permissionPolicy || 'unknown',
      readyForDownload: validation.canDownload,
      blockReason: validation.reason
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
}
