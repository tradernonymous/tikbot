export interface TimestampedSegment {
  startSeconds: number;
  endSeconds: number;
  text: string;
}

export interface SmartClippingInput {
  videoTitle: string;
  segments: TimestampedSegment[];
  minDurationSeconds?: number;
  maxDurationSeconds?: number;
}

export interface RankedClipCandidate {
  id: string;
  title: string;
  startSeconds: number;
  endSeconds: number;
  durationSeconds: number;
  hookTimestampSeconds: number;
  hookText: string;
  highlightReason: string;
  viralityScore: number;
}

export interface ClipVariant {
  clipId: string;
  platform: 'TIKTOK' | 'INSTAGRAM_REELS' | 'YOUTUBE_SHORTS';
  caption: string;
  durationSeconds: number;
  startSeconds: number;
  endSeconds: number;
}

const HOOK_TRIGGERS = [
  /^(stop|don't|never|quit)/i,
  /^(did you know|why is nobody|the secret)/i,
  /^(if you|here is how|watch this)/i,
  /^(pov|what happens when)/i,
];

export function extractRankedClips(input: SmartClippingInput): RankedClipCandidate[] {
  const minDuration = input.minDurationSeconds ?? 15;
  const maxDuration = input.maxDurationSeconds ?? 60;
  const segments = input.segments;

  if (!segments || segments.length === 0) {
    return [];
  }

  const candidates: RankedClipCandidate[] = [];

  for (let i = 0; i < segments.length; i++) {
    const startSeg = segments[i];
    const text = startSeg.text.trim();

    // Check if segment is a strong hook candidate
    const isHook = HOOK_TRIGGERS.some((pattern) => pattern.test(text));
    if (!isHook && i > 0) continue; // Skip non-hook intros unless it's the very start

    let endIdx = i;
    let accumulatedText = text;

    for (let j = i + 1; j < segments.length; j++) {
      const segDuration = segments[j].endSeconds - startSeg.startSeconds;
      if (segDuration > maxDuration) break;
      endIdx = j;
      accumulatedText += ' ' + segments[j].text;
    }

    const durationSeconds = Math.round((segments[endIdx].endSeconds - startSeg.startSeconds) * 10) / 10;
    if (durationSeconds < minDuration) continue;

    // Calculate virality score
    let viralityScore = 60;
    if (isHook) viralityScore += 20;
    if (/\b\d+%\b|\b\d+\b/i.test(accumulatedText)) viralityScore += 10; // Contains stats
    if (durationSeconds >= 20 && durationSeconds <= 45) viralityScore += 10; // Sweet spot duration

    candidates.push({
      id: `clip-${startSeg.startSeconds}-${segments[endIdx].endSeconds}`,
      title: startSeg.text,
      startSeconds: startSeg.startSeconds,
      endSeconds: segments[endIdx].endSeconds,
      durationSeconds,
      hookTimestampSeconds: startSeg.startSeconds,
      hookText: startSeg.text,
      highlightReason: isHook ? 'High urgency hook + concrete statistic' : 'Topical highlight segment',
      viralityScore: Math.min(99, viralityScore),
    });
  }

  return candidates.sort((a, b) => b.viralityScore - a.viralityScore);
}

export function convertClipToVariant(
  clip: RankedClipCandidate,
  options?: { platform?: 'TIKTOK' | 'INSTAGRAM_REELS' | 'YOUTUBE_SHORTS' }
): ClipVariant {
  const platform = options?.platform || 'TIKTOK';
  return {
    clipId: clip.id,
    platform,
    caption: `${clip.hookText} #viral #growth #shorts`,
    durationSeconds: clip.durationSeconds,
    startSeconds: clip.startSeconds,
    endSeconds: clip.endSeconds,
  };
}
