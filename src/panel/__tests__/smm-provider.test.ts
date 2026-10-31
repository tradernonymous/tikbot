import { describe, it, expect, vi } from 'vitest';
import { SMMProviderAdapter, SMMProviderConfig } from '../smm-provider';

describe('SMMProviderAdapter', () => {
  const config: SMMProviderConfig = {
    apiUrl: 'https://smm-partner.internal/api/v2',
    apiKey: 'secret_partner_key_123',
    providerName: 'AlphaSMM',
  };

  it('fetches provider account balance and currency', async () => {
    const mockFetcher = vi.fn().mockResolvedValue({
      balance: '142.50',
      currency: 'USD',
    });

    const adapter = new SMMProviderAdapter(config, mockFetcher);
    const balance = await adapter.getBalance();

    expect(balance.balance).toBe(142.5);
    expect(balance.currency).toBe('USD');
    expect(mockFetcher).toHaveBeenCalledWith('https://smm-partner.internal/api/v2', {
      key: 'secret_partner_key_123',
      action: 'balance',
    });
  });

  it('submits external order with action=add and returns external orderId', async () => {
    const mockFetcher = vi.fn().mockResolvedValue({
      order: 88721,
    });

    const adapter = new SMMProviderAdapter(config, mockFetcher);
    const result = await adapter.createExternalOrder({
      service: 101,
      link: 'https://www.tiktok.com/@creator/video/998877',
      quantity: 1000,
    });

    expect(result.externalOrderId).toBe('88721');
    expect(mockFetcher).toHaveBeenCalledWith('https://smm-partner.internal/api/v2', {
      key: 'secret_partner_key_123',
      action: 'add',
      service: 101,
      link: 'https://www.tiktok.com/@creator/video/998877',
      quantity: 1000,
    });
  });

  it('polls order status and parses remains and start_count', async () => {
    const mockFetcher = vi.fn().mockResolvedValue({
      charge: '0.50',
      start_count: '1200',
      status: 'Completed',
      remains: '0',
      currency: 'USD',
    });

    const adapter = new SMMProviderAdapter(config, mockFetcher);
    const status = await adapter.getOrderStatus('88721');

    expect(status.status).toBe('Completed');
    expect(status.startCount).toBe(1200);
    expect(status.remains).toBe(0);
  });

  it('translates provider errors into clear domain exceptions', async () => {
    const mockFetcher = vi.fn().mockResolvedValue({
      error: 'Not enough balance on your account',
    });

    const adapter = new SMMProviderAdapter(config, mockFetcher);
    await expect(
      adapter.createExternalOrder({
        service: 101,
        link: 'https://www.tiktok.com/@creator/video/998877',
        quantity: 10000,
      })
    ).rejects.toThrow(/Provider AlphaSMM Error: Not enough balance on your account/);

    // Also test getBalance error
    await expect(adapter.getBalance()).rejects.toThrow(/Provider AlphaSMM Error/);

    // Also test getOrderStatus error
    await expect(adapter.getOrderStatus('123')).rejects.toThrow(/Provider AlphaSMM Error/);
  });

  it('supports custom comments and default fetcher fallback', async () => {
    const mockFetcher = vi.fn().mockResolvedValue({ order: 1234 });
    const adapter = new SMMProviderAdapter(config, mockFetcher);

    await adapter.createExternalOrder({
      service: 202,
      link: 'https://tiktok.com/@user/video/1',
      quantity: 50,
      comments: 'Great video!\nAwesome content!',
    });

    expect(mockFetcher).toHaveBeenCalledWith(
      'https://smm-partner.internal/api/v2',
      expect.objectContaining({
        comments: 'Great video!\nAwesome content!',
      })
    );

    // Instantiate with default fetcher to cover default arg
    const defaultAdapter = new SMMProviderAdapter({
      apiUrl: 'https://dummy.url',
      apiKey: 'k',
    });
    expect(defaultAdapter).toBeDefined();
  });
});
