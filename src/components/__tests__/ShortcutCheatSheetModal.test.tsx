import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { ShortcutCheatSheetModal } from '../ShortcutCheatSheetModal';

describe('S2.7 Keyboard Shortcut Cheat Sheet Modal', () => {
  it('renders nothing when isOpen is false', () => {
    const html = renderToString(
      <ShortcutCheatSheetModal isOpen={false} onClose={vi.fn()} />
    );
    expect(html).not.toContain('Keyboard Shortcuts');
  });

  it('renders cheat sheet modal with all key groupings when isOpen is true', () => {
    const html = renderToString(
      <ShortcutCheatSheetModal isOpen={true} onClose={vi.fn()} />
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('Keyboard Shortcuts');
    expect(html).toContain('Command Palette');
    expect(html).toContain('⌘K');
    expect(html).toContain('Trends Radar');
    expect(html).toContain('>g</kbd>');
    expect(html).toContain('>t</kbd>');
    expect(html).toContain('Composer');
    expect(html).toContain('>p</kbd>');
    expect(html).toContain('Undo safe operation');
    expect(html).toContain('⌘Z');
  });
});
