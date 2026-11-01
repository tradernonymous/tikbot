import { createHash } from 'node:crypto';

export type StealthEngineType = 'CAMOUFOX' | 'BROWSER_OXIDE' | 'CHROMIUM';

export interface DevicePersona {
  accountId: string;
  engine: StealthEngineType;
  screenResolution: string;
  gpuRenderer: string;
  timezone: string;
  locale: string;
  fonts: string[];
  canvasNoiseSeed: string;
  webglNoiseSeed: string;
  userAgent: string;
  ja4TlsFingerprint: string;
  createdAt: string;
}

const GPU_PROFILES = [
  'Apple GPU (Metal)',
  'Mali-G78 MP14',
  'Adreno (TM) 660',
  'Mali-G710 MC10',
  'Adreno (TM) 730',
];

const RESOLUTIONS = [
  '1170x2532',
  '1080x2400',
  '390x844',
  '412x915',
  '1179x2556',
];

const LOCALES = [
  { locale: 'en-US', timezone: 'America/New_York' },
  { locale: 'en-US', timezone: 'America/Chicago' },
  { locale: 'en-US', timezone: 'America/Los_Angeles' },
  { locale: 'en-GB', timezone: 'Europe/London' },
  { locale: 'en-CA', timezone: 'America/Toronto' },
];

const FONT_SETS = [
  ['Roboto', 'Arial', 'Helvetica', 'Noto Sans'],
  ['SF Pro Text', 'Helvetica Neue', 'Arial', 'system-ui'],
  ['Segoe UI', 'Roboto', 'Arial', 'Ubuntu'],
];

const TLS_JA4_SEEDS = [
  't13d1516h2_8daaf6152771_018247da31a4',
  't13i1908h2_9e2b1049c310_b4b88a104031',
  't12d1214h2_7c11f48201b2_498b2c194a02',
];

// Persistent cache for frozen personas per accountId
const personaCache = new Map<string, DevicePersona>();

export function generateDevicePersona(accountId: string): DevicePersona {
  const cached = personaCache.get(accountId);
  if (cached) return cached;

  // Use hash of accountId as deterministic seed
  const hash = createHash('sha256').update(accountId).digest('hex');
  const numSeed = parseInt(hash.slice(0, 8), 16);

  const engineIndex = Math.abs(numSeed) % 3;
  const engine: StealthEngineType =
    engineIndex === 0 ? 'CAMOUFOX' : engineIndex === 1 ? 'BROWSER_OXIDE' : 'CHROMIUM';

  const resIndex = Math.abs(numSeed >> 3) % RESOLUTIONS.length;
  const gpuIndex = Math.abs(numSeed >> 6) % GPU_PROFILES.length;
  const locIndex = Math.abs(numSeed >> 9) % LOCALES.length;
  const fontIndex = Math.abs(numSeed >> 12) % FONT_SETS.length;
  const tlsIndex = Math.abs(numSeed >> 15) % TLS_JA4_SEEDS.length;

  const loc = LOCALES[locIndex];
  const userAgent =
    engine === 'CAMOUFOX'
      ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1'
      : 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

  const persona: DevicePersona = {
    accountId,
    engine,
    screenResolution: RESOLUTIONS[resIndex],
    gpuRenderer: GPU_PROFILES[gpuIndex],
    timezone: loc.timezone,
    locale: loc.locale,
    fonts: FONT_SETS[fontIndex],
    canvasNoiseSeed: hash.slice(8, 24),
    webglNoiseSeed: hash.slice(24, 40),
    userAgent,
    ja4TlsFingerprint: TLS_JA4_SEEDS[tlsIndex],
    createdAt: new Date().toISOString(),
  };

  personaCache.set(accountId, persona);
  return persona;
}

export function resetPersonaCacheForTesting(): void {
  personaCache.clear();
}
