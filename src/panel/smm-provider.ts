export interface SMMProviderConfig {
  apiUrl: string;
  apiKey: string;
  providerName?: string;
}

export interface ProviderBalance {
  balance: number;
  currency: string;
}

export interface CreateExternalOrderParams {
  service: number | string;
  link: string;
  quantity: number;
  comments?: string;
}

export interface ExternalOrderResult {
  externalOrderId: string;
}

export interface ExternalOrderStatus {
  status: string;
  charge?: number;
  startCount?: number;
  remains?: number;
  currency?: string;
}

export type SMMHttpFetcher = (url: string, params: Record<string, any>) => Promise<any>;

/**
 * Robust default HTTP fetcher for SMM v2 panels (e.g. supplierfollower.com).
 * Includes:
 * 1. 15-second timeout via AbortSignal to avoid socket hangs.
 * 2. Status code & HTML error page interception (e.g. Cloudflare 502/504 errors).
 * 3. Exponential backoff retry on transient 5xx/network errors.
 */
export async function defaultSMMFetcher(
  url: string,
  params: Record<string, any>,
  maxRetries = 2,
  timeoutMs = 15000
): Promise<any> {
  const formBody = new URLSearchParams();
  for (const key in params) {
    if (params[key] !== undefined && params[key] !== null) {
      formBody.append(key, String(params[key]));
    }
  }

  let attempt = 0;
  while (true) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString(),
        signal: controller.signal,
      });

      clearTimeout(timer);

      const rawText = await response.text();

      // Check if response is HTML (e.g. Cloudflare challenge or 502 Bad Gateway)
      if (rawText.trim().startsWith('<') || rawText.includes('<!DOCTYPE html>')) {
        throw new Error(
          `Provider upstream returned an HTML page (HTTP ${response.status}) instead of JSON. Provider may be undergoing Cloudflare protection or maintenance.`
        );
      }

      let parsed: any;
      try {
        parsed = JSON.parse(rawText);
      } catch {
        throw new Error(`Invalid JSON received from provider: ${rawText.slice(0, 100)}`);
      }

      return parsed;
    } catch (err: any) {
      attempt++;
      const isAbort = err?.name === 'AbortError' || err?.message?.includes('aborted');
      const isTransient = isAbort || err?.message?.includes('HTML page') || err?.message?.includes('fetch failed');

      if (attempt <= maxRetries && isTransient) {
        const delay = Math.pow(2, attempt) * 500;
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      throw err;
    }
  }
}

export class SMMProviderAdapter {
  private providerName: string;

  constructor(
    private config: SMMProviderConfig,
    private fetcher: SMMHttpFetcher = (url, params) => defaultSMMFetcher(url, params)
  ) {
    this.providerName = config.providerName || 'ExternalSMM';
  }

  async getBalance(): Promise<ProviderBalance> {
    const data = await this.fetcher(this.config.apiUrl, {
      key: this.config.apiKey,
      action: 'balance',
    });

    if (data.error) {
      throw new Error(`Provider ${this.providerName} Error: ${data.error}`);
    }

    return {
      balance: parseFloat(data.balance || '0'),
      currency: data.currency || 'USD',
    };
  }

  async createExternalOrder(params: CreateExternalOrderParams): Promise<ExternalOrderResult> {
    const payload: Record<string, any> = {
      key: this.config.apiKey,
      action: 'add',
      service: params.service,
      link: params.link,
      quantity: params.quantity,
    };

    if (params.comments) {
      payload.comments = params.comments;
    }

    const data = await this.fetcher(this.config.apiUrl, payload);

    if (data.error) {
      throw new Error(`Provider ${this.providerName} Error: ${data.error}`);
    }

    return {
      externalOrderId: String(data.order),
    };
  }

  async getOrderStatus(orderId: string): Promise<ExternalOrderStatus> {
    const data = await this.fetcher(this.config.apiUrl, {
      key: this.config.apiKey,
      action: 'status',
      order: orderId,
    });

    if (data.error) {
      throw new Error(`Provider ${this.providerName} Error: ${data.error}`);
    }

    return {
      status: data.status,
      charge: data.charge ? parseFloat(data.charge) : undefined,
      startCount: data.start_count ? parseInt(data.start_count, 10) : undefined,
      remains: data.remains !== undefined ? parseInt(data.remains, 10) : undefined,
      currency: data.currency,
    };
  }

  async getServices(): Promise<any[]> {
    const data = await this.fetcher(this.config.apiUrl, {
      key: this.config.apiKey,
      action: 'services',
    });

    if (data && data.error) {
      throw new Error(`Provider ${this.providerName} Error: ${data.error}`);
    }

    return Array.isArray(data) ? data : [];
  }
}
