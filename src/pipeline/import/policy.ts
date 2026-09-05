import { SourceMetadata, SourcePermissionPolicy } from './types';

export interface PolicyEvaluation {
  policy: SourcePermissionPolicy;
  reason: string;
}

/**
 * Evaluates the permission policy of a source based on its metadata.
 * Prevents unauthorized, unverified, or prohibited sources from being imported.
 */
export function evaluateSourcePolicy(metadata?: SourceMetadata | null): PolicyEvaluation {
  if (!metadata) {
    return {
      policy: 'unknown',
      reason: 'Kaynak üstverisi (metadata) bulunamadı. Güvenli varsayılan olarak inceleme gereklidir.'
    };
  }

  // 1. Explicit policy declaration
  if (metadata.permissionPolicy) {
    switch (metadata.permissionPolicy) {
      case 'allowed':
        return { policy: 'allowed', reason: 'Kaynak izin politikası onaylandı (ALLOWED).' };
      case 'prohibited':
        return { policy: 'prohibited', reason: 'Kaynak kullanım şartları veya telif gereği kesinlikle yasaklandı (PROHIBITED).' };
      case 'review_required':
        return { policy: 'review_required', reason: 'Kaynak lisansı veya izin durumu manuel inceleme gerektiriyor (REVIEW_REQUIRED).' };
      case 'unknown':
      default:
        return { policy: 'unknown', reason: 'Kaynak izin durumu belirsiz (UNKNOWN).' };
    }
  }

  // 2. Derive policy from contentPermissionStatus
  switch (metadata.contentPermissionStatus) {
    case 'authorized':
    case 'public_domain':
      return { policy: 'allowed', reason: `Açık lisans veya yetkilendirilmiş kaynak (${metadata.contentPermissionStatus}).` };
    case 'pending_review':
      return { policy: 'review_required', reason: 'İçerik izin durumu inceleme bekliyor (pending_review).' };
    case 'unknown':
    default:
      if (metadata.sourceType === 'mock') {
        return { policy: 'allowed', reason: 'Yerel geliştirme ve test mock kaynağı.' };
      }
      return { policy: 'unknown', reason: 'Kaynak içerik hakları ve izin durumu bilinmiyor (unknown).' };
  }
}
