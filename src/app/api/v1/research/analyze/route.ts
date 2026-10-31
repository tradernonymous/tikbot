import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireSession, handleSessionRefresh } from '@/security/auth';
import { DouyinTikTokClient } from '@/research/download-api-client';
import { analyzeTranscript } from '@/intelligence/transcripts';

export const dynamic = 'force-dynamic';

const analyzeSchema = z.object({
  url: z.string().trim().min(1, 'url is required'),
  baselineViews: z.number().optional().default(50000),
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

    const parsed = analyzeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map((i) => i.message).join('; ') },
        { status: 400 }
      );
    }

    const client = new DouyinTikTokClient();
    const mediaData = await client.extractVideoData(parsed.data.url);

    const baseline = parsed.data.baselineViews > 0 ? parsed.data.baselineViews : 50000;
    const outlierScore = Math.round((mediaData.stats.views / baseline) * 10) / 10;

    const transcriptAnalysis = analyzeTranscript(mediaData.caption || 'Authentic video review');

    const result = {
      author: mediaData.author.handle.startsWith('@') ? mediaData.author.handle : `@${mediaData.author.handle}`,
      authorNickname: mediaData.author.nickname,
      caption: mediaData.caption,
      outlierScore,
      views: mediaData.stats.views,
      likes: mediaData.stats.likes,
      comments: mediaData.stats.comments,
      shares: mediaData.stats.shares,
      hookText: transcriptAnalysis.hookText,
      hookType: transcriptAnalysis.hookType,
      claims: transcriptAnalysis.claims,
      atoms: transcriptAnalysis.atoms,
      downloadUrl: mediaData.playUrl,
      coverUrl: mediaData.coverUrl,
    };

    const response = NextResponse.json({
      success: true,
      result,
      provenance: 'live',
      analyzedAt: new Date().toISOString(),
    });

    return handleSessionRefresh(auth, response);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to analyze video' },
      { status: 500 }
    );
  }
}
