export interface SoundSnapshot {
  soundId: string;
  title: string;
  author: string;
  videoCount: number;
  timestamp: string;
}

export type SoundPhase = 'EMERGING' | 'RISING' | 'PEAK' | 'DECLINING';

export interface SoundLifecycleAnalysis {
  soundId: string;
  title: string;
  phase: SoundPhase;
  growthRatePercent: number;
  accelerationRatePercent: number;
  alertTriggered: boolean;
  alertMessage?: string;
}

export function trackSoundLifecycle(
  snapshots: SoundSnapshot[],
  thresholdPercent: number = 50
): SoundLifecycleAnalysis {
  if (!snapshots || snapshots.length === 0) {
    return {
      soundId: 'unknown',
      title: 'Unknown Track',
      phase: 'EMERGING',
      growthRatePercent: 0,
      accelerationRatePercent: 0,
      alertTriggered: false,
    };
  }

  const sorted = [...snapshots].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const initial = sorted[0];
  const latest = sorted[sorted.length - 1];

  let growthRatePercent = 0;
  if (initial.videoCount > 0) {
    growthRatePercent = Math.round(
      ((latest.videoCount - initial.videoCount) / initial.videoCount) * 100
    );
  }

  // Calculate acceleration between consecutive intervals
  let accelerationRatePercent = 0;
  if (sorted.length >= 3) {
    const mid = sorted[Math.floor(sorted.length / 2)];
    const v1 = mid.videoCount - initial.videoCount;
    const v2 = latest.videoCount - mid.videoCount;
    if (v1 > 0) {
      accelerationRatePercent = Math.round(((v2 - v1) / v1) * 100);
    }
  }

  let phase: SoundPhase = 'EMERGING';
  if (latest.videoCount > 50000 && growthRatePercent < 15) {
    phase = 'DECLINING';
  } else if (latest.videoCount > 100000) {
    phase = 'PEAK';
  } else if (growthRatePercent >= 40 || accelerationRatePercent > 20) {
    phase = 'RISING';
  }

  const alertTriggered = phase === 'RISING' && growthRatePercent >= thresholdPercent;
  const alertMessage = alertTriggered
    ? `Rising crossover detected: "${latest.title}" surged ${growthRatePercent}% in recent window.`
    : undefined;

  return {
    soundId: latest.soundId,
    title: latest.title,
    phase,
    growthRatePercent,
    accelerationRatePercent,
    alertTriggered,
    alertMessage,
  };
}
