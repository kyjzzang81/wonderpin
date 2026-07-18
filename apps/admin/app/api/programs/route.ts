import { NextResponse } from 'next/server';
import { listPrograms } from '@/lib/program-reviews';

export const dynamic = 'force-dynamic';
export async function GET(request: Request) { return NextResponse.json(await listPrograms(new URL(request.url).searchParams)); }
