import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeVariantFingerprint,
  assertVariantIntegrity,
  registerPublishedVariant,
  resetVariantIntegrityRegistryForTesting,
  DuplicateVariantBlockedError,
} from '../variant-integrity-guard';

describe('A3.7 Variant Integrity Guard (Cross-Account Byte Deduplication)', () => {
  beforeEach(() => {
    resetVariantIntegrityRegistryForTesting();
  });

  it('computes sha256 byte fingerprint of video content buffer or string', () => {
    const hash = computeVariantFingerprint('video-bytes-sample-data-123');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);

    const sameHash = computeVariantFingerprint('video-bytes-sample-data-123');
    expect(sameHash).toBe(hash);
  });

  it('allows novel variant fingerprints on first publication', () => {
    const check = assertVariantIntegrity({
      accountId: 'acc-alpha',
      fingerprintSha256: 'a1b2c3d4e5f67890123456789012345678901234567890123456789012345678',
    });

    expect(check.allowed).toBe(true);
    expect(check.reason).toBeUndefined();
  });

  it('blocks publishing identical bytes across different accounts at queue level', () => {
    const testHash = '9999c3d4e5f67890123456789012345678901234567890123456789012345678';

    // Account Alpha publishes this variant
    registerPublishedVariant({
      accountId: 'acc-alpha',
      fingerprintSha256: testHash,
      jobId: 'job-publish-1',
    });

    // Account Beta tries to publish the identical bytes
    const checkBeta = assertVariantIntegrity({
      accountId: 'acc-beta',
      fingerprintSha256: testHash,
    });

    expect(checkBeta.allowed).toBe(false);
    expect(checkBeta.reason).toContain('Duplicate variant detected across account acc-alpha');

    // Throws DuplicateVariantBlockedError when strict mode is requested
    expect(() => {
      assertVariantIntegrity(
        {
          accountId: 'acc-beta',
          fingerprintSha256: testHash,
        },
        { throwOnBlock: true }
      );
    }).toThrow(DuplicateVariantBlockedError);
  });
});
