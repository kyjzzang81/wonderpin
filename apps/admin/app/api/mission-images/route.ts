import { requireAdmin } from '@wonderpin/auth/server';
import {
  getAdminWonderMission,
  MAX_MISSION_IMAGE_BYTES,
  MISSION_MEDIA_BUCKET,
  missionAssetUrl,
  validateMissionImage,
  type WonderMissionAssetKind,
} from '@wonderpin/database/wonder-missions';
import { NextResponse } from 'next/server';
import { adminApiError } from '@/lib/admin-api';

export const dynamic = 'force-dynamic';

function safeOriginalName(value: string) {
  return value.normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 255) || 'image';
}

export async function POST(request: Request) {
  try {
    const declaredSize = Number(request.headers.get('content-length') || 0);
    if (declaredSize > MAX_MISSION_IMAGE_BYTES + 100_000) {
      throw new Error('이미지는 5MB 이하만 업로드할 수 있습니다.');
    }
    const { client, user } = await requireAdmin();
    const form = await request.formData();
    const file = form.get('file');
    const missionId = String(form.get('mission_id') || '');
    const kind = String(form.get('kind') || 'body') as WonderMissionAssetKind;
    if (!(file instanceof File)) throw new Error('이미지 파일을 선택해 주세요.');
    if (!['thumbnail', 'body'].includes(kind)) throw new Error('올바르지 않은 이미지 용도입니다.');
    if (!await getAdminWonderMission(client, missionId)) throw new Error('원더미션을 먼저 저장해 주세요.');

    const body = new Uint8Array(await file.arrayBuffer());
    const { mimeType, extension } = validateMissionImage(file.type, body);
    const assetId = crypto.randomUUID();
    const objectPath = `${missionId}/${assetId}.${extension}`;
    const { error: uploadError } = await client.storage
      .from(MISSION_MEDIA_BUCKET)
      .upload(objectPath, body, { contentType: mimeType, upsert: false });
    if (uploadError) throw new Error(uploadError.message);

    const { data: asset, error: assetError } = await client
      .from('wonder_mission_assets')
      .insert({
        id: assetId,
        mission_id: missionId,
        object_path: objectPath,
        kind,
        original_name: safeOriginalName(file.name),
        mime_type: mimeType,
        size_bytes: body.byteLength,
        created_by: user.id,
      })
      .select()
      .single();
    if (assetError || !asset) {
      await client.storage.from(MISSION_MEDIA_BUCKET).remove([objectPath]);
      throw new Error(assetError?.message || '이미지 정보를 저장하지 못했습니다.');
    }
    return NextResponse.json({ ...asset, url: missionAssetUrl(objectPath) }, { status: 201 });
  } catch (error) {
    return adminApiError(error);
  }
}
