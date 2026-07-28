# WP-017 Supabase 원더미션 저장소·관리자 권한 연동

- 상태: review
- 담당: app-developer
- 우선순위: P1
- 목표일: 미정
- 연관 업무: WP-016 원더미션 공개 웹과 관리자 UI 기반

## 목적

원더미션 공개 조회와 관리자 CRUD의 유일한 영속 저장소를 Supabase Database·Storage로 구현한다. JSON 파일과 로컬 업로드 디렉터리는 임시 저장소로 사용하지 않는다.

## 범위

- Supabase 프로젝트 연결과 로컬·배포 환경변수 계약
- `wonder_missions` 테이블과 생성 타입
- 필드: `id`, `title`, `recommended_age`, `thumbnail_path`, `content`, `status`, `created_at`, `updated_at`
- 썸네일·본문 이미지용 Storage bucket과 object path 규칙
- 공개된 미션의 가족용 익명 읽기 정책
- `content_manager`, `super_admin` 관리자 Auth와 CRUD RLS
- Route Handler·서버 데이터 계층의 인증·권한 재검증
- 기존 JSON·로컬 업로드 구현 제거
- HTML 정제, 파일 형식·크기 검증, 삭제 시 Storage 정리 정책

## 완료 조건

- 공개 웹이 Supabase의 공개 상태 원더미션만 목록·상세로 읽는다.
- 권한이 있는 관리자만 원더미션과 이미지를 생성·수정·삭제한다.
- UI 숨김이 아니라 서버와 RLS에서 권한이 강제된다.
- JSON 파일과 로컬 업로드 경로가 실행 코드에서 제거된다.
- 썸네일과 본문 이미지 object path가 DB에 저장되고 화면에서 정상 표시된다.
- lint, typecheck, test, 두 앱 build와 권한별 통합 검증이 통과한다.

## 사용자 승인 필요

- Supabase 프로젝트 생성 또는 기존 프로젝트 선택
- 프로젝트 URL과 publishable key 환경변수 설정
- 원격 Database migration, Storage bucket과 RLS 적용
- 관리자 계정 생성과 역할 부여

## 현재 상태

2026-07-28 기준 로컬 구현·검증과 승인된 원격 migration 적용을 완료했다.

- `supabase/migrations/20260727131140_create_wonder_missions.sql`에 원더미션, 관리자 역할, 이미지 자산, private Storage bucket과 RLS를 정의했다.
- `packages/database`를 Supabase 타입·쿼리·검증 계층으로 전환하고 JSON·로컬 파일 저장 코드를 제거했다.
- `packages/auth`에 `@supabase/ssr` cookie 기반 browser/server client와 관리자 역할 guard를 구현했다.
- 가족용 웹은 `published` 미션만 명시적으로 조회하고, RLS가 같은 조건을 다시 강제한다.
- 관리자 `/missions`와 미션·이미지 API는 로그인과 `content_manager`/`super_admin` 역할을 서버에서 재검증한다.
- 이미지 MIME·signature·5MB 검증, private Storage 업로드와 미션 삭제 시 object 정리를 구현했다.
- 관리자 UI에 로그인, 공개 상태, 썸네일 업로드와 로그아웃을 추가했다.
- 환경변수 계약은 두 앱의 `.env.example`에만 기록했고 secret/service-role key는 사용하지 않았다.

## 검증 결과

- `npm run lint`: 통과
- `npm run typecheck`: 통과
- `npm test`: 3/3 통과
- `npm run build`: 관리자 로그인 페이지의 Suspense 요구로 최초 실패했으나 수정 후 Next.js `16.2.11`에서 관리자·가족용 웹 모두 통과
- `npm audit`: high 8건, critical 0건. 프로덕션 그래프에는 Next.js가 고정한 `postcss@8.4.31`, optional `sharp@0.34.5` 관련 high 3건이 남고 나머지는 lint 개발 도구 그래프다.
- `supabase db reset`: 통과. 빈 로컬 DB에 migration과 seed가 재현 가능하게 적용됐다.
- `supabase test db`: 역할별 RLS 테스트 8/8 통과
- 원격 migration과 Storage/RLS 적용: `20260727131140` 적용 완료, local/remote 버전 일치 및 원격 schema lint 통과

## 남은 완료 조건과 위험

- 첫 `super_admin` 역할을 bootstrap해야 한다.
- 실제 관리자 계정으로 초안 작성 → 이미지 업로드 → 공개 → 가족용 목록·상세 조회 → 삭제 흐름을 검증해야 한다.
- 첫 관리자 역할은 기존 super admin이 없으므로 Dashboard SQL Editor 또는 별도 승인된 관리 경로에서 한 번 bootstrap해야 한다.
- Next.js 호환 범위에서 postcss·sharp 보안 패치가 포함된 릴리스를 추적해야 한다.
