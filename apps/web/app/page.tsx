import Link from 'next/link';
import { missionAssetUrl, sanitizeMissionHtml } from '@wonderpin/database/wonder-missions';
import { listMissions } from '@/lib/missions';

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
  const missions = await listMissions();
  return (
    <>
      <section className="home-intro">
        <div className="hero-copy">
          <p className="eyebrow"><span aria-hidden="true">✦</span> 오늘의 원더미션</p>
          <h1>아이의 질문이<br /><strong>시작되는 곳.</strong></h1>
          <p className="hero-description">평범한 산책길을 천천히 바라보세요.<br />발견하고, 비교하고, 아이의 생각을 들어보는 탐험이 시작됩니다.</p>
          <a className="hero-link" href="#mission-list-title">
            미션 둘러보기 <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="discovery-scene" aria-hidden="true">
          {/* Decorative raster artwork is maintained in the repository asset library. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/web-graphics/wonder-mission/hero-explorer.png" alt="" />
        </div>
      </section>
      <section className="mission-section" aria-labelledby="mission-list-title">
        <div className="section-heading">
          <div>
            <p>밖으로 나갈 준비가 됐나요?</p>
            <h2 id="mission-list-title">오늘 열어볼<br />원더미션</h2>
          </div>
          <span>{missions.length}개의 발견</span>
        </div>
        {missions.length ? (
          <div className="mission-grid">
            {missions.map((mission, index) => {
              const image = mission.thumbnail_path
                ? { src: missionAssetUrl(mission.thumbnail_path), alt: '' }
                : firstImage(mission.content);
              return (
                <Link className="mission-card" href={`/missions/${encodeURIComponent(mission.id)}`} key={mission.id}>
                  {image ? (
                    // Uploaded mission media can change independently from the application build.
                    // eslint-disable-next-line @next/next/no-img-element
                    <div className="mission-cover"><img src={image.src} alt={image.alt} loading="lazy" /><span className="cover-shine" aria-hidden="true" /></div>
                  ) : (
                    <div className={`mission-cover placeholder placeholder-${index % 3}`} aria-hidden="true">
                      <span className="placeholder-orbit" />
                      <span className="placeholder-pebble" />
                      <span className="placeholder-sprout" />
                      <span className="placeholder-spark">✦</span>
                    </div>
                  )}
                  <div className="mission-card-body">
                    <span className="age-chip">{mission.recommended_age}</span>
                    <h3>{mission.title}</h3>
                    <span className="open-label">미션 열기 <b aria-hidden="true">↗</b></span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-orbit" aria-hidden="true"><span>✦</span></div>
            <h3>새 원더미션을 준비하고 있어요</h3>
            <p>곧 아이와 함께 열어볼 미션이 도착합니다.</p>
          </div>
        )}
      </section>
    </>
  );
}
