import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { EntityDrawer } from '../EntityDrawer';

describe('F1.7 Shared EntityDrawer Component', () => {
  it('renders account entity details and relation link to proxies', () => {
    const html = renderToString(
      <EntityDrawer
        isOpen={true}
        onClose={vi.fn()}
        entityType="account"
        data={{
          id: 'acc-1',
          username: 'growth_node_alpha',
          platform: 'TIKTOK',
          status: 'ACTIVE',
          warmupDay: 8,
          healthScore: 98,
          proxyHost: 'proxy.residential.node:8080',
        }}
      />
    );

    expect(html).toContain('Account Detail');
    expect(html).toContain('growth_node_alpha');
    expect(html).toContain('ACTIVE');
    expect(html).toContain('proxy.residential.node:8080');
  });

  it('renders campaign entity details with approval state', () => {
    const html = renderToString(
      <EntityDrawer
        isOpen={true}
        onClose={vi.fn()}
        entityType="campaign"
        data={{
          id: 'camp-99',
          title: 'Breakout Viral Likes Boost',
          targetUrl: 'https://tiktok.com/@creator/video/1',
          status: 'PENDING_APPROVAL',
          actionType: 'LIKE',
          targetCount: 50,
          executedCount: 0,
        }}
      />
    );

    expect(html).toContain('Campaign Detail');
    expect(html).toContain('Breakout Viral Likes Boost');
    expect(html).toContain('PENDING_APPROVAL');
    expect(html).toContain('https://tiktok.com/@creator/video/1');
  });

  it('renders publish job entity with scheduled status', () => {
    const html = renderToString(
      <EntityDrawer
        isOpen={true}
        onClose={vi.fn()}
        entityType="publish_job"
        data={{
          id: 'pub-5',
          caption: '3 productivity hacks #fyp',
          account: '@growth_hacker',
          status: 'SCHEDULED',
          scheduledAt: '2026-11-02T14:00:00Z',
        }}
      />
    );

    expect(html).toContain('Publish Slot Detail');
    expect(html).toContain('3 productivity hacks #fyp');
    expect(html).toContain('@growth_hacker');
  });

  it('renders audit log entity', () => {
    const html = renderToString(
      <EntityDrawer
        isOpen={true}
        onClose={vi.fn()}
        entityType="audit_log"
        data={{
          id: 'audit-1',
          action: 'TOGGLE_KILL_SWITCH',
          actorEmail: 'admin@tikbot.local',
          resourceId: 'SYSTEM',
          ipAddress: '127.0.0.1',
          timestamp: '2026-11-01T04:00:00Z',
          status: 'SUCCESS',
        }}
      />
    );

    expect(html).toContain('Audit Log Entry');
    expect(html).toContain('TOGGLE_KILL_SWITCH');
    expect(html).toContain('admin@tikbot.local');
  });

  it('renders task entity details with status and payload', () => {
    const html = renderToString(
      <EntityDrawer
        isOpen={true}
        onClose={vi.fn()}
        entityType="task"
        data={{
          id: 'task-101',
          name: 'farm.like',
          status: 'RUNNING',
          targetUrl: 'https://tiktok.com/@growth/video/2',
          attempts: 1,
          maxAttempts: 3,
        }}
      />
    );

    expect(html).toContain('Task Detail');
    expect(html).toContain('farm.like');
    expect(html).toContain('RUNNING');
    expect(html).toContain('https://tiktok.com/@growth/video/2');
  });

  it('renders research post entity with outlier score and campaign action', () => {
    const html = renderToString(
      <EntityDrawer
        isOpen={true}
        onClose={vi.fn()}
        entityType="research_post"
        data={{
          id: 'post-900',
          author: '@viral_tok',
          views: 1200000,
          likes: 240000,
          outlierScore: '8.4x',
          targetUrl: 'https://tiktok.com/@viral_tok/video/900',
        }}
      />
    );

    expect(html).toContain('Outlier Post Intelligence');
    expect(html).toContain('@viral_tok');
    expect(html).toContain('8.4x');
    expect(html).toContain('Launch Campaign From Post');
  });
});
