import { NextRequest, NextResponse } from 'next/server';
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

export async function handleJobWebhook(
  payload: WebhookJobPayload,
  providedSecret: string | null,
  expectedSecret: string,
  callback?: WebhookJobCallback
): Promise<{ status: number; body: { success?: boolean; error?: string } }> {
  if (!providedSecret || providedSecret !== expectedSecret) {
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
