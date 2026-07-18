'use client';

/* eslint-disable @next/next/no-img-element -- Review images come from dynamic third-party and local collector URLs. */

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type Program = Record<string, any>;
type ProgramResponse = { total: number; page: number; pages: number; decision_counts: Record<'pending' | 'accept' | 'decline', number>; items: Program[] };
type Collection = { status: 'idle' | 'running' | 'success' | 'failed'; started_at: string | null; progress: Record<string, { current: number; total: number }>; logs: string[] };
const emptyPrograms: ProgramResponse = { total: 0, page: 1, pages: 1, decision_counts: { pending: 0, accept: 0, decline: 0 }, items: [] };
const emptyCollection: Collection = { status: 'idle', started_at: null, progress: {}, logs: [] };
const categories = ['야외', '박물관', '숲', '문화공간', '집', '기타'];

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || '요청을 처리하지 못했습니다.');
  return data;
}

function money(value: unknown) { return value == null ? '가격 미확인' : `${Number(value).toLocaleString('ko-KR')}원`; }
function age(item: Program) { return `${item.target_age_min ?? 4}–${item.target_age_max ?? 9}세 대상`; }
function decisionLabel(value: string) { return ({ pending: '검토 전', accept: 'Accept', decline: 'Decline' } as Record<string, string>)[value] || value; }
function remoteImages(item: Program) {
  const urls = (item.image_urls || []) as string[];
  return [...urls.filter((value) => value.includes('cdn.igogo.kr')), ...urls.filter((value) => !value.includes('cdn.igogo.kr'))];
}
function mediaUrl(value: string) { return `/media/${value.split('/').map(encodeURIComponent).join('/')}`; }
function imageUrl(item: Program) { return item.downloaded_images?.length ? mediaUrl(item.downloaded_images[0]) : remoteImages(item)[0] || ''; }

