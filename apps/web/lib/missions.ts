import { createServerSupabaseClient } from '@wonderpin/auth/server';
import {
  getPublishedWonderMission,
  listPublishedWonderMissions,
} from '@wonderpin/database/wonder-missions';

export async function listMissions() {
  return listPublishedWonderMissions(await createServerSupabaseClient());
}

export async function getMission(id: string) {
  return getPublishedWonderMission(await createServerSupabaseClient(), id);
}
