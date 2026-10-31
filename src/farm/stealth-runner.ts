import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

export interface ViewRunOptions {
  url: string;
  targetViews?: number;
  minDwellSeconds?: number;
  maxDwellSeconds?: number;
  headless?: boolean | 'new';
  chromePath?: string;
  onProgress?: (completed: number, target: number, dwellSecs: number) => void;
}

export async function runStealthViewSession(options: ViewRunOptions): Promise<{
  successfulViews: number;
  failedViews: number;
  totalDurationSeconds: number;
}> {
  const targetViews = options.targetViews ?? 1;
  const minDwell = options.minDwellSeconds ?? 8;
  const maxDwell = options.maxDwellSeconds ?? 18;
  const chromePath = options.chromePath || '/usr/bin/google-chrome';
  const headless = options.headless ?? true;

  let successfulViews = 0;
  let failedViews = 0;
  const startTime = Date.now();

  console.log(`[StealthRunner] Starting real view runner targeting: ${options.url}`);
  console.log(`[StealthRunner] Planned views: ${targetViews} (Dwell: ${minDwell}s - ${maxDwell}s)`);

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

      // Spoof realistic User-Agent
      await page.setUserAgent(
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Navigate to TikTok video
      console.log(`[StealthRunner] [View ${i}/${targetViews}] Navigating to video page...`);
      await page.goto(options.url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Random dwell time for algorithmic view retention
      const dwell = Math.floor(Math.random() * (maxDwell - minDwell + 1)) + minDwell;

      // Humanized jitter mouse movement
      await page.mouse.move(200 + Math.random() * 300, 300 + Math.random() * 200);

      // Attempt to find and play video if paused
      try {
        await page.evaluate(() => {
          const video = document.querySelector('video');
          if (video) {
            video.muted = true;
            video.play().catch(() => {});
          }
        });
      } catch {}

      console.log(`[StealthRunner] [View ${i}/${targetViews}] Watching video for ${dwell}s completion dwell...`);
      await new Promise((r) => setTimeout(r, dwell * 1000));

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
      const waitJitter = Math.floor(Math.random() * 5) + 3; // 3-7s pause
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