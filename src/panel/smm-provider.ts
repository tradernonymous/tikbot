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

export class SMMProviderAdapter {
  private providerName: string;

  constructor(
    private config: SMMProviderConfig,
    private fetcher: SMMHttpFetcher = async (url, params) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      return response.json();
    }
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
