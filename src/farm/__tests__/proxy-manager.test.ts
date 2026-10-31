import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ProxyPoolManager,
  type ManagedProxy,
  type ProxyHealthProbe,
} from '../proxy-manager';

describe('Proxy Pool Manager (Health Checks & Sticky Assignment)', () => {
  let initialProxies: ManagedProxy[];
  let manager: ProxyPoolManager;

  beforeEach(() => {
    initialProxies = [
      {
        id: 'proxy-us-1',
        protocol: 'HTTP',
        host: 'us1.proxies.io',
        port: 8080,
        country: 'US',
        status: 'HEALTHY',
        latencyMs: 120,
        consecutiveErrors: 0,
      },
      {
        id: 'proxy-us-2',
        protocol: 'HTTP',
        host: 'us2.proxies.io',
        port: 8080,
        country: 'US',
        status: 'HEALTHY',
        latencyMs: 250,
        consecutiveErrors: 0,
      },
      {
        id: 'proxy-gb-1',
        protocol: 'SOCKS5',
        host: 'gb1.proxies.io',
        port: 1080,
        country: 'GB',
        status: 'HEALTHY',
        latencyMs: 180,
        consecutiveErrors: 0,
      },
    ];
    manager = new ProxyPoolManager(initialProxies);
  });

  it('selects lowest-latency healthy proxy matching specified country', () => {
    const selected = manager.selectProxyForAccount('acc-1', 'US');
    expect(selected?.id).toBe('proxy-us-1'); // 120ms vs 250ms
  });

  it('enforces sticky binding for an account once assigned', () => {
    const firstPick = manager.selectProxyForAccount('acc-1', 'US');
    expect(firstPick?.id).toBe('proxy-us-1');

    // Subsequent calls return the same pinned proxy
    const secondPick = manager.selectProxyForAccount('acc-1', 'US');
    expect(secondPick?.id).toBe('proxy-us-1');
  });

  it('trips circuit breaker and marks proxy UNHEALTHY after 3 consecutive failures', async () => {
    const mockProbe: ProxyHealthProbe = vi.fn().mockResolvedValue({
      healthy: false,
      error: 'Connection timeout (ETIMEDOUT)',
    });

    await manager.checkProxyHealth('proxy-us-1', mockProbe);
    let p = manager.getProxy('proxy-us-1');
    expect(p?.consecutiveErrors).toBe(1);
    expect(p?.status).toBe('HEALTHY'); // Still healthy on first error

    await manager.checkProxyHealth('proxy-us-1', mockProbe);
    p = manager.getProxy('proxy-us-1');
    expect(p?.consecutiveErrors).toBe(2);

    await manager.checkProxyHealth('proxy-us-1', mockProbe);
    p = manager.getProxy('proxy-us-1');
    expect(p?.consecutiveErrors).toBe(3);
    expect(p?.status).toBe('UNHEALTHY'); // Tripped circuit breaker
  });

  it('resets error counter and restores HEALTHY status upon successful probe', async () => {
    const badProbe: ProxyHealthProbe = vi.fn().mockResolvedValue({
      healthy: false,
      error: 'Timeout',
    });
    await manager.checkProxyHealth('proxy-us-1', badProbe);
    await manager.checkProxyHealth('proxy-us-1', badProbe);

    const goodProbe: ProxyHealthProbe = vi.fn().mockResolvedValue({
      healthy: true,
      latencyMs: 95,
    });
    await manager.checkProxyHealth('proxy-us-1', goodProbe);

    const p = manager.getProxy('proxy-us-1');
    expect(p?.status).toBe('HEALTHY');
    expect(p?.consecutiveErrors).toBe(0);
    expect(p?.latencyMs).toBe(95);
  });

  it('returns null when no healthy proxy exists in requested country', () => {
    const selected = manager.selectProxyForAccount('acc-japan', 'JP');
    expect(selected).toBeNull();
  });

  it('lists all proxies and handles unknown proxy checks', async () => {
    const all = manager.getAllProxies();
    expect(all).toHaveLength(3);

    const probe = vi.fn();
    await expect(manager.checkProxyHealth('non-existent-proxy', probe)).rejects.toThrow(
      /Proxy not found/
    );
  });
});
