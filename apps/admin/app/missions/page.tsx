import type { Metadata } from 'next';
import MissionManager from './mission-manager';

export const metadata: Metadata = { title: '원더미션 관리' };
export const dynamic = 'force-dynamic';

export default function MissionsPage() {
  return <MissionManager />;
}
