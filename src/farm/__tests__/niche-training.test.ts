import { describe, it, expect, beforeEach } from 'vitest';
import {
  NicheCurriculumEngine,
  type NicheCurriculum,
  type WarmupSessionPlan,
} from '../niche-curriculum';
import {
  NicheAlignmentScorer,
  type FeedSampleItem,
} from '../niche-alignment';
import {
  enrichPersonaInterests,
  type PersonaInterestProfile,
} from '../persona-interest';
import { TrainingScheduler } from '../training-scheduler';

describe('F3.1 Niche Curriculum Engine', () => {
  let engine: NicheCurriculumEngine;

  beforeEach(() => {
    engine = new NicheCurriculumEngine();
  });

  it('creates niche curriculum and generates human-like warmup plan with dwell variance', () => {
    const curriculum: NicheCurriculum = {
      nicheKey: 'FITNESS_GYM',
      name: 'Fitness & Bodybuilding',
      hashtags: ['#gymtok', '#workout', '#fitnesstips'],
      creators: ['@gymbro_cbum', '@fitgirl_sarah'],
      sounds: ['sound_phonk_123'],
      targetAlignmentThreshold: 70,
    };

    engine.registerCurriculum(curriculum);

    const session: WarmupSessionPlan = engine.generateTrainingSession('acc-1', 'FITNESS_GYM', 20); // 20 video scrolls
    expect(session.nicheKey).toBe('FITNESS_GYM');
    expect(session.totalScrolls).toBe(20);
    expect(session.targetLikeCount).toBeGreaterThanOrEqual(4);
    expect(session.targetLikeCount).toBeLessThanOrEqual(10); // 20-50% human fraction, never 100%
    expect(session.dwellVariances.length).toBe(20);
    expect(session.dwellVariances.every((d) => d >= 2.0)).toBe(true);
  });
});

describe('F3.2 Alignment Scorer', () => {
  let scorer: NicheAlignmentScorer;

  beforeEach(() => {
    scorer = new NicheAlignmentScorer();
  });

  it('computes alignment score and gates cohort eligibility', () => {
    const feedSample: FeedSampleItem[] = [
      { id: 'v1', hashtags: ['#gymtok', '#fitness'], author: '@gymbro' },
      { id: 'v2', hashtags: ['#workout'], author: '@someone' },
      { id: 'v3', hashtags: ['#cat', '#cute'], author: '@catlovers' },
      { id: 'v4', hashtags: ['#fitnesstips'], author: '@trainer' },
    ];

    // 3 out of 4 videos match FITNESS keywords -> 75% alignment
    const result = scorer.calculateAlignment(
      'acc-fit',
      ['#gymtok', '#fitness', '#workout', '#fitnesstips'],
      feedSample,
      70 // threshold
    );

    expect(result.alignmentScore).toBe(75);
    expect(result.eligibleForBoostCohort).toBe(true);
    expect(result.provenance).toBe('live');
  });

  it('rejects accounts below alignment threshold from boost cohort', () => {
    const feedSample: FeedSampleItem[] = [
      { id: 'v1', hashtags: ['#gaming', '#minecraft'], author: '@gamer1' },
      { id: 'v2', hashtags: ['#anime'], author: '@otaku' },
      { id: 'v3', hashtags: ['#gymtok'], author: '@gymbro' },
      { id: 'v4', hashtags: ['#food'], author: '@chef' },
    ];

    // 1 out of 4 -> 25% < 70% threshold
    const result = scorer.calculateAlignment(
      'acc-unaligned',
      ['#gymtok', '#fitness'],
      feedSample,
      70
    );

    expect(result.alignmentScore).toBe(25);
    expect(result.eligibleForBoostCohort).toBe(false);
  });
});

describe('F3.3 Persona Interest Enrichment', () => {
  it('enriches persona with in-niche topic vocabulary and interest weights', () => {
    const enriched: PersonaInterestProfile = enrichPersonaInterests('acc-tech', 'TECH_AI', [
      'machine learning',
      'chatgpt',
      'coding',
    ]);

    expect(enriched.nicheKey).toBe('TECH_AI');
    expect(enriched.vocabulary.length).toBeGreaterThanOrEqual(3);
    expect(enriched.topicWeights['machine learning']).toBeDefined();
    expect(enriched.sampleComments.length).toBeGreaterThan(0);
  });
});

describe('F3.4 Training Scheduler', () => {
  it('enrolls accounts into curricula and tracks cohort alignment distribution', () => {
    const scheduler = new TrainingScheduler();
    scheduler.enrollAccount('acc-1', 'FITNESS_GYM');
    scheduler.enrollAccount('acc-2', 'FITNESS_GYM');

    const status = scheduler.getCurriculumStats('FITNESS_GYM');
    expect(status.enrolledAccountsCount).toBe(2);
    expect(status.curriculumKey).toBe('FITNESS_GYM');
  });
});

describe('F3 Edge Branches Coverage', () => {
  it('covers listCurricula and getCurriculum in NicheCurriculumEngine', () => {
    const engine = new NicheCurriculumEngine();
    engine.registerCurriculum({
      nicheKey: 'ECOMM',
      name: 'E-commerce',
      hashtags: ['#dropship'],
      creators: ['@dropshipper'],
      sounds: ['s1'],
      targetAlignmentThreshold: 60,
    });

    expect(engine.getCurriculum('ECOMM')?.name).toBe('E-commerce');
    expect(engine.getCurriculum('MISSING')).toBeUndefined();
    expect(engine.listCurricula()).toHaveLength(1);
  });

  it('covers empty feedSample in NicheAlignmentScorer', () => {
    const scorer = new NicheAlignmentScorer();
    const res = scorer.calculateAlignment('acc-empty', ['#tech'], []);
    expect(res.alignmentScore).toBe(0);
    expect(res.eligibleForBoostCohort).toBe(false);
  });

  it('covers already enrolled and getEnrolledAccounts in TrainingScheduler', () => {
    const sched = new TrainingScheduler();
    sched.enrollAccount('acc-1', 'NICHE_A');
    sched.enrollAccount('acc-1', 'NICHE_A'); // duplicate
    expect(sched.getEnrolledAccounts('NICHE_A')).toEqual(['acc-1']);
    expect(sched.getEnrolledAccounts('NON_EXISTENT')).toEqual([]);
  });
});
