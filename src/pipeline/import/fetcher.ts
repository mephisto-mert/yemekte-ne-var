/**
 * Safe, minimal HTTP/Fetch abstraction for future external source adapters.
 * No rate limit bypass, no UA spoofing, no CAPTCHA tricks.
 */

export interface FetchOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export interface FetcherResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  headers: Record<string, string>;
}

export interface Fetcher {
  get<T = any>(url: string, options?: FetchOptions): Promise<FetcherResponse<T>>;
}

/**
 * Standard Fetcher implementation wrapping native fetch.
 */
export class SafeFetcher implements Fetcher {
  async get<T = any>(url: string, options?: FetchOptions): Promise<FetcherResponse<T>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options?.timeoutMs || 10000);

    try {
      const response = await fetch(url, {
        headers: options?.headers,
        signal: controller.signal
      });

      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((val, key) => {
        responseHeaders[key] = val;
      });

      let data: any = null;
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        ok: response.ok,
        status: response.status,
        data,
        headers: responseHeaders
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
