# 002. 로그인 - 구현 계획

## 1. 파일 목록
- Backend
  - `src/presentation/api/routes/auth.routes.ts` (POST `/auth/signin`)
- Frontend
  - `src/presentation/web/app/(auth)/signin/page.tsx` (Signin 페이지)
  - `src/presentation/web/components/features/auth/login-form.tsx` (로그인 폼 컴포넌트)
- Shared
  - `src/shared/types/auth.ts` (인증 DTO/타입: `SignInRequest`, `SignInResponse`, `AuthErrorCode`)

## 2. 구현 순서
1) 로그인 API (Supabase Auth signInWithPassword)
- 입력: `{ email, password, rememberMe? }`
- 처리: `signInWithPassword` → 세션 쿠키 설정 → `profiles` 조회 → `{ userId, onboarded, role }` 반환
- 에러: 401(`invalid_credentials`), 429(`rate_limited`), 503(`service_unavailable`)

2) 로그인 폼 컴포넌트
- `react-hook-form + zod`로 이메일/비밀번호 검증
- `/auth/signin` 호출, 로딩/에러 표준 메시지 표시

3) 로그인 페이지
- 서버 컴포넌트로 폼 렌더링
- 세션 존재 시 서버사이드 리다이렉트 연계

4) 역할별 리다이렉트 로직
- `onboarded = false` → `/onboarding`
- `role = 'instructor'` → `/instructor/dashboard`
- `role = 'learner'` → `/learner/dashboard`

## 3. 체크리스트
- 구현 체크
  - [ ] `/auth/signin` 라우트 구현 및 세션 쿠키 설정
  - [ ] `profiles`에서 `{ onboarded, role }` 조회 후 반환
  - [ ] `login-form` 유효성/에러/로딩 처리 및 API 연동
  - [ ] `signin/page.tsx` 렌더링 및 리다이렉트 연계
  - [ ] 역할별 리다이렉트 동작 확인

- 에러 케이스 테스트
  - [ ] 이메일/비밀번호 불일치 → 401, "이메일 또는 비밀번호가 올바르지 않습니다" 표시
  - [ ] 온보딩 미완료 → 로그인 성공 후 `/onboarding`으로 리다이렉트
