import fs from 'node:fs/promises';
import path from 'node:path';
import { wonderMissionPaths } from '@wonderpin/database/wonder-missions';

const TYPES: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' };
export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ filename: string }> }) {
  const filename = (await params).filename;
  if (!/^[a-f0-9-]+\.(?:png|jpg|gif|webp)$/i.test(filename)) return new Response('Not found', { status: 404 });
  try {
    const image = await fs.readFile(path.join(wonderMissionPaths().uploadsPath, filename));
    return new Response(image, { headers: { 'content-type': TYPES[path.extname(filename).toLowerCase()], 'cache-control': 'private, max-age=3600', 'x-content-type-options': 'nosniff' } });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return new Response('Not found', { status: 404 });
    throw error;
  }
}
