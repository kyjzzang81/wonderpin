begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users (id, email)
values
  ('10000000-0000-4000-8000-000000000001', 'manager@example.test'),
  ('10000000-0000-4000-8000-000000000002', 'family@example.test');

insert into public.admin_user_roles (user_id, role)
values ('10000000-0000-4000-8000-000000000001', 'content_manager');

insert into public.wonder_missions (
  id, title, recommended_age, content, status, created_by, updated_by
)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '공개 미션',
    '만 5~7세',
    '<p>공개 내용</p>',
    'published',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001'
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '초안 미션',
    '만 5~7세',
    '<p>초안 내용</p>',
    'draft',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001'
  );

set local role anon;
select extensions.is(
  (select count(*) from public.wonder_missions),
  1::bigint,
  'anonymous users only read published missions'
);
select extensions.throws_ok(
  $$delete from public.wonder_missions where id = '20000000-0000-4000-8000-000000000001'$$,
  '42501',
  null,
  'anonymous users cannot delete missions'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select extensions.is(
  (select count(*) from public.wonder_missions),
  1::bigint,
  'authenticated users without an admin role only read published missions'
);
select extensions.throws_ok(
  $$update public.wonder_missions set title = '변조' where id = '20000000-0000-4000-8000-000000000001'$$,
  '42501',
  null,
  'authenticated users without an admin role cannot update missions'
);

reset role;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select extensions.is(
  (select count(*) from public.wonder_missions),
  2::bigint,
  'content managers read every mission status'
);
select extensions.lives_ok(
  $$update public.wonder_missions
    set title = '수정한 초안',
        updated_by = '10000000-0000-4000-8000-000000000001'
    where id = '20000000-0000-4000-8000-000000000002'$$,
  'content managers can update missions'
);

select * from finish();
rollback;
