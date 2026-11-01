export interface CoverFramePickerInput {
  videoDurationSeconds: number;
  sampleCount?: number;
  videoAssetPath?: string;
}

export interface CandidateFrame {
  frameIndex: number;
  timestampSeconds: number;
  contrastScore: number;
  facePresenceScore: number;
  compositeScore: number;
  isRecommended: boolean;
  thumbnailUrl: string;
}

export function extractCandidateCoverFrames(input: CoverFramePickerInput): CandidateFrame[] {
  const duration = Math.max(1, input.videoDurationSeconds);
  const count = input.sampleCount || 5;
  const assetPath = input.videoAssetPath || '/storage/renders/default.mp4';
  const baseName = assetPath.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'video';

  const frames: CandidateFrame[] = [];
  const step = duration / (count + 1);

  let highestScore = -1;
  let bestIndex = 0;

  for (let i = 1; i <= count; i++) {
    const timestampSeconds = Math.round(i * step * 10) / 10;
    // Heuristic: earlier frames (first 3s) get slight boost for TikTok first impression
    const hookBonus = timestampSeconds <= 3.5 ? 10 : 0;
    // Contrast and face presence simulated heuristics
    const contrastScore = Math.min(98, Math.max(50, Math.round(65 + Math.sin(i * 1.5) * 20)));
    const facePresenceScore = Math.min(95, Math.max(40, Math.round(60 + Math.cos(i * 1.2) * 25 + hookBonus)));
    const compositeScore = Math.round(contrastScore * 0.45 + facePresenceScore * 0.55);

    if (compositeScore > highestScore) {
      highestScore = compositeScore;
      bestIndex = i - 1;
    }

    frames.push({
      frameIndex: i - 1,
      timestampSeconds,
      contrastScore,
      facePresenceScore,
      compositeScore,
      isRecommended: false,
      thumbnailUrl: `/api/v1/content/media/frame?asset=${encodeURIComponent(baseName)}&t=${timestampSeconds}`,
    });
  }

  if (frames[bestIndex]) {
    frames[bestIndex].isRecommended = true;
  }

  return frames;
}
