import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('U0.4 Truth Pass — No Hardcoded Telemetry Literals Guard', () => {
  const dashboardPath = path.join(process.cwd(), 'src/app/dashboard/page.tsx');
  const fileContent = fs.readFileSync(dashboardPath, 'utf8');

  it('contains no hardcoded "100% Sticky Residential" string', () => {
    expect(fileContent).not.toContain('100% Sticky Residential');
  });

  it('contains no hardcoded "0.0%" ban challenge rate string', () => {
    expect(fileContent).not.toMatch(/<span[^>]*>0\.0%<\/span>/);
  });

  it('contains no hardcoded value="100%" compliance metric string', () => {
    expect(fileContent).not.toMatch(/value="100%"/);
  });
});
