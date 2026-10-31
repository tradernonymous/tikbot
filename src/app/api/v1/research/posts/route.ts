import { NextRequest, NextResponse } from 'next/server';
import { requireSession, handleSessionRefresh } from '@/security/auth';
import {
  queryResearchPostsSchema,
  createResearchPostSchema,
} from '@/repositories/research.schemas';
import {
  listResearchPosts,
  upsertResearchPost,
} from '@/repositories/research-posts.repository';

export const dynamic = 'force-dynamic';

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

    const parsed = queryResearchPostsSchema.safeParse(rawQuery);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues.map((i) => i.message).join(', '),
        },
        { status: 400 }
      );
    }

    const { posts, nextCursor } = await listResearchPosts(parsed.data);

    const res = NextResponse.json({
      success: true,
      posts,
      nextCursor,
    });

    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to list research posts' },
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
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body' },
        { status: 400 }
      );
    }

    const parsed = createResearchPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues.map((i) => i.message).join(', '),
        },
        { status: 400 }
      );
    }

    const post = await upsertResearchPost(parsed.data);
    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Database persistence failed' },
        { status: 500 }
      );
    }

    const res = NextResponse.json({
      success: true,
      post,
    });

    return handleSessionRefresh(auth, res);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to create research post' },
      { status: 500 }
    );
  }
}
