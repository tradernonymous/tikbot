import { describe, it, expect } from 'vitest';
import {
  evaluateAccountHealth,
  type PageInspectionInput,
} from '../ban-detector';

describe('Account Health & Ban/Challenge Detector', () => {
  it('detects permanent suspension / ban and recommends QUARANTINE', () => {
    const input: PageInspectionInput = {
      httpStatus: 200,
      pageTitle: 'Account Suspended - TikTok',
      bodySnippet: 'Your account was permanently banned due to multiple violations of our Community Guidelines.',
    };

    const result = evaluateAccountHealth(input);
    expect(result.status).toBe('BANNED');
    expect(result.recommendedAction).toBe('QUARANTINE');
    expect(result.evidence).toContain('permanently banned');
  });

  it('detects captcha puzzle or SMS verification challenge and recommends MANUAL_CHALLENGE', () => {
    const captchaInput: PageInspectionInput = {
      httpStatus: 200,
      pageTitle: 'Verification - TikTok',
      bodySnippet: 'Please drag the slider to complete the puzzle to continue.',
    };

    const captchaResult = evaluateAccountHealth(captchaInput);
    expect(captchaResult.status).toBe('RESTRICTED');
    expect(captchaResult.recommendedAction).toBe('MANUAL_CHALLENGE');

    const smsInput: PageInspectionInput = {
      httpStatus: 200,
      pageTitle: 'Verify Phone',
      bodySnippet: 'Enter the 6-digit code sent to your phone number.',
    };

    const smsResult = evaluateAccountHealth(smsInput);
    expect(smsResult.status).toBe('RESTRICTED');
    expect(smsResult.recommendedAction).toBe('MANUAL_CHALLENGE');
  });

  it('detects rate limiting (429) and recommends COOLDOWN', () => {
    const input: PageInspectionInput = {
      httpStatus: 429,
      bodySnippet: 'Too Many Requests. Please wait before retrying.',
    };

    const result = evaluateAccountHealth(input);
    expect(result.status).toBe('RATE_LIMITED');
    expect(result.recommendedAction).toBe('COOLDOWN');
  });

  it('evaluates normal feed response as HEALTHY', () => {
    const input: PageInspectionInput = {
      httpStatus: 200,
      pageTitle: 'Profile - TikTok',
      bodySnippet: '<div class="video-feed">Video 1</div>',
    };

    const result = evaluateAccountHealth(input);
    expect(result.status).toBe('HEALTHY');
    expect(result.recommendedAction).toBe('NONE');
  });
});
