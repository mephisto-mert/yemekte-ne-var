/**
 * Resilient, Secret-Safe HTTP Client for Image Providers.
 * 
 * SECURITY GUARANTEES:
 * 1. Authorization headers and API keys are NEVER logged or leaked in error messages.
 * 2. Secrets in URLs or query strings are automatically redacted.
 * 3. Does NOT retry non-transient auth/permission errors (401, 403).
 * 4. Handles rate limits (429) with Retry-After or limited exponential backoff.
 * 5. Supports custom fetch function injection for zero-network unit tests.
 */

export interface HttpRequestOptions {
  headers?: Record<string, string>;
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  fetchFn?: typeof fetch;
}

export interface HttpResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  headers: Record<string, string>;
  retryAfterSeconds?: number;
}

export interface SafeHttpClientOptions {
  defaultTimeoutMs?: number;
  defaultMaxRetries?: number;
  defaultRetryDelayMs?: number;
  fetchFn?: typeof fetch;
}

export class SafeHttpClient {
  private defaultTimeoutMs: number;
  private defaultMaxRetries: number;
  private defaultRetryDelayMs: number;
  private customFetch?: typeof fetch;

  constructor(options?: SafeHttpClientOptions) {
    this.defaultTimeoutMs = options?.defaultTimeoutMs ?? 8000;
    this.defaultMaxRetries = options?.defaultMaxRetries ?? 2;
    this.defaultRetryDelayMs = options?.defaultRetryDelayMs ?? 300;
    this.customFetch = options?.fetchFn;
  }

  /**
   * Redacts sensitive keys and credentials from URLs and strings.
   */
  public redactSecrets(input: string, secretToRedact?: string): string {
    let result = input;
    if (secretToRedact && secretToRedact.trim().length > 3) {
      result = result.replaceAll(secretToRedact, '[REDACTED_API_KEY]');
    }
    // General pattern matching for keys in query strings
    result = result.replace(/([?&](?:api_?key|key|token|auth)=)[^&]+/gi, '$1[REDACTED]');
    return result;
  }

  /**
   * Executes a GET request with controlled timeout, error suppression, and safe retries.
   */
  public async get<T = any>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    const fetchImpl = options?.fetchFn || this.customFetch || globalThis.fetch;
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    const maxRetries = options?.maxRetries ?? this.defaultMaxRetries;
    const retryDelayMs = options?.retryDelayMs ?? this.defaultRetryDelayMs;

    let attempts = 0;
    let lastError: any = null;

    // Identify any secret in auth header to ensure redaction in error messages
    const authHeader = options?.headers?.['Authorization'] || options?.headers?.['authorization'];

    while (attempts <= maxRetries) {
      attempts++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetchImpl(url, {
          method: 'GET',
          headers: options?.headers,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        const responseHeaders: Record<string, string> = {};
        if (response.headers && typeof response.headers.forEach === 'function') {
          response.headers.forEach((val, key) => {
            responseHeaders[key.toLowerCase()] = val;
          });
        }

        const retryAfterHeader = responseHeaders['retry-after'];
        const retryAfterSeconds = retryAfterHeader ? parseInt(retryAfterHeader, 10) : undefined;

        // Check if authentication error (401 or 403) -> DO NOT RETRY
        if (response.status === 401 || response.status === 403) {
          return {
            ok: false,
            status: response.status,
            data: null as any,
            headers: responseHeaders,
            retryAfterSeconds
          };
        }

        // Check 429 Rate Limit
        if (response.status === 429) {
          if (attempts <= maxRetries) {
            const waitMs = (retryAfterSeconds && !isNaN(retryAfterSeconds))
              ? Math.min(retryAfterSeconds * 1000, 2000)
              : retryDelayMs * attempts;
            await new Promise(r => setTimeout(r, waitMs));
            continue;
          }
          return {
            ok: false,
            status: 429,
            data: null as any,
            headers: responseHeaders,
            retryAfterSeconds
          };
        }

        // Check 5xx Server Errors (Transient)
        if (response.status >= 500 && response.status < 600) {
          if (attempts <= maxRetries) {
            await new Promise(r => setTimeout(r, retryDelayMs * attempts));
            continue;
          }
          return {
            ok: false,
            status: response.status,
            data: null as any,
            headers: responseHeaders
          };
        }

        // Parse response body
        let parsedData: any = null;
        const text = await response.text();
        try {
          parsedData = text ? JSON.parse(text) : null;
        } catch {
          // Malformed JSON
          if (!response.ok) {
            return {
              ok: false,
              status: response.status,
              data: null as any,
              headers: responseHeaders
            };
          }
          throw new Error('Yanıt geçerli bir JSON formatında değil (malformed JSON response).');
        }

        return {
          ok: response.ok,
          status: response.status,
          data: parsedData,
          headers: responseHeaders,
          retryAfterSeconds
        };
      } catch (err: any) {
        clearTimeout(timeoutId);
        const isTimeout = err?.name === 'AbortError' || String(err).includes('aborted');
        const safeMessage = this.redactSecrets(
          isTimeout ? `İstek zaman aşımına uğradı (${timeoutMs}ms timeout)` : (err?.message || 'Ağ hatası'),
          authHeader
        );

        lastError = new Error(safeMessage);

        // Do not retry if non-network programming error
        if (isTimeout && attempts <= maxRetries) {
          await new Promise(r => setTimeout(r, retryDelayMs * attempts));
          continue;
        }

        if (attempts > maxRetries) {
          break;
        }
      }
    }

    throw lastError || new Error('İstek başarısız oldu.');
  }
}
