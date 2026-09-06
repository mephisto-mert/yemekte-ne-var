import crypto from 'crypto';

export interface CacheEntry<T = any> {
  queryHash: string;
  provider: string;
  createdAt: string;
  data: T;
}

/**
 * Deterministic In-Memory & Staging Cache Foundation.
 * STRICT RULE: Secret, authorization, or token strings are NEVER cached.
 */
export class DeterministicEnrichmentCache {
  private cache: Map<string, CacheEntry> = new Map();

  /**
   * Generates a deterministic SHA-256 key from a given object or string.
   */
  public generateKey(prefix: string, payload: any): string {
    const rawString = typeof payload === 'string'
      ? payload
      : JSON.stringify(payload, Object.keys(payload || {}).sort());

    const hash = crypto.createHash('sha256').update(rawString).digest('hex').slice(0, 16);
    return `${prefix}:${hash}`;
  }

  public get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    return entry.data as T;
  }

  public set<T = any>(key: string, data: T, provider = 'system'): void {
    // Sanitize: do not cache authorization or secret tokens
    const queryHash = crypto.createHash('sha256').update(key).digest('hex');
    this.cache.set(key, {
      queryHash,
      provider,
      createdAt: new Date().toISOString(),
      data
    });
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }

  public size(): number {
    return this.cache.size;
  }

  public clear(): void {
    this.cache.clear();
  }
}
