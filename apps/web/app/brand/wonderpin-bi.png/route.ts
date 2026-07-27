import fs from 'node:fs/promises';
import path from 'node:path';
import { findRepositoryRoot } from '@wonderpin/database/repository-root';

export const dynamic = 'force-dynamic';

export async function GET() {
  const image = await fs.readFile(path.join(findRepositoryRoot(), 'assets/brand/wonderpin-bi.png'));
  return new Response(image, { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=3600', 'x-content-type-options': 'nosniff' } });
}
