import type { Metadata } from 'next';
import Link from 'next/link';
import { BrandLogo, InstagramIcon } from '@wonderpin/ui';
import '@wonderpin/ui/tokens.css';
import './globals.css';

export const metadata: Metadata = {
  title: { default: '원더미션 | 원더핀', template: '%s | 원더핀' },
  description: '아이의 질문이 시작되는 원더핀 원더미션',
};

function instagramUrl() {
  const value = String(process.env.WONDERPIN_INSTAGRAM_URL || '').trim();
  return /^https:\/\/(www\.)?instagram\.com\//i.test(value) ? value : null;
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const instagram = instagramUrl();
  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          <Link className="brand-link" href="/" aria-label="원더핀 홈">
            <BrandLogo width={132} height={64} />
          </Link>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          {instagram ? (
            <a className="instagram-button" href={instagram} target="_blank" rel="noreferrer noopener" aria-label="원더핀 인스타그램 채널 열기">
              <InstagramIcon />
            </a>
          ) : (
            <span className="instagram-button" aria-disabled="true" title="인스타그램 채널 주소를 준비하고 있습니다.">
              <InstagramIcon /><span className="visually-hidden">인스타그램 채널 준비 중</span>
            </span>
          )}
        </footer>
      </body>
    </html>
  );
}
