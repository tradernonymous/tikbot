import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('UI Accessibility & Responsive Design (U4.2, U4.3)', () => {
  const rootDir = process.cwd();

  it('root layout includes an accessible skip-to-content link', () => {
    const layoutPath = path.join(rootDir, 'src/app/layout.tsx');
    const layoutCode = fs.readFileSync(layoutPath, 'utf8');

    expect(layoutCode).toContain('href="#main-content"');
    expect(layoutCode).toMatch(/skip to (main )?content/i);
  });

  it('dashboard layout tags main region with id="main-content"', () => {
    const dashLayoutPath = path.join(rootDir, 'src/app/dashboard/layout.tsx');
    const dashLayoutCode = fs.readFileSync(dashLayoutPath, 'utf8');

    expect(dashLayoutCode).toContain('id="main-content"');
  });

  it('TopNavbar provides aria-label on icon buttons', () => {
    const navPath = path.join(rootDir, 'src/components/TopNavbar.tsx');
    const navCode = fs.readFileSync(navPath, 'utf8');

    expect(navCode).toContain('aria-label=');
  });

  it('Sidebar supports responsive drawer toggle on smaller screens', () => {
    const sidebarPath = path.join(rootDir, 'src/components/Sidebar.tsx');
    const sidebarCode = fs.readFileSync(sidebarPath, 'utf8');

    // Either hidden lg:flex or mobile drawer state
    expect(sidebarCode).toMatch(/(hidden\s+lg:flex|lg:w-64|drawer)/);
  });
});
