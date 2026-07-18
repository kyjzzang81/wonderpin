import type { Metadata } from 'next';
import '@wonderpin/ui/tokens.css';
import './globals.css';

export const metadata: Metadata = {
  title: { default: '원더핀 관리자', template: '%s | 원더핀 관리자' },
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ko"><body>{children}</body></html>;
}
