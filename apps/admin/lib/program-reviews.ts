import { createHash, randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { findRepositoryRoot } from '@wonderpin/database/repository-root';

type Program = Record<string, any>;
type Decision = Record<string, any>;
type Collection = {
  status: 'idle' | 'running' | 'success' | 'failed';
  started_at: string | null;
  finished_at: string | null;
  exit_code: number | null;
  error: string | null;
  progress: Record<string, { current: number; total: number }>;
  logs: string[];
};

const root = findRepositoryRoot();
export const dataDir = path.resolve(/* turbopackIgnore: true */ process.env.WONDERPIN_DATA_DIR || path.join(root, 'research/platform-content'));
const programsPath = path.resolve(/* turbopackIgnore: true */ process.env.WONDERPIN_PROGRAMS_PATH || path.join(dataDir, 'programs.json'));
const decisionsPath = path.resolve(/* turbopackIgnore: true */ process.env.WONDERPIN_DECISIONS_PATH || path.join(dataDir, 'review-decisions.json'));
const collectorPath = path.resolve(/* turbopackIgnore: true */ process.env.WONDERPIN_COLLECTOR_PATH || path.join(root, 'scripts/collect-platform-programs.mjs'));

const globalCollection = globalThis as typeof globalThis & { __wonderpinCollection?: Collection };
export const collection = globalCollection.__wonderpinCollection ??= {
  status: 'idle', started_at: null, finished_at: null, exit_code: null, error: null, progress: {}, logs: [],
};

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try { return JSON.parse(await fs.readFile(file, 'utf8')) as T; }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return fallback;
    throw error;
  }
}

