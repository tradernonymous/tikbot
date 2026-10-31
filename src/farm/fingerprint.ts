import crypto from 'node:crypto';

export type DeviceType = 'DESKTOP' | 'MOBILE';

export interface ViewportConfig {
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
}

export interface DeviceFingerprint {
  deviceType: DeviceType;
  userAgent: string;
  viewport: ViewportConfig;
  webglVendor: string;
  webglRenderer: string;
  hardwareConcurrency: number;
  deviceMemoryGb: number;
  canvasNoiseSeed: number;
}

const DESKTOP_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0',
];

const MOBILE_USER_AGENTS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
];

const WEBGL_CONFIGS = [
  { vendor: 'Google Inc. (NVIDIA)', renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)' },
  { vendor: 'Google Inc. (AMD)', renderer: 'ANGLE (AMD, AMD Radeon RX 6700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)' },
  { vendor: 'Apple Inc.', renderer: 'Apple M2' },
];

export function generateDeviceFingerprint(type: DeviceType = 'DESKTOP', seed?: number): DeviceFingerprint {
  const isDesktop = type === 'DESKTOP';
  const uas = isDesktop ? DESKTOP_USER_AGENTS : MOBILE_USER_AGENTS;

  const pseudoRandom = seed !== undefined ? (seed % 1000) / 1000 : Math.random();
  const uaIndex = Math.floor(pseudoRandom * uas.length);
  const webglIndex = Math.floor(pseudoRandom * WEBGL_CONFIGS.length);
  const webgl = WEBGL_CONFIGS[webglIndex];

  const viewport: ViewportConfig = isDesktop
    ? {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        isMobile: false,
        hasTouch: false,
      }
    : {
        width: 390,
        height: 844,
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      };

  return {
    deviceType: type,
    userAgent: uas[uaIndex],
    viewport,
    webglVendor: webgl.vendor,
    webglRenderer: webgl.renderer,
    hardwareConcurrency: isDesktop ? 8 : 6,
    deviceMemoryGb: isDesktop ? 16 : 6,
    canvasNoiseSeed: seed !== undefined ? seed : Math.floor(Math.random() * 1000000) + 1,
  };
}

export function getDeterministicFingerprintForAccount(accountId: string): DeviceFingerprint {
  const hash = crypto.createHash('sha256').update(accountId).digest('hex');
  // Extract 32-bit positive integer seed from hash
  const seed = parseInt(hash.slice(0, 8), 16);
  return generateDeviceFingerprint('DESKTOP', seed);
}
