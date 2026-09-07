/**
 * URL Security & SSRF Protection for Image Acquisition Pipeline.
 * 
 * Strict Security Rules:
 * 1. Only HTTPS allowed in production (HTTP optionally configurable for local testing).
 * 2. Blocks all non-web protocols: javascript:, data:, file:, blob:, ftp:, gopher:, ldap:.
 * 3. SSRF Protection: Blocks localhost, loopback, link-local, cloud metadata (169.254.169.254),
 *    private RFC 1918 IPv4 ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16),
 *    and IPv6 private/local addresses.
 * 4. Blocks authentication credentials in URLs (user:pass@host).
 * 5. Restricts network ports to standard web ports (80, 443).
 */

export interface SafeUrlValidationResult {
  isSafe: boolean;
  error?: string;
  normalizedUrl?: string;
  hostname?: string;
  protocol?: string;
  port?: number;
}

export interface SafeUrlOptions {
  allowHttp?: boolean;
  allowedDomains?: string[];
  blockPrivateIps?: boolean;
}

/**
 * Checks if an IPv4 string falls into private, loopback, link-local, or reserved blocks.
 */
export function isPrivateOrLocalIpV4(ip: string): boolean {
  const parts = ip.split('.').map(p => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return false;
  }

  const [b0, b1] = parts;

  // 0.0.0.0/8 (Current network)
  if (b0 === 0) return true;

  // 127.0.0.0/8 (Loopback)
  if (b0 === 127) return true;

  // 10.0.0.0/8 (Private RFC 1918)
  if (b0 === 10) return true;

  // 172.16.0.0/12 (Private RFC 1918: 172.16.0.0 - 172.31.255.255)
  if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;

  // 192.168.0.0/16 (Private RFC 1918)
  if (b0 === 192 && b1 === 168) return true;

  // 169.254.0.0/16 (Link-local & AWS/GCP metadata 169.254.169.254)
  if (b0 === 169 && b1 === 254) return true;

  // 100.64.0.0/10 (Carrier-grade NAT)
  if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;

  // 224.0.0.0/4 (Multicast)
  if (b0 >= 224 && b0 <= 239) return true;

  // 240.0.0.0/4 (Reserved)
  if (b0 >= 240) return true;

  return false;
}

/**
 * Checks if an IPv6 string is private, loopback, or link-local.
 */
export function isPrivateOrLocalIpV6(ip: string): boolean {
  const clean = ip.toLowerCase().trim().replace(/^\[|\]$/g, '');

  if (clean === '::1' || clean === '0:0:0:0:0:0:0:1') return true; // Loopback
  if (clean === '::' || clean === '0:0:0:0:0:0:0:0') return true; // Unspecified

  // Unique local (fc00::/7)
  if (clean.startsWith('fc') || clean.startsWith('fd')) return true;

  // Link-local (fe80::/10)
  if (clean.startsWith('fe8') || clean.startsWith('fe9') || clean.startsWith('fea') || clean.startsWith('feb')) return true;

  // IPv4-mapped IPv6 (::ffff:192.168.1.1 or ::ffff:c0a8:0101)
  if (clean.startsWith('::ffff:')) {
    const v4Part = clean.slice(7);
    if (v4Part.includes('.')) {
      return isPrivateOrLocalIpV4(v4Part);
    }
  }

  return false;
}

/**
 * Evaluates whether an input URL is safe for download.
 */
export function validateSafeDownloadUrl(rawUrl?: string | null, options?: SafeUrlOptions): SafeUrlValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string' || rawUrl.trim().length === 0) {
    return { isSafe: false, error: 'Görsel URL adresi boş veya eksik.' };
  }

  const trimmed = rawUrl.trim();

  // Explicitly block dangerous pseudo-schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:') ||
    lower.startsWith('ftp:') ||
    lower.startsWith('ldap:')
  ) {
    return { isSafe: false, error: `Tehlikeli veya desteklenmeyen URL protokolü: ${trimmed.split(':')[0]}` };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isSafe: false, error: 'Geçersiz URL sözdizimi (malformed URL).' };
  }

  // Protocol Check
  const allowHttp = options?.allowHttp ?? false;
  if (parsed.protocol !== 'https:' && (parsed.protocol !== 'http:' || !allowHttp)) {
    return {
      isSafe: false,
      error: `Güvenlik ilkesi gereği yalnızca HTTPS protokolü kabul edilir (mevcut: ${parsed.protocol})`
    };
  }

  // Credentials Check
  if (parsed.username || parsed.password) {
    return { isSafe: false, error: 'URL içinde kullanıcı adı veya parola barındırılamaz.' };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');

  // Port Check
  const port = parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80);
  if (port !== 80 && port !== 443) {
    return { isSafe: false, error: `Yalnızca standart web portlarına izin verilir (mevcut port: ${port})` };
  }

  // SSRF Hostname & IP Checks
  const blockPrivate = options?.blockPrivateIps ?? true;

  if (blockPrivate) {
    // Localhost keywords
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === 'loopback' ||
      hostname === '0.0.0.0' ||
      hostname === 'metadata.google.internal' ||
      hostname === 'instance-data'
    ) {
      return { isSafe: false, error: `SSRF Koruması: Yerel veya dahili ana makinelere erişim engellendi (${hostname}).` };
    }

    // IPv4 check
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      if (isPrivateOrLocalIpV4(hostname)) {
        return { isSafe: false, error: `SSRF Koruması: Özel veya yerel IP adresine erişim engellendi (${hostname}).` };
      }
    }

    // Hex / Octal / Decimal IP check (e.g. 2130706433 or 0x7f000001)
    if (/^\d+$/.test(hostname) || /^0x[0-9a-f]+$/i.test(hostname)) {
      return { isSafe: false, error: `SSRF Koruması: Sayısal/onaltılık IP formatı engellendi (${hostname}).` };
    }

    // IPv6 check
    if (hostname.includes(':')) {
      if (isPrivateOrLocalIpV6(hostname)) {
        return { isSafe: false, error: `SSRF Koruması: Özel veya yerel IPv6 adresine erişim engellendi (${hostname}).` };
      }
    }
  }

  // Domain whitelist check (if configured)
  if (options?.allowedDomains && options.allowedDomains.length > 0) {
    const isDomainAllowed = options.allowedDomains.some(domain => {
      const cleanDomain = domain.toLowerCase().trim();
      return hostname === cleanDomain || hostname.endsWith(`.${cleanDomain}`);
    });

    if (!isDomainAllowed) {
      return { isSafe: false, error: `Alan adı onaylı izin listesinde yer almıyor (${hostname}).` };
    }
  }

  return {
    isSafe: true,
    normalizedUrl: parsed.toString(),
    hostname,
    protocol: parsed.protocol,
    port
  };
}
