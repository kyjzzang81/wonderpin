import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export function GET() {
  const value = String(process.env.WONDERPIN_INSTAGRAM_URL || '').trim();
  return NextResponse.json({ instagram_url: /^https:\/\/(www\.)?instagram\.com\//i.test(value) ? value : null });
}