export default function ProgramReviewClient() {
  const [programs, setPrograms] = useState<ProgramResponse>(emptyPrograms);
  const [collection, setCollection] = useState<Collection>(emptyCollection);
  const [selected, setSelected] = useState<Program | null>(null);
  const [note, setNote] = useState('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [source, setSource] = useState('all');
  const [decision, setDecision] = useState('all');
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);

  async function loadPrograms(targetPage = page) {
    const query = new URLSearchParams({ search, category, source, decision, page: String(targetPage), limit: '30' });
    const value = await api<ProgramResponse>(`/api/programs?${query}`);
    setPrograms(value);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void api<ProgramResponse>(`/api/programs?${new URLSearchParams({ search, category, source, decision, page: String(page), limit: '30' })}`)
        .then((value) => { setPrograms(value); setError(''); })
        .catch((reason: Error) => setError(reason.message));
    }, search ? 250 : 0);
    return () => window.clearTimeout(timer);
  }, [search, category, source, decision, page]);

  useEffect(() => {
    let active = true;
    async function poll() {
      try {
        const value = await api<Collection>('/api/collect/status');
        if (active) setCollection(value);
      } catch (reason) { if (active) setError((reason as Error).message); }
    }
    void poll();
    const timer = window.setInterval(poll, 1200);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  function changeFilter(setter: (value: string) => void, value: string) { setPage(1); setter(value); }

  async function openDetail(sourceKey: string) {
    try {
      const item = await api<Program>(`/api/program?source_key=${encodeURIComponent(sourceKey)}`);
      setSelected(item); setNote(item.review_note || ''); dialog.current?.showModal();
    } catch (reason) { setError((reason as Error).message); }
  }

  async function saveReview(nextDecision: 'accept' | 'decline') {
    if (!selected) return;
    try {
      await api('/api/decisions', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ source_key: selected.source_key, decision: nextDecision, note }) });
      dialog.current?.close(); setSelected(null); await loadPrograms();
    } catch (reason) { setError((reason as Error).message); }
  }

  async function startCollection() {
    if (!window.confirm('전체 플랫폼 수집과 상세 이미지 OCR을 시작할까요? 수 분 이상 걸릴 수 있습니다.')) return;
    try { setCollection(await api<Collection>('/api/collect', { method: 'POST' })); }
    catch (reason) { setError((reason as Error).message); }
  }

  const stats = [
    ['전체', Object.values(programs.decision_counts).reduce((sum, value) => sum + value, 0), ''],
    ['검토 전', programs.decision_counts.pending, 'pending'], ['Accept', programs.decision_counts.accept, 'accept'], ['Decline', programs.decision_counts.decline, 'decline'],
  ] as const;
  const collectionLabels = { idle: '수집 대기', running: '수집 중', success: '수집 완료', failed: '수집 실패' };
  const detailImages = selected ? (selected.downloaded_images?.length ? selected.downloaded_images.map(mediaUrl) : remoteImages(selected).slice(0, 8)) : [];

  return (
    <>
      <header className="topbar"><div><p className="eyebrow">WONDERPIN ADMIN</p><h1>프로그램 검수</h1><p className="subtitle">수집된 프로그램을 원본·이미지와 함께 확인하고 판정합니다.</p></div><div className="topbar-actions"><Link className="admin-nav-link" href="/missions">원더미션 관리</Link><button type="button" className="collect-button" disabled={collection.status === 'running'} onClick={startCollection}>새로 수집</button></div></header>
      <div className="local-warning program-warning" role="note"><strong>로컬 관리자 전용</strong> 로그인과 역할 권한이 없으므로 127.0.0.1 개발 환경 밖에 공개하지 마세요.</div>
      <section className="collection-panel" aria-live="polite"><div><strong>{collectionLabels[collection.status]}</strong><span>{collection.started_at ? `시작 ${new Date(collection.started_at).toLocaleTimeString('ko-KR')}` : ''}</span></div><div className="progress-group"><span>아이고고 <b>{collection.progress.igogo ? `${collection.progress.igogo.current}/${collection.progress.igogo.total}` : '-'}</b></span><span>째깍악어 <b>{collection.progress.tictoccroc ? `${collection.progress.tictoccroc.current}/${collection.progress.tictoccroc.total}` : '-'}</b></span></div>{collection.logs.length > 0 && <pre>{collection.logs.slice(-12).join('\n')}</pre>}</section>
      <section className="stats">{stats.map(([label, value, className]) => <div className={`stat ${className}`} key={label}><span>{label}</span><strong>{value.toLocaleString('ko-KR')}</strong></div>)}</section>
      <section className="filters"><input type="search" value={search} onChange={(event) => changeFilter(setSearch, event.target.value)} placeholder="프로그램명, 운영자, 장소 검색" /><select value={category} onChange={(event) => changeFilter(setCategory, event.target.value)}><option value="all">모든 카테고리</option>{categories.map((value) => <option value={value} key={value}>{value}</option>)}</select><select value={source} onChange={(event) => changeFilter(setSource, event.target.value)}><option value="all">모든 출처</option><option value="igogo">아이고고</option><option value="tictoccroc">째깍악어</option></select><select value={decision} onChange={(event) => changeFilter(setDecision, event.target.value)}><option value="all">모든 판정</option><option value="pending">검토 전</option><option value="accept">Accept</option><option value="decline">Decline</option></select></section>
      <main className="program-main"><div className="result-meta"><span>{error || `${programs.total.toLocaleString('ko-KR')}개 프로그램`}</span><span>{programs.page} / {programs.pages} 페이지</span></div><section className="program-grid">{programs.items.length ? programs.items.map((item) => { const image = imageUrl(item); return <article className="card" key={item.source_key} onClick={() => openDetail(item.source_key)}>{image ? <img className="thumb" src={image} alt="" onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} /> : <div className="thumb thumb-placeholder">이미지 없음</div>}<div className="card-body"><div className="badges"><span className="badge">{item.category}</span><span className={`badge ${item.review_decision}`}>{decisionLabel(item.review_decision)}</span></div><h2>{item.title}</h2><p>{item.operator || '운영자 미확인'}</p><p>{age(item)} · {money(item.price)}</p><p>{item.region || item.venue || '장소 미확인'}</p></div></article>; }) : <div className="empty">조건에 맞는 프로그램이 없습니다.</div>}</section><div className="pagination"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>이전</button><button type="button" disabled={page >= programs.pages} onClick={() => setPage((value) => value + 1)}>다음</button></div></main>
      <dialog ref={dialog} onClick={(event) => { if (event.target === dialog.current) dialog.current?.close(); }}><button type="button" className="dialog-close" aria-label="닫기" onClick={() => dialog.current?.close()}>×</button>{selected && <article className="detail"><div className="badges"><span className="badge">{selected.source}</span><span className="badge">{selected.category}</span><span className={`badge ${selected.review_decision}`}>{decisionLabel(selected.review_decision)}</span></div><h2>{selected.title}</h2><p>{selected.operator || '운영자 미확인'}</p><div className="detail-meta"><span>{age(selected)}</span><span>{money(selected.price)}</span><span>{selected.region || '지역 미확인'}</span><span>{selected.venue || '장소 미확인'}</span></div><a className="source-link" href={selected.source_url} target="_blank" rel="noreferrer">원본 페이지 열기 ↗</a>{detailImages.length > 0 && <div className="gallery">{detailImages.map((src: string) => <img src={src} alt={`${selected.title} 상세 이미지`} loading="lazy" key={src} onError={(event) => { event.currentTarget.style.display = 'none'; }} />)}</div>}<section className="detail-section"><h3>프로그램 요약</h3><p>{selected.summary || '구조화된 요약이 없습니다.'}</p></section><section className="detail-section"><h3>OCR 상세 내용</h3><pre>{selected.ocr_text || 'OCR 텍스트 없음'}</pre></section><section className="detail-section"><h3>수집·분류 정보</h3><p>분류 근거: {selected.classification_reason || '-'} · 신뢰도: {selected.classification_confidence || '-'}<br />원본 갱신: {selected.updated_at || '-'} · 수집 확인: {selected.checked_at || '-'}</p></section><div className="decision-box"><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="판정 메모(선택)" /><button type="button" className="accept-button" onClick={() => saveReview('accept')}>Accept</button><button type="button" className="decline-button" onClick={() => saveReview('decline')}>Decline</button></div></article>}</dialog>
    </>
  );
}
