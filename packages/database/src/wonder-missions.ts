import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface WonderMission {
  id: string;
  title: string;
  recommended_age: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface WonderMissionInput {
  title?: unknown;
  recommended_age?: unknown;
  content?: unknown;
}

interface WonderMissionPayload {
  version: 1;
  updated_at: string | null;
  missions: WonderMission[];
}

const DEFAULT_PAYLOAD: WonderMissionPayload = { version: 1, updated_at: null, missions: [] };
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'u', 'h2', 'h3', 'ul', 'ol', 'li',
  'blockquote', 'figure', 'figcaption', 'img', 'a',
]);
const VOID_TAGS = new Set(['br', 'img']);

function escapeAttribute(value: unknown) {
  return String(value).replace(/[&"<>]/g, (character) => ({
    '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;',
  })[character] ?? character);
}

function safeUrl(value: unknown, kind: 'image' | 'link') {
  const url = String(value || '').trim();
  if (kind === 'image') {
    return url.startsWith('/mission-media/') || /^https:\/\//i.test(url) ? url : '';
  }
  return /^https?:\/\//i.test(url) ? url : '';
}

/** Keep mission HTML portable and safe to render on the public website. */
export function sanitizeMissionHtml(input: unknown) {
  const withoutDangerousBlocks = String(input || '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed|form|button|input|textarea|select|template|svg|math)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form|button|input|textarea|select|template|svg|math)\b[^>]*\/?\s*>/gi, '');

  return withoutDangerousBlocks.replace(/<\/?([a-z0-9-]+)\b([^>]*)>/gi, (tag, rawName: string, rawAttributes: string) => {
    const name = rawName.toLowerCase();
    if (!ALLOWED_TAGS.has(name)) return '';
    if (tag.startsWith('</')) return VOID_TAGS.has(name) ? '' : `</${name}>`;

    const attributes: string[] = [];
    if (name === 'img') {
      const src = rawAttributes.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const alt = rawAttributes.match(/\balt\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const safeSrc = safeUrl(src?.[1] ?? src?.[2] ?? src?.[3], 'image');
      if (!safeSrc) return '';
      attributes.push(`src="${escapeAttribute(safeSrc)}"`);
      attributes.push(`alt="${escapeAttribute(alt?.[1] ?? alt?.[2] ?? alt?.[3] ?? '')}"`);
      attributes.push('loading="lazy"');
    }
    if (name === 'a') {
      const href = rawAttributes.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const safeHref = safeUrl(href?.[1] ?? href?.[2] ?? href?.[3], 'link');
      if (!safeHref) return '';
      attributes.push(`href="${escapeAttribute(safeHref)}"`, 'target="_blank"', 'rel="noreferrer noopener"');
    }
    return `<${name}${attributes.length ? ` ${attributes.join(' ')}` : ''}>`;
  }).trim();
}

export function normalizeMission(input: WonderMissionInput, existing: Partial<WonderMission> = {}): WonderMission {
  const now = new Date().toISOString();
  const title = String(input.title ?? existing.title ?? '').normalize('NFKC').trim().slice(0, 120);
  const recommendedAge = String(input.recommended_age ?? existing.recommended_age ?? '').normalize('NFKC').trim().slice(0, 80);
  const content = sanitizeMissionHtml(input.content ?? existing.content ?? '');
  if (!title) throw new Error('원더미션명을 입력해 주세요.');
  if (!recommendedAge) throw new Error('권장연령을 입력해 주세요.');
  if (!content.replace(/<[^>]*>/g, '').trim() && !content.includes('<img')) throw new Error('원더미션 내용을 입력해 주세요.');
  return {
    id: existing.id || randomUUID(),
    title,
    recommended_age: recommendedAge,
    content,
    created_at: existing.created_at || now,
    updated_at: now,
  };
}

export function findRepositoryRoot(start = process.cwd()) {
  if (path.basename(start) === 'wonderpin') return start;
  // The workspace scripts always run Next from apps/<name>. Ignore this development
  // repository lookup during output tracing; runtime data is intentionally external.
  return path.resolve(/* turbopackIgnore: true */ start, '../..');
}

export function wonderMissionPaths() {
  const root = findRepositoryRoot();
  const storagePath = path.resolve(/* turbopackIgnore: true */ process.env.WONDERPIN_MISSIONS_PATH || path.join(root, 'data/wonder-missions/wonder-missions.json'));
  const uploadsPath = path.resolve(/* turbopackIgnore: true */ process.env.WONDERPIN_MISSION_UPLOADS_DIR || path.join(path.dirname(storagePath), 'uploads'));
  return { root, storagePath, uploadsPath };
}

export function createWonderMissionStore(file = wonderMissionPaths().storagePath) {
  const storagePath = path.resolve(file);

  async function read(): Promise<WonderMissionPayload> {
    try {
      const parsed = JSON.parse(await fs.readFile(storagePath, 'utf8')) as Partial<WonderMissionPayload>;
      return { ...DEFAULT_PAYLOAD, ...parsed, missions: Array.isArray(parsed.missions) ? parsed.missions : [] };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return structuredClone(DEFAULT_PAYLOAD);
      throw error;
    }
  }

  async function write(missions: WonderMission[]) {
    const payload: WonderMissionPayload = { version: 1, updated_at: new Date().toISOString(), missions };
    const temporary = `${storagePath}.${process.pid}.${randomUUID()}.tmp`;
    await fs.mkdir(path.dirname(storagePath), { recursive: true });
    await fs.writeFile(temporary, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
    await fs.rename(temporary, storagePath);
    return payload;
  }

  return {
    storagePath,
    async list() {
      const payload = await read();
      return [...payload.missions].sort((a, b) => String(b.updated_at).localeCompare(String(a.updated_at)));
    },
    async get(id: string) {
      return (await read()).missions.find((mission) => mission.id === id) || null;
    },
    async create(input: WonderMissionInput) {
      const payload = await read();
      const mission = normalizeMission(input);
      await write([mission, ...payload.missions]);
      return mission;
    },
    async update(id: string, input: WonderMissionInput) {
      const payload = await read();
      const index = payload.missions.findIndex((mission) => mission.id === id);
      if (index < 0) return null;
      const mission = normalizeMission(input, payload.missions[index]);
      payload.missions[index] = mission;
      await write(payload.missions);
      return mission;
    },
    async remove(id: string) {
      const payload = await read();
      const mission = payload.missions.find((item) => item.id === id);
      if (!mission) return null;
      await write(payload.missions.filter((item) => item.id !== id));
      return mission;
    },
  };
}

const IMAGE_SIGNATURES = {
  'image/png': { extension: '.png', valid: (body: Buffer) => body.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
  'image/jpeg': { extension: '.jpg', valid: (body: Buffer) => body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff },
  'image/gif': { extension: '.gif', valid: (body: Buffer) => ['GIF87a', 'GIF89a'].includes(body.subarray(0, 6).toString('ascii')) },
  'image/webp': { extension: '.webp', valid: (body: Buffer) => body.subarray(0, 4).toString('ascii') === 'RIFF' && body.subarray(8, 12).toString('ascii') === 'WEBP' },
} as const;

export const MAX_MISSION_IMAGE_BYTES = 5_000_000;

export function validImageExtension(contentType: string | null, body: Buffer) {
  const type = String(contentType || '').split(';')[0].trim().toLowerCase() as keyof typeof IMAGE_SIGNATURES;
  const match = IMAGE_SIGNATURES[type];
  return match?.valid(body) ? match.extension : null;
}

export async function saveMissionImage(contentType: string | null, body: Buffer, directory = wonderMissionPaths().uploadsPath) {
  if (!body.length || body.length > MAX_MISSION_IMAGE_BYTES) throw new Error('이미지는 5MB 이하만 업로드할 수 있습니다.');
  const extension = validImageExtension(contentType, body);
  if (!extension) throw new Error('PNG, JPEG, GIF 또는 WebP 이미지 파일만 업로드할 수 있습니다.');
  await fs.mkdir(directory, { recursive: true });
  const filename = `${randomUUID()}${extension}`;
  await fs.writeFile(path.join(directory, filename), body, { mode: 0o600, flag: 'wx' });
  return { filename, url: `/mission-media/${filename}` };
}
