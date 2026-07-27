import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { missionAssetUrl, sanitizeMissionHtml } from '@wonderpin/database/wonder-missions';
import { getMission } from '@/lib/missions';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const mission = await getMission(decodeURIComponent((await params).id));
  return { title: mission?.title || '원더미션' };
}

export default async function MissionDetailPage({ params }: Props) {
  const mission = await getMission(decodeURIComponent((await params).id));
  if (!mission) notFound();
  return (
    <article className="mission-detail">
      <Link className="back-link" href="/" aria-label="원더미션 목록으로 돌아가기">← 목록으로</Link>
      <header className="detail-heading"><span className="age-chip">{mission.recommended_age}</span><h1>{mission.title}</h1></header>
      {mission.thumbnail_path && (
        // Supabase Storage media is streamed through the RLS-protected asset route.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="detail-thumbnail" src={missionAssetUrl(mission.thumbnail_path)} alt="" />
      )}
      <div className="mission-content" dangerouslySetInnerHTML={{ __html: sanitizeMissionHtml(mission.content) }} />
      <Link className="back-button" href="/">다른 원더미션 보기</Link>
    </article>
  );
}
