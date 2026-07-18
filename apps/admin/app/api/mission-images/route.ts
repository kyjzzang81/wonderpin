import { NextResponse } from 'next/server';
import { MAX_MISSION_IMAGE_BYTES, saveMissionImage } from '@wonderpin/database/wonder-missions';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const declaredSize = Number(request.headers.get('content-length') || 0);
    if (declaredSize > MAX_MISSION_IMAGE_BYTES) throw new Error('이미지는 5MB 이하만 업로드할 수 있습니다.');
    const body = Buffer.from(await request.arrayBuffer());
    return NextResponse.json(await saveMissionImage(request.headers.get('content-type'), body), { status: 201 });
  } catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
}
