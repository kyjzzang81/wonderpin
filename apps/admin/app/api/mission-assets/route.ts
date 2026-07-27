import { requireAdmin } from '@wonderpin/auth/server';
import {
  isMissionAssetPath,
  MISSION_MEDIA_BUCKET,
} from '@wonderpin/database/wonder-missions';
import { adminApiError } from '@/lib/admin-api';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const objectPath = new URL(request.url).searchParams.get('path');
    if (!isMissionAssetPath(objectPath)) return new Response('Not found', { status: 404 });
    const { client } = await requireAdmin();
    const { data, error } = await client.storage.from(MISSION_MEDIA_BUCKET).download(objectPath);
    if (error || !data) return new Response('Not found', { status: 404 });
    return new Response(data, {
      headers: {
        'content-type': data.type || 'application/octet-stream',
        'cache-control': 'private, max-age=3600',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch (error) {
    return adminApiError(error, 500);
  }
}
