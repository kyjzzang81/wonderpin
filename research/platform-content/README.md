# 플랫폼 프로그램 수집 데이터

아이고고와 째깍악어의 공개 플랫폼에서 만 4~9세와 연령 범위가 겹치는 프로그램을 수집한다.

## 분류

- `숲`: 숲, 산림, 생태, 수목원, 식물원
- `박물관`: 박물관
- `집`: 플랫폼의 `home`·`delivery` 유형 또는 비대면, 온라인, 집에서, 홈키트, 배송, 가정방문
- `야외`: 공원, 산책, 농장, 목장, 캠핑, 광장, 둘레길, 해변, 갯벌, 여행, 자연, 섬, 탐방
- `문화공간`: 명시된 미술관, 전시관, 과학관, 극장, 도서관, 문화센터 또는 스튜디오에서 진행하는 미술·공예·음악·요리 활동
- `기타`: 위 규칙에 해당하지 않는 프로그램

앞에 있는 규칙을 우선 적용한다. 예를 들어 `서울식물원 숲체험`은 `숲`, `국립중앙박물관 역사수업`은 `박물관`이다.

각 행에는 `classification_reason`, `classification_confidence`, `other_reason`을 함께 기록한다. 일반 교습·실내 스포츠·운영상품·장소 불명 항목은 억지로 공간 카테고리에 넣지 않고 `기타` 하위 사유로 남긴다.

## 실행

```bash
node scripts/collect-platform-programs.mjs --igogo-pages=1
```

이미지 다운로드와 macOS Vision 기반 한국어 OCR을 포함한 표본 실행:

```bash
node scripts/collect-platform-programs.mjs --igogo-pages=1 --download-images --ocr --image-limit=10
```

째깍악어의 이미지 중심 상세 설명을 프로그램당 1장씩 OCR:

```bash
node scripts/collect-platform-programs.mjs --igogo-pages=104 --download-images --ocr --image-limit=112 --images-per-program=1
```

전체 아이고고 목록은 페이지당 20건이다. 먼저 작은 표본의 정확도와 사이트 정책을 검토한 뒤 페이지 수를 늘린다.

```bash
node scripts/collect-platform-programs.mjs --igogo-pages=104
```

2026-07-17 전체 실행 결과는 만 4~9세와 연령 범위가 겹치는 2,018건이다. 아이고고 1,906건과 째깍악어 공개 17개 지점의 112건이다. 분류 결과는 야외 92, 박물관 201, 숲 432, 문화공간 392, 집 528, 기타 373건이다.

째깍악어 112건은 대표 상세 이미지 1장씩 다운로드해 OCR했다. 101건에서 텍스트가 추출됐고 11건은 이미지에 인식 가능한 문자가 없어 빈 결과로 남았다. 오류로 중단된 건은 없다.

## 산출물

- `programs.json`: 전체 구조화 데이터와 카테고리 집계
- `programs.csv`: 검수용 표
- `images/<source>/<source_id>/`: `--download-images` 사용 시 상세 이미지

연락처, 이메일, 후기 작성자와 아동 개인정보는 수집하지 않는다. OCR 결과에서도 전화번호와 이메일 형태를 제거한다. 이미지와 OCR은 내부 분석용이며 원더핀 SNS에 재게시할 수 있는 권리를 의미하지 않는다.

다운로드 이미지는 `.gitignore`로 저장소 커밋에서 제외한다. JSON·CSV에는 원본 이미지 URL, OCR 텍스트와 로컬 상대경로만 남긴다.
