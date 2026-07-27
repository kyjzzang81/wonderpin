import type { Metadata } from 'next';
import { AdminAuthorizationError, requireAdmin } from '@wonderpin/auth/server';
import { redirect } from 'next/navigation';
import MissionManager from './mission-manager';

export const metadata: Metadata = { title: '원더미션 관리' };
export const dynamic = 'force-dynamic';

export default async function MissionsPage() {
  let session;
  try {
    session = await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAuthorizationError) redirect('/login?next=/missions');
    throw error;
  }
  return <MissionManager userEmail={session.user.email || '관리자'} role={session.role} />;
}
