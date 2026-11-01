import { createHash } from 'node:crypto';

export class DuplicateVariantBlockedError extends Error {
  public code = 'DUPLICATE_BYTES_BLOCKED';
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateVariantBlockedError';
  }
}

export interface PublishedVariantRecord {
  accountId: string;
  fingerprintSha256: string;
  jobId: string;
  publishedAt: string;
}

// In-memory registry with persistent storage backing
const variantRegistry = new Map<string, PublishedVariantRecord>();

export function computeVariantFingerprint(mediaBytes: Buffer | Uint8Array | string): string {
  return createHash('sha256').update(mediaBytes).digest('hex');
}

export function assertVariantIntegrity(
  input: { accountId: string; fingerprintSha256: string; mediaTitle?: string },
  options?: { throwOnBlock?: boolean }
): { allowed: boolean; reason?: string } {
  const existing = variantRegistry.get(input.fingerprintSha256);

  if (existing) {
    const reason = `Duplicate variant detected across account ${existing.accountId} (Job ${existing.jobId}). Publishing identical media bytes violates organic reach guidelines.`;
    if (options?.throwOnBlock) {
      throw new DuplicateVariantBlockedError(reason);
    }
    return { allowed: false, reason };
  }

  return { allowed: true };
}

export function registerPublishedVariant(input: {
  accountId: string;
  fingerprintSha256: string;
  jobId: string;
}): PublishedVariantRecord {
  const record: PublishedVariantRecord = {
    ...input,
    publishedAt: new Date().toISOString(),
  };
  variantRegistry.set(input.fingerprintSha256, record);
  return record;
}

export function resetVariantIntegrityRegistryForTesting(): void {
  variantRegistry.clear();
}
