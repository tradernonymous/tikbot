import { AgingTier } from './aging-tiers';

export interface WizardTarget {
  url: string;
  handle: string;
  canaryCheck: 'PENDING' | 'PASSED' | 'FAILED';
}

export interface WizardGoal {
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  deliveryHours: number;
}

export interface WizardCohort {
  id?: string;
  niche: string;
  minTier: AgingTier;
  availableCount: number;
}

export interface WizardPacing {
  curveType: 'GAUSSIAN' | 'LINEAR' | 'STAGGERED';
  peakHourOffset: number;
  jitterPercent: number;
}

export interface WizardSafety {
  preflightScore: number;
  warnings?: string[];
  clusterViolation: boolean;
  approved: boolean;
}

export interface LaunchWizardState {
  step: number;
  target: WizardTarget;
  goal: WizardGoal;
  cohort: WizardCohort;
  pacing: WizardPacing;
  safety: WizardSafety;
}

export function createWizardState(): LaunchWizardState {
  return {
    step: 1,
    target: {
      url: '',
      handle: '',
      canaryCheck: 'PENDING',
    },
    goal: {
      viewCount: 100,
      likeCount: 20,
      commentCount: 5,
      shareCount: 5,
      deliveryHours: 4,
    },
    cohort: {
      niche: 'general',
      minTier: 'FRESH',
      availableCount: 0,
    },
    pacing: {
      curveType: 'GAUSSIAN',
      peakHourOffset: 2,
      jitterPercent: 15,
    },
    safety: {
      preflightScore: 100,
      warnings: [],
      clusterViolation: false,
      approved: false,
    },
  };
}

export function validateWizardStep(
  step: number,
  state: LaunchWizardState
): { valid: boolean; error?: string } {
  if (step === 1) {
    if (!state.target.url || !state.target.url.includes('tiktok.com/')) {
      return { valid: false, error: 'Valid TikTok URL is required.' };
    }
    if (!state.target.handle) {
      return { valid: false, error: 'Target handle is required.' };
    }
    if (state.target.canaryCheck === 'FAILED') {
      return { valid: false, error: 'Target failed shadowban or reach canary test.' };
    }
    return { valid: true };
  }

  if (step === 2) {
    if (state.goal.viewCount <= 0 || state.goal.deliveryHours <= 0) {
      return { valid: false, error: 'Goal view count and delivery hours must be positive numbers.' };
    }
    return { valid: true };
  }

  if (step === 3) {
    if (!state.cohort.niche) {
      return { valid: false, error: 'A niche cohort must be selected.' };
    }
    return { valid: true };
  }

  if (step === 4) {
    if (state.pacing.jitterPercent < 0 || state.pacing.jitterPercent > 50) {
      return { valid: false, error: 'Jitter percent must be between 0% and 50%.' };
    }
    return { valid: true };
  }

  if (step === 5) {
    if (state.safety.clusterViolation) {
      return { valid: false, error: 'Cluster violation detected; break subnet collisions before launch.' };
    }
    if (state.safety.preflightScore < 60) {
      return { valid: false, error: 'Preflight safety score is too low (< 60).' };
    }
    return { valid: true };
  }

  return { valid: true };
}

export function serializeWizardToUrl(state: LaunchWizardState): string {
  const params = new URLSearchParams();
  params.set('w_step', state.step.toString());
  if (state.target.url) params.set('w_url', state.target.url);
  if (state.target.handle) params.set('w_handle', state.target.handle);
  params.set('w_views', state.goal.viewCount.toString());
  params.set('w_hours', state.goal.deliveryHours.toString());
  params.set('w_niche', state.cohort.niche);
  params.set('w_tier', state.cohort.minTier);
  params.set('w_curve', state.pacing.curveType);
  return params.toString();
}

export function deserializeWizardFromUrl(searchString: string): LaunchWizardState {
  const state = createWizardState();
  const params = new URLSearchParams(searchString.startsWith('?') ? searchString.slice(1) : searchString);

  if (params.has('w_step')) {
    const s = parseInt(params.get('w_step') || '1', 10);
    if (!isNaN(s) && s >= 1 && s <= 6) state.step = s;
  }
  if (params.has('w_url')) state.target.url = params.get('w_url') || '';
  if (params.has('w_handle')) state.target.handle = params.get('w_handle') || '';
  if (params.has('w_views')) {
    const v = parseInt(params.get('w_views') || '100', 10);
    if (!isNaN(v)) state.goal.viewCount = v;
  }
  if (params.has('w_hours')) {
    const h = parseInt(params.get('w_hours') || '4', 10);
    if (!isNaN(h)) state.goal.deliveryHours = h;
  }
  if (params.has('w_niche')) state.cohort.niche = params.get('w_niche') || 'general';
  if (params.has('w_tier')) state.cohort.minTier = (params.get('w_tier') as AgingTier) || 'FRESH';
  if (params.has('w_curve')) {
    state.pacing.curveType = (params.get('w_curve') as 'GAUSSIAN' | 'LINEAR' | 'STAGGERED') || 'GAUSSIAN';
  }

  return state;
}

export function buildOrderFromWizard(state: LaunchWizardState) {
  return {
    targetUrl: state.target.url,
    targetHandle: state.target.handle,
    goalTier: state.cohort.minTier,
    targetReach: state.goal.viewCount,
    status: 'PENDING' as const,
    stats: {
      views: state.goal.viewCount,
      likes: state.goal.likeCount,
      comments: state.goal.commentCount,
      shares: state.goal.shareCount,
      deliveryHours: state.goal.deliveryHours,
      cohortNiche: state.cohort.niche,
      preflightScore: state.safety.preflightScore,
    },
  };
}
