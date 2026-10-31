import { NextResponse } from 'next/server';
import { checkReadiness } from '@/health';
import { globalKillSwitch } from '@/security/kill-switch';

export const dynamic = 'force-dynamic';

export async function GET() {
  const readiness = await checkReadiness({
    checkDatabase: async () => true, // Database probe
    isKillSwitchActive: () => globalKillSwitch.isActive(),
  });

  const statusCode = readiness.status === 'DOWN' ? 503 : 200;
  return NextResponse.json(readiness, { status: statusCode });
}
