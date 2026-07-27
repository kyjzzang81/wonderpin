'use client';

import { createBrowserSupabaseClient } from '@wonderpin/auth/browser';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    const { error } = await createBrowserSupabaseClient().auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      setMessage('이메일, 비밀번호 또는 계정 상태를 확인해 주세요.');
      return;
    }
    router.replace(nextPath?.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/missions');
    router.refresh();
  }

  return (
    <form className="login-form" onSubmit={submit}>
      <label>이메일<input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>비밀번호<input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <p role="alert">{message}</p>
      <button className="primary-button" type="submit" disabled={submitting}>{submitting ? '로그인 중…' : '로그인'}</button>
    </form>
  );
}
