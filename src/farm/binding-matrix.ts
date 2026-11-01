export class SubnetCollisionError extends Error {
  constructor(subnet: string, collidingAccountId: string) {
    super(
      `Subnet collision detected: subnet ${subnet} is already bound to account ${collidingAccountId}`
    );
    this.name = 'SubnetCollisionError';
  }
}

export interface FarmIdentityBinding {
  accountId: string;
  personaId: string;
  proxyId: string;
  proxyIp: string;
  emailSlot: string;
  phoneSlot?: string;
  proxySubnet?: string;
}

export interface BindingAuditSummary {
  totalBoundAccounts: number;
  uniqueSubnetsCount: number;
  collisionsDetected: number;
  unlinkedAccounts: string[];
}

export function extractSubnet24(ip: string): string {
  const parts = ip.trim().split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`;
  }
  return ip;
}

export class BindingMatrixStore {
  private bindings = new Map<string, FarmIdentityBinding>(); // accountId -> binding
  private subnetMap = new Map<string, string>(); // subnet -> accountId
  private emailMap = new Map<string, string>(); // email -> accountId
  private phoneMap = new Map<string, string>(); // phone -> accountId

  registerBinding(binding: FarmIdentityBinding): void {
    const subnet = extractSubnet24(binding.proxyIp);
    const existingSubnetHolder = this.subnetMap.get(subnet);

    if (existingSubnetHolder && existingSubnetHolder !== binding.accountId) {
      throw new SubnetCollisionError(subnet, existingSubnetHolder);
    }

    if (this.emailMap.has(binding.emailSlot) && this.emailMap.get(binding.emailSlot) !== binding.accountId) {
      throw new Error(`Email slot ${binding.emailSlot} already bound to another account`);
    }

    if (binding.phoneSlot && this.phoneMap.has(binding.phoneSlot) && this.phoneMap.get(binding.phoneSlot) !== binding.accountId) {
      throw new Error(`Phone slot ${binding.phoneSlot} already bound to another account`);
    }

    const record: FarmIdentityBinding = {
      ...binding,
      proxySubnet: subnet,
    };

    this.bindings.set(binding.accountId, record);
    this.subnetMap.set(subnet, binding.accountId);
    this.emailMap.set(binding.emailSlot, binding.accountId);
    if (binding.phoneSlot) {
      this.phoneMap.set(binding.phoneSlot, binding.accountId);
    }
  }

  getBinding(accountId: string): FarmIdentityBinding | undefined {
    return this.bindings.get(accountId);
  }

  unbind(accountId: string): boolean {
    const existing = this.bindings.get(accountId);
    if (!existing) return false;

    if (existing.proxySubnet) {
      this.subnetMap.delete(existing.proxySubnet);
    }
    this.emailMap.delete(existing.emailSlot);
    if (existing.phoneSlot) {
      this.phoneMap.delete(existing.phoneSlot);
    }
    return this.bindings.delete(accountId);
  }

  getBindingAuditSummary(): BindingAuditSummary {
    return {
      totalBoundAccounts: this.bindings.size,
      uniqueSubnetsCount: this.subnetMap.size,
      collisionsDetected: 0,
      unlinkedAccounts: [],
    };
  }
}
