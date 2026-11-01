import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, handleSessionRefresh } from '@/security/auth';
import {
  createLiveRoomTracker,
  ingestLiveEvent,
  LiveRoomTracker,
  LiveRoomEvent,
} from '@/intelligence/live-intelligence';

export const dynamic = 'force-dynamic';

// Active in-process live room tracker
let activeLiveTracker: LiveRoomTracker | null = null;

const PostActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('connect'),
    targetHandle: z.string().min(1).max(100),
  }),
  z.object({
    action: z.literal('disconnect'),
  }),
  z.object({
    action: z.literal('event'),
    event: z.discriminatedUnion('type', [
      z.object({
        type: z.literal('VIEWER_COUNT'),
        viewerCount: z.number().nonnegative(),
        timestamp: z.string(),
      }),
      z.object({
        type: z.literal('CHAT_MESSAGE'),
        author: z.string(),
        text: z.string(),
        timestamp: z.string(),
      }),
      z.object({
        type: z.literal('GIFT'),
        author: z.string(),
        giftName: z.string(),
        count: z.number().int().positive(),
        timestamp: z.string(),
      }),
    ]),
  }),
]);

export async function GET(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const res = NextResponse.json({
      success: true,
      connected: activeLiveTracker !== null,
      tracker: activeLiveTracker,
      provenance: 'live',
    });

    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch live tracker' },
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
    const parsed = PostActionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.action === 'connect') {
      const cleanHandle = data.targetHandle.trim().replace(/^@/, '');
      activeLiveTracker = createLiveRoomTracker(cleanHandle);

      const res = NextResponse.json({
        success: true,
        connected: true,
        tracker: activeLiveTracker,
      });
      return handleSessionRefresh(auth, res);
    }

    if (data.action === 'disconnect') {
      activeLiveTracker = null;

      const res = NextResponse.json({
        success: true,
        connected: false,
        tracker: null,
      });
      return handleSessionRefresh(auth, res);
    }

    if (data.action === 'event') {
      if (!activeLiveTracker) {
        return NextResponse.json(
          { success: false, error: 'No active live tracker connected' },
          { status: 400 }
        );
      }

      ingestLiveEvent(activeLiveTracker, data.event as LiveRoomEvent);

      const res = NextResponse.json({
        success: true,
        tracker: activeLiveTracker,
      });
      return handleSessionRefresh(auth, res);
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to process live action' },
      { status: 500 }
    );
  }
}
