import { NextResponse } from 'next/server';
import { requireAdmin } from '@wonderpin/auth/server';
import { MISSION_MEDIA_BUCKET } from '@wonderpin/database/wonder-missions';
import { adminApiError } from '@/lib/admin-api';
import {
  getAdminWonderMission,
  listWonderMissionAssets,
  updateWonderMission,
} from '@/lib/missions';

export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const { client } = await requireAdmin();
    const mission = await getAdminWonderMission(client, decodeURIComponent((await params).id));
    return mission ? NextResponse.json(mission) : NextResponse.json({ error: '원더미션을 찾을 수 없습니다.' }, { status: 404 });
  } catch (error) {
    return adminApiError(error, 500);
  }
}

export async function PUT(request: Request, { params }: Context) {
  try {
    const { client, user } = await requireAdmin();
    const mission = await updateWonderMission(
      client,
      user.id,
      decodeURIComponent((await params).id),
      await request.json(),
    );
    return mission ? NextResponse.json(mission) : NextResponse.json({ error: '원더미션을 찾을 수 없습니다.' }, { status: 404 });
  } catch (error) {
    return adminApiError(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    const { client } = await requireAdmin();
    const id = decodeURIComponent((await params).id);
    const mission = await getAdminWonderMission(client, id);
    if (!mission) return NextResponse.json({ error: '원더미션을 찾을 수 없습니다.' }, { status: 404 });

    const assets = await listWonderMissionAssets(client, id);
    if (assets.length) {
      const { error: storageError } = await client.storage
        .from(MISSION_MEDIA_BUCKET)
        .remove(assets.map((asset) => asset.object_path));
      if (storageError) throw new Error(`이미지 정리에 실패했습니다: ${storageError.message}`);
    }
    const { error } = await client.from('wonder_missions').delete().eq('id', id);
    if (error) throw new Error(error.message);
    return NextResponse.json({ deleted: true, id });
  } catch (error) {
    return adminApiError(error, 500);
  }
}
