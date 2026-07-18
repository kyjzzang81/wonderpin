import fs from 'node:fs/promises';

const root = new URL('..', import.meta.url).pathname;
const dataPath = `${root}research/programs/weekly-wonderpin-program-candidates.json`;
const supplementPath = `${root}research/programs/WP-007-private-program-supplement.json`;
const csvPath = `${root}research/programs/weekly-wonderpin-program-candidates.csv`;

const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));
const supplementData = JSON.parse(await fs.readFile(supplementPath, 'utf8'));
const supplementRows = Array.isArray(supplementData) ? supplementData : supplementData.candidates;
const supplement = supplementRows?.filter((row) => row.evidence_strength === 'strong');
if (!Array.isArray(supplement)) throw new Error('Supplement must be an array or contain candidates[].');

const required = ['program_name', 'venue_name', 'public_private', 'operator', 'introduction_url', 'checked_at'];
const existingKeys = new Set(data.candidates.map((row) => `${row.program_name}|${row.venue_name}|${row.schedule_or_period}`));
let nextId = Math.max(...data.candidates.map((row) => Number(row.id.replace('WWP-', '')))) + 1;
const additions = [];
for (const row of supplement) {
  const missing = required.filter((field) => !row[field]);
  if (missing.length) throw new Error(`Missing ${missing.join(', ')} in ${row.program_name || 'unnamed row'}`);
  const key = `${row.program_name}|${row.venue_name}|${row.schedule_or_period}`;
  if (existingKeys.has(key)) continue;
  existingKeys.add(key);
  additions.push({ ...row, id: `WWP-${String(nextId++).padStart(3, '0')}` });
}

data.candidates.push(...additions);
for (const row of data.candidates) {
  delete row.evidence_strength;
  delete row.duplicate_check;
}
data.as_of = '2026-07-17';
data.candidate_count = data.candidates.length;
data.dataset_note = `${data.candidate_count}건 후보 풀. 기관 진입점과 사설 운영자 프로그램이 혼재하며, 게시·서비스 반영 전 공식 회차·연령·비용·예약·후기 원문을 재확인해야 한다.`;

const headers = Object.keys(data.candidates[0]);
for (const row of data.candidates) {
  for (const header of headers) if (!(header in row)) row[header] = Array.isArray(data.candidates[0][header]) ? [] : '';
}
const csvCell = (value) => {
  const normalized = Array.isArray(value) ? value.join(' | ') : (value ?? '');
  return `"${String(normalized).replaceAll('"', '""')}"`;
};
const csv = [headers.join(','), ...data.candidates.map((row) => headers.map((header) => csvCell(row[header])).join(','))].join('\n') + '\n';

await fs.writeFile(dataPath, `${JSON.stringify(data, null, 2)}\n`);
await fs.writeFile(csvPath, csv);
console.log(JSON.stringify({ added: additions.length, total: data.candidates.length, first_added_id: additions[0]?.id, last_added_id: additions.at(-1)?.id }));
