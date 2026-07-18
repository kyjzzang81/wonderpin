import { NextResponse } from 'next/server';
import { saveDecision } from '@/lib/program-reviews';

export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  try { return NextResponse.json(await saveDecision(await request.json())); }
  catch (error) { return NextResponse.json({ error: (error as Error).message }, { status: 400 }); }
}
