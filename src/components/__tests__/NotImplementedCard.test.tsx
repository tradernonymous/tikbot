import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { NotImplementedCard } from '../NotImplementedCard';

describe('NotImplementedCard Component (R0.6)', () => {
  it('renders feature title, explanation, and NOT CONFIGURED / NOT IMPLEMENTED badge', () => {
    const html = renderToString(
      <NotImplementedCard
        featureName="Direct TikTok OAuth"
        explanation="Official TikTok Content Posting API requires enterprise partner audit and video.publish scope."
      />
    );

    expect(html).toContain('Direct TikTok OAuth');
    expect(html).toContain('Official TikTok Content Posting API requires enterprise partner audit');
    expect(html).toContain('NOT IMPLEMENTED');
  });

  it('renders issue link when issueUrl and issueNumber are supplied', () => {
    const html = renderToString(
      <NotImplementedCard
        featureName="Automatic Captcha Solver"
        explanation="Third-party 2Captcha/CapSolver integration planned for Phase 3."
        issueUrl="https://github.com/tikbot/tikbot/issues/42"
        issueNumber="42"
      />
    );

    expect(html).toContain('https://github.com/tikbot/tikbot/issues/42');
    expect(html).toContain('Issue #42');
  });

  it('contains no action buttons that trigger simulated success', () => {
    const html = renderToString(
      <NotImplementedCard
        featureName="Autonomous DM outreach"
        explanation="Direct messaging automation violates ToS and is intentionally unsupported."
      />
    );

    expect(html).not.toContain('<button');
    expect(html).not.toContain('success');
  });
});
