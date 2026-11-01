export interface SafetyRule {
  id: string;
  name: string;
  description: string;
  docRef: string;
  category: 'VELOCITY' | 'AUTHENTICITY' | 'SPAM' | 'CLUSTER';
}

export class SafetyRulesEngine {
  private static activeRules: SafetyRule[] = [
    {
      id: 'RULE_VELOCITY_CEILING',
      name: 'Velocity Ceiling & Anti-Spike Protection',
      description: 'Prevents flat instant bursts of views/likes on a single target, enforcing organic decay curves.',
      docRef: 'TikTok Community Guidelines — Integrity & Authenticity: Artificial Amplification',
      category: 'VELOCITY',
    },
    {
      id: 'RULE_COMMENT_UNIQUENESS',
      name: 'Comment Uniqueness & Repetition Floor',
      description: 'Guarantees comment templates maintain lexical diversity, preventing identical comment strings across farm runs.',
      docRef: 'TikTok Community Guidelines — Integrity & Authenticity: Spam & Mass Actions',
      category: 'SPAM',
    },
    {
      id: 'RULE_ENGAGEMENT_RATIO_PLAUSIBILITY',
      name: 'Organic Engagement Ratio Plausibility Band',
      description: 'Locks engagement mix (likes, comments, shares, saves) within documented organic creator distributions (never 100%).',
      docRef: 'TikTok Newsroom — How TikTok Recommends Videos: User Interactions Distribution',
      category: 'AUTHENTICITY',
    },
    {
      id: 'RULE_CLUSTER_BREAKER',
      name: 'Subnet & Fingerprint Cluster Decoupling',
      description: 'Enforces zero subnet collisions and breaks fingerprint family clustering on any individual target video.',
      docRef: 'TikTok Community Guidelines — Integrity & Authenticity: Circumvention & Coordinated Inauthentic Behavior',
      category: 'CLUSTER',
    },
  ];

  static getActiveRules(): SafetyRule[] {
    return [...this.activeRules];
  }
}
