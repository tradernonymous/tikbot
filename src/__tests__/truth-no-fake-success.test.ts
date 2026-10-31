import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('R0.6 Truth Pass — No Fabricated Success Buttons Guard', () => {
  const publishingPagePath = path.join(
    process.cwd(),
    'src/app/dashboard/publishing/page.tsx'
  );
  const publishingContent = fs.readFileSync(publishingPagePath, 'utf8');

  const contextPath = path.join(
    process.cwd(),
    'src/context/OperationsContext.tsx'
  );
  const contextContent = fs.readFileSync(contextPath, 'utf8');

  it('contains no "Simulate automated upload right now" button in publishing page', () => {
    expect(publishingContent).not.toContain('Simulate automated upload right now');
  });

  it('contains no fabricated "Post is now live on TikTok" toast in publishing page', () => {
    expect(publishingContent).not.toContain('Post is now live on TikTok');
  });

  it('does not generate fake random TikTok video URLs in OperationsContext', () => {
    expect(contextContent).not.toMatch(/Math\.random\(\)\s*\*\s*8999999999/);
    expect(contextContent).not.toMatch(/@growth_creator_01\/video\//);
  });
});
