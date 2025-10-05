# 003. 코스 생성 - 구현 계획

## 1. 파일 목록
- Backend
  - `src/presentation/api/routes/courses.routes.ts` (POST `/courses`)
- Frontend
  - `src/presentation/web/app/(instructor)/courses/new/page.tsx` (새 코스 페이지)
  - `src/presentation/web/components/features/courses/course-form.tsx` (코스 폼 컴포넌트)
  - `src/presentation/web/components/features/courses/thumbnail-uploader.tsx` (썸네일 업로드, 선택)
    - 또는 기존 `src/components/ui/file-upload.tsx` 재사용
- Domain (선택)
  - `src/domain/entities/course.entity.ts` (Course 엔티티)

## 2. 구현 순서
1) 코스 생성 API (Supabase INSERT)
- 엔드포인트: POST `/courses`
- 입력: `{ title, description, thumbnailUrl? }`
- 처리: `instructor_id = auth.uid()`, `status = 'draft'` 기본값으로 INSERT 후 `{ id }` 반환

2) 코스 폼 컴포넌트 (제목, 설명, 썸네일)
- `react-hook-form + zod`로 제목(1-200), 설명(10-5000) 검증
- 썸네일 업로드 시 Storage 업로드 → public URL 생성 → API에 전달

3) 페이지 통합
- `/instructor/courses/new`에서 폼 렌더링
- 성공 시 `/instructor/courses/{course_id}`로 리다이렉트, 성공 토스트

4) RLS 정책 확인
- `instructor_id = auth.uid()`로 INSERT 허용 정책 확인
- `draft` 상태는 소유 Instructor만 SELECT 허용

## 3. 체크리스트
- 접근 제어
  - [ ] Instructor만 접근 가능 (Middleware 역할 가드)
- 기본값/필드
  - [ ] `status = 'draft'` 기본 저장
  - [ ] 필수 필드 검증(제목, 설명) 및 길이 제한
- 업로드/저장
  - [ ] 썸네일 업로드 실패/성공 분기 처리 및 URL 전달
  - [ ] DB INSERT 실패 시 에러 처리 및 업로드 정리(선택)
- UX
  - [ ] 로딩/비활성화 상태, 에러 메시지, 성공 토스트
