# 공유 데이터베이스 패키지

세 웹앱이 함께 사용하는 DB 타입, 데이터 계약과 검증 코드를 둔다.

## 원더미션 저장소 목표

원더미션의 단일 영속 저장소는 Supabase다. 메타데이터와 정제된 WYSIWYG HTML은 Database, 썸네일과 본문 이미지는 Storage에 저장한다. `packages/database`는 Supabase 생성 타입, 쿼리 계약, 필드 검증과 HTML 정제를 제공하고 앱이 공급자 SDK를 직접 흩어 쓰지 않게 한다.

`src/wonder-missions.ts`는 Supabase query, 필드·상태 검증, HTML 정제, 이미지 signature·크기 검증을 제공한다. JSON과 로컬 업로드 구현은 제거했다. 운영 완료 판정에는 migration·RLS와 실제 관리자 계정의 권한별 E2E 검증이 추가로 필요하다.
