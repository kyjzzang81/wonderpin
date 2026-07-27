import { NextResponse } from 'next/server';
import { requireAdmin } from '@wonderpin/auth/server';
import { adminApiError } from '@/lib/admin-api';
import { createWonderMission, listAdminWonderMissions } from '@/lib/missions';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { client } = await requireAdmin();
    const items = await listAdminWonderMissions(client);
    return NextResponse.json({ items, total: items.length });
  } catch (error) {
    return adminApiError(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const { client, user } = await requireAdmin();
    return NextResponse.json(
      await createWonderMission(client, user.id, await request.json()),
      { status: 201 },
    );
  } catch (error) {
    return adminApiError(error);
  }
}
