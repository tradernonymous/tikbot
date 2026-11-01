import { describe, it, expect, vi } from 'vitest';
import {
  generateVideoAsset,
  VIDEO_TEMPLATES,
  VideoGenerationJobInput,
  MockVideoRendererDriver,
} from '../video-generator';

describe('A3.1 Generation Sidecar (MoneyPrinterTurbo-pattern)', () => {
  it('supports faceless listicle, POV, and tutorial templates with 9:16 aspect ratio', () => {
    expect(VIDEO_TEMPLATES).toContain('FACELESS_LISTICLE');
    expect(VIDEO_TEMPLATES).toContain('POV');
    expect(VIDEO_TEMPLATES).toContain('TUTORIAL');
  });

  it('renders a 9:16 video from script, generates SHA-256 fingerprint and output metadata', async () => {
    const input: VideoGenerationJobInput = {
      template: 'FACELESS_LISTICLE',
      script: 'Top 3 productivity hacks you never heard of. Number one: batching notifications.',
      aspectRatio: '9:16',
      includeCaptions: true,
    };

    const result = await generateVideoAsset(input);

    expect(result.status).toBe('COMPLETED');
    expect(result.template).toBe('FACELESS_LISTICLE');
    expect(result.aspectRatio).toBe('9:16');
    expect(result.durationSeconds).toBeGreaterThan(0);
    expect(result.fingerprintSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(result.outputPath).toContain('.mp4');
  });

  it('supports custom renderer driver injection for mock or FFmpeg execution', async () => {
    const customDriver = new MockVideoRendererDriver();
    const renderSpy = vi.spyOn(customDriver, 'render');

    const result = await generateVideoAsset(
      {
        template: 'POV',
        script: 'POV: You automated all your TikTok posting.',
      },
      { driver: customDriver }
    );

    expect(renderSpy).toHaveBeenCalled();
    expect(result.template).toBe('POV');
  });
});