function identityPart(value: unknown) {
  return String(value ?? '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}

function fingerprint(program: Program) {
  return createHash('sha256').update([identityPart(program.title), identityPart(program.operator), identityPart(program.venue)].join('|')).digest('hex');
}

function normalizeProgram(program: Program): Program {
  return {
    ...program,
    source_url: program.source === 'igogo' && program.source_id ? `https://app.igogo.kr/product/${program.source_id}` : program.source_url,
    source_key: program.source_key || `${program.source}:${program.source_id}`,
    fingerprint: program.fingerprint || fingerprint(program),
  };
}

async function loadReviewData() {
  const [programPayload, decisionPayload] = await Promise.all([
    readJson<{ programs?: Program[]; counts?: Record<string, number> }>(programsPath, { programs: [], counts: {} }),
    readJson<{ updated_at: string | null; decisions: Decision[] }>(decisionsPath, { updated_at: null, decisions: [] }),
  ]);
  const decisions = Array.isArray(decisionPayload.decisions) ? decisionPayload.decisions : [];
  const decisionMap = new Map(decisions.map((item) => [item.source_key, item]));
  const current = (programPayload.programs ?? []).map(normalizeProgram);
  const currentKeys = new Set(current.map((item) => item.source_key));
  const archivedDeclines = decisions.filter((item) => item.decision === 'decline' && item.snapshot && !currentKeys.has(item.source_key)).map((item) => normalizeProgram(item.snapshot));
  const programs = [...current, ...archivedDeclines].map((program): Program => ({
    ...program,
    review_decision: decisionMap.get(program.source_key)?.decision || program.review_decision || 'pending',
    review_note: decisionMap.get(program.source_key)?.note || '',
    decided_at: decisionMap.get(program.source_key)?.decided_at || null,
    archived: !currentKeys.has(program.source_key),
  }));
  return { decisionPayload, programs };
}

export function summarize(program: Program) {
  const generatedSummary = [
    `수집 정보 기준: ${program.title}`,
    `대상 ${program.target_age_min ?? program.age_min ?? 4}–${program.target_age_max ?? program.age_max ?? 9}세`,
    `분류 ${program.category || '미분류'}`,
    program.operator ? `운영 ${program.operator}` : null,
    program.price != null ? `가격 ${Number(program.price).toLocaleString('ko-KR')}원` : null,
    program.status ? `원문 상태 ${program.status}` : null,
  ].filter(Boolean).join(' · ');
  const fields = ['source_key', 'source', 'source_id', 'title', 'operator', 'category', 'region', 'venue', 'age_min', 'age_max', 'target_age_min', 'target_age_max', 'price', 'status', 'source_url', 'image_urls', 'downloaded_images', 'ocr_text', 'classification_reason', 'classification_confidence', 'other_reason', 'updated_at', 'checked_at', 'review_decision', 'review_note', 'decided_at', 'archived'];
  const result: Program = Object.fromEntries(fields.map((key) => [key, program[key]]));
  result.summary = String(program.summary || '').trim() || generatedSummary;
  result.image_urls ??= [];
  result.downloaded_images ??= [];
  result.ocr_text ??= '';
  return result;
}

export async function listPrograms(searchParams: URLSearchParams) {
  const { programs } = await loadReviewData();
  const search = identityPart(searchParams.get('search'));
  const category = searchParams.get('category') || 'all';
  const source = searchParams.get('source') || 'all';
  const decision = searchParams.get('decision') || 'all';
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(100, Math.max(12, Number(searchParams.get('limit') || 30)));
  const filtered = programs.filter((program) => {
    const haystack = identityPart([program.title, program.operator, program.venue, program.region, program.summary, program.ocr_text].join(' '));
    return (!search || haystack.includes(search)) && (category === 'all' || program.category === category) && (source === 'all' || program.source === source) && (decision === 'all' || program.review_decision === decision);
  });
  const decisionCounts = Object.fromEntries(['pending', 'accept', 'decline'].map((value) => [value, programs.filter((item) => item.review_decision === value).length]));
  const start = (page - 1) * limit;
  return { total: filtered.length, page, limit, pages: Math.max(1, Math.ceil(filtered.length / limit)), decision_counts: decisionCounts, items: filtered.slice(start, start + limit).map(summarize) };
}

export async function getProgram(sourceKey: string | null) {
  const { programs } = await loadReviewData();
  const program = programs.find((item) => item.source_key === sourceKey);
  return program ? summarize(program) : null;
}

export async function saveDecision(body: Record<string, unknown>) {
  if (!['accept', 'decline'].includes(String(body.decision))) throw new Error('decision must be accept or decline');
  const { decisionPayload, programs } = await loadReviewData();
  const program = programs.find((item) => item.source_key === body.source_key);
  if (!program) throw new Error('program not found');
  const decisions = Array.isArray(decisionPayload.decisions) ? decisionPayload.decisions : [];
  const index = decisions.findIndex((item) => item.source_key === program.source_key);
  const previous = index >= 0 ? decisions[index] : null;
  const entry = { source_key: program.source_key, fingerprint: program.fingerprint || fingerprint(program), decision: body.decision, decided_at: new Date().toISOString(), note: String(body.note || '').trim().slice(0, 1000), snapshot: previous?.snapshot || summarize(program) };
  if (index >= 0) decisions[index] = entry; else decisions.push(entry);
  const temporary = `${decisionsPath}.${process.pid}.${randomUUID()}.tmp`;
  await fs.mkdir(path.dirname(decisionsPath), { recursive: true });
  await fs.writeFile(temporary, `${JSON.stringify({ updated_at: entry.decided_at, decisions }, null, 2)}\n`);
  await fs.rename(temporary, decisionsPath);
  return entry;
}

function appendLog(text: string) {
  for (const line of text.split(/\r?\n/).filter(Boolean)) {
    collection.logs.push(line);
    if (collection.logs.length > 120) collection.logs.shift();
    try {
      const parsed = JSON.parse(line);
      if (parsed.type === 'progress') collection.progress[parsed.source] = { current: parsed.current, total: parsed.total };
    } catch { /* Collector may emit plain-text diagnostics. */ }
  }
}

export function startCollection() {
  if (collection.status === 'running') return false;
  Object.assign(collection, { status: 'running', started_at: new Date().toISOString(), finished_at: null, exit_code: null, error: null, progress: {}, logs: [] });
  const child = spawn(process.execPath, [collectorPath, '--igogo-pages=104', '--download-images', '--ocr', '--image-limit=500', '--images-per-program=1', '--progress'], { cwd: root, env: { ...process.env }, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', (chunk) => appendLog(chunk.toString()));
  child.stderr.on('data', (chunk) => appendLog(chunk.toString()));
  child.on('error', (error) => { collection.status = 'failed'; collection.error = error.message; collection.finished_at = new Date().toISOString(); });
  child.on('close', (code) => { collection.exit_code = code; collection.status = code === 0 ? 'success' : 'failed'; collection.finished_at = new Date().toISOString(); if (code !== 0 && !collection.error) collection.error = `collector exited with code ${code}`; });
  return true;
}
