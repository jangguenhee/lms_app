# 003. 코스 생성 (Instructor)

이 문서는 `003. 코스 생성` 스프린트에서 구현한 Instructor 코스 작성 플로우를 정리합니다.

## 구현 내용

- `/instructor/courses/new`: 코스 초안 생성 페이지
- `/instructor/courses/[id]/edit`: 코스 편집 & 게시 페이지
- 서버 액션
  - `createCourse`, `updateCourse`, `publishCourse`
- 재사용 가능한 컴포넌트
  - `CourseForm`, `PublishButton`, `CourseCard`
- 유효성 검사 (`lib/validations/course.ts`) 와 접근 제어 (`lib/auth/guards.ts`)
- Supabase 클라이언트 정비 (`lib/supabase/server.ts`, `lib/supabase/client.ts`)
- 간단한 스모크 테스트 (`__tests__/003.course.creation.spec.ts`)

코스는 생성 시 자동으로 `draft` 상태가 되며, Instructor 본인만 수정/게시할 수 있습니다. 게시하려면 제목/설명을 모두 충족해야 하며, UI에서 필드 에러와 토스트 메시지를 제공합니다.

> **참고**: 썸네일 입력은 Supabase Storage 업로드 대신 공개 URL 입력 방식으로 단순화했습니다. 실제 업로드가 필요하면 Storage 연동을 추가하세요.

## 환경 변수

다음 값이 설정되어 있어야 Supabase 인증 및 RLS가 정상 동작합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=...        # Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=...    # Anon Key
SUPABASE_URL=...                    # 서버 액션용 (profiles / guard)
SUPABASE_SERVICE_ROLE_KEY=...       # 선택, 서비스 작업 시 필요
```

## 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build
```

## 테스트

이번 스프린트에서는 Node 20의 내장 테스트 러너(`node:test`)를 사용해 서버 액션 핵심 동작을 스모크 테스트했습니다.

```bash
node --test __tests__/003.course.creation.spec.ts
```

테스트는 다음 시나리오를 다룹니다.

1. 코스 초안 생성 시 `draft` 상태로 저장되고 ID가 반환되는지
2. 설명이 없는 코스는 게시가 차단되는지
3. 유효한 코스는 게시가 성공하는지
4. Instructor가 새 코스 페이지에 접근할 수 있는지

Playwright 또는 Vitest 기반의 통합/E2E 테스트가 필요하다면, 위 시나리오를 확장해 추가하세요.

## 향후 과제

- 썸네일 Storage 업로드 및 용량/파일 형식 검증
- Instructor 전용 코스 목록 페이지에서 `CourseCard` 사용
- 게시/저장 성공 후 목록 자동 갱신을 위한 React Query 통합
