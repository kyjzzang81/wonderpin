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
      <section className="detail-hero">
        <Link className="back-link" href="/" aria-label="원더미션 목록으로 돌아가기"><span aria-hidden="true">←</span> 목록으로</Link>
        <header className="detail-heading">
          <p className="detail-kicker"><span aria-hidden="true">✦</span> 오늘의 발견</p>
          <span className="age-chip">{mission.recommended_age}</span>
          <h1>{mission.title}</h1>
        </header>
        <div className="detail-scene" aria-hidden="true">
          {/* Decorative raster artwork is maintained in the repository asset library. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/web-graphics/wonder-mission/discovery-sprout.png" alt="" />
        </div>
      </section>
      <section className="detail-paper" aria-label="원더미션 내용">
        {mission.thumbnail_path && (
          // Supabase Storage media is streamed through the RLS-protected asset route.
          // eslint-disable-next-line @next/next/no-img-element
          <img className="detail-thumbnail" src={missionAssetUrl(mission.thumbnail_path)} alt="" />
        )}
        <div className="mission-content" dangerouslySetInnerHTML={{ __html: sanitizeMissionHtml(mission.content) }} />
        <Link className="back-button" href="/">다른 원더미션 보기 <span aria-hidden="true">→</span></Link>
      </section>
    </article>
  );
}
