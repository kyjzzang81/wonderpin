import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createWonderMissionStore, sanitizeMissionHtml, saveMissionImage } from '../src/wonder-missions.ts';

test('mission CRUD persists sanitized HTML', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'wonderpin-missions-'));
  const store = createWonderMissionStore(path.join(directory, 'missions.json'));
  const mission = await store.create({
    title: ' 바람의 흔적 찾기 ',
    recommended_age: '만 5~7세',
    content: '<h2 onclick="bad()">시작</h2><script>alert(1)</script><p>움직이는 것을 찾아요.</p>',
  });
  assert.equal(mission.title, '바람의 흔적 찾기');
  assert.doesNotMatch(mission.content, /onclick|script|alert/);
  assert.equal((await store.list()).length, 1);
  assert.equal((await store.update(mission.id, { recommended_age: '만 5~8세' }))?.recommended_age, '만 5~8세');
  assert.equal((await store.remove(mission.id))?.id, mission.id);
  assert.equal((await store.list()).length, 0);
});

test('sanitizer only keeps safe links and mission image sources', () => {
  const value = sanitizeMissionHtml('<a href="javascript:bad()">bad</a><img src="/mission-media/a.png" onerror="bad()"><img src="data:x">');
  assert.doesNotMatch(value, /javascript|onerror|data:/);
  assert.match(value, /loading="lazy"/);
});

test('image upload checks declared type, signature and limit', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'wonderpin-images-'));
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0]);
  const saved = await saveMissionImage('image/png', png, directory);
  assert.match(saved.url, /^\/mission-media\/[a-f0-9-]+\.png$/);
  await assert.rejects(() => saveMissionImage('image/jpeg', png, directory), /PNG, JPEG/);
});
