import { DouyinTikTokClient, type ExtractedMediaData } from './download-api-client';
export { DouyinTikTokClient };
export type { ExtractedMediaData };

export type HealthTier = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';

export interface V5Identity {
  id: string;
  name: string;
  healthStatus?: string;
}

export interface DownloadApiRequestLogEntry {
  id: number;
  endpoint: string;
  status: number;
  latencyMs: number;
  healthTier: HealthTier;
  createdAt: Date;
}

const MAX_REQUEST_LOG = 200;
const REQUEST_LOG: DownloadApiRequestLogEntry[] = [];
let nextLogId = 1;

function recordLog(entry: DownloadApiRequestLogEntry) {
  REQUEST_LOG.push(entry);
  if (REQUEST_LOG.length > MAX_REQUEST_LOG) REQUEST_LOG.shift();
}

function getLog(): DownloadApiRequestLogEntry[] {
  return [...REQUEST_LOG];
}

/** Circuit breaker per endpoint: opens after 2 consecutive 429s (then rejects immediately). */
class EndpointCircuitBreaker {
  private consecutive429s = 0;

  note(status: number): void {
    if (status === 429) this.consecutive429s += 1;
    else this.consecutive429s = 0;
  }

  isOpen(): boolean {
    return this.consecutive429s >= 2;
  }
}

/**
 * Adapter over DouyinTikTTDownload_API v5 (sidecar):
 * health-tier identity selection, 429 retry, per-endpoint circuit breaker,
 * request log. Does not vendor the Python service — sidecar stays external.
 */
export class DouyinTikTokV5Client {
  private baseUrl: string;
  private circuitBreakers: Record<string, EndpointCircuitBreaker> = {};
  private retryBaseMs: number;

  constructor(
    private options?: { apiBaseUrl?: string; maxRetries?: number; retryBaseMs?: number; fetcher?: typeof fetch }
  ) {
    this.baseUrl = options?.apiBaseUrl || 'http://localhost:8000';
    this.retryBaseMs = options?.retryBaseMs ?? 1000;
  }

  private get fetcher(): typeof fetch {
    return this.options?.fetcher ?? fetch;
  }

  private breaker(endpoint: string): EndpointCircuitBreaker {
    return (this.circuitBreakers[endpoint] ??= new EndpointCircuitBreaker());
  }

  private getHealthTierFromResponse(res: Response): HealthTier {
    if (res.ok) return 'HEALTHY';
    if (res.status === 429 || res.status >= 500) return 'DEGRADED';
    return 'HEALTHY';
  }

  /** v5 identity pool — select the healthiest identity (R2.8). */
  async selectIdentity(): Promise<V5Identity | null> {
    const endpoint = '/api/v5/identity/select';
    if (this.breaker(endpoint).isOpen()) return null;
    const t0 = Date.now();
    const res = await this.fetcher(`${this.baseUrl}/api/v5/identity/select`);
    this.breaker(endpoint).note(res.status);
    if (!res.ok) {
      recordLog({ id: nextLogId++, endpoint, status: res.status, latencyMs: Date.now() - t0, healthTier: this.getHealthTierFromResponse(res), createdAt: new Date() });
      return null;
    }
    const data = (await res.json().catch(() => null)) as V5Identity | null;
    recordLog({ id: nextLogId++, endpoint, status: res.status, latencyMs: Date.now() - t0, healthTier: 'HEALTHY', createdAt: new Date() });
    return data && data.id ? data : null;
  }

  /** Extract video data from a social URL, with 429 retry (R2.8). */
  async extractVideoData(rawUrl: string): Promise<ExtractedMediaData> {
    const endpoint = '/api/hybrid/video_data';
    const client = new DouyinTikTokClient({ apiBaseUrl: this.baseUrl, fetcher: this.fetcher });
    const attempt = async (attempts: number): Promise<ExtractedMediaData> => {
      if (this.breaker(endpoint).isOpen()) throw new Error('Download API circuit open (429)');
      const t0 = Date.now();
      try {
        const data = await client.extractVideoData(rawUrl);
        this.breaker(endpoint).note(200);
        recordLog({ id: nextLogId++, endpoint, status: 200, latencyMs: Date.now() - t0, healthTier: 'HEALTHY', createdAt: new Date() });
        return data;
      } catch (err: any) {
        const msg = String(err?.message || '');
        const statusMatch = /: (\d{3})\s/.exec(msg);
        const isRateLimit =
          statusMatch?.[1] === '429' || /429|too many requests|rate limit/i.test(msg);
        const status = statusMatch ? Number(statusMatch[1]) : isRateLimit ? 429 : 500;
        this.breaker(endpoint).note(status);
        const tier = this.getHealthTierFromResponse(new Response('', { status }));
        recordLog({ id: nextLogId++, endpoint, status, latencyMs: Date.now() - t0, healthTier: tier, createdAt: new Date() });
        const canRetry = isRateLimit && attempts > 0;
        if (canRetry) {
          const wait = this.retryBaseMs * Math.pow(2, attempts);
          await new Promise((r) => setTimeout(r, wait));
          return attempt(attempts - 1);
        }
        throw err;
      }
    };
    return attempt(2);
  }
}

export function getDownloadApiRequestLog(): DownloadApiRequestLogEntry[] {
  return getLog();
}

export function clearDownloadApiRequestLog(): void {
  REQUEST_LOG.length = 0;
  nextLogId = 1;
}
