'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getDevFixtures, FixtureDataset } from '@/fixtures';
import { WarmupEngine } from '@/farm/warmup-routine';
import { AccountLifecycleManager, AccountState } from '@/farm/account-lifecycle';
import { COMPLIANCE_ACTION_CAPS } from '@/farm/rate-limiter';

export interface FarmAccount {
  id: string;
  username: string;
  platform: 'TIKTOK' | 'DOUYIN';
  status: AccountState;
  healthScore: number;
  actionsToday: number;
  dailyCap: number;
  proxyId: string | null;
  warmupDay: number;
  sessionCipher?: string;
  hasCookies?: boolean;
  createdAt: string;
}

export interface StickyProxy {
  id: string;
  protocol: 'HTTP' | 'SOCKS5';
  host: string;
  port: number;
  country: string;
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  latencyMs: number;
}

export interface GovernedCampaign {
  id: string;
  title: string;
  targetUrl: string;
  actionType: 'LIKE' | 'COMMENT' | 'SAVE' | 'VIEW' | 'LIVE_VIEW';
  targetCount: number;
  executedCount: number;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'RUNNING' | 'COMPLETED' | 'PAUSED';
  approvalId: string | null;
  riskTier?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: string;
}

export interface ActiveFarmTask {
  id: string;
  serviceName: string;
  serviceType: 'VIEW' | 'LIKE' | 'COMMENT' | 'LIVE_VIEW';
  targetUrl: string;
  executed: number;
  target: number;
  status: 'RUNNING' | 'QUEUED' | 'COMPLETED' | 'PAUSED' | 'FAILED';
  assignedNodes: number;
  startedAt: string;
  commentNiche?: string;
  externalOrderId?: string;
  executionMode?: 'INTERNAL_FARM' | 'SMM_PROVIDER';
  costFormatted?: string;
  providerStatus?: string;
  remains?: number;
  startCount?: number;
  lastPolledAt?: string;
}

export interface PublishJob {
  id: string;
  title: string;
  scheduledAt: string;
  status: 'PENDING_APPROVAL' | 'SCHEDULED' | 'PUBLISHED' | 'CANCELLED';
  account: string;
  platform: 'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE_SHORTS';
  publishedUrl?: string;
  linkedOutlierHook?: string;
}

export interface MediaAsset {
  id: string;
  title: string;
  size: string;
  duration: string;
  format: string;
  folder: string;
}

export interface ResearchedPost {
  id: string;
  platformPostId: string;
  authorHandle: string;
  caption: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  outlierScore: number;
  hookText?: string;
  downloadUrl?: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  actorEmail: string;
  resourceId: string;
  ipAddress: string;
  createdAt: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'CRITICAL';
  timestamp: string;
  href?: string;
}

interface OperationsContextType {
  // Accounts & Proxies
  accounts: FarmAccount[];
  proxies: StickyProxy[];
  addAccount: (username: string, platform?: 'TIKTOK' | 'DOUYIN', cookiesJson?: string) => void;
  updateAccountCookies: (accountId: string, cookiesJson: string) => void;
  removeAccount: (accountId: string) => void;
  advanceWarmupDay: (accountId: string) => void;
  transitionAccountStatus: (accountId: string, nextState: AccountState, reason?: string) => void;
  bindProxyToAccount: (accountId: string, proxyId: string) => void;
  testProxyLatency: (proxyId: string) => void;

  // Campaigns & Approvals
  campaigns: GovernedCampaign[];
  createCampaign: (data: {
    title: string;
    targetUrl: string;
    actionType: 'LIKE' | 'COMMENT' | 'SAVE' | 'VIEW' | 'LIVE_VIEW';
    targetCount: number;
  }) => GovernedCampaign;
  approveCampaign: (campaignId: string) => void;
  rejectCampaign: (campaignId: string) => void;
  pauseCampaign: (campaignId: string) => void;
  resumeCampaign: (campaignId: string) => void;

  // Farm Tasks (Direct launchers)
  farmTasks: ActiveFarmTask[];
  dispatchFarmTask: (data: {
    serviceName: string;
    serviceType: 'VIEW' | 'LIKE' | 'COMMENT' | 'LIVE_VIEW';
    targetUrl: string;
    targetCount: number;
    commentNiche?: string;
    externalOrderId?: string;
    executionMode?: 'INTERNAL_FARM' | 'SMM_PROVIDER';
    costFormatted?: string;
    status?: 'RUNNING' | 'QUEUED' | 'COMPLETED' | 'PAUSED' | 'FAILED';
  }) => void;
  pauseTask: (taskId: string) => void;
  resumeTask: (taskId: string) => void;
  cancelTask: (taskId: string) => void;

