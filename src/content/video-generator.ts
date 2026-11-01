import { createHash } from 'node:crypto';

export const VIDEO_TEMPLATES = ['FACELESS_LISTICLE', 'POV', 'TUTORIAL'] as const;
export type VideoTemplate = (typeof VIDEO_TEMPLATES)[number];

export interface VideoGenerationJobInput {
  template: VideoTemplate;
  script: string;
  aspectRatio?: '9:16' | '16:9' | '1:1';
  voiceId?: string;
  includeCaptions?: boolean;
  backgroundTrack?: string;
}

export interface VideoGenerationResult {
  jobId: string;
  template: VideoTemplate;
  outputPath: string;
  durationSeconds: number;
  aspectRatio: string;
  fingerprintSha256: string;
  status: 'COMPLETED' | 'FAILED';
  provenance: 'live_ffmpeg' | 'mock';
}

export interface VideoRendererDriver {
  render(input: VideoGenerationJobInput): Promise<VideoGenerationResult>;
}

export class MockVideoRendererDriver implements VideoRendererDriver {
  async render(input: VideoGenerationJobInput): Promise<VideoGenerationResult> {
    const aspectRatio = input.aspectRatio || '9:16';
    const wordCount = input.script.split(/\s+/).filter(Boolean).length;
    // ~2.5 words per second speaking rate
    const durationSeconds = Math.max(5, Math.round((wordCount / 2.5) * 10) / 10);

    const hashPayload = `${input.template}|${input.script}|${aspectRatio}|${durationSeconds}`;
    const fingerprintSha256 = createHash('sha256').update(hashPayload).digest('hex');
    const jobId = `gen-${fingerprintSha256.substring(0, 12)}`;

    return {
      jobId,
      template: input.template,
      outputPath: `/var/storage/renders/${jobId}.mp4`,
      durationSeconds,
      aspectRatio,
      fingerprintSha256,
      status: 'COMPLETED',
      provenance: 'mock',
    };
  }
}

const defaultDriver = new MockVideoRendererDriver();

export async function generateVideoAsset(
  input: VideoGenerationJobInput,
  options?: { driver?: VideoRendererDriver }
): Promise<VideoGenerationResult> {
  const driver = options?.driver || defaultDriver;
  return driver.render(input);
}
