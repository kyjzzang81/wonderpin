# Claude–Canva 디자인 전달 공간

이 폴더는 원더핀 콘텐츠를 Claude에서 Canva 디자인으로 제작할 때 제공하는 유일한 읽기 범위다. 저장소의 원본 업무 문서가 아니라 검토된 디자인 입력의 스냅샷이다.

## Claude 작업 규칙

1. `brand/BRAND_SUMMARY.md`와 캠페인의 `BRIEF.md`, `COPY.md`, `CONTENT_PLAN.md`만 근거로 디자인한다.
2. 확정 문구를 임의로 고치지 않는다. 개선이 필요하면 결과물과 분리해 `CHANGE_REQUESTS.md`에 제안한다.
3. 확인되지 않은 교육 효과, 국내 최초·유일, 구현되지 않은 플랫폼·예약·AR 기능을 표현하지 않는다.
4. 외부 이미지·문구를 새로 가져오거나 사용하지 않는다. 캠페인의 `assets/`에 포함된 사용 승인 자산만 사용한다.
5. 아동·가족 개인정보를 추가하거나 추론하지 않는다.
6. Canva 편집 링크, 내보낸 파일과 작업 메모는 캠페인의 `output/`에 기록한다.
7. 디자인 완료는 게시 승인이 아니다. 외부 공개는 사용자의 별도 승인이 필요하다.

## 캠페인 시작 방법

`templates/campaign/`을 `campaigns/YYYY-MM-campaign-name/`으로 복사하고 모든 대괄호 항목을 채운다. `HANDOFF_STATUS.md`가 `approved_for_design`일 때만 디자인 작업을 시작한다.

## 상태

- `draft`: 작성 중
- `review`: 문구·사실·자산 검토 중
- `approved_for_design`: 디자인 작업 가능
- `design_review`: 디자인 검토 중
- `approved_for_publish`: 사용자 게시 승인 완료
- `published`: 실제 게시 완료

## 현재 전달된 콘텐츠

- `campaigns/00-shared-card-template/`: 공통 디자인 시스템 요구사항과 참고 시안
- `campaigns/01-launch-pinned-post/`: 런칭 고정 게시물 5장
- `campaigns/02-one-minute-same-color/`: 같은 색 세 가지 찾기 3장
- `campaigns/03-research-inquiry-not-right-answer/`: 연구 기반 보호자 콘텐츠 7장
- `campaigns/04-weekly-wonderpin-template/`: 이주의 원더핀 7장 공통 틀
- `campaigns/EDITORIAL_BACKLOG.md`: 아직 카피가 완성되지 않은 후속 소재

모두 현재 `review` 상태다. 사용자 검토 항목은 루트의 `REVIEW_REQUIRED.md`에서 확인한다.
