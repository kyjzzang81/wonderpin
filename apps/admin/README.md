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

원더미션 메타데이터와 WYSIWYG HTML은 Supabase `wonder_missions` 테이블, 썸네일과 본문 이미지는 Supabase Storage에 저장한다. 프로젝트·환경변수·스키마·bucket·관리자 Auth·RLS는 `WP-017`에서 연결한다. JSON 파일이나 로컬 업로드 디렉터리를 임시 CRUD 저장소로 사용하지 않는다. 연동 전에는 로그인과 역할 권한도 없으므로 외부에 공개하면 안 된다.

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

서식 편집기는 제3자 WYSIWYG 패키지 없이 React `contentEditable` 컴포넌트로 구현했다. 현재 필요한 제목·본문·굵게·목록·이미지만 제공해 번들 및 라이선스 의존을 늘리지 않았다. 브라우저의 `execCommand`를 사용하는 최소 전환 구현이므로 복합 서식, 협업 편집 또는 접근성 요구가 커지면 별도 에디터를 다시 평가한다.
