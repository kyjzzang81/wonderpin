# 원더핀 기술 구조

> **현재 상태(2026-07-27): 원더미션 Supabase 연동 코드·migration 검토 단계.** `apps/web`과 `apps/admin`은 Supabase Database·Storage·Auth·RLS를 사용하도록 전환했고 JSON·로컬 업로드 실행 경로는 제거했다. Local DB reset과 RLS test 8건은 통과했지만 승인된 원격 migration·계정 E2E는 아직 완료되지 않았으므로 운영 CRUD로 간주하거나 배포하지 않는다.

## 1. 제품 구성

원더핀은 하나의 저장소에서 세 개의 반응형 웹앱을 개발한다.

| 앱 | 위치 | 대상 | 주요 기능 | 권장 도메인 |
| --- | --- | --- | --- | --- |
| 원더핀 | `apps/web` | 가족 | 장소·프로그램 탐색, 예약·결제, 내 예약, 원더팩 | `wonderpin.kr` |
| 원더핀 파트너 | `apps/partner` | 운영자 | 프로그램·회차, 정원, 예약자, 안내, 후기 | `partner.wonderpin.kr` |
| 원더핀 관리자 | `apps/admin` | 내부 운영팀 | 운영자 승인, 장소·프로그램 검수, 예약·환불, 원더팩, CS, 지표 | `admin.wonderpin.kr` |

세 앱은 별도 제품 화면을 제공하지만 동일한 사용자, 장소, 프로그램, 회차, 예약, 결제, 원더팩 데이터를 사용한다.

## 2. 권장 기술 기반

- 모노레포: npm workspaces 또는 pnpm workspaces와 Turborepo
- 프론트엔드·서버: Next.js, TypeScript
- 데이터베이스·인증·스토리지: Supabase
- 배포: Vercel의 앱별 프로젝트
- 결제: 국내 결제 제공자 검토 후 결정
- 이메일·문자·알림: MVP 운영 정책과 개인정보 검토 후 결정

현재 패키지 관리자는 npm workspaces, 프론트엔드·서버는 Next.js App Router와 TypeScript로 확정했다. Supabase schema, private Storage bucket, Auth와 RLS 정책의 local migration은 `WP-017`에 구현되어 있다. 승인된 원격 적용과 권한별 E2E 전 관리자 CRUD는 운영 가능 상태로 간주하지 않는다.

### 원더미션 저장 원칙

- 메타데이터와 WYSIWYG HTML: Supabase `wonder_missions` 테이블
- 썸네일과 본문 이미지: Supabase Storage
- DB에는 Storage object path와 필요한 공개·서명 URL 파생 정보만 저장한다.
- 관리자 쓰기는 Supabase Auth 사용자 중 `content_manager` 또는 `super_admin` 역할만 허용한다.
- 브라우저 화면 숨김이 아니라 Route Handler·서버 데이터 계층과 RLS에서 권한을 검증한다.
- JSON 파일, repository 파일과 로컬 업로드 디렉터리는 운영·임시 CRUD 저장소로 사용하지 않는다.

### Supabase 환경과 최초 관리자 설정

두 Next.js 앱은 다음 공개 환경변수만 사용한다. secret/service-role key로 관리자 CRUD를 우회하지 않는다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

로컬에서는 Docker를 실행한 뒤 아래 순서로 migration과 RLS test를 확인한다.

```bash
supabase start
supabase db reset
supabase test db
```

첫 관리자 역할은 아직 `super_admin`이 없어 애플리케이션 RLS로 생성할 수 없다. Auth 사용자를 먼저 만든 다음, 사용자 승인 하에 Supabase Dashboard SQL Editor에서 한 번 bootstrap한다. 아래 SQL의 이메일은 실제 관리자 계정으로 바꿔야 한다.

```sql
insert into public.admin_user_roles (user_id, role)
select id, 'super_admin'::public.wonderpin_admin_role
from auth.users
where email = 'ADMIN_EMAIL'
on conflict (user_id) do update
set role = excluded.role;
```

