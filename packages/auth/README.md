# 공유 인증·권한 패키지

가족, 운영자와 내부 관리자 역할의 서버 권한 검사와 라우트 보호 코드를 둔다.

원더미션 관리에는 `@supabase/ssr` cookie 기반 browser/server client를 사용한다. 서버 `requireAdmin`은 Supabase Auth의 현재 사용자와 `admin_user_roles`를 조회해 `content_manager` 또는 `super_admin`만 허용한다. service-role key는 사용하지 않으며 실제 데이터 권한은 Database와 Storage RLS가 다시 강제한다.
