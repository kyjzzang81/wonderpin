import Link from 'next/link';

export default function NotFound() {
  return <div className="error-state"><h1>원더미션을 찾을 수 없어요</h1><p>주소를 다시 확인해 주세요.</p><Link href="/">홈으로 돌아가기</Link></div>;
}
