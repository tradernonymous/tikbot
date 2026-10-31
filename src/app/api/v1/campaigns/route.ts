import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, handleSessionRefresh } from '@/security/auth';
import {
  listCampaigns,
  createCampaign,
  updateCampaignStatus,
  deleteCampaign,
} from '@/repositories/campaigns.repository';
import { globalNotificationService } from '@/notifications/service';

export const dynamic = 'force-dynamic';

const createCampaignSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  targetUrl: z.string().min(1, 'Target URL is required'),
  actionType: z.enum(['LIKE', 'COMMENT', 'SAVE', 'SHARE', 'VIEW', 'LIVE_VIEW']),
  targetCount: z.coerce.number().positive('targetCount must be positive'),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RUNNING', 'PAUSED', 'COMPLETED']).optional(),
});

const patchCampaignSchema = z.object({
  id: z.string().min(1, 'id is required'),
  status: z.enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'RUNNING', 'PAUSED', 'COMPLETED']),
});

export async function GET(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const campaigns = await listCampaigns();
    const res = NextResponse.json({ success: true, campaigns });
    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to list campaigns' },
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

    const parseResult = createCampaignSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
        },
        { status: 400 }
      );
    }

    const campaign = await createCampaign(parseResult.data);
    const res = NextResponse.json({ success: true, campaign });
    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create campaign' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
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

    const parseResult = patchCampaignSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
        },
        { status: 400 }
      );
    }

    const success = await updateCampaignStatus(parseResult.data.id, parseResult.data.status);
    if (success && (parseResult.data.status === 'APPROVED' || parseResult.data.status === 'REJECTED')) {
      await globalNotificationService.emitCampaignEvent(
        parseResult.data.id,
        parseResult.data.status,
        parseResult.data.id
      ).catch(() => {});
    }
    const res = NextResponse.json({ success });
    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update campaign' },
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
      return NextResponse.json({ success: false, error: 'Campaign id is required' }, { status: 400 });
    }

    const deleted = await deleteCampaign(id);
    const res = NextResponse.json({ success: deleted });
    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
