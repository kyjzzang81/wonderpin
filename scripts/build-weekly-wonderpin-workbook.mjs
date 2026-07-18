import fs from 'node:fs/promises';
import { SpreadsheetFile, Workbook } from '@oai/artifact-tool';

const root = new URL('..', import.meta.url).pathname;
const sourcePath = `${root}research/programs/weekly-wonderpin-program-candidates.json`;
const source = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
const rows = source.candidates;
const outputDir = `${root}outputs/weekly-wonderpin-${source.as_of.replaceAll('-', '')}`;
const endRow = rows.length + 1;
const publicCount = rows.filter((row) => row.public_private === '공공').length;
const privateCount = rows.filter((row) => row.public_private === '사설').length;
const wb = Workbook.create();
const summary = wb.worksheets.add('사용 안내');
const candidates = wb.worksheets.add('프로그램 후보');
const queue = wb.worksheets.add('발행 전 재확인');
const dict = wb.worksheets.add('데이터 사전');

const primary = '#0167D3';
const secondary = '#F3B806';
const palePrimary = '#EAF4FF';
const paleSecondary = '#FFF8DD';
const dark = '#1D2A3A';
const border = '#D7E3F2';

function styleTitle(sheet, range) {
  sheet.getRange(range).format = { fill: primary, font: { bold: true, color: '#FFFFFF', size: 16 }, horizontalAlignment: 'left', verticalAlignment: 'center' };
}
function styleHeader(sheet, range) {
  sheet.getRange(range).format = { fill: primary, font: { bold: true, color: '#FFFFFF' }, horizontalAlignment: 'center', verticalAlignment: 'center', wrapText: true, borders: { preset: 'all', style: 'thin', color: border } };
}

summary.showGridLines = false;
summary.mergeCells('A1:H1');
summary.getRange('A1').values = [['이주의 원더핀 · 프로그램 후보 풀']];
styleTitle(summary, 'A1:H1');
summary.getRange('A1:H1').format.rowHeight = 32;
summary.mergeCells('A3:H4');
summary.getRange('A3').values = [[`기준일 ${source.as_of} · 후보 ${rows.length}건(공공 기관 진입점 + 사설 운영자 프로그램)을 정리했습니다. 현재 회차 모집·연령·가격·후기 원문은 항목별 상태를 확인하고, 게시·서비스 반영 전 반드시 공식 원출처에서 재확인해야 합니다.`]];
summary.getRange('A3:H4').format = { fill: paleSecondary, font: { color: dark }, wrapText: true, verticalAlignment: 'center', borders: { preset: 'outside', style: 'thin', color: secondary } };
summary.getRange('A6:B6').values = [['후보 수', '현재 모집 확인']];
summary.getRange('D6:E6').values = [['공공 후보', '사설 후보']];
summary.getRange('G6:H6').values = [['발행 전 재확인', '재확인 기본 주기']];
for (const r of ['A6:B6','D6:E6','G6:H6']) summary.getRange(r).format = { fill: palePrimary, font: { bold: true, color: primary }, horizontalAlignment: 'center', borders: { preset: 'outside', style: 'thin', color: border } };
summary.getRange('A7:B7').formulas = [[`=COUNTA('프로그램 후보'!A2:A${endRow})`, `=COUNTIF('프로그램 후보'!O2:O${endRow},"현재 모집*")`]];
summary.getRange('D7:E7').formulas = [[`=COUNTIF('프로그램 후보'!D2:D${endRow},"공공")`, `=COUNTIF('프로그램 후보'!D2:D${endRow},"사설")`]];
summary.getRange('G7').formulas = [[`=COUNTA('프로그램 후보'!A2:A${endRow})`]];
summary.getRange('H7').values = [['7일 이내']];
for (const r of ['A7:B7','D7:E7','G7:H7']) summary.getRange(r).format = { fill: '#FFFFFF', font: { bold: true, color: dark, size: 14 }, horizontalAlignment: 'center', borders: { preset: 'outside', style: 'thin', color: border } };
summary.getRange('A9:H9').merge();
summary.getRange('A9').values = [['사용 순서']];
summary.getRange('A9:H9').format = { fill: primary, font: { bold: true, color: '#FFFFFF' } };
summary.getRange('A10:H14').values = [
  ['1. 프로그램 후보 시트에서 지역·장소 유형·우선순위를 필터링합니다.', '', '', '', '', '', '', ''],
  ['2. 소개 링크와 예약 링크에서 해당 회차의 일정·연령·비용·모집 상태를 확인합니다.', '', '', '', '', '', '', ''],
  ['3. 발행 전 재확인 시트에서 상태를 현재 모집/마감/종료/보류로 갱신합니다.', '', '', '', '', '', '', ''],
  ['4. 최신 후기 최대 5개를 확인해 혼잡·예약·연령 적합성만 짧게 요약합니다.', '', '', '', '', '', '', ''],
  ['5. 원더핀이 직접 판매·검수하지 않은 프로그램은 운영 주체와 공식 예약처를 함께 표기합니다.', '', '', '', '', '', '', ''],
];
summary.getRange('A10:H14').format = { wrapText: true, verticalAlignment: 'center' };
summary.getRange('A16:H16').merge();
summary.getRange('A16').values = [[`품질 상태: 공공 ${publicCount}건, 사설 ${privateCount}건입니다. 기관 진입점 후보와 세부 조건 미확인 행은 발행할 수 없으며, 모든 사설 행도 회차·잔여석·후기 상태를 발행 전에 재확인해야 합니다.`]];
summary.getRange('A16:H16').format = { fill: paleSecondary, font: { bold: true, color: dark }, wrapText: true, borders: { preset: 'outside', style: 'thin', color: secondary } };
for (const c of ['A','B','C','D','E','F','G','H']) summary.getRange(`${c}:${c}`).format.columnWidth = c === 'A' ? 26 : 18;
summary.getRange('A3:H4').format.rowHeight = 32;
summary.getRange('A10:H14').format.rowHeight = 42;
summary.freezePanes.freezeRows(1);

