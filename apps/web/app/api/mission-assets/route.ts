import { createServerSupabaseClient } from '@wonderpin/auth/server';
import {
  isMissionAssetPath,
  MISSION_MEDIA_BUCKET,
} from '@wonderpin/database/wonder-missions';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const objectPath = new URL(request.url).searchParams.get('path');
  if (!isMissionAssetPath(objectPath)) return new Response('Not found', { status: 404 });

  const client = await createServerSupabaseClient();
  const { data, error } = await client.storage.from(MISSION_MEDIA_BUCKET).download(objectPath);
  if (error || !data) return new Response('Not found', { status: 404 });
  return new Response(data, {
    headers: {
      'content-type': data.type || 'application/octet-stream',
      'cache-control': 'public, max-age=3600',
      'x-content-type-options': 'nosniff',
    },
  });
}
