# 공유 데이터베이스 패키지

세 웹앱이 함께 사용하는 DB 타입, 데이터 계약과 검증 코드를 둔다.

## 원더미션 저장소 목표

원더미션의 단일 영속 저장소는 Supabase다. 메타데이터와 정제된 WYSIWYG HTML은 Database, 썸네일과 본문 이미지는 Storage에 저장한다. `packages/database`는 Supabase 생성 타입, 쿼리 계약, 필드 검증과 HTML 정제를 제공하고 앱이 공급자 SDK를 직접 흩어 쓰지 않게 한다.

현재 `src/wonder-missions.ts`의 파일 저장 구현은 초기 화면 검증 과정에서 생성된 미완료 코드이며 승인된 임시 저장 방식이 아니다. `WP-017`에서 Supabase 저장소로 교체하고 JSON·로컬 업로드 경로를 제거해야 원더미션 CRUD를 완료로 판정한다.
