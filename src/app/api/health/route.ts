import { NextResponse } from 'next/server';
import { checkLiveness } from '@/health';

export const dynamic = 'force-dynamic';

export async function GET() {
  const liveness = checkLiveness();
  return NextResponse.json(liveness, { status: 200 });
}
