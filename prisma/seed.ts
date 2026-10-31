import { getDevFixtures } from '../src/fixtures/index';

async function seed() {
  const fixtures = getDevFixtures();
  console.log(`[Seed] Loaded fixtures: ${fixtures.users.length} users, ${fixtures.proxies.length} proxies, ${fixtures.accounts.length} accounts, ${fixtures.campaigns.length} campaigns.`);
  console.log(`[Seed] Ready for database population when DB is connected.`);
}

seed().catch((e) => {
  console.error('[Seed] Error during seeding:', e);
  process.exit(1);
});
