import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getConfig } from '@/config';

export const dynamic = 'force-dynamic';

export interface WebhookJobPayload {
  jobId: string;
  status: 'COMPLETED' | 'FAILED';
  result?: Record<string, unknown>;
  error?: string;
}

export type WebhookJobCallback = (
  jobId: string,
  status: 'COMPLETED' | 'FAILED',
  result?: Record<string, unknown>,
  error?: string
) => Promise<boolean>;

function timingSafeSecretCompare(
  provided: string | null | undefined,
  expected: string | null | undefined
): boolean {
  if (!provided || !expected) {
    return false;
  }
  const bufA = Buffer.from(provided, 'utf-8');
  const bufB = Buffer.from(expected, 'utf-8');
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function handleJobWebhook(
  payload: WebhookJobPayload,
  providedSecret: string | null,
  expectedSecret: string,
  callback?: WebhookJobCallback
): Promise<{ status: number; body: { success?: boolean; error?: string } }> {
  if (!expectedSecret || !providedSecret || !timingSafeSecretCompare(providedSecret, expectedSecret)) {
    return { status: 401, body: { error: 'Unauthorized webhook request' } };
  }

  if (!payload || !payload.jobId || !payload.status) {
    return { status: 400, body: { error: 'jobId and status are required fields' } };
  }

  if (callback) {
    await callback(payload.jobId, payload.status, payload.result, payload.error);
  }

  return { status: 200, body: { success: true } };
}

export async function POST(request: NextRequest) {
  try {
    const config = getConfig();
    const providedSecret = request.headers.get('x-internal-secret');
    const body = (await request.json()) as WebhookJobPayload;

    const res = await handleJobWebhook(body, providedSecret, config.INTERNAL_API_SECRET);
    return NextResponse.json(res.body, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid request' },
      { status: 500 }
    );
  }
}
