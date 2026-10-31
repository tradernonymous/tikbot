import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, handleSessionRefresh } from '@/security/auth';
import {
  listPublishJobs,
  createPublishJob,
  deletePublishJob,
} from '@/repositories/publish-jobs.repository';

export const dynamic = 'force-dynamic';

const createJobSchema = z.object({
  accountId: z.string().min(1, 'accountId is required'),
  mediaAssetId: z.string().min(1, 'mediaAssetId is required'),
  caption: z.string().min(1, 'caption is required'),
  scheduledAt: z.string().min(1, 'scheduledAt is required'),
});

export async function GET(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const jobs = await listPublishJobs();
    const res = NextResponse.json({ success: true, jobs });
    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to list publish jobs' },
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

    const parseResult = createJobSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
        },
        { status: 400 }
      );
    }

    const job = await createPublishJob(parseResult.data);
    const res = NextResponse.json({ success: true, job });
    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create publish job' },
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
      return NextResponse.json({ success: false, error: 'Job id is required' }, { status: 400 });
    }

    const deleted = await deletePublishJob(id);
    const res = NextResponse.json({ success: deleted });
    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete publish job' },
      { status: 500 }
    );
  }
}
