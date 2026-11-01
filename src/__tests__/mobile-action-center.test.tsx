import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import { MobileActionCenter } from '../components/MobileActionCenter';

describe('P8.3 & P8.4 Mobile Action Center', () => {
  it('renders mobile command center region with accessible role and aria-label', () => {
    const html = renderToString(
      <MobileActionCenter
        killSwitchActive={false}
        pendingApprovalsCount={3}
        activeAccount="growth_bot_1"
        onToggleKillSwitch={vi.fn()}
        onQuickApprove={vi.fn()}
      />
    );

    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Mobile Command Center"');
    expect(html).toContain('@growth_bot_1');
    expect(html).toContain('3 pending');
    expect(html).toContain('Emergency Kill');
  });

  it('renders active kill switch state with danger indicator', () => {
    const html = renderToString(
      <MobileActionCenter
        killSwitchActive={true}
        pendingApprovalsCount={0}
        activeAccount="bot_locked"
        onToggleKillSwitch={vi.fn()}
        onQuickApprove={vi.fn()}
      />
    );

    expect(html).toContain('KILL SWITCH ACTIVE');
    expect(html).toContain('bg-red-600');
  });

  it('renders provenance chip on mobile telemetry', () => {
    const html = renderToString(
      <MobileActionCenter
        killSwitchActive={false}
        pendingApprovalsCount={0}
        activeAccount="prov_bot"
        provenance="live"
        onToggleKillSwitch={vi.fn()}
        onQuickApprove={vi.fn()}
      />
    );

    expect(html).toContain('live');
  });
});
