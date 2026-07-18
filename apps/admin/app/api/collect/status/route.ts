import { NextResponse } from 'next/server';
import { collection } from '@/lib/program-reviews';

export const dynamic = 'force-dynamic';
export async function GET() { return NextResponse.json(collection); }
