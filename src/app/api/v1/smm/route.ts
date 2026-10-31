import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, handleSessionRefresh } from '@/security/auth';
import { SMMProviderAdapter } from '@/panel/smm-provider';
import { getSystemSetting } from '@/storage/system-settings';

const ALLOWED_HOSTS = [
  'supplierfollower.com',
  'justanotherpanel.com',
  'api.supplierfollower.com',
];

const balanceSchema = z.object({
  action: z.literal('balance'),
});

const servicesSchema = z.object({
  action: z.literal('services'),
});

const orderSchema = z.object({
  action: z.literal('order'),
  service: z.union([z.string(), z.number()]).transform(String).pipe(z.string().min(1, 'service is required')),
  link: z.string().min(1, 'link is required'),
  quantity: z.union([z.string(), z.number()]).pipe(z.coerce.number().positive('quantity must be positive')),
  runs: z.union([z.string(), z.number()]).optional(),
  interval: z.union([z.string(), z.number()]).optional(),
});

const statusSchema = z.object({
  action: z.literal('status'),
  orderId: z.union([z.string(), z.number()]).transform(String).pipe(z.string().min(1, 'orderId is required')),
});

const smmRequestSchema = z.discriminatedUnion('action', [
  balanceSchema,
  servicesSchema,
  orderSchema,
  statusSchema,
]);

function validateProviderUrl(urlStr: string): { valid: boolean; error?: string } {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return { valid: false, error: 'Invalid SMM provider URL' };
  }
  if (parsed.protocol !== 'https:') {
    return { valid: false, error: 'SMM provider URL must use https protocol' };
  }
  const host = parsed.hostname.toLowerCase();
  const isAllowed = ALLOWED_HOSTS.some(allowed => host === allowed || host.endsWith('.' + allowed));
  if (!isAllowed) {
    return { valid: false, error: `SMM provider host '${host}' is not in allowed hosts list` };
  }
  return { valid: true };
}

export async function POST(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    // SSRF Prevention: disallow apiUrl and apiKey in client body
    if ('apiUrl' in body) {
      return NextResponse.json(
        { success: false, error: 'apiUrl parameter is not allowed in request body (SSRF protection)' },
        { status: 400 }
      );
    }
    if ('apiKey' in body) {
      return NextResponse.json(
        { success: false, error: 'apiKey parameter is not allowed in request body (security policy)' },
        { status: 400 }
      );
    }

    const parseResult = smmRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues
            .map(e => (e.path.length ? `${e.path.join('.')}: ${e.message}` : e.message))
            .join('; '),
        },
        { status: 400 }
      );
    }

    const validatedData = parseResult.data;
    const providerUrl = (await getSystemSetting('SMM_PROVIDER_URL')) || process.env.SMM_PROVIDER_URL || 'https://supplierfollower.com/api/v2';
    const providerKey = (await getSystemSetting('SMM_PROVIDER_API_KEY')) || process.env.SMM_PROVIDER_API_KEY || '';

    const urlValidation = validateProviderUrl(providerUrl);
    if (!urlValidation.valid) {
      return NextResponse.json({ success: false, error: urlValidation.error }, { status: 400 });
    }

    if (!providerKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'SMM Provider API Key is not configured on server. Please set SMM_PROVIDER_API_KEY in server environment / settings.',
        },
        { status: 400 }
      );
    }

    const adapter = new SMMProviderAdapter({
      apiUrl: providerUrl,
      apiKey: providerKey,
    });

    let response: NextResponse;
    if (validatedData.action === 'balance') {
      const balance = await adapter.getBalance();
      response = NextResponse.json({ success: true, balance });
    } else if (validatedData.action === 'order') {
      const order = await adapter.createExternalOrder({
        service: validatedData.service,
        link: validatedData.link,
        quantity: validatedData.quantity,
      });
      response = NextResponse.json({ success: true, order });
    } else if (validatedData.action === 'status') {
      const status = await adapter.getOrderStatus(validatedData.orderId);
      response = NextResponse.json({ success: true, status });
    } else if (validatedData.action === 'services') {
      const services = await adapter.getServices();
      response = NextResponse.json({ success: true, services });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action requested' }, { status: 400 });
    }

    return handleSessionRefresh(auth, response);
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
