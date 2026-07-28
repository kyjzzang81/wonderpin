import assert from 'node:assert/strict';
import test from 'node:test';
import {
  missionAssetUrl,
  normalizeMission,
  sanitizeMissionHtml,
  validateMissionImage,
} from '../src/wonder-missions.ts';

const assetPath = '11111111-1111-4111-8111-111111111111/22222222-2222-4222-8222-222222222222.png';

test('mission normalization sanitizes HTML and validates workflow fields', () => {
  const mission = normalizeMission({
    title: ' 바람의 흔적 찾기 ',
    recommended_age: '만 5~7세',
    thumbnail_path: assetPath,
    status: 'published',
    content: `<h2 onclick="bad()">시작</h2><script>alert(1)</script><img src="${missionAssetUrl(assetPath)}">`,
  });
  assert.equal(mission.title, '바람의 흔적 찾기');
  assert.equal(mission.status, 'published');
  assert.equal(mission.thumbnail_path, assetPath);
  assert.doesNotMatch(mission.content, /onclick|script|alert/);
  assert.match(mission.content, /loading="lazy"/);
  assert.throws(() => normalizeMission({ ...mission, status: 'invalid' }), /공개 상태/);
});

test('sanitizer only keeps safe links and Supabase mission asset proxy sources', () => {
  const value = sanitizeMissionHtml(
    `<a href="javascript:bad()">bad</a><img src="${missionAssetUrl(assetPath)}" onerror="bad()"><img src="https://example.com/x.png">`,
  );
  assert.doesNotMatch(value, /javascript|onerror|example\.com/);
  assert.match(value, /api\/mission-assets/);
});

test('sanitizer preserves only supported paragraph alignment', () => {
  const value = sanitizeMissionHtml(
    '<p style="color:red; text-align: center" onclick="bad()">가운데</p><h2 style="text-align:right">오른쪽</h2><p style="text-align: justify">제거</p>',
  );
  assert.match(value, /<p style="text-align: center">/);
  assert.match(value, /<h2 style="text-align: right">/);
  assert.doesNotMatch(value, /color|onclick|justify/);
});

test('image validation checks declared type, signature and limit', () => {
  const png = Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
  assert.deepEqual(validateMissionImage('image/png', png), { mimeType: 'image/png', extension: 'png' });
  assert.throws(() => validateMissionImage('image/jpeg', png), /PNG, JPEG/);
  assert.throws(() => validateMissionImage('image/png', new Uint8Array()), /5MB/);
});
