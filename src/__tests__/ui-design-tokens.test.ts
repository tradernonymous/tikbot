import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('UI Design Tokens & Tailwind v4 Config (U4.1)', () => {
  const rootDir = process.cwd();
  const globalsCssPath = path.join(rootDir, 'src/app/globals.css');
  const tailwindConfigPath = path.join(rootDir, 'tailwind.config.js');

  it('removes dead tailwind.config.js in favor of Tailwind v4 @theme', () => {
    expect(fs.existsSync(tailwindConfigPath)).toBe(false);
  });

  it('defines design tokens in @theme within globals.css', () => {
    expect(fs.existsSync(globalsCssPath)).toBe(true);
    const css = fs.readFileSync(globalsCssPath, 'utf8');

    expect(css).toContain('@theme');
    expect(css).toContain('--color-bg-primary:');
    expect(css).toContain('--color-bg-card:');
    expect(css).toContain('--color-border-subtle:');
    expect(css).toContain('--color-brand-cyan:');
    expect(css).toContain('--color-brand-emerald:');
    expect(css).toContain('--color-brand-rose:');
    expect(css).toContain('--color-brand-amber:');
  });

  it('sets up dark-only theme tokens with readable contrast variables', () => {
    const css = fs.readFileSync(globalsCssPath, 'utf8');
    expect(css).toContain('--background:');
    expect(css).toContain('--foreground:');
  });
});
