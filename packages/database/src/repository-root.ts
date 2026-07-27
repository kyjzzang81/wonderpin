import path from 'node:path';

/** Resolve the monorepo root for local-only internal tools and checked-in brand assets. */
export function findRepositoryRoot(start = process.cwd()) {
  if (path.basename(start) === 'wonderpin') return start;
  return path.resolve(/* turbopackIgnore: true */ start, '../..');
}
