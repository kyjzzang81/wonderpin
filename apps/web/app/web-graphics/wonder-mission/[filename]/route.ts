import fs from 'node:fs/promises';
import path from 'node:path';
import { notFound } from 'next/navigation';
import { findRepositoryRoot } from '@wonderpin/database/repository-root';

const files = new Set(['hero-explorer.png', 'discovery-sprout.png']);

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, context: { params: Promise<{ filename: string }> }) {
  const { filename } = await context.params;
  if (!files.has(filename)) notFound();

  const image = await fs.readFile(
    path.join(findRepositoryRoot(), 'assets/web-graphics/wonder-mission', filename),
  );
  return new Response(image, {
    headers: {
      'content-type': 'image/png',
      'cache-control': 'public, max-age=86400, stale-while-revalidate=604800',
      'x-content-type-options': 'nosniff',
    },
  });
}
