import { NextRequest, NextResponse } from 'next/server';
import { globalKillSwitch } from '@/security/kill-switch';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(globalKillSwitch.getState());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { active, reason, operatorId } = body;

    if (typeof active !== 'boolean' || !reason) {
      return NextResponse.json(
        { error: 'Fields "active" (boolean) and "reason" (string) are required.' },
        { status: 400 }
      );
    }

    const state = globalKillSwitch.setKillSwitch(active, reason, operatorId || 'admin-operator');
    return NextResponse.json(state, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid request payload' },
      { status: 400 }
    );
  }
}
