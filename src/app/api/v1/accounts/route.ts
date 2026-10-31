import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, handleSessionRefresh } from '@/security/auth';
import {
  listAccounts,
  createAccount,
  deleteAccount,
} from '@/repositories/accounts.repository';

export const dynamic = 'force-dynamic';

const createAccountSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  platform: z.enum(['TIKTOK', 'DOUYIN']).optional(),
  proxyId: z.string().nullable().optional(),
  dailyCap: z.coerce.number().positive().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const accounts = await listAccounts();
    const res = NextResponse.json({ success: true, accounts });
    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to list accounts' },
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

    const parseResult = createAccountSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
        },
        { status: 400 }
      );
    }

    const account = await createAccount(parseResult.data);
    const res = NextResponse.json({ success: true, account });
    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create account' },
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
      return NextResponse.json({ success: false, error: 'Account id is required' }, { status: 400 });
    }

    const deleted = await deleteAccount(id);
    const res = NextResponse.json({ success: deleted });
    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete account' },
      { status: 500 }
    );
  }
}
