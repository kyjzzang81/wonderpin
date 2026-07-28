# WP-016 원더미션 공개 웹과 관리자 UI 기반

- 상태: review
- 담당: app-developer
- 우선순위: P1
- 목표일: 2026-07-18
- 연관 목표 또는 Gate: `1분 원더미션` 실행 반응 검증

## 목적

가족용 원더미션 목록·상세와 관리자 편집 UI를 Next.js로 구현한다. 운영 CRUD 완료는 Supabase 연동 업무 `WP-017`에서 판정하며 JSON·로컬 파일 저장을 임시 제품 경로로 사용하지 않는다.

## 산출물

- 루트 `package.json`, `package-lock.json`: npm workspaces와 통합 검증 명령
- `apps/web`: Next.js App Router 기반 모바일·태블릿 반응형 목록·상세, BI header, Instagram footer 버튼
- `apps/admin/app/missions`: React 기반 원더미션 CRUD와 이미지 업로드 가능한 최소 서식 편집기
- `packages/database/src/wonder-missions.ts`: 공유 TypeScript 계약과 초기 검증 코드. 파일 저장 구현은 승인된 최종·임시 저장소가 아니며 WP-017에서 제거 대상
- `packages/ui`, `packages/config`: 브랜드 토큰·공통 컴포넌트와 TypeScript 설정
- 공통 데이터 계약 테스트와 두 앱 production build

## 완료 조건

- [ ] 공개 목록과 상세가 Supabase의 같은 원더미션 데이터를 읽는다. (`WP-017`)
- [x] 모바일 1열, 태블릿 2열, 데스크톱 3열 레이아웃이 CSS breakpoint로 정의돼 있다.
- [x] header에는 현행 BI만, footer에는 Instagram 아이콘 버튼 하나만 있다.
- [ ] 관리자가 Supabase에서 원더미션명·권장연령·썸네일·서식 내용을 CRUD할 수 있다. (`WP-017`)
- [ ] 썸네일과 본문 이미지를 Supabase Storage에 업로드하고 object path를 저장한다. (`WP-017`)
- [x] 허용 목록 밖 HTML과 이벤트 속성을 서버에서 제거한다.
- [x] 기존 관리자 프로그램 검수 화면·API·재수집 동작을 Next.js 경로에서 유지한다.
- [x] 관련 lint, typecheck, test와 두 앱 production build가 통과한다.

## 프레임워크·에디터 판단

- 공개 콘텐츠의 서버 렌더링, 관리자 Route Handler, React·TypeScript 공유와 향후 Supabase 인증·스토리지 확장을 한 체계에서 제공하기 위해 Next.js App Router를 선택했다.
- 공개 웹과 관리자는 배포·권한 경계가 달라 별도 workspace 앱으로 유지하고, DB 계약·UI·설정만 `packages/`에서 공유한다.
- 현 요구가 제목·본문·굵게·목록·이미지에 한정돼 제3자 WYSIWYG 라이브러리를 추가하지 않았다. React `contentEditable`과 브라우저 편집 명령을 사용해 별도 라이선스 의존은 없다. 고급 블록, 협업, 복합 접근성이 필요해지면 Tiptap/Lexical을 다시 비교한다.

## 검증 결과

- `npm run lint`: 통과
- `npm run typecheck`: 통과
- `npm test`: 공통 저장소·HTML 정제·이미지 검증 3/3 통과
- `npm run build`: `@wonderpin/admin`, `@wonderpin/web` Next.js 16.2.10 production build 통과
- `npm audit --json`: moderate 2건. Next.js 16.2.10의 고정 간접 의존성 `postcss@8.4.31`에 대한 `GHSA-qx2v-qp2m-jg93`이며 high/critical은 없다. `npm audit fix --force`가 Next.js 9.3.3으로의 부적절한 major downgrade를 제안해 실행하지 않았다.
- 기존 순수 Node `server.mjs`, 정적 HTML·JS·CSS와 그 실행 경로는 제거하고 Next.js workspace 명령만 남겼다.
- Next.js 개발 서버에서 공개 웹 390px, 관리자 768px 화면을 브라우저로 검수했다. 두 화면 모두 가로 overflow가 없었고, BI·빈 목록·서식 편집기와 기존 프로그램 검수 화면 렌더링을 확인했다.

