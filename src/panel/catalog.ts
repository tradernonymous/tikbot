import { randomUUID } from 'node:crypto';

export type SMMServiceCategory = 'VIEWS' | 'LIKES' | 'COMMENTS' | 'SHARES' | 'SAVES' | 'LIVE_VIEWS';

export interface CatalogService {
  id: string;
  name: string;
  category: SMMServiceCategory;
  ratePer1000: number; // in MYR / USD
  minQuantity: number;
  maxQuantity: number;
  description: string;
  isInternalFarm: boolean;
  currency?: string;
  smmServiceId?: string;
}

export const SUPPLIER_FOLLOWER_TIKTOK_SERVICES: Record<
  SMMServiceCategory,
  { id: string; name: string; ratePer1000: number; min: number; max: number; note: string }[]
> = {
  VIEWS: [
    {
      id: '12886',
      name: 'TikTok Video Views [Real Device Farm] [R30] (Recommended)',
      ratePer1000: 0.2639,
      min: 100,
      max: 10000000,
      note: 'Stable real device farm delivery, 30 days refill, 50K/day pace.',
    },
    {
      id: '12578',
      name: 'TikTok Views [HQ Monetisation Tier] [R30]',
      ratePer1000: 0.7356,
      min: 500,
      max: 10000000,
      note: 'High-quality impression pings suitable for TikTok Creator Rewards.',
    },
    {
      id: '12702',
      name: 'TikTok Views [Fast Low-Drop] [No Refill]',
      ratePer1000: 0.0560,
      min: 100,
      max: 10000000,
      note: 'Instant fast delivery (RM 0.056 per 1k views).',
    },
    {
      id: '12368',
      name: 'TikTok Video Views [SF Exclusive #2] ⭐️🔥⚡️',
      ratePer1000: 0.7030,
      min: 100,
      max: 10000000,
      note: 'Exclusive high-retention pool directly bypasses algorithmic shadowbans.',
    },
  ],
  LIKES: [
    {
      id: '12956',
      name: 'TikTok Likes [Instant Real Mix] (Cheapest)',
      ratePer1000: 3.8351,
      min: 10,
      max: 100000,
      note: 'Instant delivery from real accounts (RM 3.84 per 1k likes).',
    },
    {
      id: '12951',
      name: 'TikTok Likes [100% Real Accounts] [100K/D] ⚡️',
      ratePer1000: 5.0075,
      min: 10,
      max: 10000000,
      note: '100% active profile interactions with realistic avatar profiles.',
    },
    {
      id: '12533',
      name: 'TikTok Likes [Super HQ Low Drop] [R30 Refill] ♻️',
      ratePer1000: 8.4532,
      min: 10,
      max: 25000,
      note: 'Super HQ non-drop likes backed by 30-day automatic refill.',
    },
  ],
  COMMENTS: [
    {
      id: '12271',
      name: '10 Targeted Custom Comments (Malaysia / English)',
      ratePer1000: 130.50,
      min: 1,
      max: 1,
      note: 'Pack of 10 human-written organic comments (RM 1.30 per 10 comments).',
    },
    {
      id: '12270',
      name: '30 Targeted Custom Comments (Malaysia / English)',
      ratePer1000: 130.50,
      min: 1,
      max: 1,
      note: 'Pack of 30 human-written organic comments (RM 3.91 per 30 comments).',
    },
    {
      id: '12269',
      name: '50 Targeted Custom Comments (Malaysia / English)',
      ratePer1000: 130.50,
      min: 1,
      max: 1,
      note: 'Pack of 50 human-written organic comments (RM 6.52 per 50 comments).',
    },
  ],
  LIVE_VIEWS: [
    {
      id: '12905',
      name: 'TikTok Live Stream Viewers [15 Minutes]',
      ratePer1000: 19.7991,
      min: 10,
      max: 50000,
      note: 'Maintains live viewer audience for 15 minutes of stream.',
    },
    {
      id: '12906',
      name: 'TikTok Live Stream Viewers [30 Minutes]',
      ratePer1000: 39.4433,
      min: 10,
      max: 50000,
      note: 'Maintains live viewer audience for 30 minutes of stream.',
    },
    {
      id: '12751',
      name: '100 Live Chat Comments + Screen Taps (Malaysia)',
      ratePer1000: 130.50,
      min: 1,
      max: 1,
      note: '100 automated live chat interactions and screen tap likes (RM 13.05).',
    },
  ],
  SHARES: [
    {
      id: '12832',
      name: 'TikTok Engagement Combo Pack 🔥',
      ratePer1000: 21.06,
      min: 1,
      max: 1,
      note: 'Multi-interaction combo pack: views + saves + shares (RM 21.06).',
    },
  ],
  SAVES: [
    {
      id: '12832',
      name: 'TikTok Video Saves & Favorites Pack',
      ratePer1000: 21.06,
      min: 1,
      max: 1,
      note: 'Algorithmic save signals to boost FYP recommendation ranking.',
    },
  ],
};

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
