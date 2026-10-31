import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, handleSessionRefresh } from '@/security/auth';
import {
  listProxies,
  createProxy,
  deleteProxy,
} from '@/repositories/proxies.repository';

export const dynamic = 'force-dynamic';

const createProxySchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.coerce.number().positive('Port must be positive'),
  protocol: z.enum(['HTTP', 'HTTPS', 'SOCKS5']).optional(),
  country: z.string().optional(),
  username: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const proxies = await listProxies();
    const res = NextResponse.json({ success: true, proxies });
    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to list proxies' },
      { status: 500 }
    );
  }
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

    const parseResult = createProxySchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
        },
        { status: 400 }
      );
    }

    const proxy = await createProxy(parseResult.data);
    const res = NextResponse.json({ success: true, proxy });
    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create proxy' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const id = req.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Proxy id is required' }, { status: 400 });
    }

    const deleted = await deleteProxy(id);
    const res = NextResponse.json({ success: deleted });
    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete proxy' },
      { status: 500 }
    );
  }
}
