import { AdminAuthorizationError } from '@wonderpin/auth/server';
import { NextResponse } from 'next/server';

export function adminApiError(error: unknown, fallbackStatus = 400) {
  const status = error instanceof AdminAuthorizationError ? error.status : fallbackStatus;
  return NextResponse.json(
    { error: error instanceof Error ? error.message : '요청을 처리하지 못했습니다.' },
    { status },
  );
}
