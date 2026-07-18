import Link from 'next/link';
import { sanitizeMissionHtml } from '@wonderpin/database/wonder-missions';
import { missionStore } from '@/lib/missions';

export const dynamic = 'force-dynamic';

function firstImage(content: string) {
  const sanitized = sanitizeMissionHtml(content);
  const tag = sanitized.match(/<img\b[^>]*>/i)?.[0];
  if (!tag) return null;
  const src = tag.match(/\bsrc="([^"]+)"/i)?.[1];
  const alt = tag.match(/\balt="([^"]*)"/i)?.[1] || '';
  return src ? { src, alt } : null;
}

export default async function HomePage() {
  const missions = await missionStore.list();
  return (
    <>
      <section className="home-intro">
        <p className="eyebrow">오늘의 원더미션</p>
        <h1>아이의 질문이<br />시작되는 곳.</h1>
        <p>평범한 산책길에서 발견하고, 비교하고, 이야기해 보세요.</p>
      </section>
      <section className="mission-section" aria-labelledby="mission-list-title">
        <div className="section-heading"><h2 id="mission-list-title">원더미션 목록</h2><span>{missions.length}개</span></div>
        {missions.length ? (
          <div className="mission-grid">
            {missions.map((mission, index) => {
              const image = firstImage(mission.content);
              return (
                <Link className="mission-card" href={`/missions/${encodeURIComponent(mission.id)}`} key={mission.id}>
                  {image ? (
                    // Uploaded mission media can change independently from the application build.
                    // eslint-disable-next-line @next/next/no-img-element
                    <div className="mission-cover"><img src={image.src} alt={image.alt} loading="lazy" /></div>
                  ) : (
                    <div className={`mission-cover placeholder placeholder-${index % 3}`} aria-hidden="true"><span /><span /><span /></div>
                  )}
                  <div className="mission-card-body"><span className="age-chip">{mission.recommended_age}</span><h3>{mission.title}</h3><span className="open-label">미션 열기 <b aria-hidden="true">→</b></span></div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-state"><div aria-hidden="true">✦</div><h3>새 원더미션을 준비하고 있어요</h3><p>곧 아이와 함께 열어볼 미션이 도착합니다.</p></div>
        )}
      </section>
    </>
  );
}
