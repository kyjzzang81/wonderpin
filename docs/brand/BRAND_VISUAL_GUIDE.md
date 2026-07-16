# 원더핀 비주얼 브랜드 가이드

이 문서는 원더핀 로고와 핵심 컬러를 일관되게 사용하기 위한 최소 기준이다. 기준 BI와 실사용 로고 파일은 `assets/brand/`에서 관리한다.

## 1. 브랜드 컬러

| 역할 | 이름 | HEX | RGB | 권장 용도 |
| --- | --- | --- | --- | --- |
| Primary | Wonder Blue | `#0167D3` | `1, 103, 211` | 로고의 `wonder`, 주요 제목, 핵심 버튼, 링크와 브랜드를 대표하는 면 |
| Secondary | Wonder Yellow | `#F3B806` | `243, 184, 6` | 로고의 별과 `p`, 발견·축하·진행을 나타내는 작은 강조 요소 |
| Third | Wonder Red | `#EC2127` | `236, 33, 39` | 로고의 `in`, 중요한 배지·짧은 강조 요소. 오류 상태에는 별도의 상태 색을 우선 사용 |
| Background | White | `#FFFFFF` | `255, 255, 255` | 기본 화면·문서 배경 |

### 사용 원칙

- Wonder Blue를 기본 브랜드 인지 색상으로 사용한다. 넓은 브랜드 면과 핵심 버튼은 Blue를 우선한다.
- Wonder Yellow와 Wonder Red는 로고처럼 작은 포인트와 짧은 강조에 사용한다. 넓은 면이나 긴 본문에는 사용하지 않는다.
- 세 색을 함께 사용할 때는 Blue를 주색으로 두고, Yellow와 Red는 발견감과 리듬을 더하는 보조색으로 제한한다.
- 흰색 배경을 기본으로 하며, 본문 텍스트는 가독성을 위해 별도의 짙은 중립색을 사용한다.
- White 위에서 Yellow는 작은 글자·핵심 조작 요소의 전경색으로 사용하지 않는다. Red 역시 작은 흰색 글자와 조합하기 전 실제 명도 대비를 확인한다.

### 디자인 토큰 예시

```css
:root {
  --color-primary: #0167d3;
  --color-secondary: #f3b806;
  --color-third: #ec2127;
  --color-background: #ffffff;
}
```

## 2. 로고 파일

| 파일 | 용도 |
| --- | --- |
| `assets/brand/wonderpin-bi.png` | 2026-07-16 기준 BI 원본. 색상·로고 표현의 최우선 참조 |
| `assets/brand/wonderpin-logo-ko.png` | 이전 Purple 기반 한글 로고. 신규 대외 산출물에는 사용하지 않음 |
| `assets/brand/wonderpin-logo-ko@4x.png` | 이전 Purple 기반 한글 로고. 신규 대외 산출물에는 사용하지 않음 |
| `assets/brand/wonderpin-logo-en.png` | 이전 Purple 기반 영문 로고. 신규 대외 산출물에는 사용하지 않음 |
| `assets/brand/wonderpin-logo-en@4x.png` | 이전 Purple 기반 영문 로고. 신규 대외 산출물에는 사용하지 않음 |
| `assets/brand/wonderpin-brand-board.png` | 이전 브랜드 보드. 기록용으로만 보관 |

### 로고 사용 원칙

- 로고의 비율, 글자 간격, 색상과 별 모양을 임의로 바꾸지 않는다.
- 로고 주변에는 최소한 별 모양 한 개 높이 정도의 여백을 확보한다.
- 복잡하거나 브랜드 컬러와 비슷한 배경 위에는 직접 올리지 않는다. 흰색 또는 충분히 밝고 단순한 배경을 사용한다.
- 현재 BI는 흰 배경이 포함된 래스터 참조본이다. 신규 화면·문서에 쓰는 투명 PNG와 벡터 원본(`SVG`, `AI`)은 별도 제작 또는 확보 후 `assets/brand/`에 추가한다.

## 3. 브랜드 인상

> 호기심을 따라 발견하고 질문하는, 선명하고 즐거운 브랜드

시각 표현은 밝고 친근하게 구성하되, 흰 바탕 위 Blue를 중심으로 Yellow와 Red가 발견의 순간을 만드는 구성을 유지한다.
