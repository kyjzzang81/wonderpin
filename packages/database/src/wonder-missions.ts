import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export type WonderMissionStatus = Database['public']['Enums']['wonder_mission_status'];
export type WonderpinAdminRole = Database['public']['Enums']['wonderpin_admin_role'];
export type WonderMissionAssetKind = Database['public']['Enums']['wonder_mission_asset_kind'];
export type WonderMission = Database['public']['Tables']['wonder_missions']['Row'];
export type WonderMissionAsset = Database['public']['Tables']['wonder_mission_assets']['Row'];

export interface WonderMissionInput {
  title?: unknown;
  recommended_age?: unknown;
  thumbnail_path?: unknown;
  content?: unknown;
  status?: unknown;
}

export interface NormalizedWonderMission {
  title: string;
  recommended_age: string;
  thumbnail_path: string | null;
  content: string;
  status: WonderMissionStatus;
}

const MISSION_ASSET_PATH = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(?:png|jpg|gif|webp)$/i;
const MISSION_ASSET_URL = /^\/api\/mission-assets\?path=([^#&]+)$/;
const ALLOWED_STATUSES = new Set<WonderMissionStatus>(['draft', 'published', 'archived']);
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

export function isMissionAssetPath(value: unknown): value is string {
  return typeof value === 'string' && MISSION_ASSET_PATH.test(value);
}

export function missionAssetUrl(objectPath: string) {
  if (!isMissionAssetPath(objectPath)) throw new Error('올바르지 않은 원더미션 이미지 경로입니다.');
  return `/api/mission-assets?path=${encodeURIComponent(objectPath)}`;
}

function safeUrl(value: unknown, kind: 'image' | 'link') {
  const url = String(value || '').trim();
  if (kind === 'link') return /^https?:\/\//i.test(url) ? url : '';
  const match = url.match(MISSION_ASSET_URL);
  if (!match) return '';
  try {
    const objectPath = decodeURIComponent(match[1]);
    return isMissionAssetPath(objectPath) ? missionAssetUrl(objectPath) : '';
  } catch {
    return '';
  }
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

export function normalizeMission(
  input: WonderMissionInput,
  existing: Partial<WonderMission> = {},
): NormalizedWonderMission {
  const title = String(input.title ?? existing.title ?? '').normalize('NFKC').trim().slice(0, 120);
  const recommendedAge = String(input.recommended_age ?? existing.recommended_age ?? '').normalize('NFKC').trim().slice(0, 80);
  const content = sanitizeMissionHtml(input.content ?? existing.content ?? '');
  const rawThumbnail = input.thumbnail_path === null
    ? null
    : String(input.thumbnail_path ?? existing.thumbnail_path ?? '').trim() || null;
  const rawStatus = String(input.status ?? existing.status ?? 'draft') as WonderMissionStatus;

  if (!title) throw new Error('원더미션명을 입력해 주세요.');
  if (!recommendedAge) throw new Error('권장연령을 입력해 주세요.');
  if (!content.replace(/<[^>]*>/g, '').trim() && !content.includes('<img')) {
    throw new Error('원더미션 내용을 입력해 주세요.');
  }
  if (rawThumbnail && !isMissionAssetPath(rawThumbnail)) throw new Error('올바르지 않은 썸네일 경로입니다.');
  if (!ALLOWED_STATUSES.has(rawStatus)) throw new Error('올바르지 않은 공개 상태입니다.');

  return {
    title,
    recommended_age: recommendedAge,
    thumbnail_path: rawThumbnail,
    content,
    status: rawStatus,
  };
}

function unwrap<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  if (data === null) throw new Error('Supabase가 데이터를 반환하지 않았습니다.');
  return data;
}

export async function listPublishedWonderMissions(client: SupabaseClient<Database>) {
  const { data, error } = await client
    .from('wonder_missions')
    .select('*')
    .eq('status', 'published')
    .order('updated_at', { ascending: false });
  return unwrap(data, error);
}

export async function getPublishedWonderMission(client: SupabaseClient<Database>, id: string) {
  const { data, error } = await client
    .from('wonder_missions')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function listAdminWonderMissions(client: SupabaseClient<Database>) {
  const { data, error } = await client
    .from('wonder_missions')
    .select('*')
    .order('updated_at', { ascending: false });
  return unwrap(data, error);
}

export async function getAdminWonderMission(client: SupabaseClient<Database>, id: string) {
  const { data, error } = await client
    .from('wonder_missions')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function createWonderMission(
  client: SupabaseClient<Database>,
  userId: string,
  input: WonderMissionInput,
) {
  const mission = normalizeMission(input);
  const { data, error } = await client
    .from('wonder_missions')
    .insert({ ...mission, created_by: userId, updated_by: userId })
    .select()
    .single();
  return unwrap(data, error);
}

export async function updateWonderMission(
  client: SupabaseClient<Database>,
  userId: string,
  id: string,
  input: WonderMissionInput,
) {
  const existing = await getAdminWonderMission(client, id);
  if (!existing) return null;
  const mission = normalizeMission(input, existing);
  const { data, error } = await client
    .from('wonder_missions')
    .update({ ...mission, updated_by: userId })
    .eq('id', id)
    .select()
    .single();
  return unwrap(data, error);
}

export async function listWonderMissionAssets(client: SupabaseClient<Database>, missionId: string) {
  const { data, error } = await client
    .from('wonder_mission_assets')
    .select('*')
    .eq('mission_id', missionId)
    .order('created_at');
  return unwrap(data, error);
}

export const MAX_MISSION_IMAGE_BYTES = 5_000_000;
export const MISSION_MEDIA_BUCKET = 'wonder-mission-media';

const IMAGE_SIGNATURES = {
  'image/png': { extension: 'png', valid: (body: Uint8Array) => body.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => body[index] === byte) },
  'image/jpeg': { extension: 'jpg', valid: (body: Uint8Array) => body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff },
  'image/gif': { extension: 'gif', valid: (body: Uint8Array) => ['GIF87a', 'GIF89a'].includes(new TextDecoder('ascii').decode(body.slice(0, 6))) },
  'image/webp': { extension: 'webp', valid: (body: Uint8Array) => new TextDecoder('ascii').decode(body.slice(0, 4)) === 'RIFF' && new TextDecoder('ascii').decode(body.slice(8, 12)) === 'WEBP' },
} as const;

export type MissionImageMimeType = keyof typeof IMAGE_SIGNATURES;

export function validateMissionImage(contentType: string | null, body: Uint8Array) {
  if (!body.length || body.length > MAX_MISSION_IMAGE_BYTES) {
    throw new Error('이미지는 5MB 이하만 업로드할 수 있습니다.');
  }
  const type = String(contentType || '').split(';')[0].trim().toLowerCase() as MissionImageMimeType;
  const match = IMAGE_SIGNATURES[type];
  if (!match?.valid(body)) throw new Error('PNG, JPEG, GIF 또는 WebP 이미지 파일만 업로드할 수 있습니다.');
  return { mimeType: type, extension: match.extension };
}