const headers = ['ID','프로그램명','장소명','공공/사설','운영주체','지역','장소 유형','권장 연령','일정/운영 기간','비용','예약 상태','예약 링크','소개 요약','소개 링크','정보 상태','공식성','사실','조사자 추론','후기 요약','후기 출처(최대 5개)','후기 미확인 사유','소개 우선순위','확인일','재확인 필요일','출처 메모','프로그램 형식','데이터 구분'];
const values = rows.map((r) => [r.id,r.program_name,r.venue_name,r.public_private,r.operator,r.region,r.venue_type,r.recommended_age,r.schedule_or_period,r.cost,r.reservation_status,r.reservation_url,r.introduction_summary,r.introduction_url,r.information_status,r.officialness,r.facts,r.researcher_inference,r.review_summary,(r.review_sources || []).join('\n'),r.review_unavailable_reason,r.introduced_priority,r.checked_at,r.reconfirm_by,r.source_note,r.program_format || '',r.dataset_segment || '']);
candidates.showGridLines = false;
candidates.getRange(`A1:AA${values.length + 1}`).values = [headers, ...values];
styleHeader(candidates, 'A1:AA1');
candidates.getRange(`A2:AA${values.length + 1}`).format = { verticalAlignment: 'top', wrapText: true, borders: { insideHorizontal: { style: 'thin', color: '#EEEAF4' } } };
candidates.getRange(`W2:X${values.length + 1}`).format.numberFormat = 'yyyy-mm-dd';
candidates.getRange(`A1:Y${values.length + 1}`).format.rowHeight = 34;
candidates.getRange('A1:Y1').format.rowHeight = 42;
const widths = [12,29,20,12,18,14,18,20,22,16,25,38,35,38,28,22,38,38,32,42,30,13,13,15,34,30,28];
for (let i = 0; i < widths.length; i++) candidates.getRangeByIndexes(0,i,values.length+1,1).format.columnWidth = widths[i];
candidates.tables.add(`A1:AA${values.length + 1}`, true, 'ProgramCandidates');
candidates.freezePanes.freezeRows(1);
candidates.freezePanes.freezeColumns(3);
candidates.getRange(`D2:D${values.length + 1}`).conditionalFormats.add('containsText', { text: '공공', format: { fill: palePrimary, font: { color: primary } } });
candidates.getRange(`O2:O${values.length + 1}`).conditionalFormats.add('containsText', { text: '미확인', format: { fill: paleSecondary, font: { color: dark } } });

