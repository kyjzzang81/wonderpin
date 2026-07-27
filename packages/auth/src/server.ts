import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database, WonderpinAdminRole } from '@wonderpin/database';
import { cookies } from 'next/headers';
import { getSupabasePublicConfig } from './config';

export class AdminAuthorizationError extends Error {
  constructor(message: string, public readonly status: 401 | 403 = 401) {
    super(message);
  }
}

export async function createServerSupabaseClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();
  const { url, publishableKey } = getSupabasePublicConfig();
  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => {
        try {
          values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies. Route handlers and browser auth refresh them.
        }
      },
    },
  });
}

export interface AdminSession {
  client: SupabaseClient<Database>;
  user: User;
  role: WonderpinAdminRole;
}

export async function requireAdmin(): Promise<AdminSession> {
  const client = await createServerSupabaseClient();
  const { data: { user }, error: userError } = await client.auth.getUser();
  if (userError || !user) throw new AdminAuthorizationError('로그인이 필요합니다.', 401);

  const { data, error } = await client
    .from('admin_user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new AdminAuthorizationError('원더미션 관리 권한이 없습니다.', 403);
  return { client, user, role: data.role };
}
