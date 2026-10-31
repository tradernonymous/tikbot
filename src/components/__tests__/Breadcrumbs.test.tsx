import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { Breadcrumbs } from '../Breadcrumbs';

describe('F1.8 Entity-Aware Breadcrumbs', () => {
  it('renders base breadcrumb for section', () => {
    const html = renderToString(
      <Breadcrumbs
        pathname="/dashboard/campaigns"
        searchParams={new URLSearchParams('')}
        contextData={{ campaigns: [], accounts: [] }}
      />
    );

    expect(html).toContain('Dashboard');
    expect(html).toContain('Engagement Campaigns');
  });

  it('renders campaign entity title when focus param is present', () => {
    const html = renderToString(
      <Breadcrumbs
        pathname="/dashboard/campaigns"
        searchParams={new URLSearchParams('focus=camp-1')}
        contextData={{
          campaigns: [{ id: 'camp-1', title: 'Q4 Viral Likes' }],
          accounts: [],
        }}
      />
    );

    expect(html).toContain('Dashboard');
    expect(html).toContain('Engagement Campaigns');
    expect(html).toContain('Q4 Viral Likes');
  });

  it('renders account username when focus or account param is present', () => {
    const html = renderToString(
      <Breadcrumbs
        pathname="/dashboard/accounts"
        searchParams={new URLSearchParams('focus=acc-1')}
        contextData={{
          campaigns: [],
          accounts: [{ id: 'acc-1', username: 'growth_lead' }],
        }}
      />
    );

    expect(html).toContain('Dashboard');
    expect(html).toContain('Farm Accounts');
    expect(html).toContain('@growth_lead');
  });

  it('renders sub-tab name when tab param is present', () => {
    const html = renderToString(
      <Breadcrumbs
        pathname="/dashboard/campaigns"
        searchParams={new URLSearchParams('tab=COMMENT_BANK')}
        contextData={{ campaigns: [], accounts: [] }}
      />
    );

    expect(html).toContain('Engagement Campaigns');
    expect(html).toContain('Comment Bank');
  });
});
