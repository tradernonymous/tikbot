export interface FixtureDataset {
  users: Array<{
    id: string;
    email: string;
    role: 'OPERATOR' | 'AUDITOR';
  }>;
  proxies: Array<{
    id: string;
    protocol: 'HTTP' | 'SOCKS5';
    host: string;
    port: number;
    country: string;
    status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
    latencyMs: number;
  }>;
  accounts: Array<{
    id: string;
    username: string;
    platform: 'TIKTOK' | 'DOUYIN';
    status: 'CREATED' | 'WARMING' | 'ACTIVE' | 'COOLDOWN' | 'RESTRICTED' | 'BANNED';
    healthScore: number;
    actionsToday: number;
    dailyCap: number;
    proxyId: string | null;
  }>;
  approvals: Array<{
    id: string;
    type: 'CAMPAIGN' | 'PUBLISH';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    resourceId: string;
  }>;
  campaigns: Array<{
    id: string;
    title: string;
    targetUrl: string;
    actionType: 'LIKE' | 'COMMENT' | 'SAVE' | 'VIEW' | 'LIVE_VIEW';
    targetCount: number;
    executedCount: number;
    status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'RUNNING' | 'COMPLETED';
    approvalId: string | null;
  }>;
  posts: Array<{
    id: string;
    platformPostId: string;
    authorHandle: string;
    caption: string;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    outlierScore: number;
  }>;
}

export function getDevFixtures(): FixtureDataset {
  const proxies = [
    {
      id: 'proxy-us-1',
      protocol: 'HTTP' as const,
      host: 'res.proxy-gateway.io',
      port: 10001,
      country: 'US',
      status: 'HEALTHY' as const,
      latencyMs: 142,
    },
    {
      id: 'proxy-uk-1',
      protocol: 'HTTP' as const,
      host: 'res.proxy-gateway.io',
      port: 10002,
      country: 'GB',
      status: 'HEALTHY' as const,
      latencyMs: 185,
    },
    {
      id: 'proxy-de-1',
      protocol: 'SOCKS5' as const,
      host: 'res.proxy-gateway.io',
      port: 10003,
      country: 'DE',
      status: 'DEGRADED' as const,
      latencyMs: 380,
    },
  ];

  const approvals = [
    {
      id: 'appr-1',
      type: 'CAMPAIGN' as const,
      status: 'APPROVED' as const,
      resourceId: 'camp-1',
    },
    {
      id: 'appr-2',
      type: 'CAMPAIGN' as const,
      status: 'PENDING' as const,
      resourceId: 'camp-2',
    },
  ];

  return {
    users: [
      { id: 'usr-admin', email: 'admin@tikbot.local', role: 'OPERATOR' },
      { id: 'usr-auditor', email: 'audit@tikbot.local', role: 'AUDITOR' },
    ],
    proxies,
    accounts: [
      {
        id: 'acc-1',
        username: 'organic_growth_hacker',
        platform: 'TIKTOK',
        status: 'ACTIVE',
        healthScore: 98,
        actionsToday: 12,
        dailyCap: 80,
        proxyId: 'proxy-us-1',
      },
      {
        id: 'acc-2',
        username: 'content_spark_daily',
        platform: 'TIKTOK',
        status: 'WARMING',
        healthScore: 100,
        actionsToday: 4,
        dailyCap: 30,
        proxyId: 'proxy-uk-1',
      },
      {
        id: 'acc-3',
        username: 'trend_spotter_alpha',
        platform: 'TIKTOK',
        status: 'COOLDOWN',
        healthScore: 84,
        actionsToday: 78,
        dailyCap: 80,
        proxyId: 'proxy-us-1',
      },
    ],
    approvals,
    campaigns: [
      {
        id: 'camp-1',
        title: 'Initial Boost for Viral Hook Reel',
        targetUrl: 'https://www.tiktok.com/@creator/video/71829102918',
        actionType: 'LIKE',
        targetCount: 50,
        executedCount: 42,
        status: 'RUNNING',
        approvalId: 'appr-1',
      },
      {
        id: 'camp-2',
        title: 'Pain Point Discussion Seeders',
        targetUrl: 'https://www.tiktok.com/@creator/video/71829102999',
        actionType: 'COMMENT',
        targetCount: 15,
        executedCount: 0,
        status: 'PENDING_APPROVAL',
        approvalId: 'appr-2',
      },
    ],
    posts: [
      {
        id: 'post-1',
        platformPostId: '71829102918',
        authorHandle: 'topcreator',
        caption: '3 copywriting hooks that generate 100k views in 24 hours #marketing #hooks',
        viewCount: 420000,
        likeCount: 58000,
        commentCount: 1240,
        shareCount: 8900,
        outlierScore: 4.82,
      },
    ],
  };
}
