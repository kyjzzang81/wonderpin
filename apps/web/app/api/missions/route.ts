import { NextResponse } from 'next/server';
import { sanitizeMissionHtml } from '@wonderpin/database/wonder-missions';
import { listMissions } from '@/lib/missions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const items = (await listMissions()).map((mission) => ({ ...mission, content: sanitizeMissionHtml(mission.content) }));
  return NextResponse.json({ items, total: items.length });
}
