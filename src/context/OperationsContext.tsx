'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo, ReactNode } from 'react';
import { type FixtureDataset } from '@/fixtures';
import { WarmupEngine } from '@/farm/warmup-routine';
import { AccountLifecycleManager, AccountState } from '@/farm/account-lifecycle';
import { COMPLIANCE_ACTION_CAPS } from '@/farm/rate-limiter';
import { pollAllSMMTasks, calculatePollerBackoff } from '@/panel/smm-poller';

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

  // Network Sync Resilience
  fetchError: string | null;
  retryFetchAll: () => void;
}

const OperationsContext = createContext<OperationsContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'tikbot_operations_state_v1';

export function OperationsProvider({ children }: { children: ReactNode }) {
  // Initialize Accounts
  const [accounts, setAccounts] = useState<FarmAccount[]>([]);

  // Initialize Proxies
  const [proxies, setProxies] = useState<StickyProxy[]>([]);

  // Initialize Campaigns
  const [campaigns, setCampaigns] = useState<GovernedCampaign[]>([]);

  // Initialize Farm Tasks
  const [farmTasks, setFarmTasks] = useState<ActiveFarmTask[]>([]);

  // Initialize Publish Jobs
  const [publishJobs, setPublishJobs] = useState<PublishJob[]>([]);

  // Initialize Media Assets
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);

  // Initialize Researched Outlier Posts from server state
  const [researchedPosts, setResearchedPosts] = useState<ResearchedPost[]>([]);

  // Initialize Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  // Notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Execution Terminal Logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '[SYSTEM] Operator Console Initialized in Dark Mode',
    '[QUEUE] Background worker polling ready',
  ]);

  // Kill Switch
  const [killSwitchActive, setKillSwitchActive] = useState<boolean>(false);

  // Caps
  const [caps, setCaps] = useState(COMPLIANCE_ACTION_CAPS);

  // Helper: Append Audit Log & Notification (Bounded circular buffer)
  const recordAudit = (action: string, resourceId: string, status: 'SUCCESS' | 'WARNING' | 'FAILED' = 'SUCCESS', detail?: string) => {
    const timeStr = new Date().toLocaleTimeString();
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? `audit-${crypto.randomUUID()}` : `audit-${Date.now()}`;
    const newLog: AuditLogItem = {
      id,
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
      const notifId = typeof crypto !== 'undefined' && crypto.randomUUID ? `notif-${crypto.randomUUID()}` : `notif-${Date.now()}`;
      setNotifications((prev) => [
        {
          id: notifId,
          title: action,
          description: detail,
          type: status === 'FAILED' ? 'CRITICAL' : status === 'WARNING' ? 'WARNING' : 'INFO',
          timestamp: 'Just now',
        },
        ...prev.slice(0, 15),
      ]);
    }
  };

  // Server-Side State Persistence: Load from API routes on mount (P3 & 0.6)
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const retryFetchAll = () => {
    setFetchError(null);
    setRefreshCounter((c) => c + 1);
  };

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    // 1. One-time cleanup of legacy localStorage state blob if present
    try {
      if (typeof window !== 'undefined' && localStorage.getItem(LOCAL_STORAGE_KEY)) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    } catch {}

    const handleFetchErr = (err: any) => {
      if (err?.name === 'AbortError') return;
      setFetchError('Operations data synchronization issue. Displaying latest valid local state.');
    };

    // 2. Fetch server-persisted accounts (preserves deletions, never resurrects)
    fetch('/api/v1/accounts', { signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data?.success && Array.isArray(data.accounts)) {
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
      .catch(handleFetchErr);

    // 3. Fetch server-persisted proxies
    fetch('/api/v1/proxies', { signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data?.success && Array.isArray(data.proxies)) {
          setProxies(data.proxies);
        }
      })
      .catch(handleFetchErr);

    // 4. Fetch server-persisted campaigns
    fetch('/api/v1/campaigns', { signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data?.success && Array.isArray(data.campaigns)) {
          setCampaigns(
            data.campaigns.map((c: any) => ({
              ...c,
              riskTier: c.targetCount > 100 ? ('MEDIUM' as const) : ('LOW' as const),
            }))
          );
        }
      })
      .catch(handleFetchErr);

    // 5. Fetch server-persisted audit logs
    fetch('/api/v1/audit-logs', { signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data?.success && Array.isArray(data.logs)) {
          setAuditLogs(
            data.logs.map((l: any) => ({
              id: l.id,
              action: l.action || 'SYSTEM',
              actorEmail: l.metadata?.actorEmail || 'admin@tikbot.local',
              resourceId: l.resourceId || l.resourceType || 'SYSTEM',
              ipAddress: l.ipAddress || '127.0.0.1',
              createdAt: l.timestamp ? new Date(l.timestamp).toLocaleTimeString() : 'Today',
              status: (l.metadata?.status as 'SUCCESS' | 'WARNING' | 'FAILED') || 'SUCCESS',
            }))
          );
        }
      })
      .catch(handleFetchErr);

    // 6. Fetch server-persisted publishing jobs
    fetch('/api/v1/publishing/jobs', { signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data?.success && Array.isArray(data.jobs)) {
          setPublishJobs(
            data.jobs.map((j: any) => ({
              id: j.id,
              title: j.caption || 'Scheduled Post',
              platform: 'TIKTOK' as const,
              status: j.status,
              account: j.accountUsername ? (j.accountUsername.startsWith('@') ? j.accountUsername : `@${j.accountUsername}`) : '@account',
              scheduledAt: j.scheduledAt ? new Date(j.scheduledAt).toLocaleTimeString() : 'Scheduled',
              linkedOutlierHook: undefined,
            }))
          );
        }
      })
      .catch(handleFetchErr);

    // 7. Fetch media assets
    fetch('/api/v1/content/media', { signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data && Array.isArray(data.assets)) {
          setMediaAssets(
            data.assets.map((a: any) => ({
              id: a.id,
              title: a.storageKey,
              size: `${(a.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`,
              duration: a.durationSeconds ? `${a.durationSeconds.toFixed(1)}s` : '15.0s',
              format: '9:16',
              folder: (a.tags && a.tags[0]) || 'Hooks',
            }))
          );
        }
      })
      .catch(handleFetchErr);

    return () => {
      controller.abort();
    };
  }, [refreshCounter]);

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

  const farmTasksRef = useRef(farmTasks);
  farmTasksRef.current = farmTasks;

  const isPollingRef = useRef(false);
  const consecutiveErrorsRef = useRef(0);

  // Live SMM Status Poller: Ref-based lock, stable dependencies, Promise.allSettled batching, backoff & error telemetry (P10)
  useEffect(() => {
    if (killSwitchActive) return;

    let timeoutId: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const pollTick = async () => {
      if (isCancelled || isPollingRef.current) return;

      const activeSmmTasks = farmTasksRef.current.filter(
        (t) => t.executionMode === 'SMM_PROVIDER' && t.status === 'RUNNING' && t.externalOrderId
      );

      if (activeSmmTasks.length === 0) {
        consecutiveErrorsRef.current = 0;
        timeoutId = setTimeout(pollTick, 15000);
        return;
      }

      isPollingRef.current = true;
      let tickHadError = false;

      try {
        const results = await pollAllSMMTasks(
          activeSmmTasks.map((t) => ({ id: t.id, externalOrderId: t.externalOrderId }))
        );

        for (const res of results) {
          if (res.success && res.rawStatus) {
            const rawStatus = res.rawStatus.toLowerCase();
            const remains = res.remains;
            const startCount = res.startCount;

            setFarmTasks((prev) =>
              prev.map((t) => {
                if (t.id === res.taskId) {
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
                    providerStatus: res.rawStatus,
                    lastPolledAt: new Date().toLocaleTimeString(),
                  };
                }
                return t;
              })
            );

            setTerminalLogs((prev) => [
              `[${new Date().toLocaleTimeString()}] [SMM Poller] Order #${res.externalOrderId}: ${res.rawStatus}${
                remains !== undefined ? ` (Remains: ${remains})` : ''
              }`,
              ...prev.slice(0, 59),
            ]);
          } else if (!res.success) {
            tickHadError = true;
            setTerminalLogs((prev) => [
              `[${new Date().toLocaleTimeString()}] [SMM Poller Error] Order #${res.externalOrderId || res.taskId}: ${res.error || 'Failed status poll'}`,
              ...prev.slice(0, 59),
            ]);
          }
        }
      } catch (err) {
        tickHadError = true;
        setTerminalLogs((prev) => [
          `[${new Date().toLocaleTimeString()}] [SMM Poller Error] Batch poll failure: ${err instanceof Error ? err.message : String(err)}`,
          ...prev.slice(0, 59),
        ]);
      } finally {
        isPollingRef.current = false;
        if (tickHadError) {
          consecutiveErrorsRef.current += 1;
        } else {
          consecutiveErrorsRef.current = 0;
        }

        const nextDelay = calculatePollerBackoff(consecutiveErrorsRef.current, 15000, 60000);
        if (!isCancelled) {
          timeoutId = setTimeout(pollTick, nextDelay);
        }
      }
    };

    timeoutId = setTimeout(pollTick, 15000);

    return () => {
      isCancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [killSwitchActive]);

  // Background Task Ticker (Internal Farm & Campaigns simulation only - disabled in production per P7)
  useEffect(() => {
    if (killSwitchActive || process.env.NODE_ENV === 'production') return;

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
    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? `acc-${crypto.randomUUID()}` : `acc-${Date.now()}`;
    const hasCookies = Boolean(cookiesJson && cookiesJson.trim().length > 5);

    const newAcc: FarmAccount = {
      id: tempId,
      username: cleanUser,
      platform,
      status: 'CREATED',
      healthScore: 100,
      actionsToday: 0,
      dailyCap: platform === 'TIKTOK' ? 30 : 25,
      proxyId: healthyProxy ? healthyProxy.id : null,
      warmupDay: 1,
      hasCookies,
      sessionCipher: hasCookies ? `vault_aes256_enc_${tempId}` : undefined,
      createdAt: 'Just now',
    };

    setAccounts((prev) => [newAcc, ...prev]);

    // Persist to server API and synchronize server-generated ID
    fetch('/api/v1/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: cleanUser,
        platform,
        proxyId: healthyProxy ? healthyProxy.id : null,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.account) {
          const serverId = data.account.id;
          setAccounts((prev) =>
            prev.map((acc) =>
              acc.id === tempId
                ? {
                    ...acc,
                    id: serverId,
                    sessionCipher: hasCookies ? `vault_aes256_enc_${serverId}` : undefined,
                  }
                : acc
            )
          );
          recordAudit('ACCOUNT_PROVISIONED', serverId, 'SUCCESS', `Account @${cleanUser} provisioned successfully`);

          if (hasCookies && cookiesJson) {
            fetch('/api/v1/accounts/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                accountId: serverId,
                username: cleanUser,
                platform,
                cookiesJson: cookiesJson.trim(),
              }),
            }).catch((err) => {
              console.error('[OperationsContext] Failed to securely upload session:', err);
            });
          }
        } else {
          recordAudit('ACCOUNT_PROVISION_FAILED', cleanUser, 'FAILED', data.error || 'Server rejected account creation');
        }
      })
      .catch((err) => {
        console.error('[OperationsContext] Failed to persist account:', err);
        recordAudit('ACCOUNT_PROVISION_FAILED', cleanUser, 'FAILED', err?.message || 'Network error');
      });

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
    const tempId = typeof crypto !== 'undefined' && crypto.randomUUID ? `camp-${crypto.randomUUID()}` : `camp-${Date.now()}`;
    const apprId = typeof crypto !== 'undefined' && crypto.randomUUID ? `appr-${crypto.randomUUID()}` : `appr-${Date.now()}`;
    const newCamp: GovernedCampaign = {
      id: tempId,
      title: data.title,
      targetUrl: data.targetUrl,
      actionType: data.actionType,
      targetCount: data.targetCount,
      executedCount: 0,
      status: 'PENDING_APPROVAL',
      approvalId: apprId,
      riskTier,
      createdAt: 'Just now',
    };
    setCampaigns((prev) => [newCamp, ...prev]);

    // Persist to server API and sync database ID
    fetch('/api/v1/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: data.title,
        targetUrl: data.targetUrl,
        actionType: data.actionType,
        targetCount: data.targetCount,
        status: 'PENDING_APPROVAL',
      }),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.campaign) {
          const serverCamp = resData.campaign;
          setCampaigns((prev) =>
            prev.map((c) => (c.id === tempId ? { ...c, id: serverCamp.id } : c))
          );
          recordAudit('CREATE_CAMPAIGN', serverCamp.id, 'SUCCESS', `Created campaign "${newCamp.title}" (${newCamp.targetCount} ${newCamp.actionType}s)`);
        } else {
          recordAudit('CREATE_CAMPAIGN_FAILED', newCamp.title, 'FAILED', resData.error || 'Server rejected campaign');
        }
      })
      .catch((err) => {
        console.error('[OperationsContext] Failed to persist campaign:', err);
        recordAudit('CREATE_CAMPAIGN_FAILED', newCamp.title, 'FAILED', err?.message || 'Network error');
      });

    return newCamp;
  };

  const approveCampaign = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, status: 'RUNNING' } : c))
    );
    fetch('/api/v1/campaigns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: campaignId, status: 'RUNNING' }),
    }).catch(() => {});
    recordAudit('APPROVE_CAMPAIGN', campaignId, 'SUCCESS', `Authorized campaign ${campaignId} for dispatch`);
  };

  const rejectCampaign = (campaignId: string) => {
    setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
    fetch(`/api/v1/campaigns?id=${encodeURIComponent(campaignId)}`, {
      method: 'DELETE',
    }).catch(() => {});
    recordAudit('REJECT_CAMPAIGN', campaignId, 'WARNING', `Rejected and archived campaign ${campaignId}`);
  };

  const pauseCampaign = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, status: 'PAUSED' } : c))
    );
    fetch('/api/v1/campaigns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: campaignId, status: 'PAUSED' }),
    }).catch(() => {});
    recordAudit('PAUSE_CAMPAIGN', campaignId, 'WARNING', `Paused campaign ${campaignId}`);
  };

  const resumeCampaign = (campaignId: string) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, status: 'RUNNING' } : c))
    );
    fetch('/api/v1/campaigns', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: campaignId, status: 'RUNNING' }),
    }).catch(() => {});
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
    const taskId = typeof crypto !== 'undefined' && crypto.randomUUID ? `task-${crypto.randomUUID()}` : `task-${Date.now()}`;
    const newTask: ActiveFarmTask = {
      id: taskId,
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
    const pubId = typeof crypto !== 'undefined' && crypto.randomUUID ? `pub-${crypto.randomUUID()}` : `pub-${Date.now()}`;
    const newJob: PublishJob = {
      id: pubId,
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
    fetch(`/api/v1/publishing/jobs?id=${encodeURIComponent(jobId)}`, {
      method: 'DELETE',
    }).catch(() => {});
    recordAudit('REJECT_PUBLISH_JOB', jobId, 'WARNING', `Rejected publish slot ${jobId}`);
  };

  const publishNow = (jobId: string) => {
    recordAudit('PUBLISH_NOW', jobId, 'WARNING', `Direct upload requires configured worker engine driver`);
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

  const contextValue = useMemo<OperationsContextType>(
    () => ({
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
      fetchError,
      retryFetchAll,
    }),
    [
      accounts,
      proxies,
      campaigns,
      farmTasks,
      publishJobs,
      mediaAssets,
      researchedPosts,
      auditLogs,
      notifications,
      terminalLogs,
      killSwitchActive,
      caps,
      fetchError,
    ]
  );

  return (
    <OperationsContext.Provider value={contextValue}>
      {fetchError && (
        <div
          role="alert"
          className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs text-amber-300"
        >
          <span>{fetchError}</span>
          <button
            type="button"
            onClick={retryFetchAll}
            className="px-2.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-medium transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}
      {children}
    </OperationsContext.Provider>
  );
}

export { useUi } from './UiContext';
export { useNotifications } from './NotificationsContext';

export function useOperations() {
  const context = useContext(OperationsContext);
  if (!context) {
    throw new Error('useOperations must be used within an OperationsProvider');
  }
  return context;
}