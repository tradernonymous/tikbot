import { describe, it, expect, beforeEach } from 'vitest';
import { ServiceCatalog, OrderPipeline } from '../catalog';

describe('ServiceCatalog', () => {
  let catalog: ServiceCatalog;

  beforeEach(() => {
    catalog = new ServiceCatalog();
  });

  it('lists active services and enforces min/max quantities', () => {
    const services = catalog.listServices();
    expect(services.length).toBeGreaterThan(0);

    const viewsService = catalog.getService('TIKTOK_VIEWS_ORGANIC');
    expect(viewsService).toBeDefined();
    expect(viewsService?.minQuantity).toBe(100);
    expect(viewsService?.maxQuantity).toBe(100_000);
  });

  it('calculates order cost based on rate per 1000', () => {
    const cost = catalog.calculateCost('TIKTOK_VIEWS_ORGANIC', 5000);
    // Rate is $0.50 per 1000 -> 5000 = $2.50
    expect(cost).toBe(2.5);
  });
});

describe('OrderPipeline', () => {
  let catalog: ServiceCatalog;
  let pipeline: OrderPipeline;

  beforeEach(() => {
    catalog = new ServiceCatalog();
    pipeline = new OrderPipeline(catalog);
  });

  it('creates an order and transitions through lifecycle states', () => {
    const order = pipeline.createOrder({
      serviceId: 'TIKTOK_LIKES_TARGETED',
      targetUrl: 'https://www.tiktok.com/@creator/video/123456789',
      quantity: 500,
      notes: 'Boost for Q4 product announcement',
    });

    expect(order.id).toBeDefined();
    expect(order.status).toBe('SUBMITTED');
    expect(order.chargeAmount).toBeGreaterThan(0);

    const activeOrder = pipeline.updateOrderStatus(order.id, 'IN_PROGRESS');
    expect(activeOrder.status).toBe('IN_PROGRESS');

    const completedOrder = pipeline.updateOrderStatus(order.id, 'COMPLETED');
    expect(completedOrder.status).toBe('COMPLETED');
  });

  it('rejects order if quantity is below minimum requirement', () => {
    expect(() => {
      pipeline.createOrder({
        serviceId: 'TIKTOK_VIEWS_ORGANIC',
        targetUrl: 'https://www.tiktok.com/@creator/video/123456789',
        quantity: 10, // Min is 100
      });
    }).toThrow(/Quantity 10 is below service minimum of 100/);
  });
});
