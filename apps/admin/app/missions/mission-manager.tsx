'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { WonderMission } from '@wonderpin/database/wonder-missions';

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '요청을 처리하지 못했습니다.');
  return data;
}

function readableDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export default function MissionManager() {
  const [missions, setMissions] = useState<WonderMission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [recommendedAge, setRecommendedAge] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const editor = useRef<HTMLDivElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);

  async function loadMissions() {
    const data = await api<{ items: WonderMission[] }>('/api/missions');
    setMissions(data.items);
    return data.items;
  }

  useEffect(() => {
    void api<{ items: WonderMission[] }>('/api/missions')
      .then((data) => setMissions(data.items))
      .catch((error: Error) => setStatus(error.message));
  }, []);

  function resetForm() {
    setSelectedId(null); setTitle(''); setRecommendedAge(''); setStatus('');
    if (editor.current) editor.current.innerHTML = '';
  }

  function selectMission(mission: WonderMission) {
    setSelectedId(mission.id); setTitle(mission.title); setRecommendedAge(mission.recommended_age); setStatus('');
    if (editor.current) editor.current.innerHTML = mission.content;
    if (window.innerWidth < 900) document.getElementById('editor-title')?.scrollIntoView({ behavior: 'smooth' });
  }

  function format(command: string, value?: string) {
    editor.current?.focus();
    document.execCommand(command, false, value);
  }

  async function uploadImage(file?: File) {
    if (!file) return;
    setStatus('이미지 업로드 중…');
    try {
      const result = await api<{ url: string }>('/api/mission-images', { method: 'POST', headers: { 'content-type': file.type }, body: file });
      format('insertImage', result.url);
      const image = editor.current?.querySelector<HTMLImageElement>(`img[src="${CSS.escape(result.url)}"]`);
      if (image) image.alt = file.name.replace(/\.[^.]+$/, '');
      setStatus('이미지를 추가했습니다.');
    } catch (error) { setStatus((error as Error).message); }
    if (imageInput.current) imageInput.current.value = '';
  }

  async function save(event: FormEvent) {
    event.preventDefault(); setSaving(true); setStatus('저장 중…');
    try {
      const saved = await api<WonderMission>(selectedId ? `/api/missions/${encodeURIComponent(selectedId)}` : '/api/missions', {
        method: selectedId ? 'PUT' : 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, recommended_age: recommendedAge, content: editor.current?.innerHTML || '' }),
      });
      const items = await loadMissions();
      selectMission(items.find((item) => item.id === saved.id) || saved);
      setStatus('저장했습니다.');
    } catch (error) { setStatus((error as Error).message); }
    finally { setSaving(false); }
  }

  async function remove() {
    const mission = missions.find((item) => item.id === selectedId);
    if (!mission || !window.confirm(`“${mission.title}” 원더미션을 삭제할까요?`)) return;
    try { await api(`/api/missions/${encodeURIComponent(mission.id)}`, { method: 'DELETE' }); await loadMissions(); resetForm(); }
    catch (error) { setStatus((error as Error).message); }
  }

  return (
    <>
      <header className="admin-header">
        <div><p>WONDERPIN ADMIN</p><h1>원더미션 관리</h1><span>공개 웹에 보여줄 원더미션을 등록하고 편집합니다.</span></div>
        <nav aria-label="관리자 메뉴"><Link href="/">프로그램 검수</Link><button type="button" onClick={resetForm}>새 원더미션</button></nav>
      </header>
      <div className="local-warning" role="note"><strong>로컬 관리자 전용</strong> 이 화면에는 로그인·역할 권한이 없습니다. 서버가 127.0.0.1에서만 실행되는 개발 환경에서 사용하세요.</div>
      <main className="admin-layout">
        <section className="mission-list-panel" aria-labelledby="list-title">
          <div className="panel-title"><h2 id="list-title">등록된 원더미션</h2><span>{missions.length}개</span></div>
          <div className="mission-list">
            {missions.length ? missions.map((mission) => (
              <button type="button" className={`mission-row${mission.id === selectedId ? ' active' : ''}`} key={mission.id} onClick={() => selectMission(mission)}>
                <span className="age-badge">{mission.recommended_age}</span><strong>{mission.title}</strong><small>수정 {readableDate(mission.updated_at)}</small>
              </button>
            )) : <div className="empty"><strong>등록된 원더미션이 없습니다.</strong><span>오른쪽 편집기에서 첫 미션을 등록하세요.</span></div>}
          </div>
        </section>
        <section className="editor-panel" aria-labelledby="editor-title">
          <div className="panel-title"><div><p>{selectedId ? '내용 수정' : '새로 등록'}</p><h2 id="editor-title">원더미션 내용</h2></div>{selectedId && <button className="danger-link" type="button" onClick={remove}>삭제</button>}</div>
          <form onSubmit={save}>
            <label>원더미션명<input maxLength={120} required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 동그라미 짝꿍 찾기" /></label>
            <label>권장연령<input maxLength={80} required value={recommendedAge} onChange={(event) => setRecommendedAge(event.target.value)} placeholder="예: 만 4~5세" /></label>
            <div className="editor-field">
              <span className="field-label">내용</span>
              <div className="toolbar" role="toolbar" aria-label="내용 서식">
                <button type="button" onClick={() => format('formatBlock', 'p')}>본문</button><button type="button" onClick={() => format('formatBlock', 'h2')}>제목</button><button type="button" onClick={() => format('bold')}><strong>굵게</strong></button><button type="button" onClick={() => format('insertUnorderedList')}>목록</button><button type="button" onClick={() => imageInput.current?.click()}>이미지</button>
                <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={(event) => uploadImage(event.target.files?.[0])} />
              </div>
              <div ref={editor} className="content-editor" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="원더미션 내용" data-placeholder="카드뉴스 이미지와 안내 문구를 입력하세요." />
              <p className="help">PNG·JPEG·GIF·WebP, 파일당 최대 5MB. 업로드 이미지는 로컬 저장소에 보관됩니다.</p>
            </div>
            <div className="form-actions"><span role="status">{status}</span><button className="primary-button" type="submit" disabled={saving}>{selectedId ? '수정 저장' : '등록하기'}</button></div>
          </form>
        </section>
      </main>
    </>
  );
}
