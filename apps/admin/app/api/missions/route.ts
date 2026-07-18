import { NextResponse } from 'next/server';
import { missionStore } from '@/lib/missions';

export const dynamic = 'force-dynamic';

export async function GET() {
  const items = await missionStore.list();
  return NextResponse.json({ items, total: items.length });
}

export async function POST(request: Request) {
  try { return NextResponse.json(await missionStore.create(await request.json()), { status: 201 }); }
  catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
}
