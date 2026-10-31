import { NextRequest, NextResponse } from 'next/server';
import { SMMProviderAdapter } from '@/panel/smm-provider';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, apiUrl, apiKey, service, link, quantity, orderId } = body;

    const providerUrl = apiUrl || process.env.SMM_PROVIDER_URL || 'https://justanotherpanel.com/api/v2';
    const providerKey = apiKey || process.env.SMM_PROVIDER_API_KEY || '';

    if (!providerKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'SMM Provider API Key is not configured. Please provide apiKey or set SMM_PROVIDER_API_KEY in Settings / Railway variables.',
        },
        { status: 400 }
      );
    }

    const adapter = new SMMProviderAdapter({
      apiUrl: providerUrl,
      apiKey: providerKey,
    });

    if (action === 'balance') {
      const balance = await adapter.getBalance();
      return NextResponse.json({ success: true, balance });
    }

    if (action === 'order') {
      if (!service || !link || !quantity) {
        return NextResponse.json(
          { success: false, error: 'Missing required parameters: service, link, quantity' },
          { status: 400 }
        );
      }
      const order = await adapter.createExternalOrder({
        service,
        link,
        quantity: Number(quantity),
      });
      return NextResponse.json({ success: true, order });
    }

    if (action === 'status') {
      if (!orderId) {
        return NextResponse.json({ success: false, error: 'Missing orderId' }, { status: 400 });
      }
      const status = await adapter.getOrderStatus(String(orderId));
      return NextResponse.json({ success: true, status });
    }

    if (action === 'services') {
      const services = await adapter.getServices();
      return NextResponse.json({ success: true, services });
    }

    return NextResponse.json({ success: false, error: 'Invalid action requested' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to communicate with SMM Provider API',
      },
      { status: 500 }
    );
  }
}
