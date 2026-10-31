import { describe, it, expect } from 'vitest';
import {
  CampaignManager,
  UnauthorizedCampaignExecutionError,
  type CampaignDefinition,
} from '../campaign';

describe('Engagement Campaign Model & Approval Gate', () => {
  const baseCampaign: CampaignDefinition = {
    id: 'camp-101',
    title: 'Outlier Post Hook Boost',
    targetUrl: 'https://www.tiktok.com/@creator/video/123456',
    actionType: 'LIKE',
    targetCount: 50,
  };

  it('initializes campaign in PENDING_APPROVAL status by default', () => {
    const manager = new CampaignManager(baseCampaign);
    expect(manager.getStatus()).toBe('PENDING_APPROVAL');
  });

  it('prevents starting execution before manual operator approval is granted', () => {
    const manager = new CampaignManager(baseCampaign);

    expect(() => manager.startExecution()).toThrow(
      UnauthorizedCampaignExecutionError
    );
  });

  it('permits execution only after explicit operator approval', () => {
    const manager = new CampaignManager(baseCampaign);

    manager.approve('operator-admin', 'Parameters verified within compliance');
    expect(manager.getStatus()).toBe('APPROVED');

    manager.startExecution();
    expect(manager.getStatus()).toBe('RUNNING');
  });

  it('rejects campaign execution if rejected by operator', () => {
    const manager = new CampaignManager(baseCampaign);

    manager.reject('operator-admin', 'Target URL flagged as high risk');
    expect(manager.getStatus()).toBe('REJECTED');

    expect(() => manager.startExecution()).toThrow(
      UnauthorizedCampaignExecutionError
    );
  });

  it('pauses running campaign immediately upon kill switch or manual pause', () => {
    const manager = new CampaignManager(baseCampaign);
    manager.approve('operator-admin');
    manager.startExecution();
    expect(manager.getStatus()).toBe('RUNNING');

    manager.pause('Emergency kill switch triggered');
    expect(manager.getStatus()).toBe('PAUSED');
  });

  it('tracks progress and automatically completes when targetCount is reached', () => {
    const manager = new CampaignManager({ ...baseCampaign, targetCount: 2 });
    manager.approve('operator-admin');
    manager.startExecution();

    expect(manager.getProgress().executed).toBe(0);
    manager.incrementProgress();
    expect(manager.getStatus()).toBe('RUNNING');
    expect(manager.getProgress().executed).toBe(1);

    manager.incrementProgress();
    expect(manager.getStatus()).toBe('COMPLETED');
    expect(manager.getProgress().executed).toBe(2);
  });
});
