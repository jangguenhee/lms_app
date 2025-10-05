# Instructions (Ruler Entry)

본 프로젝트는 Layered Architecture (Presentation → Application → Domain → Infrastructure)를 따른다.
모든 규칙은 한국어 기준으로 해석/출력한다.

## 아키텍처
- ✅ 의존성 방향: 바깥 → 안쪽 (Infrastructure → Domain, 역참조 금지)
- ✅ Use Case 중심 (Application에서 워크플로우 조율)
- ❌ Domain에서는 외부 프레임워크/라이브러리 금지 (예외: date-fns, ts-pattern)

## 코드 규칙
- ✅ 모든 Repository/Service는 Interface 기반(DIP)
- ✅ TypeScript strict, 모든 함수 `return type` 명시
- ❌ `any` 금지 (`unknown` 허용)
- ✅ 네이밍: Entity(PascalCase), VO(`*.vo.ts`), UseCase(`*.use-case.ts`), Interface(`I*`)

## Presentation
- ✅ Application(Use Case)와 Shared utils만 의존
- ❌ Infrastructure 직접 접근 금지 (DI 통해서만)
- ✅ Server Component 기본, `'use client'`는 필요시만
- ✅ `page.tsx`의 `params`는 Promise 사용

## Domain
- ✅ 순수 비즈니스 로직만 포함
- ❌ Next.js/React/Hono/Supabase 의존 금지

## Infrastructure
- ✅ 외부 연동(Supabase 등), Mapper로 DB↔Domain 변환
- ✅ 모든 테이블 RLS 활성화, 마이그레이션은 `supabase/migrations/`에서만

## 테스트/품질
- ✅ Domain/Application 단위 테스트, Use Case 통합 테스트
- ✅ `neverthrow`의 Result 타입 사용 및 `match` 분기

## 패키지/도구
- ✅ npm 사용 및 `package-lock.json` 커밋
- ✅ shadcn 컴포넌트는 `npx shadcn@latest add <name>`

## 포함 문서
- 본 파일은 진입점이며, 세부 규칙은 `ruler.toml`의 include로 읽는다:
  - `AGENTS.md` (기본 가이드)
  - `auth.md` (인증/온보딩)
  - `database.md` (DB/RLS)
  - `ui-ux.md` (UI/접근성)