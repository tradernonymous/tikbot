export type WatchType = 'COMPLETION' | 'REWATCH' | 'PARTIAL';

export interface WatchSessionProfile {
  watchType: WatchType;
  watchDurationSeconds: number;
  loopCount: number;
  completionRate: number;
}

export function simulateWatchSession(
  accountId: string,
  videoDurationSeconds: number
): WatchSessionProfile {
  const seed = (accountId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 100;
  const jitter = ((seed % 20) - 10) / 10; // -1.0 to +1.0 sec

  // Distribution: ~70% completion, ~20% rewatch, ~10% partial
  if (seed < 20) {
    // Rewatch: watch 2x
    const duration = Math.round(videoDurationSeconds * 2.0 + Math.max(0, jitter));
    return {
      watchType: 'REWATCH',
      watchDurationSeconds: duration,
      loopCount: 2,
      completionRate: 2.0,
    };
  }

  if (seed < 90) {
    // Single Full Completion with slight dwell jitter
    const duration = Math.round(videoDurationSeconds + Math.max(0.5, jitter + 1.0));
    return {
      watchType: 'COMPLETION',
      watchDurationSeconds: duration,
      loopCount: 1,
      completionRate: 1.0,
    };
  }

  // Partial watch: 50% to 85% of duration
  const partialRatio = 0.5 + ((seed % 35) / 100);
  const duration = Math.round(videoDurationSeconds * partialRatio);
  return {
    watchType: 'PARTIAL',
    watchDurationSeconds: duration,
    loopCount: 1,
    completionRate: partialRatio,
  };
}