queue.showGridLines = false;
const qHeaders = ['ID','프로그램명','장소명','소개 링크','예약 링크','현재 정보 상태','재확인 필요일','발행 가능 판정','발행 전 확인 메모'];
const qValues = rows.map((r) => [r.id,r.program_name,r.venue_name,r.introduction_url,r.reservation_url,r.information_status,r.reconfirm_by,'보류','공식 회차의 일시·대상·비용·예약·휴관·취소·촬영 규정 확인 필요']);
queue.getRange(`A1:I${qValues.length+1}`).values = [qHeaders,...qValues];
styleHeader(queue,'A1:I1');
queue.getRange(`A2:I${qValues.length+1}`).format = { wrapText: true, verticalAlignment: 'top', borders: { insideHorizontal: { style: 'thin', color: '#EEEAF4' } } };
for (const [i,w] of [12,29,20,40,40,30,15,16,42].entries()) queue.getRangeByIndexes(0,i,qValues.length+1,1).format.columnWidth = w;
queue.getRange(`A1:I${qValues.length+1}`).format.rowHeight = 34;
queue.getRange('A1:I1').format.rowHeight = 42;
queue.tables.add(`A1:I${qValues.length+1}`,true,'RecheckQueue');
queue.getRange(`H2:H${qValues.length+1}`).dataValidation = { rule: { type: 'list', values: ['보류','발행 가능','마감','종료','정보 불충분'] } };
queue.getRange(`H2:H${qValues.length+1}`).conditionalFormats.add('containsText',{text:'발행 가능',format:{fill:'#E8F5EA',font:{bold:true,color:'#28713A'}}});
queue.getRange(`H2:H${qValues.length+1}`).conditionalFormats.add('containsText',{text:'보류',format:{fill:paleSecondary,font:{bold:true,color:dark}}});
queue.freezePanes.freezeRows(1);

dict.showGridLines = false;
const dictRows = [
  ['필드','설명','입력/검수 기준'],
  ['정보 상태','현재 회차가 실제로 열려 있는지에 대한 판정','현재 모집/상시·정기/과거 행사/확인 불가를 구분. 미확인은 발행 금지.'],
  ['소개 링크','소개 사실을 뒷받침하는 원출처','검색 결과만 쓰지 않고 공식 홈페이지·공지·예약 페이지를 우선.'],
  ['후기 출처','경험상 주의점을 확인하는 공개 후기 링크','최대 5개. 후기 원문은 개인정보를 복사하지 않고 최신성·혼잡·예약·연령 적합성만 요약.'],
  ['재확인 필요일','변동 정보의 재검수 기준일','일정·정원·가격이 바뀌는 항목은 기본 7일, 마감이 빠르면 발행 전날.'],
  ['발행 가능 판정','콘텐츠 제작 직전의 운영 판정','공식 회차와 필수 정보가 모두 확인된 경우에만 발행 가능.'],
  ['공공/사설','운영 주체의 구분','기관 직영·공공 연계와 사설 운영자를 혼동하지 않도록 분리.'],
];
dict.getRange(`A1:C${dictRows.length}`).values = dictRows;
styleHeader(dict,'A1:C1');
dict.getRange(`A2:C${dictRows.length}`).format = { wrapText:true, verticalAlignment:'top', borders:{insideHorizontal:{style:'thin',color:'#EEEAF4'}} };
dict.getRange('A:A').format.columnWidth = 20;
dict.getRange('B:B').format.columnWidth = 34;
dict.getRange('C:C').format.columnWidth = 62;
dict.getRange(`A1:C${dictRows.length}`).format.rowHeight = 38;
dict.freezePanes.freezeRows(1);

await fs.mkdir(outputDir, { recursive: true });
const xlsx = await SpreadsheetFile.exportXlsx(wb);
await xlsx.save(`${outputDir}/weekly-wonderpin-program-candidates.xlsx`);

const inspection = await wb.inspect({kind:'table',range:'프로그램 후보!A1:Y6',include:'values,formulas',tableMaxRows:6,tableMaxCols:25});
console.log(inspection.ndjson);
const errors = await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A',options:{useRegex:true,maxResults:50},summary:'formula errors'});
console.log(errors.ndjson);
for (const [sheetName, range, name] of [['사용 안내','A1:H16','summary'], ['프로그램 후보','A1:Y8','candidates'], ['발행 전 재확인','A1:I8','queue'], ['데이터 사전','A1:C7','dictionary']]) {
  const preview = await wb.render({sheetName,range,scale:1.2,format:'png'});
  await fs.writeFile(`${outputDir}/preview-${name}.png`,new Uint8Array(await preview.arrayBuffer()));
}
