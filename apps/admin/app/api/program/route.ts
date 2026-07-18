import { NextResponse } from 'next/server';
import { getProgram } from '@/lib/program-reviews';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const program = await getProgram(new URL(request.url).searchParams.get('source_key'));
  return program ? NextResponse.json(program) : NextResponse.json({ error: 'program not found' }, { status: 404 });
}
