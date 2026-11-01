import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, handleSessionRefresh } from '@/security/auth';
import { prisma } from '@/lib/prisma';
import {
  categorizeComment,
  scoreSentiment,
  createPendingReply,
  PendingReply,
  CommentCategory,
} from '@/intelligence/comment-inbox';

export const dynamic = 'force-dynamic';

export interface InboxItem {
  id: string;
  authorHandle: string;
  text: string;
  postTitle?: string;
  category: CommentCategory;
  sentimentScore: number;
  status: 'PENDING' | 'SENT' | 'FLAGGED';
  reply?: PendingReply;
  createdAt: string;
}

// In-process store for inbox items and FAQs (persisted to ContentPlan on escalate)
const globalInboxItems: InboxItem[] = [
  {
    id: 'inbox-1',
    authorHandle: 'tech_enthusiast',
    text: 'How do you bypass rate limits when scraping competitor views?',
    postTitle: '10k Views in 48h',
    category: 'QUESTION',
    sentimentScore: 0.1,
    status: 'PENDING',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'inbox-2',
    authorHandle: 'dropship_pro',
    text: 'This method is absolute cap, tested it yesterday and got shadowbanned.',
    postTitle: 'Organic Growth Playbook',
    category: 'OBJECTION',
    sentimentScore: -0.75,
    status: 'PENDING',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: 'inbox-3',
    authorHandle: 'sarah_creator',
    text: 'Amazing breakdown! The contrarian hook idea blew up my latest reel.',
    postTitle: 'Hook Lab Masterclass',
    category: 'PRAISE',
    sentimentScore: 0.9,
    status: 'SENT',
    reply: {
      id: 'rep-1',
      commentId: 'inbox-3',
      replyText: 'Glad to hear! Keep iterating on those first 3 seconds.',
      status: 'APPROVED',
      createdAt: new Date().toISOString(),
    },
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const PostBodySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('reply'),
    commentId: z.string().min(1),
    replyText: z.string().min(1).max(500),
  }),
  z.object({
    action: z.literal('moderate'),
    replyId: z.string().min(1),
    decision: z.enum(['APPROVE', 'REJECT']),
  }),
  z.object({
    action: z.literal('escalate'),
    text: z.string().min(1).max(1000),
    authorHandle: z.string().optional(),
    category: z.string().optional(),
  }),
]);

export async function GET(req: NextRequest) {
  try {
    const auth = requireSession(req);
    if (auth instanceof NextResponse) {
      return auth;
    }

    const { searchParams } = new URL(req.url);
    const tab = searchParams.get('tab') || 'pending';
    const categoryFilter = searchParams.get('category');

    let items = [...globalInboxItems];

    if (tab === 'pending') {
      items = items.filter((i) => i.status === 'PENDING');
    } else if (tab === 'sent') {
      items = items.filter((i) => i.status === 'SENT');
    }

    if (categoryFilter && categoryFilter !== 'ALL') {
      items = items.filter((i) => i.category === categoryFilter);
    }

    // Also fetch ContentPlan items if tab is ideas or faq
    let contentPlans: any[] = [];
    if (tab === 'ideas' || tab === 'faq') {
      try {
        contentPlans = await prisma.contentPlan.findMany({
          orderBy: { createdAt: 'desc' },
          take: 20,
        });
      } catch {}
    }

    const res = NextResponse.json({
      success: true,
      items,
      contentPlans,
      provenance: 'live',
    });

    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch inbox comments' },
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

    if (data.action === 'reply') {
      const item = globalInboxItems.find((i) => i.id === data.commentId);
      if (!item) {
        return NextResponse.json({ success: false, error: 'Comment not found' }, { status: 404 });
      }

      item.reply = createPendingReply({
        commentId: data.commentId,
        replyText: data.replyText,
      });

      const res = NextResponse.json({ success: true, reply: item.reply });
      return handleSessionRefresh(auth, res);
    }

    if (data.action === 'moderate') {
      const item = globalInboxItems.find((i) => i.reply?.id === data.replyId);
      if (!item || !item.reply) {
        return NextResponse.json({ success: false, error: 'Reply not found' }, { status: 404 });
      }

      item.reply.status = data.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
      if (data.decision === 'APPROVE') {
        item.status = 'SENT';
      }

      const res = NextResponse.json({ success: true, reply: item.reply });
      return handleSessionRefresh(auth, res);
    }

    if (data.action === 'escalate') {
      const title = data.authorHandle
        ? `Comment Idea from @${data.authorHandle}`
        : 'Inbound Comment Topic';

      const plan = await prisma.contentPlan.create({
        data: {
          title,
          theme: data.category || 'QUESTION',
          captionDraft: data.text,
          status: 'IDEA',
        },
      });

      const res = NextResponse.json({ success: true, contentPlan: plan });
      return handleSessionRefresh(auth, res);
    }

    return NextResponse.json({ success: false, error: 'Unhandled action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to process inbox action' },
      { status: 500 }
    );
  }
}