이 SQL과 `supabase db push`는 운영 데이터베이스 변경이므로 사용자 승인 전 실행하지 않는다.

## 3. 공유 패키지

- `packages/database`: DB 스키마에서 생성한 타입, 쿼리 계약, 데이터 검증
- `packages/auth`: 로그인 세션, 역할, 권한 확인과 서버 가드
- `packages/ui`: 브랜드 토큰과 공통 컴포넌트
- `packages/config`: TypeScript, lint, test 공통 설정

앱 사이에서 동일 코드를 복사하지 않는다. 다만 가족용과 내부 관리자용 UI가 다른 목적을 가지므로 모든 화면을 억지로 공통 컴포넌트로 만들지는 않는다.

## 4. 핵심 역할

- `family`: 가족용 탐색과 자신의 예약·원더팩 이용
- `partner`: 승인된 운영자 범위의 프로그램과 예약 관리
- `operator`: 운영, 검수와 CS 처리
- `content_manager`: 장소, 큐레이션과 원더팩 관리
- `support`: 문의, 취소와 사고 기록 처리
- `viewer`: 내부 조회 전용
- `super_admin`: 관리자 계정과 전체 설정

역할은 UI 표시 여부가 아니라 서버의 권한 검사와 데이터베이스의 행 수준 보안 정책으로 강제한다. 초기 계정이 한 명이어도 권한 모델은 분리한다.

## 5. 관리자 MVP

관리자 앱의 첫 범위는 다음과 같다.

1. 로그인과 관리자 권한 확인
2. 오늘 처리할 예약·취소·문의 요약
3. 운영자 신청 검토와 승인 상태
4. 장소와 프로그램의 검수·공개 상태
5. 예약·결제·환불 상태 조회와 운영 메모
6. 원더팩 등록, 버전과 장소·프로그램 연결
7. 문의·사고 기록과 처리 이력
8. 핵심 Gate 및 운영 지표 조회

AI 에이전트 자체를 관리자 웹에서 실행하는 기능은 첫 MVP에 포함하지 않는다. Codex 작업 상태는 저장소의 `operations/`와 `tasks/`에서 관리하고, 필요성이 검증된 뒤 관리자 앱의 조회 화면과 동기화 방법을 결정한다.

## 6. 핵심 데이터 경계

최소 핵심 엔터티:

- 사용자, 가족 프로필과 참가 어린이
- 파트너와 파트너 승인 상태
- 관리자 역할과 감사 이력
- 장소와 정보 출처·확인일
- 프로그램과 프로그램 회차
- 정원과 예약 가능 상태
- 예약, 참가자와 상태 이력
- 결제, 취소와 환불 상태
- 안내와 발송 기록
- 후기
- 원더팩, 버전, 장소·프로그램 연결
- 문의와 사고 기록

상태 변경은 가능한 한 이력을 남기고, 관리자 작업은 작업자, 시각, 변경 전후 값과 사유를 감사 기록으로 보존한다.

## 7. 후속 개발 착수 조건과 순서

개발 착수는 `docs/strategy/LAUNCH_GOAL.md`의 카드 수익 검증과 오프라인 아동 창작 Gate 결과로 판단한다. 단지 기술 구현이 가능하거나 AR 선호 응답이 있다는 이유로 착수하지 않는다.

1. 모노레포와 세 앱 셸
2. 공유 DB 모델, 인증과 권한
3. 장소 목록·상세와 관리자 장소 관리
4. 파트너 프로그램·회차 등록과 관리자 검수
5. 가족 예약과 파트너 예약 관리
6. 결제·취소·안내
7. 원더팩 웹 버전과 관리자 연결
8. 후기, CS와 핵심 지표

각 단계는 가족·파트너·관리자 화면을 같은 데이터 흐름으로 연결해 검증한다.
