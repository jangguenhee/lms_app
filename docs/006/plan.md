# 006. 과제 제출 - 구현 계획

## 1. 파일 목록
- Backend
  - `src/presentation/api/routes/submissions.routes.ts`
    - POST `/api/submissions` (제출 생성)
  - Storage 업로드 (파일)
    - `src/infrastructure/external/storage/supabase-storage.ts` (선택: 업로드 헬퍼)
- Frontend
  - `src/presentation/web/app/(learner)/courses/my/[courseId]/assignments/[id]/page.tsx` (과제 상세/제출)
  - `src/presentation/web/components/features/submissions/submission-form.tsx` (제출 폼)
  - `src/presentation/web/components/features/submissions/file-upload.tsx` 또는 `src/components/ui/file-upload.tsx` 재사용 (파일 업로드)

## 2. 구현 순서
1) 과제 상세 조회 API
- GET `/api/assignments/{id}` → `status='published'`만 조회, 수강 여부 확인용 데이터 포함(코스 id)

2) 제출 폼 (텍스트, 파일)
- `react-hook-form + zod` 검증: 텍스트 최대 10,000자, 파일 형식/크기(≤10MB)
- 텍스트 또는 파일 중 최소 1개 필수

3) 파일 업로드 (Supabase Storage)
- 경로: `submissions/{assignment_id}/{learner_id}/{timestamp}_{filename}`
- 업로드 성공 시 public URL 획득 → 제출 페이로드에 포함

4) 제출 API (is_late 판정)
- POST `/api/submissions` Body: `{ assignmentId, content?, fileUrl? }`
- 서버 로직: 수강 여부 확인 → 마감 로직 판정 → `is_late` 설정 → INSERT(`status='submitted'`)

5) 마감 시간 표시
- 과제 상세에서 남은 시간/마감/지각 정책 표시, 지각 예상 시 경고 문구

## 3. 체크리스트
- 권한/검증
  - [ ] 해당 코스를 수강 신청한 Learner만 제출 가능 (`enrollments` 확인)
  - [ ] `content` 또는 `file_url` 최소 1개 필수
  - [ ] 파일 형식: PDF/DOC/DOCX/ZIP/JPG/PNG, 크기 ≤ 10MB
- 비즈니스 로직
  - [ ] 지각 제출 판정(`is_late`) 적용
  - [ ] 마감 후 제출 불가 처리(지각 불허 또는 지각 마감 초과 시 403)
- UX
  - [ ] 업로드/제출 로딩 상태, 에러 메시지 및 재시도 제공
  - [ ] 제출 성공 시 토스트/상태 갱신 및 제출 내용 표시
