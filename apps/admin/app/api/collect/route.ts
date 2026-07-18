import { NextResponse } from 'next/server';
import { collection, startCollection } from '@/lib/program-reviews';

export const dynamic = 'force-dynamic';
export async function POST() { return startCollection() ? NextResponse.json(collection, { status: 202 }) : NextResponse.json({ error: 'collection already running', collection }, { status: 409 }); }
