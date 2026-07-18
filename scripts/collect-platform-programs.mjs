import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = path.join(root, 'research/platform-content');
const args = new Map(process.argv.slice(2).map((arg) => {
  const [key, ...rest] = arg.split('=');
  return [key, rest.length ? rest.join('=') : true];
}));

const igogoPages = Math.max(0, Number(args.get('--igogo-pages') ?? 1));
const tictocSeed = args.get('--tictoc-seed') ? String(args.get('--tictoc-seed')) : null;
const tictocSitemap = String(args.get('--tictoc-sitemap') ?? 'https://parent.tictoccroc.com/sitemap.xml');
const downloadImages = args.has('--download-images');
const runOcr = args.has('--ocr');
const imageLimit = Math.max(0, Number(args.get('--image-limit') ?? 20));
const imagesPerProgram = Math.max(1, Number(args.get('--images-per-program') ?? 2));
const reportProgress = args.has('--progress');
const checkedAt = new Date().toISOString();
const decisionsPath = path.join(outputRoot, 'review-decisions.json');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const unique = (values) => [...new Set(values.filter(Boolean))];
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function normalizedIdentityPart(value) {
  return String(value ?? '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}

function applyProgramIdentity(item) {
  item.source_key = `${item.source}:${item.source_id}`;
  item.fingerprint = sha256([
    normalizedIdentityPart(item.title),
    normalizedIdentityPart(item.operator),
    normalizedIdentityPart(item.venue),
  ].join('|'));
}

async function loadReviewDecisions() {
  try {
    const parsed = JSON.parse(await fs.readFile(decisionsPath, 'utf8'));
    return Array.isArray(parsed.decisions) ? parsed.decisions : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function loadExistingPrograms() {
  try {
    const parsed = JSON.parse(await fs.readFile(path.join(outputRoot, 'programs.json'), 'utf8'));
    return Array.isArray(parsed.programs) ? parsed.programs : [];
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

function absoluteImageUrl(source, value) {
  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;
  return source === 'igogo' ? `https://cdn.igogo.kr${value}` : `https://cdn.tictoccroc.com${value}`;
}

function htmlImageUrls(html = '') {
  return [...html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)].map((match) => match[1]);
}

function textForCategory(item) {
  return [item.title, item.summary, item.activity_type, ...(item.source_categories ?? []), ...(item.tags ?? [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function classify(item) {
  const text = textForCategory(item);
  const result = (category, reason, confidence = 'high', otherReason = null) => ({ category, reason, confidence, otherReason });
  if (['home', 'delivery'].includes(item.activity_type)) return result('집', `activity_type:${item.activity_type}`);
  if (/(비대면|온라인|집에서|우리집|집콕|홈키트|정기배송|밀키트|가정방문|방문수업|방문미술|집으로 찾아|online)/i.test(text)) return result('집', 'keyword:home');
  if (/(숲|산림|수목원|식물원|숲체험|숲해설|생태공원|생태탐방|forest)/i.test(text)) return result('숲', 'keyword:forest');
  if (/(박물관|museum)/i.test(text)) return result('박물관', 'keyword:museum');

  const explicitOutdoor = /(공원|야외|산책|둘레길|갯벌|해변|농장|목장|캠핑|팜크닉|스키장|리조트|운동장|광장|outdoor)/i.test(text);
  const historicOutdoor = /(궁궐|성곽|왕릉|한옥마을|유적|수원화성|월정교|첨성대|궁남지)/i.test(text)
    && /(투어|답사|걷기|탐방|보물찾기)/i.test(text);
  const explicitIndoor = /(실내|아이스링크|클라이밍|수영장)/i.test(text);
  if ((explicitOutdoor || historicOutdoor) && !explicitIndoor) return result('야외', historicOutdoor ? 'keyword:historic_outdoor' : 'keyword:outdoor');

  if (/(미술관|전시관|과학관|천문대|기념관|체험관|극장|공연장|도서관|문화센터|문화회관|아트센터)/i.test(text)) {
    return result('문화공간', 'keyword:cultural_venue');
  }
  if (item.activity_type === 'studio' && /(공방|아뜰리에|도예|도자기|공예|미술|연극|공연|북클럽|음악|악기|피아노|요리|쿠킹|베이킹|드로잉)/i.test(text)) {
    return result('문화공간', 'studio:cultural_activity', 'medium');
  }

  if (/(수강권|회차권|일정변경|재구매|테스트상품|픽드랍|패키지)/i.test(text)) return result('기타', 'fallback', 'medium', '운영상품');
  if (/(클라이밍|다이빙|하키|스케이트|서바이벌|체육|스포츠|운동)/i.test(text)) return result('기타', 'fallback', 'medium', '실내스포츠');
  if (/(영어|파닉스|한글|수학|코딩|스피치|체스|학습|learning|english)/i.test(text)) return result('기타', 'fallback', 'medium', '일반교습');
  if (!item.venue && !item.address) return result('기타', 'fallback', 'low', '장소불명');
  return result('기타', 'fallback', 'low', '복합또는미분류');
}

function applyClassification(item) {
  const classification = classify(item);
  item.category = classification.category;
  item.classification_reason = classification.reason;
  item.classification_confidence = classification.confidence;
  item.other_reason = classification.otherReason;
}

function overlapsTargetAge(minAge, maxAge) {
  const toAge = (value) => value === null || value === undefined || value === ''
    ? null
    : (Number.isFinite(Number(value)) ? Number(value) : null);
  const min = toAge(minAge);
  const max = toAge(maxAge);
  return (min === null || min <= 9) && (max === null || max >= 4);
}

function stripSensitiveText(value = '') {
  return String(value)
    .replace(/(?:01[016789])[-.\s]?\d{3,4}[-.\s]?\d{4}/g, '[연락처 제외]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[이메일 제외]');
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'WonderpinResearchBot/0.1 (+https://github.com/kyjzzang81/wonderpin)' },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url));
}

async function collectIgogo() {
  const results = [];
  let expectedPages = igogoPages;
  for (let page = 0; page < igogoPages; page += 1) {
    const url = new URL('https://api.igogo.kr/app/v2/feed');
    url.searchParams.set('page', String(page));
    url.searchParams.set('size', '20');
    const payload = await fetchJson(url);
    expectedPages = Math.min(igogoPages, Math.ceil((payload.total ?? 0) / (payload.size || 20)) || igogoPages);
    for (const product of payload.contents ?? []) {
      const imageUrls = unique([
        absoluteImageUrl('igogo', product.thumbnailImage),
        ...(product.detailImages ?? []).map((value) => absoluteImageUrl('igogo', value)),
        ...(product.details?.images ?? []).map((value) => absoluteImageUrl('igogo', value)),
        ...htmlImageUrls(product.detailHtml).map((value) => absoluteImageUrl('igogo', value)),
      ]);
      const address = product.location?.specificAddress?.[0];
      const item = {
        source: 'igogo',
        source_id: product._id,
        source_url: `https://app.igogo.kr/product/${product._id}`,
        api_url: `https://api.igogo.kr/app/v1/products/${product._id}`,
        title: product.title,
        summary: stripSensitiveText(product.sellerShortComment || ''),
        operator: product.sellerName,
        age_min: product.ageMin ?? null,
        age_max: product.ageMax ?? null,
        price: product.fee ?? null,
        original_price: product.originFee ?? null,
        region: address?.sido ? `${address.sido} ${address.sigungu ?? ''}`.trim() : null,
        venue: address?.buildingName || address?.address2 || null,
        address: address?.roadAddress || address?.address || null,
        status: product.status,
        display: product.display,
        activity_type: product.activityType,
        source_categories: unique([...(product.categories ?? []), ...(product.rootCategories ?? [])]),
        tags: product.tags ?? [],
        image_urls: imageUrls,
        detail_text_source: product.detailHtml ? 'html_and_images' : 'images',
        ocr_needed: false,
        updated_at: product.updatedAt ?? null,
        checked_at: checkedAt,
      };
      applyClassification(item);
      if (overlapsTargetAge(item.age_min, item.age_max) && item.display !== false && item.status !== 'closed') results.push(item);
    }
    if (reportProgress) console.log(JSON.stringify({ type: 'progress', source: 'igogo', current: page + 1, total: expectedPages }));
    if (!payload.hasNext) break;
    await sleep(500);
  }
  return results;
}

function parseWindowJson(html, variableName, nextMarker) {
  const prefix = `window.${variableName}=`;
  const start = html.indexOf(prefix);
  if (start < 0) throw new Error(`Missing ${prefix}`);
  const valueStart = start + prefix.length;
  const end = html.indexOf(nextMarker, valueStart);
  if (end < 0) throw new Error(`Missing marker after ${prefix}: ${nextMarker}`);
  return JSON.parse(html.slice(valueStart, end).trim().replace(/;$/, ''));
}

function findTictocPrograms(value, found = new Map()) {
  if (!value || typeof value !== 'object') return found;
  if (Array.isArray(value)) {
    for (const child of value) findTictocPrograms(child, found);
    return found;
  }
  if (value.id && value.product?.type === 'PROGRAM' && value.product?.name) found.set(String(value.id), value);
  for (const child of Object.values(value)) findTictocPrograms(child, found);
  return found;
}

async function collectTictoc() {
  let sourceUrls;
  if (tictocSeed) {
    sourceUrls = [tictocSeed];
  } else {
    const sitemap = await fetchText(tictocSitemap);
    sourceUrls = unique([...sitemap.matchAll(/<loc>(https:\/\/parent\.tictoccroc\.com\/island\/\d+\/?)(?:<|&lt;)/g)].map((match) => match[1]));
    if (!sourceUrls.length) throw new Error(`No public island URLs found in ${tictocSitemap}`);
  }

  const programMap = new Map();
  for (const sourceUrl of sourceUrls) {
    const html = await fetchText(sourceUrl);
    const dehydrated = parseWindowJson(html, 'dehydratedState', '; window.meta=');
    for (const [id, program] of findTictocPrograms(dehydrated)) programMap.set(id, program);
    if (reportProgress) console.log(JSON.stringify({ type: 'progress', source: 'tictoccroc', current: sourceUrls.indexOf(sourceUrl) + 1, total: sourceUrls.length }));
    await sleep(500);
  }
  const programs = [...programMap.values()];
  return programs.map((program) => {
    const product = program.product;
    const categoryNames = (product.categories ?? []).map((entry) => entry.category?.name).filter(Boolean);
    const contentMedia = (program.displays ?? [])
      .filter((display) => ['TITLE', 'CONTENT'].includes(display.type))
      .flatMap((display) => display.media ?? [])
      .filter((media) => media.type === 'IMAGE' && media.isEnabled !== false)
      .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    const item = {
      source: 'tictoccroc',
      source_id: String(program.id),
      source_url: `https://parent.tictoccroc.com/island/${product.branchId}/program/${program.id}`,
      title: product.name,
      summary: program.title || '',
      operator: product.branch?.name || null,
      age_min: program.ageLimit ?? product.branch?.ageLimit ?? null,
      age_max: null,
      price: product.price ?? null,
      original_price: null,
      region: categoryNames.find((name) => /서울|경기|인천|강원|충|전|경|제주/.test(name)) || null,
      venue: product.name?.match(/^\[([^\]]+)\]/)?.[1] || null,
      address: null,
      status: product.status,
      display: product.isEnabled !== false,
      activity_type: 'program',
      source_categories: categoryNames,
      tags: [],
      image_urls: unique(contentMedia.map((media) => absoluteImageUrl('tictoccroc', media.source))),
      detail_text_source: 'images',
      ocr_needed: true,
      duration_minutes: program.playtime ?? null,
      capacity: program.capacity ?? null,
      updated_at: program.modDatetime ?? product.modDatetime ?? null,
      checked_at: checkedAt,
    };
    applyClassification(item);
    return item;
  }).filter((item) => overlapsTargetAge(item.age_min, item.age_max) && item.display && item.status === 'ONSALE');
}

function safeExtension(url, contentType = '') {
  const pathname = new URL(url).pathname;
  const ext = path.extname(pathname).toLowerCase();
  if (/^\.(png|jpe?g|webp|gif)$/.test(ext)) return ext;
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';
  return '.jpg';
}

async function downloadAndOcr(items) {
  let downloaded = 0;
  let ocrBinary = null;
  if (runOcr) {
    ocrBinary = '/private/tmp/wonderpin-ocr-image-text';
    await execFileAsync('swiftc', [
      '-module-cache-path', '/private/tmp/wonderpin-swift-cache',
      path.join(root, 'scripts/ocr-image-text.swift'),
      '-o', ocrBinary,
    ], { maxBuffer: 10 * 1024 * 1024 });
  }
  const candidateItems = runOcr ? items.filter((item) => item.ocr_needed) : items;
  for (const item of candidateItems) {
    item.downloaded_images = [];
    item.ocr_text = '';
    for (const [index, url] of item.image_urls.slice(0, imagesPerProgram).entries()) {
      if (downloaded >= imageLimit) return;
      const response = await fetch(url, { headers: { 'user-agent': 'WonderpinResearchBot/0.1' } });
      if (!response.ok) continue;
      const bytes = Buffer.from(await response.arrayBuffer());
      const ext = safeExtension(url, response.headers.get('content-type') ?? '');
      const relative = path.join('images', item.source, item.source_id, `${String(index + 1).padStart(2, '0')}-${sha256(url).slice(0, 10)}${ext}`);
      const destination = path.join(outputRoot, relative);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      await fs.writeFile(destination, bytes);
      item.downloaded_images.push(relative);
      downloaded += 1;
      if (runOcr) {
        try {
          const { stdout } = await execFileAsync(ocrBinary, [destination], { maxBuffer: 10 * 1024 * 1024 });
          if (stdout.trim()) item.ocr_text += `${stdout.trim()}\n`;
        } catch (error) {
          item.ocr_error = stripSensitiveText(error.stderr || error.message);
        }
      }
      await sleep(250);
    }
    item.ocr_text = stripSensitiveText(item.ocr_text.trim());
  }
}

function csvCell(value) {
  const normalized = Array.isArray(value) ? value.join(' | ') : (value ?? '');
  return `"${String(normalized).replaceAll('"', '""')}"`;
}

const [igogo, tictoccroc, reviewDecisions, existingPrograms] = await Promise.all([
  collectIgogo(),
  collectTictoc(),
  loadReviewDecisions(),
  loadExistingPrograms(),
]);
const declinedSourceKeys = new Set(reviewDecisions.filter((item) => item.decision === 'decline').map((item) => item.source_key).filter(Boolean));
const declinedFingerprints = new Set(reviewDecisions.filter((item) => item.decision === 'decline').map((item) => item.fingerprint).filter(Boolean));
const acceptedSourceKeys = new Set(reviewDecisions.filter((item) => item.decision === 'accept').map((item) => item.source_key).filter(Boolean));
const existingBySourceKey = new Map(existingPrograms.map((item) => [`${item.source}:${item.source_id}`, item]));
const collectedPrograms = [...igogo, ...tictoccroc];
for (const item of collectedPrograms) {
  applyProgramIdentity(item);
  const existing = existingBySourceKey.get(item.source_key);
  if (existing?.downloaded_images?.length) item.downloaded_images = existing.downloaded_images;
  if (existing?.ocr_text) item.ocr_text = existing.ocr_text;
  if (existing?.ocr_error) item.ocr_error = existing.ocr_error;
}
const excludedDeclined = collectedPrograms.filter((item) => declinedSourceKeys.has(item.source_key) || declinedFingerprints.has(item.fingerprint)).length;
const programs = collectedPrograms
  .filter((item) => !declinedSourceKeys.has(item.source_key) && !declinedFingerprints.has(item.fingerprint))
  .map((item) => ({ ...item, review_decision: acceptedSourceKeys.has(item.source_key) ? 'accept' : 'pending' }))
  .sort((a, b) => a.category.localeCompare(b.category, 'ko') || a.title.localeCompare(b.title, 'ko'));
for (const item of programs) {
  item.target_age_min = Math.max(4, item.age_min ?? 4);
  item.target_age_max = Math.min(9, item.age_max ?? 9);
}
if (downloadImages) await downloadAndOcr(programs);

await fs.mkdir(outputRoot, { recursive: true });
const payload = {
  checked_at: checkedAt,
  target_age: { min: 4, max: 9, rule: '프로그램 연령 범위가 만 4~9세와 한 살 이상 겹치면 포함' },
  categories: ['야외', '박물관', '숲', '문화공간', '집', '기타'],
  counts: Object.fromEntries(['야외', '박물관', '숲', '문화공간', '집', '기타'].map((category) => [category, programs.filter((item) => item.category === category).length])),
  excluded_declined: excludedDeclined,
  programs,
};
await fs.writeFile(path.join(outputRoot, 'programs.json'), `${JSON.stringify(payload, null, 2)}\n`);

const headers = ['source', 'source_id', 'source_key', 'fingerprint', 'review_decision', 'category', 'classification_reason', 'classification_confidence', 'other_reason', 'title', 'operator', 'age_min', 'age_max', 'target_age_min', 'target_age_max', 'price', 'region', 'venue', 'status', 'source_url', 'updated_at', 'checked_at', 'image_urls', 'downloaded_images', 'ocr_text'];
const csv = [headers.join(','), ...programs.map((item) => headers.map((header) => csvCell(item[header])).join(','))].join('\n') + '\n';
await fs.writeFile(path.join(outputRoot, 'programs.csv'), csv);
console.log(JSON.stringify({ total: programs.length, igogo: igogo.length, tictoccroc: tictoccroc.length, excluded_declined: excludedDeclined, counts: payload.counts, downloaded_images: programs.reduce((sum, item) => sum + (item.downloaded_images?.length ?? 0), 0) }, null, 2));
