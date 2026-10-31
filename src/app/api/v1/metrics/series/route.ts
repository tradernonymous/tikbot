import { NextRequest, NextResponse } from 'next/server';
import { requireSession, handleSessionRefresh } from '@/security/auth';
import { queryMetricSeries } from '@/repositories/metric-samples.repository';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const querySeriesSchema = z.object({
  targetType: z.string().min(1, 'targetType is required'),
  targetId: z.string().min(1, 'targetId is required'),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const { searchParams } = new URL(req.url);
    const rawQuery: Record<string, any> = {};
    searchParams.forEach((val, key) => {
      rawQuery[key] = val;
    });

    const parsed = querySeriesSchema.safeParse(rawQuery);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues.map((i) => i.message).join(', '),
        },
        { status: 400 }
      );
    }

    const from = parsed.data.from ? new Date(parsed.data.from) : undefined;
    const to = parsed.data.to ? new Date(parsed.data.to) : undefined;

    const series = await queryMetricSeries(
      parsed.data.targetType,
      parsed.data.targetId,
      from,
      to
    );

    const res = NextResponse.json({
      success: true,
      series,
    });

    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to query metric series' },
      { status: 500 }
    );
  }
}
