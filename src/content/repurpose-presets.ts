import type { TargetPlatform } from './cross-platform-scheduler';

export interface SafeZone {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface PlatformPresetConfig {
  platform: TargetPlatform;
  aspectRatio: string;
  width: number;
  height: number;
  maxDurationSeconds: number;
  videoBitrate: string;
  audioBitrate: string;
  safeZone: SafeZone;
}

export const PLATFORM_PRESETS: Record<TargetPlatform, PlatformPresetConfig> = {
  TIKTOK: {
    platform: 'TIKTOK',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    maxDurationSeconds: 600,
    videoBitrate: '2500k',
    audioBitrate: '192k',
    safeZone: { top: 120, bottom: 280, left: 24, right: 120 },
  },
  YOUTUBE_SHORTS: {
    platform: 'YOUTUBE_SHORTS',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    maxDurationSeconds: 60,
    videoBitrate: '3000k',
    audioBitrate: '256k',
    safeZone: { top: 80, bottom: 200, left: 24, right: 100 },
  },
  INSTAGRAM_REELS: {
    platform: 'INSTAGRAM_REELS',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    maxDurationSeconds: 90,
    videoBitrate: '3500k',
    audioBitrate: '256k',
    safeZone: { top: 100, bottom: 220, left: 24, right: 110 },
  },
};

export interface MediaValidationInput {
  durationSeconds: number;
  width?: number;
  height?: number;
}

export interface MediaValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePlatformMedia(
  platform: TargetPlatform,
  input: MediaValidationInput
): MediaValidationResult {
  const preset = PLATFORM_PRESETS[platform];
  const errors: string[] = [];

  if (input.durationSeconds > preset.maxDurationSeconds) {
    errors.push(
      `Duration ${input.durationSeconds}s exceeds maximum allowed (${preset.maxDurationSeconds}s)`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function buildFFmpegPresetArgs(
  platform: TargetPlatform,
  inputPath: string,
  outputPath: string
): string[] {
  const preset = PLATFORM_PRESETS[platform];
  return [
    '-y',
    '-i',
    inputPath,
    '-vf',
    `scale=${preset.width}:${preset.height}:force_original_aspect_ratio=decrease,pad=${preset.width}:${preset.height}:(ow-iw)/2:(oh-ih)/2`,
    '-c:v',
    'libx264',
    '-b:v',
    preset.videoBitrate,
    '-c:a',
    'aac',
    '-b:a',
    preset.audioBitrate,
    outputPath,
  ];
}
