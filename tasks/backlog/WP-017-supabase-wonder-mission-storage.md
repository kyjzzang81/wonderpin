# WP-017 Supabase 원더미션 저장소·관리자 권한 연동

- 상태: backlog
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
- 프로젝트 URL과 publishable/secret key 환경변수 설정
- 원격 Database migration, Storage bucket과 RLS 적용
- 관리자 계정 생성과 역할 부여

## 현재 상태

설계만 확정했다. Supabase 설정과 실제 연동은 아직 시작하지 않았다.
