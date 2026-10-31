import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, handleSessionRefresh } from '@/security/auth';
import { discoverCrossPlatformHandles, SocialPlatform } from '@/intelligence/osint';

export const dynamic = 'force-dynamic';

const osintSchema = z.object({
  username: z.string().trim().min(1, 'username is required'),
  platforms: z.array(z.enum(['TIKTOK', 'INSTAGRAM', 'X', 'YOUTUBE'])).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = osintSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((i) => i.message).join('; ') },
        { status: 400 }
      );
    }

    const results = await discoverCrossPlatformHandles(parsed.data.username, {
      platforms: parsed.data.platforms as SocialPlatform[] | undefined,
    });

    const response = NextResponse.json({
      success: true,
      results,
      provenance: 'live',
      scannedAt: new Date().toISOString(),
    });

    return handleSessionRefresh(auth, response);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
