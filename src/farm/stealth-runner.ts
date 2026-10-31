import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { generateDeviceFingerprint } from './fingerprint';

puppeteer.use(StealthPlugin());

export interface ViewRunOptions {
  url: string;
  targetViews?: number;
  minDwellSeconds?: number;
  maxDwellSeconds?: number;
  headless?: boolean | 'new';
  chromePath?: string;
  cookiesPath?: string;
  /**
   * 'unique-guest' (default): strips single-user sessionid/uid_tt and mints a fresh odin_tt + fingerprint
   * per view so TikTok counts each session as a distinct anonymous viewer (Evil0ctal / growchief pattern).
   * 'authenticated': injects the full saved account session (needed for age/comfort-restricted posts,
   * though limited to 1 counted view per unique account).
   */
  identityMode?: 'unique-guest' | 'authenticated';
  devtools?: boolean;
  slowMo?: number;
  proxyUrl?: string;
  proxy?: {
    host: string;
    port: number;
    username?: string;
    password?: string;
  } | string;
  settleDelayMs?: number;
  jitterPauseMs?: number;
  onProgress?: (completed: number, target: number, dwellSecs: number) => void;
}

const SINGLE_ACCOUNT_COOKIE_NAMES = new Set([
  'sessionid',
  'sessionid_ss',
  'sid_tt',
  'sid_guard',
  'uid_tt',
  'uid_tt_ss',
  'multi_sids',
  'store-idc',
  'store-country-code',
  'cmpl_token',
  'd_ticket',
  'ttwid', // stripped so TikTok issues a fresh visitor ttwid per browser instance
]);

export function loadSavedCookies(customPath?: string): any[] {
  const candidates = [
    customPath,
    path.join(process.cwd(), 'tiktok_cookies.json'),
    '/mnt/hdd/storage/projects/home/tikbot/tiktok_cookies.json',
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.warn(`[StealthRunner] Warning reading cookies from ${p}:`, err);
      }
    }
  }
  return [];
}

export function buildSessionCookies(baseCookies: any[], mode: 'unique-guest' | 'authenticated'): any[] {
  if (mode === 'authenticated') {
    return baseCookies;
  }
  // Unique-guest mode: keep verification cookies (s_v_web_id, tt_chain_token, msToken)
  // and generate a fresh 160-hex-character odin_tt device identifier per view
  return baseCookies
    .filter((c) => !SINGLE_ACCOUNT_COOKIE_NAMES.has(c.name))
    .map((c) => {
      if (c.name === 'odin_tt') {
        return { ...c, value: crypto.randomBytes(80).toString('hex') };
      }
      return c;
    });
}

