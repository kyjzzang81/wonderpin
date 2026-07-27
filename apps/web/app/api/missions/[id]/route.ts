import { NextResponse } from 'next/server';
import { sanitizeMissionHtml } from '@wonderpin/database/wonder-missions';
import { getMission } from '@/lib/missions';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const mission = await getMission(decodeURIComponent((await params).id));
  return mission
    ? NextResponse.json({ ...mission, content: sanitizeMissionHtml(mission.content) })
    : NextResponse.json({ error: '원더미션을 찾을 수 없습니다.' }, { status: 404 });
}