### 2026-07-28 가족용 웹 시각 리디자인

- WhaleSpace의 다중 radial gradient, 큰 타이포 위계, 넓은 라운드 카드, 반투명 깊이감과 부유 그래픽 원리를 참고하되 자산·레이아웃을 복제하지 않고 Wonder Blue 중심의 자연·발견·탐험 정서로 재해석했다.
- 홈은 Blue 기반 탐험 히어로, CSS 해·잎·궤도 오브젝트, 반투명 미션 카드와 모바일 1열·태블릿 2열·데스크톱 3열 목록으로 구성했다.
- 상세는 미션명·권장연령을 먼저 읽는 Blue 히어로와 최대 820px의 흰 콘텐츠 패널로 분리하고, 본문·목록·인용문·이미지 서식을 가독성 중심으로 조정했다.
- Supabase 목록·상세 조회, Storage asset proxy, HTML 정제와 기존 경로는 변경하지 않았다. 로컬에서 실제 공개 레코드의 목록·상세와 Storage 이미지를 확인했다.
- `npm run lint --workspace @wonderpin/web`: 통과
- `npm run typecheck --workspace @wonderpin/web`: 통과
- `npm test --workspaces --if-present`: `@wonderpin/database` 3/3 통과
- `npm run build --workspace @wonderpin/web`: Next.js 16.2.11 production build 통과
- 저장소 통합 `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`: 모두 통과. `@wonderpin/admin`, `@wonderpin/web` production build를 함께 확인했다.
- 브라우저 검수: 390px 홈·상세 1열, 768px 2열, 1280px 3열을 확인했고 각 너비에서 가로 overflow가 없었다.

### 2026-07-28 래스터 그래픽 적용

- CSS 도형으로 만들었던 홈·상세 장식을 원더핀 색상의 투명 배경 3D 클레이 PNG 2종으로 교체했다.
- 원본 자산은 `assets/web-graphics/wonder-mission/`에서 관리하고, 공개 웹은 파일명 허용 목록이 있는 읽기 전용 Route Handler로 제공한다.

## 남은 위험과 승인 항목

- 공식 원더핀 Instagram URL이 저장소에 없어 추정하지 않았다. `WONDERPIN_INSTAGRAM_URL` 미설정 시 아이콘은 `aria-disabled` 상태다.
- 관리자에는 로그인·역할 권한이 없다. 서버는 `127.0.0.1`에만 바인딩하며 프로덕션 공개 금지 경고를 화면과 README에 표시했다.
- Supabase 프로젝트·환경변수·스키마·Storage·Auth·RLS가 아직 연결되지 않아 원더미션 조회·CRUD는 미완료다.
- 현재 파일 저장 구현은 화면 검증 중 생성된 코드이며 승인된 임시 저장소가 아니다. WP-017에서 제거한다.
- 현 최소 편집기는 브라우저의 deprecated `execCommand`에 의존한다. 서식 요구가 확대되기 전에 접근성·붙여넣기 정제·브라우저 호환성 기준으로 에디터 교체 여부를 재평가한다.
- Next.js가 간접 고정한 `postcss@8.4.31`의 moderate advisory는 upstream 업데이트를 추적하고, 호환되는 패치가 제공되면 lockfile을 갱신한다.
- 리디자인 검수에는 현재 공개된 E2E 레코드 1건을 사용했다. 실제 운영 콘텐츠 공개 전 긴 미션명, 다수 카드, 세로형 카드뉴스 조합을 추가 확인해야 한다.
- 프로덕션 배포와 운영 DB 변경은 하지 않았다.
