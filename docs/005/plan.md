# 005. 과제 생성 - 구현 계획

## 1. 파일 목록
- Backend
  - `src/presentation/api/routes/assignments.routes.ts` (POST `/api/assignments`)
- Frontend
  - `src/presentation/web/app/(instructor)/courses/[id]/assignments/new/page.tsx` (과제 생성 페이지)
  - `src/presentation/web/components/features/assignments/assignment-form.tsx` (과제 폼 컴포넌트)
  - 지각 제출 설정 UI
    - `src/presentation/web/components/features/assignments/late-policy.tsx` (선택, 폼 내 분리 가능)
  - DatePicker
    - `src/presentation/web/components/ui/date-picker.tsx` (또는 기존 컴포넌트 재사용)

## 2. 구현 순서
1) 과제 생성 API
- POST `/api/assignments` → Body: `{ courseId, title, description, dueDate, allowLateSubmission, lateSubmissionDeadline? }`
- 서버 검증: 코스 소유권(`course.instructor_id = auth.uid()`), 날짜 규칙, XSS 최소화, `status='draft'` 저장

2) 과제 폼 (제목, 설명, 마감일, 지각 정책)
- `react-hook-form + zod`로 검증: 제목(1-200), 설명(10-5000), 마감일(미래), 지각 정책
- 제출 시 API 호출 및 성공 시 상세로 리다이렉트

3) DatePicker 컴포넌트
- 마감일/지각 마감일 선택 UI 제공(시간 포함)
- 최소값: 현재 시각(또는 현재+1시간) 이후 선택 권장

4) 지각 마감일 조건부 표시
- `allowLateSubmission = true`일 때만 지각 마감일 필드 활성화/표시
- 제출 전/서버에서 `late_submission_deadline > due_date` 재검증

## 3. 체크리스트
- 권한/정책
  - [ ] 코스 소유 Instructor만 생성 가능 (Middleware + 서버 검증)
- 날짜/상태 규칙
  - [ ] `late_submission_deadline > due_date` 검증(클라이언트/서버)
  - [ ] `status = 'draft'` 기본값으로 저장
- 폼/UX
  - [ ] 제목/설명 필수 및 길이 검증
  - [ ] DatePicker로 날짜 형식 오류 방지, 시간 포함 입력
  - [ ] API 실패 시 에러 메시지 및 재시도, 성공 시 토스트/리다이렉트
