'use client';

import { createBrowserSupabaseClient } from '@wonderpin/auth/browser';
import {
  missionAssetUrl,
  type WonderMission,
  type WonderMissionStatus,
  type WonderpinAdminRole,
} from '@wonderpin/database/wonder-missions';
import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '요청을 처리하지 못했습니다.');
  return data;
}

function readableDate(value: string) {
  return new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

const STATUS_LABEL: Record<WonderMissionStatus, string> = {
  draft: '초안',
  published: '공개',
  archived: '보관',
};

interface MissionManagerProps {
  userEmail: string;
  role: WonderpinAdminRole;
}

export default function MissionManager({ userEmail, role }: MissionManagerProps) {
  const router = useRouter();
  const [missions, setMissions] = useState<WonderMission[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [recommendedAge, setRecommendedAge] = useState('');
  const [publicationStatus, setPublicationStatus] = useState<WonderMissionStatus>('draft');
  const [thumbnailPath, setThumbnailPath] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const editor = useRef<HTMLDivElement>(null);
  const bodyImageInput = useRef<HTMLInputElement>(null);
  const thumbnailInput = useRef<HTMLInputElement>(null);

  async function loadMissions() {
    const data = await api<{ items: WonderMission[] }>('/api/missions');
    setMissions(data.items);
    return data.items;
  }

  useEffect(() => {
    void api<{ items: WonderMission[] }>('/api/missions')
      .then((data) => setMissions(data.items))
      .catch((error: Error) => setNotice(error.message));
  }, []);

  function resetForm() {
    setSelectedId(null);
    setTitle('');
    setRecommendedAge('');
    setPublicationStatus('draft');
    setThumbnailPath(null);
    setNotice('');
    if (editor.current) editor.current.innerHTML = '';
  }

  function selectMission(mission: WonderMission) {
    setSelectedId(mission.id);
    setTitle(mission.title);
    setRecommendedAge(mission.recommended_age);
    setPublicationStatus(mission.status);
    setThumbnailPath(mission.thumbnail_path);
    setNotice('');
    if (editor.current) editor.current.innerHTML = mission.content;
    if (window.innerWidth < 900) document.getElementById('editor-title')?.scrollIntoView({ behavior: 'smooth' });
  }

  function format(command: string, value?: string) {
    editor.current?.focus();
    document.execCommand(command, false, value);
  }

  async function uploadImage(file: File | undefined, kind: 'thumbnail' | 'body') {
    const input = kind === 'thumbnail' ? thumbnailInput : bodyImageInput;
    if (!file) return;
    if (!selectedId) {
      setNotice('이미지를 올리기 전에 텍스트 내용을 먼저 저장해 주세요.');
      if (input.current) input.current.value = '';
      return;
    }
    setNotice('이미지 업로드 중…');
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('mission_id', selectedId);
      form.append('kind', kind);
      const result = await api<{ object_path: string; url: string }>('/api/mission-images', {
        method: 'POST',
        body: form,
      });
      if (kind === 'thumbnail') {
        setThumbnailPath(result.object_path);
        setNotice('썸네일을 올렸습니다. 수정 저장을 눌러 반영해 주세요.');
      } else {
        format('insertImage', result.url);
        const image = editor.current?.querySelector<HTMLImageElement>(`img[src="${CSS.escape(result.url)}"]`);
        if (image) image.alt = file.name.replace(/\.[^.]+$/, '');
        setNotice('본문 이미지를 추가했습니다. 수정 저장을 눌러 반영해 주세요.');
      }
    } catch (error) {
      setNotice((error as Error).message);
    }
    if (input.current) input.current.value = '';
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setNotice('저장 중…');
    try {
      const saved = await api<WonderMission>(selectedId ? `/api/missions/${encodeURIComponent(selectedId)}` : '/api/missions', {
        method: selectedId ? 'PUT' : 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          title,
          recommended_age: recommendedAge,
          thumbnail_path: thumbnailPath,
          content: editor.current?.innerHTML || '',
          status: publicationStatus,
        }),
      });
      const items = await loadMissions();
      selectMission(items.find((item) => item.id === saved.id) || saved);
      setNotice(selectedId ? '수정 내용을 저장했습니다.' : '초안을 저장했습니다. 이제 이미지를 추가할 수 있습니다.');
    } catch (error) {
      setNotice((error as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    const mission = missions.find((item) => item.id === selectedId);
    if (!mission || !window.confirm(`“${mission.title}” 원더미션과 연결 이미지를 삭제할까요?`)) return;
    try {
      await api(`/api/missions/${encodeURIComponent(mission.id)}`, { method: 'DELETE' });
      await loadMissions();
      resetForm();
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  async function signOut() {
    await createBrowserSupabaseClient().auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <>
      <header className="admin-header">
        <div><p>WONDERPIN ADMIN</p><h1>원더미션 관리</h1><span>공개 웹에 보여줄 원더미션을 등록하고 편집합니다.</span></div>
        <nav aria-label="관리자 메뉴">
          <Link href="/">프로그램 검수</Link>
          <button type="button" onClick={resetForm}>새 원더미션</button>
          <button className="secondary-button" type="button" onClick={signOut}>로그아웃</button>
        </nav>
      </header>
      <div className="auth-summary" role="status">
        <strong>{userEmail}</strong>
        <span>{role === 'super_admin' ? '최고 관리자' : '콘텐츠 관리자'}</span>
      </div>
      <main className="admin-layout">
        <section className="mission-list-panel" aria-labelledby="list-title">
          <div className="panel-title"><h2 id="list-title">등록된 원더미션</h2><span>{missions.length}개</span></div>
          <div className="mission-list">
            {missions.length ? missions.map((mission) => (
              <button type="button" className={`mission-row${mission.id === selectedId ? ' active' : ''}`} key={mission.id} onClick={() => selectMission(mission)}>
                <span className={`status-badge status-${mission.status}`}>{STATUS_LABEL[mission.status]}</span>
                <span className="age-badge">{mission.recommended_age}</span>
                <strong>{mission.title}</strong>
                <small>수정 {readableDate(mission.updated_at)}</small>
              </button>
            )) : <div className="empty"><strong>등록된 원더미션이 없습니다.</strong><span>오른쪽 편집기에서 첫 미션을 등록하세요.</span></div>}
          </div>
        </section>
        <section className="editor-panel" aria-labelledby="editor-title">
          <div className="panel-title"><div><p>{selectedId ? '내용 수정' : '새로 등록'}</p><h2 id="editor-title">원더미션 내용</h2></div>{selectedId && <button className="danger-link" type="button" onClick={remove}>삭제</button>}</div>
          <form onSubmit={save}>
            <label>원더미션명<input maxLength={120} required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="예: 동그라미 짝꿍 찾기" /></label>
            <label>권장연령<input maxLength={80} required value={recommendedAge} onChange={(event) => setRecommendedAge(event.target.value)} placeholder="예: 만 4~5세" /></label>
            <label>공개 상태
              <select value={publicationStatus} onChange={(event) => setPublicationStatus(event.target.value as WonderMissionStatus)}>
                <option value="draft">초안 — 가족용 웹에 표시하지 않음</option>
                <option value="published">공개 — 가족용 웹에 표시</option>
                <option value="archived">보관 — 가족용 웹에 표시하지 않음</option>
              </select>
            </label>
            <div className="thumbnail-field">
              <span className="field-label">썸네일</span>
              {thumbnailPath && (
                // Image access is checked by Supabase Storage RLS through the admin asset route.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={missionAssetUrl(thumbnailPath)} alt="현재 원더미션 썸네일" />
              )}
              <button type="button" disabled={!selectedId} onClick={() => thumbnailInput.current?.click()}>
                {thumbnailPath ? '썸네일 교체' : '썸네일 업로드'}
              </button>
              <input ref={thumbnailInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={(event) => uploadImage(event.target.files?.[0], 'thumbnail')} />
              {!selectedId && <small>텍스트 내용을 먼저 저장하면 이미지를 올릴 수 있습니다.</small>}
            </div>
            <div className="editor-field">
              <span className="field-label">내용</span>
              <div className="toolbar" role="toolbar" aria-label="내용 서식">
                <button type="button" onClick={() => format('formatBlock', 'p')}>본문</button>
                <button type="button" onClick={() => format('formatBlock', 'h2')}>제목</button>
                <button type="button" onClick={() => format('bold')}><strong>굵게</strong></button>
                <button type="button" onClick={() => format('insertUnorderedList')}>목록</button>
                <button type="button" disabled={!selectedId} onClick={() => bodyImageInput.current?.click()}>이미지</button>
                <input ref={bodyImageInput} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={(event) => uploadImage(event.target.files?.[0], 'body')} />
              </div>
              <div ref={editor} className="content-editor" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="원더미션 내용" data-placeholder="카드뉴스 이미지와 안내 문구를 입력하세요." />
              <p className="help">Supabase private Storage에 PNG·JPEG·GIF·WebP만 저장하며 파일당 최대 5MB입니다.</p>
            </div>
            <div className="form-actions"><span role="status">{notice}</span><button className="primary-button" type="submit" disabled={saving}>{selectedId ? '수정 저장' : '등록하기'}</button></div>
          </form>
        </section>
      </main>
    </>
  );
}
