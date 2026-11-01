import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, handleSessionRefresh } from '@/security/auth';
import { prisma } from '@/lib/prisma';
import { generateHookVariants, evaluateABHookTest } from '@/intelligence/hook-lab';

export const dynamic = 'force-dynamic';

const GetQuerySchema = z.object({
  pattern: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const PostBodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('generate'),
    baseText: z.string().min(1).max(500),
  }),
  z.object({
    action: z.literal('evaluate'),
    variantA: z.object({
      id: z.string(),
      views: z.number().nonnegative(),
      retentionRate: z.number().min(0).max(1),
    }),
    variantB: z.object({
      id: z.string(),
      views: z.number().nonnegative(),
      retentionRate: z.number().min(0).max(1),
    }),
  }),
  z.object({
    action: z.literal('create'),
    pattern: z.string().min(1),
    textTemplate: z.string().min(1).max(500),
    retentionProxyScore: z.number().min(0).max(100).optional(),
  }),
]);

export async function GET(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const { searchParams } = new URL(req.url);
    const parsed = GetQuerySchema.safeParse({
      pattern: searchParams.get('pattern') || undefined,
      limit: searchParams.get('limit') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      );
    }

    const { pattern, limit } = parsed.data;
    const where: any = {};
    if (pattern && pattern !== 'ALL') {
      where.pattern = pattern;
    }

    const hooks = await prisma.hook.findMany({
      where,
      orderBy: { usageCount: 'desc' },
      take: limit,
    });

    const res = NextResponse.json({
      success: true,
      hooks,
      provenance: 'live',
    });

    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch hooks' },
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

    const body = await req.json();
    const parsed = PostBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.action === 'generate') {
      const variants = generateHookVariants(data.baseText);
      const res = NextResponse.json({
        success: true,
        variants,
      });
      return handleSessionRefresh(auth, res);
    }

    if (data.action === 'evaluate') {
      const evaluation = evaluateABHookTest(data.variantA, data.variantB);
      const res = NextResponse.json({
        success: true,
        evaluation,
      });
      return handleSessionRefresh(auth, res);
    }

    if (data.action === 'create') {
      const hook = await prisma.hook.create({
        data: {
          pattern: data.pattern,
          textTemplate: data.textTemplate,
          retentionProxyScore: data.retentionProxyScore ?? 0,
        },
      });

      const res = NextResponse.json({
        success: true,
        hook,
      });
      return handleSessionRefresh(auth, res);
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to process hook action' },
      { status: 500 }
    );
  }
}
