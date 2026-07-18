# 원더핀 원더미션 웹

가족이 원더미션 목록과 카드뉴스형 내용을 보는 Next.js App Router 기반 반응형 웹이다. 운영 데이터는 Supabase에서 읽도록 연결할 예정이며 현재는 Supabase 연동 전 UI 기반만 준비된 상태다.

## 실행

```bash
npm install
npm run dev:web
```

[http://127.0.0.1:4314](http://127.0.0.1:4314)에서 확인한다. 공식 계정 URL이 확정되면 `WONDERPIN_INSTAGRAM_URL=https://www.instagram.com/.../`를 설정한다. 미설정 상태에서는 footer 아이콘은 보이지만 링크가 비활성화된다.

production build는 루트에서 `npm run build --workspace @wonderpin/web`, 로컬 production 실행은 `npm run start --workspace @wonderpin/web`으로 확인한다.

현재 서버는 화면 검증용이며 운영 CRUD가 아니다. `WP-017`에서 Supabase Database·Storage와 연결한 뒤 공개 조회 경로를 활성화한다. JSON 파일 저장소는 임시 운영 수단으로 사용하지 않는다.
