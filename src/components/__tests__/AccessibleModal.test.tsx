import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { AccessibleModal } from '../AccessibleModal';

describe('AccessibleModal Component (U9 TDD)', () => {
  it('renders modal content with accessibility attributes when isOpen is true', () => {
    const html = renderToString(
      <AccessibleModal
        isOpen={true}
        onClose={vi.fn()}
        title="Add Account Modal"
      >
        <p>Modal Body Content</p>
      </AccessibleModal>
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('Add Account Modal');
    expect(html).toContain('Modal Body Content');
  });

  it('renders nothing when isOpen is false', () => {
    const html = renderToString(
      <AccessibleModal
        isOpen={false}
        onClose={vi.fn()}
        title="Closed Modal"
      >
        <p>Hidden Content</p>
      </AccessibleModal>
    );

    expect(html).toBe('');
  });
});
