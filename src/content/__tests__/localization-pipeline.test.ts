import { describe, it, expect } from 'vitest';
import {
  LocalizationPipeline,
  LocalizationSpendApprovalRequiredError,
  type LocalizationRequest,
} from '../localization-pipeline';

describe('M6.5 Localization Pipeline Safety Guardrail', () => {
  const pipeline = new LocalizationPipeline();

  it('strictly blocks execution and throws if operator confirmation is missing', () => {
    const unconfirmedReq: LocalizationRequest = {
      sourceVideoPath: '/tmp/master_video.mp4',
      sourceLanguage: 'en',
      targetLanguages: ['es', 'ja'],
      dubAudio: true,
      operatorConfirmed: false,
    };

    expect(() => {
      pipeline.queueLocalizationJob(unconfirmedReq);
    }).toThrow(LocalizationSpendApprovalRequiredError);
  });

  it('queues localization job descriptors when operator explicitly confirms spend', () => {
    const confirmedReq: LocalizationRequest = {
      sourceVideoPath: '/tmp/master_video.mp4',
      sourceLanguage: 'en',
      targetLanguages: ['es', 'ja'],
      dubAudio: true,
      operatorConfirmed: true,
    };

    const result = pipeline.queueLocalizationJob(confirmedReq);
    expect(result.status).toBe('QUEUED');
    expect(result.jobs.length).toBe(2);
    expect(result.jobs[0].targetLanguage).toBe('es');
    expect(result.jobs[1].targetLanguage).toBe('ja');
    expect(result.requiresSpend).toBe(true);
  });
});
