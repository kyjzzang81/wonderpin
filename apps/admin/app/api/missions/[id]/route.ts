import { NextResponse } from 'next/server';
import { missionStore } from '@/lib/missions';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const mission = await missionStore.get(decodeURIComponent((await params).id));
  return mission ? NextResponse.json(mission) : NextResponse.json({ error: '원더미션을 찾을 수 없습니다.' }, { status: 404 });
}

export async function PUT(request: Request, { params }: Context) {
  try {
    const mission = await missionStore.update(decodeURIComponent((await params).id), await request.json());
    return mission ? NextResponse.json(mission) : NextResponse.json({ error: '원더미션을 찾을 수 없습니다.' }, { status: 404 });
  } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
}

export async function DELETE(_request: Request, { params }: Context) {
  const id = decodeURIComponent((await params).id);
  const mission = await missionStore.remove(id);
  return mission ? NextResponse.json({ deleted: true, id }) : NextResponse.json({ error: '원더미션을 찾을 수 없습니다.' }, { status: 404 });
}