export async function runStealthViewSession(options: ViewRunOptions): Promise<{
  successfulViews: number;
  failedViews: number;
  blockedViews: number;
  totalDurationSeconds: number;
}> {
  const targetViews = options.targetViews ?? 1;
  const minDwell = options.minDwellSeconds ?? 8;
  const maxDwell = options.maxDwellSeconds ?? 16;
  const chromePath =
    options.chromePath ||
    process.env.CHROME_BIN ||
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    '/usr/bin/google-chrome';
  const headless = options.headless ?? true;
  const identityMode = options.identityMode ?? 'unique-guest';
  const baseCookies = loadSavedCookies(options.cookiesPath);

  let proxyServer: string | undefined = options.proxyUrl;
  let proxyCredentials: { username?: string; password?: string } | undefined;

  if (options.proxy) {
    if (typeof options.proxy === 'string') {
      proxyServer = options.proxy;
    } else {
      proxyServer = `${options.proxy.host}:${options.proxy.port}`;
      if (options.proxy.username || options.proxy.password) {
        proxyCredentials = {
          username: options.proxy.username,
          password: options.proxy.password,
        };
      }
    }
  }

  let successfulViews = 0;
  let failedViews = 0;
  let blockedViews = 0;
  const startTime = Date.now();

  console.log(`[StealthRunner] Starting real view runner targeting: ${options.url}`);
  console.log(`[StealthRunner] Planned views: ${targetViews} | Mode: ${identityMode} (Dwell: ${minDwell}s - ${maxDwell}s)`);

  let masterBrowser: any = null;

  // Process termination trap to prevent zombie Chrome processes
  const handleTermination = async () => {
    if (masterBrowser) {
      try {
        await masterBrowser.close();
      } catch {}
      masterBrowser = null;
    }
  };
  process.once('SIGINT', handleTermination);
  process.once('SIGTERM', handleTermination);

  try {
    // Launch shared master browser instance once (Browser Context Pooling)
    console.log(`[StealthRunner] Initializing shared master Chrome engine...`);
    const launchArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
      '--window-size=1280,800',
    ];

    if (proxyServer) {
      launchArgs.push(`--proxy-server=${proxyServer}`);
    }

    masterBrowser = await puppeteer.launch({
      executablePath: chromePath,
      headless: headless as any,
      devtools: options.devtools ?? false,
      slowMo: options.slowMo ?? 0,
      args: launchArgs,
    });

    for (let i = 1; i <= targetViews; i++) {
      let context: any = null;
      try {
        const fp = generateDeviceFingerprint('DESKTOP', i + Math.floor(Math.random() * 10000));
        const sessionCookies = buildSessionCookies(baseCookies, identityMode);

        console.log(`[StealthRunner] [View ${i}/${targetViews}] Spawning isolated incognito context (odin_tt rotated, UA: ${fp.userAgent.slice(0, 45)}...)...`);

        // Create ephemeral incognito context per view (zero session bleed, ultra-fast)
        context = await masterBrowser.createBrowserContext();
        const page = await context.newPage();

        if (proxyCredentials?.username && proxyCredentials?.password && typeof page.authenticate === 'function') {
          await page.authenticate({
            username: proxyCredentials.username,
            password: proxyCredentials.password,
          });
        }

        await page.setViewport({ width: fp.viewport.width, height: fp.viewport.height });
        await page.setUserAgent(fp.userAgent);

        if (sessionCookies.length > 0) {
          await page.setCookie(...sessionCookies);
        }

        console.log(`[StealthRunner] [View ${i}/${targetViews}] Navigating to target post...`);
        await page.goto(options.url, {
          waitUntil: 'domcontentloaded',
          timeout: 35000,
        });

        // Wait for TikTok SPA hydration redirects to settle
        const settleDelay = options.settleDelayMs ?? 4000;
        if (settleDelay > 0) {
          await new Promise((r) => setTimeout(r, settleDelay));
        }

        // Random dwell time for algorithmic view retention
        const dwell = Math.floor(Math.random() * (maxDwell - minDwell + 1)) + minDwell;

        // Humanized mouse movement
        await page.mouse.move(200 + Math.random() * 300, 300 + Math.random() * 200);

        // Inspect post state & check for Audience Comfort / Age Restriction gate
        const pageState = await page.evaluate(() => {
          const bodyText = document.body?.innerText || '';
          const isComfortRestricted =
            bodyText.includes('not be comfortable for some audiences') ||
            document.title.includes('Log in | TikTok');
          const video = document.querySelector('video');
          if (video) {
            video.muted = true;
            video.play().catch(() => {});
            return { type: 'video', hasVideo: true, isComfortRestricted };
          }
          return { type: 'photo', hasVideo: false, isComfortRestricted };
        });

        if (pageState.isComfortRestricted && identityMode === 'unique-guest') {
          blockedViews++;
          console.warn(
            `[StealthRunner] [View ${i}/${targetViews}] BLOCKED: TikTok age/comfort gate active. Anonymous guests restricted on this post. Recommendation: Use SMM Provider API.`
          );
        } else {
          console.log(`[StealthRunner] [View ${i}/${targetViews}] Format: ${pageState.type}. Watching for ${dwell}s completion dwell...`);

          // Natural interaction: if photo carousel, swipe / navigate through slides
          if (pageState.type === 'photo') {
            const thirdDwell = Math.floor(dwell / 3);
            await new Promise((r) => setTimeout(r, thirdDwell * 1000));
            await page.keyboard.press('ArrowRight').catch(() => {});
            await page.mouse.move(350 + Math.random() * 100, 400 + Math.random() * 100);
            await new Promise((r) => setTimeout(r, thirdDwell * 1000));
            await page.keyboard.press('ArrowRight').catch(() => {});
            await new Promise((r) => setTimeout(r, (dwell - thirdDwell * 2) * 1000));
          } else {
            // Video post: watch video for full dwell
            await new Promise((r) => setTimeout(r, dwell * 1000));
          }

          successfulViews++;
          if (options.onProgress) {
            options.onProgress(successfulViews, targetViews, dwell);
          }
          console.log(`[StealthRunner] [View ${i}/${targetViews}] View session completed successfully.`);
        }
      } catch (err: any) {
        failedViews++;
        console.error(`[StealthRunner] [View ${i}/${targetViews}] Error:`, err?.message || err);
      } finally {
        if (context) {
          try {
            await context.close();
          } catch {}
        }
      }

      // Delay between successive views if not last
      if (i < targetViews) {
        const jitterMs = options.jitterPauseMs !== undefined ? options.jitterPauseMs : (Math.floor(Math.random() * 4) + 2) * 1000;
        if (jitterMs > 0) {
          console.log(`[StealthRunner] Jitter pause ${jitterMs}ms before next session...`);
          await new Promise((r) => setTimeout(r, jitterMs));
        }
      }
    }
  } finally {
    if (masterBrowser) {
      try {
        await masterBrowser.close();
      } catch {}
      masterBrowser = null;
    }
    process.removeListener('SIGINT', handleTermination);
    process.removeListener('SIGTERM', handleTermination);
  }

  const totalDurationSeconds = Math.round((Date.now() - startTime) / 1000);
  console.log(`[StealthRunner] Completed: ${successfulViews} views, ${blockedViews} blocked, ${failedViews} failed in ${totalDurationSeconds}s.`);
  return {
    successfulViews,
    failedViews,
    blockedViews,
    totalDurationSeconds,
  };
}