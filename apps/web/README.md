# 원더핀 원더미션 웹

가족이 Supabase의 `published` 원더미션 목록과 카드뉴스형 내용을 보는 Next.js App Router 기반 반응형 웹이다. 쿼리와 Database·Storage RLS에서 공개 상태를 함께 강제한다.

## 실행

```bash
npm install
npm run dev:web
```

[http://127.0.0.1:4314](http://127.0.0.1:4314)에서 확인한다. 공식 계정 URL이 확정되면 `WONDERPIN_INSTAGRAM_URL=https://www.instagram.com/.../`를 설정한다. 미설정 상태에서는 footer 아이콘은 보이지만 링크가 비활성화된다.

production build는 루트에서 `npm run build --workspace @wonderpin/web`, 로컬 production 실행은 `npm run start --workspace @wonderpin/web`으로 확인한다.

`apps/web/.env.example`의 Supabase URL과 publishable key를 `.env.local`에 설정한다. private Storage 이미지는 공개 미션에 연결된 자산만 RLS를 통과해 서버 asset route로 전달된다. 승인된 원격 migration과 권한별 E2E가 끝나기 전에는 운영 배포하지 않는다.
