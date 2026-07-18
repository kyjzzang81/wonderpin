import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { sanitizeMissionHtml } from '@wonderpin/database/wonder-missions';
import { missionStore } from '@/lib/missions';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const mission = await missionStore.get(decodeURIComponent((await params).id));
  return { title: mission?.title || '원더미션' };
}

export default async function MissionDetailPage({ params }: Props) {
  const mission = await missionStore.get(decodeURIComponent((await params).id));
  if (!mission) notFound();
  return (
    <article className="mission-detail">
      <Link className="back-link" href="/" aria-label="원더미션 목록으로 돌아가기">← 목록으로</Link>
      <header className="detail-heading"><span className="age-chip">{mission.recommended_age}</span><h1>{mission.title}</h1></header>
      <div className="mission-content" dangerouslySetInnerHTML={{ __html: sanitizeMissionHtml(mission.content) }} />
      <Link className="back-button" href="/">다른 원더미션 보기</Link>
    </article>
  );
}
