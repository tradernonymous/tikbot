import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import FarmServicesPage from '../page';

describe('FarmServicesPage (F5.5)', () => {
  it('renders catalog tab by default with services and metrics', async () => {
    const searchParams = Promise.resolve({ tab: 'catalog' });
    const page = await FarmServicesPage({ searchParams });
    const html = renderToString(page);

    expect(html).toContain('Farm Services &amp; Launch Console');
    expect(html).toContain('High-Retention Video Watch');
    expect(html).toContain('Full FYP Push Sequence');
    expect(html).toContain('Catalog Services');
    expect(html).toContain('role="tablist"');
  });

  it('renders launch wizard tab with step indicator', async () => {
    const searchParams = Promise.resolve({ tab: 'launch', w_step: '1' });
    const page = await FarmServicesPage({ searchParams });
    const html = renderToString(page);

    expect(html).toContain('Step');
    expect(html).toContain('of 6');
    expect(html).toContain('Target TikTok Video URL');
    expect(html).toContain('Canary Verification Check');
  });

  it('renders active runs tab with active order list', async () => {
    const searchParams = Promise.resolve({ tab: 'active' });
    const page = await FarmServicesPage({ searchParams });
    const html = renderToString(page);

    expect(html).toContain('Delivery Progress');
    expect(html).toContain('@growth_lab');
  });

  it('renders order history and reports tabs', async () => {
    const historyParams = Promise.resolve({ tab: 'history' });
    const pageHistory = await FarmServicesPage({ searchParams: historyParams });
    const htmlHistory = renderToString(pageHistory);
    expect(htmlHistory).toContain('@vibe_kitchen');
    expect(htmlHistory).toContain('Plausibility');

    const reportsParams = Promise.resolve({ tab: 'reports' });
    const pageReports = await FarmServicesPage({ searchParams: reportsParams });
    const htmlReports = renderToString(pageReports);
    expect(htmlReports).toContain('Safety Guardrail Pass Rate');
    expect(htmlReports).toContain('98.4%');
  });
});
