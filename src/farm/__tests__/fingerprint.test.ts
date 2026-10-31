import { describe, it, expect } from 'vitest';
import {
  generateDeviceFingerprint,
  getDeterministicFingerprintForAccount,
  type DeviceFingerprint,
} from '../fingerprint';

describe('Device Fingerprint Generation & Rotation', () => {
  it('generates plausible browser hardware and screen attributes', () => {
    const fp = generateDeviceFingerprint('DESKTOP');

    expect(fp.userAgent).toContain('Mozilla/5.0');
    expect(fp.viewport.width).toBeGreaterThanOrEqual(1280);
    expect(fp.viewport.height).toBeGreaterThanOrEqual(720);
    expect(fp.webglRenderer).toBeDefined();
    expect(fp.hardwareConcurrency).toBeGreaterThanOrEqual(4);
    expect(fp.canvasNoiseSeed).toBeGreaterThan(0);
  });

  it('generates mobile viewport and user-agent for MOBILE profile', () => {
    const fp = generateDeviceFingerprint('MOBILE');

    expect(fp.viewport.width).toBeLessThanOrEqual(500);
    expect(fp.viewport.isMobile).toBe(true);
    expect(fp.userAgent).toMatch(/iPhone|Android/);
  });

  it('guarantees deterministic sticky fingerprint binding for a given account ID', () => {
    const fp1 = getDeterministicFingerprintForAccount('account-sticky-alpha');
    const fp2 = getDeterministicFingerprintForAccount('account-sticky-alpha');

    expect(fp1.userAgent).toBe(fp2.userAgent);
    expect(fp1.canvasNoiseSeed).toBe(fp2.canvasNoiseSeed);
    expect(fp1.webglRenderer).toBe(fp2.webglRenderer);

    const fpDifferent = getDeterministicFingerprintForAccount('account-sticky-beta');
    expect(fpDifferent.canvasNoiseSeed).not.toBe(fp1.canvasNoiseSeed);
  });
});
