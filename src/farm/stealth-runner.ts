import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import path from 'path';

puppeteer.use(StealthPlugin());

export interface ViewRunOptions {
  url: string;
  targetViews?: number;
  minDwellSeconds?: number;
  maxDwellSeconds?: number;
  headless?: boolean | 'new';
  chromePath?: string;
  cookiesPath?: string;
  onProgress?: (completed: number, target: number, dwellSecs: number) => void;
}

function loadSavedCookies(customPath?: string): any[] {
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

export async function runStealthViewSession(options: ViewRunOptions): Promise<{
  successfulViews: number;
  failedViews: number;
  totalDurationSeconds: number;
}> {
  const targetViews = options.targetViews ?? 1;
  const minDwell = options.minDwellSeconds ?? 8;
  const maxDwell = options.maxDwellSeconds ?? 16;
  const chromePath = options.chromePath || '/usr/bin/google-chrome';
  const headless = options.headless ?? true;
  const cookies = loadSavedCookies(options.cookiesPath);

  let successfulViews = 0;
  let failedViews = 0;
  const startTime = Date.now();

  console.log(`[StealthRunner] Starting real view runner targeting: ${options.url}`);
  console.log(`[StealthRunner] Planned views: ${targetViews} (Dwell: ${minDwell}s - ${maxDwell}s)`);
  console.log(`[StealthRunner] Loaded ${cookies.length} authenticated session cookies.`);

  for (let i = 1; i <= targetViews; i++) {
    let browser = null;
    try {
      console.log(`[StealthRunner] [View ${i}/${targetViews}] Launching stealth browser instance...`);
      browser = await puppeteer.launch({
        executablePath: chromePath,
        headless: headless as any,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-blink-features=AutomationControlled',
          '--window-size=1280,800',
        ],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      // Spoof realistic User-Agent matching local environment
      await page.setUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Inject authenticated session cookies to bypass login intercepts
      if (cookies.length > 0) {
        await page.setCookie(...cookies);
      }

      // Navigate to TikTok post
      console.log(`[StealthRunner] [View ${i}/${targetViews}] Navigating to post page...`);
      await page.goto(options.url, {
        waitUntil: 'networkidle2',
        timeout: 35000,
      });

      // Random dwell time for algorithmic view retention
      const dwell = Math.floor(Math.random() * (maxDwell - minDwell + 1)) + minDwell;

      // Humanized mouse movement
      await page.mouse.move(200 + Math.random() * 300, 300 + Math.random() * 200);

      // Inspect whether this is video or photo carousel
      const pageType = await page.evaluate(() => {
        const video = document.querySelector('video');
        if (video) {
          video.muted = true;
          video.play().catch(() => {});
          return { type: 'video', hasVideo: true };
        }
        return { type: 'photo', hasVideo: false };
      });

      console.log(`[StealthRunner] [View ${i}/${targetViews}] Detected format: ${pageType.type}. Watching for ${dwell}s completion dwell...`);

      // Natural interaction: if photo carousel, swipe / navigate through slides
      if (pageType.type === 'photo') {
        const halfDwell = Math.floor(dwell / 2);
        await new Promise((r) => setTimeout(r, halfDwell * 1000));
        // Simulate press ArrowRight to browse next photo slide
        await page.keyboard.press('ArrowRight').catch(() => {});
        await page.mouse.move(350 + Math.random() * 100, 400 + Math.random() * 100);
        await new Promise((r) => setTimeout(r, (dwell - halfDwell) * 1000));
      } else {
        // Video post: watch video for full dwell
        await new Promise((r) => setTimeout(r, dwell * 1000));
      }

      successfulViews++;
      if (options.onProgress) {
        options.onProgress(successfulViews, targetViews, dwell);
      }
      console.log(`[StealthRunner] [View ${i}/${targetViews}] View session completed successfully.`);
    } catch (err: any) {
      failedViews++;
      console.error(`[StealthRunner] [View ${i}/${targetViews}] Error:`, err?.message || err);
    } finally {
      if (browser) {
        try {
          await browser.close();
        } catch {}
      }
    }

    // Delay between successive views if not last
    if (i < targetViews) {
      const waitJitter = Math.floor(Math.random() * 4) + 2; // 2-5s pause
      console.log(`[StealthRunner] Jitter pause ${waitJitter}s before next session...`);
      await new Promise((r) => setTimeout(r, waitJitter * 1000));
    }
  }

  const totalDurationSeconds = Math.round((Date.now() - startTime) / 1000);
  console.log(`[StealthRunner] Completed: ${successfulViews} views generated in ${totalDurationSeconds}s.`);
  return {
    successfulViews,
    failedViews,
    totalDurationSeconds,
  };
}