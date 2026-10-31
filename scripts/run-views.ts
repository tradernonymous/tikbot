import { runStealthViewSession } from '../src/farm/stealth-runner';

// Parse command line arguments
// e.g. tsx scripts/run-views.ts --url https://... --count 5
const args = process.argv.slice(2);
let targetUrl = 'https://www.tiktok.com/@jackprintezy/video/7634241914350341397';
let targetCount = 3;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--url' && args[i + 1]) {
    targetUrl = args[i + 1];
    i++;
  } else if ((args[i] === '--count' || args[i] === '-n') && args[i + 1]) {
    targetCount = parseInt(args[i + 1], 10) || 3;
    i++;
  }
}

async function main() {
  console.log('=====================================================');
  console.log(' tikbot Free Headless Stealth View Engine (Option A) ');
  console.log('=====================================================');
  console.log(`Target URL : ${targetUrl}`);
  console.log(`View Count : ${targetCount}`);
  console.log(`Browser    : Local Google Chrome with Stealth Evasions`);
  console.log(`Network    : Local Residential IP (Zero Cost)`);
  console.log('-----------------------------------------------------\n');

  const result = await runStealthViewSession({
    url: targetUrl,
    targetViews: targetCount,
    minDwellSeconds: 8,
    maxDwellSeconds: 15,
    headless: true,
  });

  console.log('\n=====================================================');
  console.log(' Run Complete Summary');
  console.log('=====================================================');
  console.log(`Successful Sessions: ${result.successfulViews}`);
  console.log(`Failed Sessions    : ${result.failedViews}`);
  console.log(`Elapsed Time       : ${result.totalDurationSeconds}s`);
  console.log('=====================================================');
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});