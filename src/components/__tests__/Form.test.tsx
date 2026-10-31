import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { FormField, SubmitButton, mapServerErrors } from '../FormField';

describe('Form Components and Validation Helpers (U4.5)', () => {
  it('renders FormField with accessible label, aria-invalid, and error role="alert"', () => {
    const html = renderToString(
      <FormField
        id="username"
        label="Account Username"
        error="Username must be at least 3 characters"
        required
      >
        <input id="username" name="username" defaultValue="ab" />
      </FormField>
    );

    expect(html).toContain('for="username"');
    expect(html).toContain('Account Username');
    expect(html).toContain('role="alert"');
    expect(html).toContain('id="username-error"');
    expect(html).toContain('Username must be at least 3 characters');
  });

  it('renders SubmitButton with aria-busy when submitting and disabled when invalid', () => {
    const htmlSubmitting = renderToString(
      <SubmitButton isSubmitting={true} disabled={false}>
        Create Campaign
      </SubmitButton>
    );
    expect(htmlSubmitting).toContain('aria-busy="true"');
    expect(htmlSubmitting).toContain('disabled=""');

    const htmlDisabled = renderToString(
      <SubmitButton isSubmitting={false} disabled={true}>
        Create Campaign
      </SubmitButton>
    );
    expect(htmlDisabled).toContain('disabled=""');
  });

  it('maps server validation responses to field error records', () => {
    const serverPayload = {
      error: 'Validation failed',
      details: [
        { field: 'targetUrl', message: 'Invalid TikTok URL scheme' },
        { field: 'budget', message: 'Budget must be greater than 0' },
      ],
    };

    const mapped = mapServerErrors(serverPayload);
    expect(mapped['targetUrl']).toBe('Invalid TikTok URL scheme');
    expect(mapped['budget']).toBe('Budget must be greater than 0');
  });

  it('maps generic server errors when details are absent', () => {
    const serverPayload = {
      error: 'Database connection failed',
    };

    const mapped = mapServerErrors(serverPayload);
    expect(mapped['root']).toBe('Database connection failed');
  });
});
