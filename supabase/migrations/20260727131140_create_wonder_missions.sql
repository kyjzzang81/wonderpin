create type public.wonder_mission_status as enum ('draft', 'published', 'archived');
create type public.wonderpin_admin_role as enum ('content_manager', 'super_admin');
create type public.wonder_mission_asset_kind as enum ('thumbnail', 'body');

create table public.admin_user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.wonderpin_admin_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.wonder_missions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  recommended_age text not null check (char_length(recommended_age) between 1 and 80),
  thumbnail_path text,
  content text not null,
  status public.wonder_mission_status not null default 'draft',
  created_by uuid not null references auth.users(id),
  updated_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint wonder_missions_content_present check (char_length(btrim(content)) > 0),
  constraint wonder_missions_thumbnail_path_format check (
    thumbnail_path is null
    or (
      thumbnail_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(png|jpg|gif|webp)$'
      and split_part(thumbnail_path, '/', 1) = id::text
    )
  )
);

create table public.wonder_mission_assets (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references public.wonder_missions(id) on delete cascade,
  object_path text not null unique,
  kind public.wonder_mission_asset_kind not null,
  original_name text not null check (char_length(original_name) between 1 and 255),
  mime_type text not null check (mime_type in ('image/png', 'image/jpeg', 'image/gif', 'image/webp')),
  size_bytes bigint not null check (size_bytes between 1 and 5000000),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  constraint wonder_mission_assets_object_path_format check (
    object_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(png|jpg|gif|webp)$'
    and split_part(object_path, '/', 1) = mission_id::text
  )
);

create index wonder_missions_status_updated_at_idx
  on public.wonder_missions(status, updated_at desc);
create index wonder_mission_assets_mission_id_idx
  on public.wonder_mission_assets(mission_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger admin_user_roles_set_updated_at
before update on public.admin_user_roles
for each row execute function public.set_updated_at();

create trigger wonder_missions_set_updated_at
before update on public.wonder_missions
for each row execute function public.set_updated_at();

create or replace function public.is_wonderpin_admin(
  allowed_roles public.wonderpin_admin_role[] default array[
    'content_manager'::public.wonderpin_admin_role,
    'super_admin'::public.wonderpin_admin_role
  ]
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.admin_user_roles
    where user_id = (select auth.uid())
      and role = any(allowed_roles)
  );
$$;

revoke all on function public.is_wonderpin_admin(public.wonderpin_admin_role[]) from public;
grant execute on function public.is_wonderpin_admin(public.wonderpin_admin_role[]) to anon, authenticated;

alter table public.admin_user_roles enable row level security;
alter table public.wonder_missions enable row level security;
alter table public.wonder_mission_assets enable row level security;

create policy "users read their own admin role"
on public.admin_user_roles
for select
to authenticated
using (
  user_id = (select auth.uid())
  or public.is_wonderpin_admin(array['super_admin'::public.wonderpin_admin_role])
);

create policy "super admins insert admin roles"
on public.admin_user_roles
for insert
to authenticated
with check (public.is_wonderpin_admin(array['super_admin'::public.wonderpin_admin_role]));

create policy "super admins update admin roles"
on public.admin_user_roles
for update
to authenticated
using (public.is_wonderpin_admin(array['super_admin'::public.wonderpin_admin_role]))
with check (public.is_wonderpin_admin(array['super_admin'::public.wonderpin_admin_role]));

create policy "super admins delete admin roles"
on public.admin_user_roles
for delete
to authenticated
using (public.is_wonderpin_admin(array['super_admin'::public.wonderpin_admin_role]));

create policy "published missions are public and admins read all"
on public.wonder_missions
for select
to anon, authenticated
using (
  status = 'published'
  or public.is_wonderpin_admin()
);

create policy "admins insert missions"
on public.wonder_missions
for insert
to authenticated
with check (
  public.is_wonderpin_admin()
  and created_by = (select auth.uid())
  and updated_by = (select auth.uid())
);

create policy "admins update missions"
on public.wonder_missions
for update
to authenticated
using (public.is_wonderpin_admin())
with check (
  public.is_wonderpin_admin()
  and updated_by = (select auth.uid())
);

create policy "admins delete missions"
on public.wonder_missions
for delete
to authenticated
using (public.is_wonderpin_admin());

create policy "published mission assets are public and admins read all"
on public.wonder_mission_assets
for select
to anon, authenticated
using (
  public.is_wonderpin_admin()
  or exists (
    select 1
    from public.wonder_missions
    where wonder_missions.id = wonder_mission_assets.mission_id
      and wonder_missions.status = 'published'
  )
);

create policy "admins insert mission assets"
on public.wonder_mission_assets
for insert
to authenticated
with check (
  public.is_wonderpin_admin()
  and created_by = (select auth.uid())
);

create policy "admins update mission assets"
on public.wonder_mission_assets
for update
to authenticated
using (public.is_wonderpin_admin())
with check (public.is_wonderpin_admin());

create policy "admins delete mission assets"
on public.wonder_mission_assets
for delete
to authenticated
using (public.is_wonderpin_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wonder-mission-media',
  'wonder-mission-media',
  false,
  5000000,
  array['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "published mission media is readable and admins read all"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'wonder-mission-media'
  and (
    public.is_wonderpin_admin()
    or exists (
      select 1
      from public.wonder_mission_assets asset
      join public.wonder_missions mission on mission.id = asset.mission_id
      where asset.object_path = storage.objects.name
        and mission.status = 'published'
    )
  )
);

create policy "admins upload mission media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'wonder-mission-media'
  and public.is_wonderpin_admin()
  and exists (
    select 1
    from public.wonder_missions
    where id::text = (storage.foldername(name))[1]
  )
);

create policy "admins update mission media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'wonder-mission-media'
  and public.is_wonderpin_admin()
)
with check (
  bucket_id = 'wonder-mission-media'
  and public.is_wonderpin_admin()
);

create policy "admins delete mission media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'wonder-mission-media'
  and public.is_wonderpin_admin()
);
