import crypto from 'crypto';

/**
 * Calculates deterministic SHA-256 checksum for an image binary buffer.
 */
export function calculateBufferChecksum(buffer: Buffer | Uint8Array): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Verifies if a buffer matches an expected SHA-256 checksum.
 */
export function verifyBufferChecksum(buffer: Buffer | Uint8Array, expectedChecksum: string): boolean {
  if (!expectedChecksum || typeof expectedChecksum !== 'string') return false;
  const actual = calculateBufferChecksum(buffer);
  return actual.toLowerCase() === expectedChecksum.toLowerCase().trim();
}