  // Publishing
  publishJobs: PublishJob[];
  mediaAssets: MediaAsset[];
  schedulePublishJob: (data: {
    title: string;
    account: string;
    platform: 'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE_SHORTS';
    scheduledAt?: string;
    linkedOutlierHook?: string;
  }) => PublishJob;
  approvePublishJob: (jobId: string) => void;
  rejectPublishJob: (jobId: string) => void;
  publishNow: (jobId: string) => void;

  // Research
  researchedPosts: ResearchedPost[];
  addResearchedPost: (post: ResearchedPost) => void;

  // Observability & Telemetry
  auditLogs: AuditLogItem[];
  notifications: NotificationItem[];
  clearNotifications: () => void;
  terminalLogs: string[];
  killSwitchActive: boolean;
  toggleKillSwitch: () => Promise<void>;

  // Settings
  caps: typeof COMPLIANCE_ACTION_CAPS;
  updateCaps: (newCaps: typeof COMPLIANCE_ACTION_CAPS) => void;
}

const OperationsContext = createContext<OperationsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'tikbot_operations_state_v1';

export function OperationsProvider({ children }: { children: ReactNode }) {
  const fixtures = getDevFixtures();

  // Initialize Accounts
  const [accounts, setAccounts] = useState<FarmAccount[]>(() => {
    return fixtures.accounts.map((acc, idx) => ({
      ...acc,
      status: acc.status as AccountState,
      warmupDay: acc.status === 'WARMING' ? 2 : acc.status === 'ACTIVE' ? 7 : 1,
      createdAt: `${idx + 1} days ago`,
      sessionCipher: 'vault_aes256_enc_' + acc.id,
    }));
  });

  // Initialize Proxies
  const [proxies, setProxies] = useState<StickyProxy[]>(fixtures.proxies);

  // Initialize Campaigns
  const [campaigns, setCampaigns] = useState<GovernedCampaign[]>(() => {
    return [
      {
        id: 'camp-jack-50',
        title: '50 High-Retention Views for @jackprintezy (Video)',
        targetUrl: 'https://www.tiktok.com/@jackprintezy/video/7634241914350341397',
        actionType: 'VIEW',
        targetCount: 50,
        executedCount: 4,
        status: 'RUNNING',
        approvalId: 'appr-jack-50',
        riskTier: 'LOW',
        createdAt: 'Just now',
      },
      {
        id: 'camp-jack-33',
        title: '33 High-Retention Views for @jackprintezy (Photo)',
        targetUrl: 'https://www.tiktok.com/@jackprintezy/photo/7661970071471803669',
        actionType: 'VIEW',
        targetCount: 33,
        executedCount: 18,
        status: 'RUNNING',
        approvalId: 'appr-jack-33',
        riskTier: 'LOW',
        createdAt: '5 mins ago',
      },
      ...fixtures.campaigns.map((c) => ({
        ...c,
        riskTier: c.targetCount > 100 ? ('MEDIUM' as const) : ('LOW' as const),
        createdAt: 'Today, 08:30 UTC',
      })),
    ];
  });

  // Initialize Farm Tasks
  const [farmTasks, setFarmTasks] = useState<ActiveFarmTask[]>([
    {
      id: 'task-jack-50',
      serviceName: 'High-Retention Video View Engine',
      serviceType: 'VIEW',
      targetUrl: 'https://www.tiktok.com/@jackprintezy/video/7634241914350341397',
      executed: 4,
      target: 50,
      status: 'RUNNING',
      assignedNodes: 3,
      startedAt: 'Just now',
    },
    {
      id: 'task-jack-01',
      serviceName: 'High-Retention Video View Engine',
      serviceType: 'VIEW',
      targetUrl: 'https://www.tiktok.com/@jackprintezy/photo/7661970071471803669',
      executed: 18,
      target: 33,
      status: 'RUNNING',
      assignedNodes: 3,
      startedAt: '5 mins ago',
    },
    {
      id: 'task-901',
      serviceName: 'High-Retention Video View Engine',
      serviceType: 'VIEW',
      targetUrl: 'https://www.tiktok.com/@topcreator/video/71829102918',
      executed: 210,
      target: 250,
      status: 'RUNNING',
      assignedNodes: 12,
      startedAt: '15 mins ago',
    },
  ]);

  // Initialize Publish Jobs
  const [publishJobs, setPublishJobs] = useState<PublishJob[]>([
    {
      id: 'pub-001',
      title: '3 copywriting hooks that generate 100k views in 24 hours #marketing #fyp',
      scheduledAt: 'Today at 14:00 UTC',
      status: 'PENDING_APPROVAL',
      account: '@organic_growth_hacker',
      platform: 'TIKTOK',
      linkedOutlierHook: 'Stop posting 60-second clips before you watch this 3-second hook framework.',
    },
    {
      id: 'pub-002',
      title: 'Behind the scenes: Self-hosted Douyin scraper demo #buildinpublic',
      scheduledAt: 'Tomorrow at 18:00 UTC',
      status: 'SCHEDULED',
      account: '@content_spark_daily',
      platform: 'TIKTOK',
    },
  ]);

  // Initialize Media Assets
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([
    { id: 'asset-1', title: 'Viral Hook 01 — 3-Second Retention Framework', size: '14.2 MB', duration: '15.4s', format: '9:16', folder: 'Hooks' },
    { id: 'asset-2', title: 'Product Showcase A — Automated Pipeline Demo', size: '28.5 MB', duration: '32.1s', format: '9:16', folder: 'Demos' },
    { id: 'asset-3', title: 'Pain Points Teaser — Creator Struggle Teardown', size: '8.9 MB', duration: '18.0s', format: '9:16', folder: 'Teasers' },
  ]);

  // Initialize Researched Outlier Posts
  const [researchedPosts, setResearchedPosts] = useState<ResearchedPost[]>(() => {
    return [
      {
        id: 'post-jack-video-1',
        platformPostId: '7634241914350341397',
        authorHandle: 'jackprintezy',
        caption: 'Viral Video by @jackprintezy (Hook Tested)',
        viewCount: 18400,
        likeCount: 2100,
        commentCount: 142,
        shareCount: 288,
        outlierScore: 4.6,
        hookText: 'High-retention visual opening by @jackprintezy',
        downloadUrl: 'https://www.tiktok.com/@jackprintezy/video/7634241914350341397',
      },
      {
        id: 'post-jack-1',
        platformPostId: '7661970071471803669',
        authorHandle: 'jackprintezy',
        caption: 'TikTok Carousel Photo Post by @jackprintezy',
        viewCount: 12400,
        likeCount: 1540,
        commentCount: 92,
        shareCount: 160,
        outlierScore: 4.2,
        hookText: 'Photo Showcase by @jackprintezy',
        downloadUrl: 'https://www.tiktok.com/@jackprintezy/photo/7661970071471803669',
      },
      ...fixtures.posts.map((p) => ({
        ...p,
        hookText: 'Stop posting 60-second clips before you watch this 3-second hook framework.',
        downloadUrl: 'https://download-api.tikbot.internal/video/hd_no_watermark.mp4',
      })),
    ];
  });

  // Initialize Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([
    {
      id: 'audit-001',
      action: 'SYSTEM_BOOT',
      actorEmail: 'admin@tikbot.local',
      resourceId: 'OPERATOR_CONSOLE',
      ipAddress: '127.0.0.1',
      createdAt: 'Today, 08:00 UTC',
      status: 'SUCCESS',
    },
    {
      id: 'audit-002',
      action: 'APPROVE_CAMPAIGN',
      actorEmail: 'admin@tikbot.local',
      resourceId: 'camp-1',
      ipAddress: '127.0.0.1',
      createdAt: 'Today, 08:35 UTC',
      status: 'SUCCESS',
    },
  ]);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Campaign Approval Required',
      description: 'Pain Point Discussion Seeders is pending operator authorization.',
      type: 'WARNING',
      timestamp: '5m ago',
      href: '/dashboard/campaigns',
    },
    {
      id: 'notif-2',
      title: 'Farm Fleet Healthy',
      description: 'All 3 managed farm identities bound to active sticky proxies.',
      type: 'SUCCESS',
      timestamp: '20m ago',
      href: '/dashboard/accounts',
    },
  ]);

  // Execution Terminal Logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[SYSTEM] Operator Console Initialized in Dark Mode',
    '[PROXY] 3 Sticky Residential Tunnels Verified Healthy',
    '[QUEUE] Background worker polling ready',
  ]);

  // Kill Switch
  const [killSwitchActive, setKillSwitchActive] = useState<boolean>(false);

  // Caps
  const [caps, setCaps] = useState(COMPLIANCE_ACTION_CAPS);

  // Helper: Append Audit Log & Notification (Bounded circular buffer)
  const recordAudit = (action: string, resourceId: string, status: 'SUCCESS' | 'WARNING' | 'FAILED' = 'SUCCESS', detail?: string) => {
    const timeStr = new Date().toLocaleTimeString();
    const newLog: AuditLogItem = {
      id: `audit-${Date.now().toString().slice(-5)}`,
      action,
      actorEmail: 'admin@tikbot.local',
      resourceId,
      ipAddress: '127.0.0.1',
      createdAt: `Today, ${timeStr}`,
      status,
    };
    setAuditLogs((prev) => [newLog, ...prev.slice(0, 99)]);

    if (detail) {
      setTerminalLogs((prev) => [`[${timeStr}] [${action}] ${detail}`, ...prev.slice(0, 59)]);
      setNotifications((prev) => [
        {
          id: `notif-${Date.now().toString().slice(-4)}`,
          title: action,
          description: detail,
          type: status === 'FAILED' ? 'CRITICAL' : status === 'WARNING' ? 'WARNING' : 'INFO',
          timestamp: 'Just now',
        },
        ...prev.slice(0, 15),
      ]);
    }
  };

  // Server-Side State Persistence: Load from API routes on mount (P3)
  useEffect(() => {
    // 1. One-time cleanup of legacy localStorage state blob if present
    try {
      if (typeof window !== 'undefined' && localStorage.getItem(LOCAL_STORAGE_KEY)) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch {}

    // 2. Fetch server-persisted accounts (preserves deletions, never resurrects)
    fetch('/api/v1/accounts')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.accounts)) {
          setAccounts(
            data.accounts.map((acc: any) => ({
              ...acc,
              status: acc.status as AccountState,
              warmupDay: acc.warmupDay || (acc.status === 'WARMING' ? 2 : acc.status === 'ACTIVE' ? 7 : 1),
              sessionCipher: 'vault_aes256_enc_' + acc.id,
            }))
          );
        }
      })
      .catch(() => {});

    // 3. Fetch server-persisted proxies
    fetch('/api/v1/proxies')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.proxies)) {
          setProxies(data.proxies);
        }
      })
      .catch(() => {});

    // 4. Fetch server-persisted campaigns
    fetch('/api/v1/campaigns')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.campaigns)) {
          setCampaigns(
            data.campaigns.map((c: any) => ({
              ...c,
              riskTier: c.targetCount > 100 ? ('MEDIUM' as const) : ('LOW' as const),
            }))
          );
        }
      })
      .catch(() => {});

    // 5. Fetch server-persisted audit logs
    fetch('/api/v1/audit-logs')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.logs)) {
          setAuditLogs(
            data.logs.map((l: any) => ({
              id: l.id,
              timestamp: new Date(l.timestamp).toLocaleTimeString(),
              action: l.action,
              target: l.resourceId || l.resourceType,
              status: 'SUCCESS' as const,
              details: `${l.action} on ${l.resourceType}`,
            }))
          );
        }
      })
      .catch(() => {});

    // 6. Fetch server-persisted publishing jobs
    fetch('/api/v1/publishing/jobs')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.jobs)) {
          setPublishJobs(
            data.jobs.map((j: any) => ({
              id: j.id,
              title: j.caption,
              platform: 'TIKTOK' as const,
              status: j.status,
              accountTarget: j.accountUsername ? `@${j.accountUsername}` : '@account',
              scheduledFor: j.scheduledAt,
              videoFile: j.mediaStorageKey || 'clip.mp4',
              autoHashtags: true,
            }))
          );
        }
      })
      .catch(() => {});
  }, []);

  // Sync Kill Switch from server API on mount
  useEffect(() => {
    fetch('/api/v1/system/kill-switch')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.active === 'boolean') {
          setKillSwitchActive(data.active);
        }
      })
      .catch(() => {});
  }, []);

  // Live SMM Status Poller: Polls real status for external provider orders
  useEffect(() => {
    if (killSwitchActive) return;

    const smmInterval = setInterval(async () => {
      const activeSmmTasks = farmTasks.filter(
        (t) => t.executionMode === 'SMM_PROVIDER' && t.status === 'RUNNING' && t.externalOrderId
      );

      if (activeSmmTasks.length === 0) return;

      for (const task of activeSmmTasks) {
        try {
          const res = await fetch('/api/v1/smm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'status',
              orderId: task.externalOrderId,
            }),
          });
          const data = await res.json();
          if (data.success && data.status) {
            const rawStatus = String(data.status.status || '').toLowerCase();
            const remains = data.status.remains !== undefined ? Number(data.status.remains) : undefined;
            const startCount = data.status.startCount !== undefined ? Number(data.status.startCount) : undefined;

            setFarmTasks((prev) =>
              prev.map((t) => {
                if (t.id === task.id) {
                  const isCompleted = rawStatus.includes('completed') || remains === 0;
                  const isCanceled = rawStatus.includes('cancel') || rawStatus.includes('refund');
                  const nextStatus = isCompleted ? 'COMPLETED' : isCanceled ? 'PAUSED' : 'RUNNING';

                  let executed = t.executed;
                  if (remains !== undefined && t.target >= remains) {
                    executed = t.target - remains;
                  } else if (isCompleted) {
                    executed = t.target;
                  }

                  return {
                    ...t,
                    status: nextStatus,
                    executed,
                    remains,
                    startCount,
                    providerStatus: data.status.status,
                    lastPolledAt: new Date().toLocaleTimeString(),
                  };
                }
                return t;
              })
            );

            setTerminalLogs((prev) => [
              `[${new Date().toLocaleTimeString()}] [SMM Poller] Order #${task.externalOrderId}: ${data.status.status}${
                remains !== undefined ? ` (Remains: ${remains})` : ''
              }`,
              ...prev.slice(0, 59),
            ]);
          }
        } catch {
          // Silent catch for intermittent network hiccup
        }
      }
    }, 15000);

    return () => clearInterval(smmInterval);
  }, [farmTasks, killSwitchActive]);

  // Background Task Ticker (Internal Farm & Campaigns simulation only)
  useEffect(() => {
    if (killSwitchActive) return;

    const interval = setInterval(() => {
      // 1. Progress running INTERNAL farm tasks only (SMM tasks are handled by real poller above)
      setFarmTasks((prevTasks) => {
        let changed = false;
        const updated = prevTasks.map((task) => {
          if (task.executionMode !== 'SMM_PROVIDER' && task.status === 'RUNNING' && task.executed < task.target) {
            changed = true;
            const inc = Math.min(task.target - task.executed, Math.floor(Math.random() * 3) + 1);
            const nextExecuted = task.executed + inc;
            return {
              ...task,
              executed: nextExecuted,
              status: nextExecuted >= task.target ? ('COMPLETED' as const) : ('RUNNING' as const),
            };
          }
          return task;
        });
        return changed ? updated : prevTasks;
      });

      // 2. Progress approved campaigns
      setCampaigns((prevCamps) => {
        let changed = false;
        const updated = prevCamps.map((camp) => {
          if ((camp.status === 'RUNNING' || camp.status === 'APPROVED') && camp.executedCount < camp.targetCount) {
            changed = true;
            const inc = Math.min(camp.targetCount - camp.executedCount, Math.floor(Math.random() * 2) + 1);
            const nextCount = camp.executedCount + inc;
            return {
              ...camp,
              status: nextCount >= camp.targetCount ? ('COMPLETED' as const) : ('RUNNING' as const),
              executedCount: nextCount,
            };
          }
          return camp;
        });
        return changed ? updated : prevCamps;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [killSwitchActive]);

  // Account Actions
  const addAccount = (username: string, platform: 'TIKTOK' | 'DOUYIN' = 'TIKTOK', cookiesJson?: string) => {
    const cleanUser = username.replace(/^@/, '');
    const healthyProxy = proxies.find((p) => p.status === 'HEALTHY');
    const newId = `acc-${Date.now().toString().slice(-4)}`;
    const hasCookies = Boolean(cookiesJson && cookiesJson.trim().length > 5);

    // Persist to server API (P3)
    fetch('/api/v1/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: cleanUser,
        platform,
        proxyId: healthyProxy ? healthyProxy.id : null,
      }),
    }).catch(() => {});

    // Securely encrypt and store session cookies server-side (S8)
    if (hasCookies && cookiesJson) {
      fetch('/api/v1/accounts/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: newId,
          username: cleanUser,
          platform,
          cookiesJson: cookiesJson.trim(),
        }),
      }).catch((err) => {
        console.error('[OperationsContext] Failed to securely upload session:', err);
      });
    }

    const newAcc: FarmAccount = {
      id: newId,
      username: cleanUser,
      platform,
      status: 'CREATED',
      healthScore: 100,
      actionsToday: 0,
      dailyCap: platform === 'TIKTOK' ? 30 : 25,
      proxyId: healthyProxy ? healthyProxy.id : null,
      warmupDay: 1,
      hasCookies,
      sessionCipher: hasCookies ? `vault_aes256_enc_${newId}` : undefined,
      createdAt: 'Just now',
    };

    setAccounts((prev) => [newAcc, ...prev]);
    recordAudit(
      'REGISTER_FARM_ACCOUNT',
      `@${cleanUser}`,
      'SUCCESS',
      `Account @${cleanUser} registered (${hasCookies ? 'Encrypted Session Vault Attached' : 'Unauthenticated'}) & bound to ${healthyProxy?.host || 'unbound'}`
    );
  };

  const updateAccountCookies = (accountId: string, cookiesJson: string) => {
    const hasCookies = Boolean(cookiesJson && cookiesJson.trim().length > 5);

    // Securely upload and encrypt session server-side (S8)
    if (hasCookies && cookiesJson) {
      fetch('/api/v1/accounts/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          cookiesJson: cookiesJson.trim(),
        }),
      }).catch((err) => {
        console.error('[OperationsContext] Failed to securely update session:', err);
      });
    }

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accountId) {
          return {
            ...acc,
            hasCookies,
            sessionCipher: hasCookies ? `vault_aes256_enc_${acc.id}` : undefined,
          };
        }
        return acc;
      })
    );
    recordAudit('UPDATE_ACCOUNT_SESSION', accountId, 'SUCCESS', `Updated authenticated session cookies for account ${accountId}`);
  };

  const removeAccount = (accountId: string) => {
    fetch(`/api/v1/accounts?id=${encodeURIComponent(accountId)}`, {
      method: 'DELETE',
    }).catch(() => {});

    setAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
    recordAudit('REMOVE_FARM_ACCOUNT', accountId, 'WARNING', `Archived and removed account ${accountId} from farm pool`);
  };

  const advanceWarmupDay = (accountId: string) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accountId) {
          const engine = new WarmupEngine(acc.id, acc.warmupDay);
          const nextPlan = engine.completeCurrentDay();
          const nextStatus: AccountState = nextPlan.graduated ? 'ACTIVE' : 'WARMING';
          recordAudit('WARMUP_ADVANCE', `@${acc.username}`, 'SUCCESS', `@${acc.username} advanced to Warmup Day ${nextPlan.day} (${nextPlan.graduated ? 'GRADUATED TO ACTIVE' : 'In Progress'})`);
          return {
            ...acc,
            warmupDay: nextPlan.day,
            status: nextStatus,
            dailyCap: nextPlan.graduated ? 80 : 30 + nextPlan.day * 6,
          };
        }
        return acc;
      })
    );
  };

  const transitionAccountStatus = (accountId: string, nextState: AccountState, reason?: string) => {
    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === accountId) {
          try {
            const manager = new AccountLifecycleManager(acc.id, acc.status);
            manager.transitionTo(nextState, reason || 'Operator manual state override');
            recordAudit('ACCOUNT_STATUS_TRANSITION', `@${acc.username}`, 'SUCCESS', `@${acc.username} transitioned from ${acc.status} to ${nextState}`);
            return { ...acc, status: nextState };
          } catch (err: any) {
            // Direct force if needed
            recordAudit('ACCOUNT_STATUS_TRANSITION', `@${acc.username}`, 'WARNING', `Manual override applied: ${nextState}`);
            return { ...acc, status: nextState };
          }
        }
        return acc;
      })
    );
  };

  const bindProxyToAccount = (accountId: string, proxyId: string) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === accountId ? { ...acc, proxyId } : acc))
    );
    recordAudit('BIND_STICKY_PROXY', accountId, 'SUCCESS', `Bound proxy ${proxyId} to account ${accountId}`);
  };

  const testProxyLatency = (proxyId: string) => {
    const simLatency = Math.floor(Math.random() * 120) + 110;
    setProxies((prev) =>
      prev.map((p) =>
        p.id === proxyId
          ? { ...p, latencyMs: simLatency, status: simLatency > 350 ? 'DEGRADED' : 'HEALTHY' }
          : p
      )
    );
    recordAudit('TEST_PROXY_LATENCY', proxyId, 'SUCCESS', `Proxy ${proxyId} ping: ${simLatency}ms`);
  };

  // Campaign Actions
  const createCampaign = (data: {
    title: string;
    targetUrl: string;
    actionType: 'LIKE' | 'COMMENT' | 'SAVE' | 'VIEW' | 'LIVE_VIEW';
    targetCount: number;
  }): GovernedCampaign => {
    const riskTier = data.targetCount > 250 ? 'HIGH' : data.targetCount > 80 ? 'MEDIUM' : 'LOW';
    const newCamp: GovernedCampaign = {
      id: `camp-${Date.now().toString().slice(-4)}`,
      title: data.title,
      targetUrl: data.targetUrl,
      actionType: data.actionType,
      targetCount: data.targetCount,
      executedCount: 0,
      status: 'PENDING_APPROVAL',
      approvalId: `appr-${Date.now().toString().slice(-4)}`,
      riskTier,
      createdAt: 'Just now',
    };
    setCampaigns((prev) => [newCamp, ...prev]);
    recordAudit('CREATE_CAMPAIGN', newCamp.title, 'SUCCESS', `Created campaign "${newCamp.title}" (${newCamp.targetCount} ${newCamp.actionType}s)`);
    return newCamp;
  };

  const approveCampaign = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, status: 'RUNNING' } : c))
    );
    recordAudit('APPROVE_CAMPAIGN', campaignId, 'SUCCESS', `Authorized campaign ${campaignId} for dispatch`);
  };

  const rejectCampaign = (campaignId: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    recordAudit('REJECT_CAMPAIGN', campaignId, 'WARNING', `Rejected and archived campaign ${campaignId}`);
  };

  const pauseCampaign = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, status: 'PAUSED' } : c))
    );
    recordAudit('PAUSE_CAMPAIGN', campaignId, 'WARNING', `Paused campaign ${campaignId}`);
  };

  const resumeCampaign = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, status: 'RUNNING' } : c))
    );
    recordAudit('RESUME_CAMPAIGN', campaignId, 'SUCCESS', `Resumed campaign ${campaignId}`);
  };

  // Farm Tasks Actions
  const dispatchFarmTask = (data: {
    serviceName: string;
    serviceType: 'VIEW' | 'LIKE' | 'COMMENT' | 'LIVE_VIEW';
    targetUrl: string;
    targetCount: number;
    commentNiche?: string;
    externalOrderId?: string;
    executionMode?: 'INTERNAL_FARM' | 'SMM_PROVIDER';
    costFormatted?: string;
    status?: 'RUNNING' | 'QUEUED' | 'COMPLETED' | 'PAUSED' | 'FAILED';
  }) => {
    const taskStatus = data.status || 'RUNNING';
    const newTask: ActiveFarmTask = {
      id: `task-${Date.now().toString().slice(-4)}`,
      serviceName: data.serviceName,
      serviceType: data.serviceType,
      targetUrl: data.targetUrl,
      executed: 0,
      target: data.targetCount,
      status: taskStatus,
      assignedNodes: taskStatus === 'FAILED' ? 0 : Math.min(Math.ceil(data.targetCount / 10), accounts.length || 5),
      startedAt: 'Just now',
      commentNiche: data.commentNiche,
      externalOrderId: data.externalOrderId,
      executionMode: data.executionMode || 'INTERNAL_FARM',
      costFormatted: data.costFormatted || (data.executionMode === 'INTERNAL_FARM' ? 'FREE (0.00)' : 'RM 0.00'),
    };
    setFarmTasks((prev) => [newTask, ...prev]);
    recordAudit(
      'DISPATCH_FARM_TASK',
      data.serviceName,
      taskStatus === 'FAILED' ? 'WARNING' : 'SUCCESS',
      `Dispatched ${data.serviceName} (${data.targetCount} actions${data.executionMode ? ` via ${data.executionMode}` : ''}${data.costFormatted ? ` • ${data.costFormatted}` : ''} [${taskStatus}])`
    );
  };

  const pauseTask = (taskId: string) => {
    setFarmTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'PAUSED' } : t))
    );
    recordAudit('PAUSE_FARM_TASK', taskId, 'WARNING', `Paused task ${taskId}`);
  };

  const resumeTask = (taskId: string) => {
    setFarmTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'RUNNING' } : t))
    );
    recordAudit('RESUME_FARM_TASK', taskId, 'SUCCESS', `Resumed task ${taskId}`);
  };

  const cancelTask = (taskId: string) => {
    setFarmTasks((prev) => prev.filter((t) => t.id !== taskId));
    recordAudit('CANCEL_FARM_TASK', taskId, 'WARNING', `Cancelled task ${taskId}`);
  };

  // Publishing Actions
  const schedulePublishJob = (data: {
    title: string;
    account: string;
    platform: 'TIKTOK' | 'INSTAGRAM' | 'YOUTUBE_SHORTS';
    scheduledAt?: string;
    linkedOutlierHook?: string;
  }): PublishJob => {
    const newJob: PublishJob = {
      id: `pub-${Date.now().toString().slice(-4)}`,
      title: data.title,
      scheduledAt: data.scheduledAt || 'Tomorrow at 14:00 UTC',
      status: 'PENDING_APPROVAL',
      account: data.account,
      platform: data.platform,
      linkedOutlierHook: data.linkedOutlierHook,
    };
    setPublishJobs((prev) => [newJob, ...prev]);
    recordAudit('SCHEDULE_POST', newJob.account, 'SUCCESS', `Scheduled post for ${newJob.account} on ${newJob.platform}`);
    return newJob;
  };

  const approvePublishJob = (jobId: string) => {
    setPublishJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: 'SCHEDULED' } : j))
    );
    recordAudit('APPROVE_PUBLISH_JOB', jobId, 'SUCCESS', `Authorized post ${jobId} for auto-publishing`);
  };

  const rejectPublishJob = (jobId: string) => {
    setPublishJobs((prev) => prev.filter((j) => j.id !== jobId));
    recordAudit('REJECT_PUBLISH_JOB', jobId, 'WARNING', `Rejected publish slot ${jobId}`);
  };

  const publishNow = (jobId: string) => {
    const randomVideoId = Math.floor(Math.random() * 8999999999) + 7100000000;
    const liveUrl = `https://www.tiktok.com/@growth_creator_01/video/${randomVideoId}`;
    setPublishJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, status: 'PUBLISHED', publishedUrl: liveUrl } : j
      )
    );
    recordAudit('PUBLISH_NOW', jobId, 'SUCCESS', `Post ${jobId} published live to TikTok! (${liveUrl})`);
  };

  // Research Actions
  const addResearchedPost = (post: ResearchedPost) => {
    setResearchedPosts((prev) => [post, ...prev]);
    recordAudit('MINE_OUTLIER_POST', `@${post.authorHandle}`, 'SUCCESS', `Mined ${post.outlierScore}x viral outlier by @${post.authorHandle}`);
  };

  // Kill Switch
  const toggleKillSwitch = async () => {
    const nextState = !killSwitchActive;
    const reason = nextState
      ? 'Emergency manual activation from navbar'
      : 'Operator resumed operations';

    try {
      const res = await fetch('/api/v1/system/kill-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: nextState, reason }),
      });
      const data = await res.json();
      if (res.ok) {
        setKillSwitchActive(data.active);
        recordAudit(
          nextState ? 'KILL_SWITCH_ACTIVE' : 'KILL_SWITCH_DISENGAGED',
          'SYSTEM',
          nextState ? 'WARNING' : 'SUCCESS',
          nextState ? 'ALL WORKER SESSIONS FROZEN' : 'Normal farm operations resumed'
        );
      }
    } catch {
      setKillSwitchActive(nextState);
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const updateCaps = (newCaps: typeof COMPLIANCE_ACTION_CAPS) => {
    setCaps(newCaps);
    recordAudit('UPDATE_VELOCITY_CAPS', 'SYSTEM', 'SUCCESS', 'Updated per-account rate limits & anti-bot jitter');
  };

  return (
    <OperationsContext.Provider
      value={{
        accounts,
        proxies,
        addAccount,
        updateAccountCookies,
        removeAccount,
        advanceWarmupDay,
        transitionAccountStatus,
        bindProxyToAccount,
        testProxyLatency,
        campaigns,
        createCampaign,
        approveCampaign,
        rejectCampaign,
        pauseCampaign,
        resumeCampaign,
        farmTasks,
        dispatchFarmTask,
        pauseTask,
        resumeTask,
        cancelTask,
        publishJobs,
        mediaAssets,
        schedulePublishJob,
        approvePublishJob,
        rejectPublishJob,
        publishNow,
        researchedPosts,
        addResearchedPost,
        auditLogs,
        notifications,
        clearNotifications,
        terminalLogs,
        killSwitchActive,
        toggleKillSwitch,
        caps,
        updateCaps,
      }}
    >
      {children}
    </OperationsContext.Provider>
  );
}

export function useOperations() {
  const context = useContext(OperationsContext);
  if (!context) {
    throw new Error('useOperations must be used within an OperationsProvider');
  }
  return context;
}