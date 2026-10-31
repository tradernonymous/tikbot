import { randomUUID } from 'node:crypto';

export type SMMServiceCategory = 'VIEWS' | 'LIKES' | 'COMMENTS' | 'SHARES' | 'SAVES' | 'LIVE_VIEWS';

export interface CatalogService {
  id: string;
  name: string;
  category: SMMServiceCategory;
  ratePer1000: number; // in USD
  minQuantity: number;
  maxQuantity: number;
  description: string;
  isInternalFarm: boolean;
}

export type OrderStatus = 'SUBMITTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface CreateOrderInput {
  serviceId: string;
  targetUrl: string;
  quantity: number;
  notes?: string;
  customComments?: string[];
}

export interface PanelOrder extends CreateOrderInput {
  id: string;
  status: OrderStatus;
  chargeAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_SERVICES: CatalogService[] = [
  {
    id: 'TIKTOK_VIEWS_ORGANIC',
    name: 'High-Retention TikTok Views',
    category: 'VIEWS',
    ratePer1000: 0.5,
    minQuantity: 100,
    maxQuantity: 100_000,
    description: 'Natural view sessions from warmed internal farm nodes with staggered intervals.',
    isInternalFarm: true,
  },
  {
    id: 'TIKTOK_LIKES_TARGETED',
    name: 'Targeted High-Quality Likes',
    category: 'LIKES',
    ratePer1000: 4.0,
    minQuantity: 50,
    maxQuantity: 10_000,
    description: 'Humanized likes with randomized delays between 45s - 120s.',
    isInternalFarm: true,
  },
  {
    id: 'TIKTOK_COMMENTS_CUSTOM',
    name: 'Custom Niche Comments',
    category: 'COMMENTS',
    ratePer1000: 15.0,
    minQuantity: 10,
    maxQuantity: 1_000,
    description: 'AI-generated relatable or custom template comments from warmed accounts.',
    isInternalFarm: true,
  },
  {
    id: 'TIKTOK_LIVE_VIEWERS',
    name: 'Live Stream Viewer Boost & Chat',
    category: 'LIVE_VIEWS',
    ratePer1000: 25.0,
    minQuantity: 5,
    maxQuantity: 50,
    description: 'Concurrent live stream viewers with automated organic chat activity.',
    isInternalFarm: true,
  },
];

export class ServiceCatalog {
  private services = new Map<string, CatalogService>();

  constructor(initialServices: CatalogService[] = DEFAULT_SERVICES) {
    for (const s of initialServices) {
      this.services.set(s.id, s);
    }
  }

  listServices(): CatalogService[] {
    return Array.from(this.services.values());
  }

  getService(id: string): CatalogService | undefined {
    return this.services.get(id);
  }

  calculateCost(serviceId: string, quantity: number): number {
    const service = this.services.get(serviceId);
    if (!service) throw new Error(`Service ${serviceId} not found`);

    return Number(((quantity / 1000) * service.ratePer1000).toFixed(2));
  }
}

export class OrderPipeline {
  private orders = new Map<string, PanelOrder>();

  constructor(private catalog: ServiceCatalog) {}

  createOrder(input: CreateOrderInput): PanelOrder {
    const service = this.catalog.getService(input.serviceId);
    if (!service) throw new Error(`Service ${input.serviceId} does not exist`);

    if (input.quantity < service.minQuantity) {
      throw new Error(`Quantity ${input.quantity} is below service minimum of ${service.minQuantity}`);
    }

    if (input.quantity > service.maxQuantity) {
      throw new Error(`Quantity ${input.quantity} exceeds service maximum of ${service.maxQuantity}`);
    }

    const chargeAmount = this.catalog.calculateCost(input.serviceId, input.quantity);
    const id = randomUUID();

    const order: PanelOrder = {
      ...input,
      id,
      status: 'SUBMITTED',
      chargeAmount,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.orders.set(id, order);
    return order;
  }

  getOrder(id: string): PanelOrder | undefined {
    return this.orders.get(id);
  }

  updateOrderStatus(id: string, status: OrderStatus): PanelOrder {
    const order = this.orders.get(id);
    if (!order) throw new Error(`Order ${id} not found`);

    order.status = status;
    order.updatedAt = new Date();
    return order;
  }

  listOrders(): PanelOrder[] {
    return Array.from(this.orders.values());
  }
}
