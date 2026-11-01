import { describe, it, expect } from 'vitest';
import {
  trackSoundLifecycle,
  SoundSnapshot,
} from '../sound-tracker';

describe('G4.3 Sound Lifecycle Tracker (Phase Detection & Crossover Alerts)', () => {
  it('detects RISING phase and triggers crossover alert when growth exceeds threshold', () => {
    const snapshots: SoundSnapshot[] = [
      { soundId: 's1', title: 'Viral Beat 1', author: 'dj_producer', videoCount: 1000, timestamp: '2026-10-28T00:00:00Z' },
      { soundId: 's1', title: 'Viral Beat 1', author: 'dj_producer', videoCount: 2200, timestamp: '2026-10-30T00:00:00Z' },
      { soundId: 's1', title: 'Viral Beat 1', author: 'dj_producer', videoCount: 5400, timestamp: '2026-11-01T00:00:00Z' },
    ];

    const result = trackSoundLifecycle(snapshots, 50);

    expect(result.phase).toBe('RISING');
    expect(result.growthRatePercent).toBeGreaterThan(50);
    expect(result.alertTriggered).toBe(true);
    expect(result.alertMessage).toContain('Rising crossover detected');
  });

  it('detects DECLINING phase when post velocity flattens or reverses', () => {
    const snapshots: SoundSnapshot[] = [
      { soundId: 's2', title: 'Old Dance Track', author: 'dj_retro', videoCount: 50000, timestamp: '2026-10-25T00:00:00Z' },
      { soundId: 's2', title: 'Old Dance Track', author: 'dj_retro', videoCount: 50500, timestamp: '2026-10-28T00:00:00Z' },
      { soundId: 's2', title: 'Old Dance Track', author: 'dj_retro', videoCount: 50520, timestamp: '2026-11-01T00:00:00Z' },
    ];

    const result = trackSoundLifecycle(snapshots);

    expect(result.phase).toBe('DECLINING');
    expect(result.alertTriggered).toBe(false);
  });
});
