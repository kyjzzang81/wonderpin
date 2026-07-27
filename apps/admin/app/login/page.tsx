import type { Metadata } from 'next';
import LoginForm from './login-form';

export const metadata: Metadata = { title: '관리자 로그인' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = (await searchParams).next;
  return (
    <main className="login-page">
      <section className="login-card">
        <p className="eyebrow">WONDERPIN ADMIN</p>
        <h1>관리자 로그인</h1>
        <p>Supabase Auth 계정과 등록된 관리자 역할이 필요합니다.</p>
        <LoginForm nextPath={next} />
      </section>
    </main>
  );
}
