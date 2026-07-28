# 원더핀 프로그램 검수 도구

아이고고·째깍악어 수집 데이터 검수 화면과 원더미션 관리 UI를 담은 Next.js App Router 기반 내부 도구다. 원더미션 운영 CRUD는 Supabase Database·Storage·Auth·RLS 연동 이후 사용할 수 있으며 현재 UI만으로는 운영 가능 상태가 아니다.

## 실행

```bash
npm install
npm run dev:admin
```

브라우저에서 [http://127.0.0.1:4315](http://127.0.0.1:4315)을 연다. 원더미션 관리는 `/missions`에서 제공한다. production build는 루트에서 `npm run build --workspace @wonderpin/admin`으로 검증한다.

## 제공 기능

- 원더미션명·권장연령·카드뉴스형 내용 등록·조회·수정·삭제
- 서식 편집과 PNG·JPEG·GIF·WebP 이미지 업로드(파일당 최대 5MB)
- 프로그램 검색과 출처·카테고리·판정 상태 필터
- 원본 링크, 수집 이미지, 프로그램 요약·OCR·분류 근거 확인
- accept·decline 판정과 메모 저장
- decline 프로그램의 snapshot 보존과 다음 수집 제외
- 버튼으로 전체 수집 실행, 소스별 진행 상태와 로그 확인

`새로 수집`은 아이고고 104페이지와 째깍악어 공개 지점을 다시 확인하고, 째깍악어 이미지 최대 500장을 프로그램당 1장씩 내려받아 OCR한다. 실행 시간과 이미지 사용량이 있으므로 중복 실행은 차단한다.

판정은 `research/platform-content/review-decisions.json`에 저장한다. 동일한 `source_key` 또는 제목·운영자·장소 fingerprint가 decline 상태이면 `scripts/collect-platform-programs.mjs`의 다음 실행 결과에서 제외한다.

원더미션 메타데이터와 WYSIWYG HTML은 Supabase `wonder_missions` 테이블, 썸네일과 본문 이미지는 private Storage에 저장한다. `/missions`와 관련 API는 Supabase Auth 사용자와 `content_manager`/`super_admin` 역할을 서버에서 확인하고 RLS가 같은 권한을 다시 강제한다. `apps/admin/.env.example`을 참고해 공개 URL·publishable key만 `.env.local`에 설정한다. 최초 `super_admin` bootstrap과 원격 migration은 `docs/product/TECHNICAL_ARCHITECTURE.md` 절차를 따르며 사용자 승인 전에 실행하지 않는다.

## 제한

- 프로덕션 배포와 외부 공개 금지
- 운영 DB·실제 고객 데이터와 연결하지 않음
- 수집 이미지와 OCR은 내부 검수용이며 재게시 권리를 뜻하지 않음

## 검증

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

서식 편집기는 Tiptap 기반 WYSIWYG로 구현한다. 제목·본문·굵게·목록·문단 정렬·실행 취소·다시 실행과 Supabase Storage 본문 이미지 삽입을 제공하며, 저장 전 서버의 HTML 허용 목록 정제를 거친다. 신규 미션에서 이미지를 선택하면 비공개 초안을 자동 생성하므로 별도의 선행 저장은 필요하지 않다.
