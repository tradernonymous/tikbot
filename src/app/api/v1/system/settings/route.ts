import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, handleSessionRefresh } from '@/security/auth';
import { getSettingsStatus, setSystemSetting } from '@/storage/system-settings';

export const dynamic = 'force-dynamic';

const allowedKeys = z.enum(['SMM_PROVIDER_API_KEY', 'SMM_PROVIDER_URL']);

const postSettingSchema = z.object({
  key: allowedKeys,
  value: z.string().min(1, 'Value cannot be empty'),
});

export async function GET(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const settings = await getSettingsStatus();
    const res = NextResponse.json({ success: true, settings });
    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch settings' },
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

    const parseResult = postSettingSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
        },
        { status: 400 }
      );
    }

    const { key, value } = parseResult.data;
    await setSystemSetting(key, value);

    const res = NextResponse.json({
      success: true,
      key,
      configured: true,
    });
    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update system setting' },
      { status: 500 }
    );
  }
}
