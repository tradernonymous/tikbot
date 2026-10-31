export type ProxyStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'OFFLINE';
export type ProxyProtocol = 'HTTP' | 'HTTPS' | 'SOCKS5';

export interface ManagedProxy {
  id: string;
  protocol: ProxyProtocol;
  host: string;
  port: number;
  country: string;
  status: ProxyStatus;
  latencyMs: number;
  consecutiveErrors: number;
  username?: string;
  encryptedPassword?: string;
  lastCheckedAt?: Date;
}

export interface ProxyProbeResult {
  healthy: boolean;
  latencyMs?: number;
  error?: string;
}

export type ProxyHealthProbe = (proxy: ManagedProxy) => Promise<ProxyProbeResult>;

export class ProxyPoolManager {
  private proxies = new Map<string, ManagedProxy>();
  private accountBindings = new Map<string, string>(); // accountId -> proxyId

  constructor(initialProxies: ManagedProxy[] = []) {
    for (const p of initialProxies) {
      this.proxies.set(p.id, { ...p });
    }
  }

  getProxy(id: string): ManagedProxy | undefined {
    const p = this.proxies.get(id);
    return p ? { ...p } : undefined;
  }

  getAllProxies(): ManagedProxy[] {
    return Array.from(this.proxies.values());
  }

  selectProxyForAccount(accountId: string, preferredCountry?: string): ManagedProxy | null {
    // 1. Check sticky binding first
    const boundProxyId = this.accountBindings.get(accountId);
    if (boundProxyId) {
      const bound = this.proxies.get(boundProxyId);
      if (bound && bound.status !== 'UNHEALTHY' && bound.status !== 'OFFLINE') {
        return { ...bound };
      }
    }

    // 2. Filter candidate proxies
    const candidates: ManagedProxy[] = [];
    for (const p of this.proxies.values()) {
      if (p.status !== 'HEALTHY') continue;
      if (preferredCountry && p.country.toUpperCase() !== preferredCountry.toUpperCase()) {
        continue;
      }
      candidates.push(p);
    }

    if (candidates.length === 0) {
      return null;
    }

    // Sort by lowest latency
    candidates.sort((a, b) => a.latencyMs - b.latencyMs);
    const chosen = candidates[0];

    // Bind sticky mapping
    this.accountBindings.set(accountId, chosen.id);
    return { ...chosen };
  }

  async checkProxyHealth(proxyId: string, probe: ProxyHealthProbe): Promise<ManagedProxy> {
    const proxy = this.proxies.get(proxyId);
    if (!proxy) {
      throw new Error(`Proxy not found: ${proxyId}`);
    }

    const result = await probe(proxy);
    const now = new Date();

    if (result.healthy) {
      proxy.status = 'HEALTHY';
      proxy.consecutiveErrors = 0;
      if (result.latencyMs !== undefined) {
        proxy.latencyMs = result.latencyMs;
      }
      proxy.lastCheckedAt = now;
    } else {
      proxy.consecutiveErrors += 1;
      proxy.lastCheckedAt = now;
      if (proxy.consecutiveErrors >= 3) {
        proxy.status = 'UNHEALTHY';
      }
    }

    this.proxies.set(proxyId, proxy);
    return { ...proxy };
  }
}
