# 007. 제출물 채점 - 구현 계획

## 1. 파일 목록
- Backend
  - `src/presentation/api/routes/assignments.routes.ts`
    - GET `/api/assignments/[id]/submissions` (과제별 제출물 목록)
  - `src/presentation/api/routes/grades.routes.ts`
    - POST `/api/grades` (채점 저장/업데이트)
- Frontend
  - `src/presentation/web/app/(instructor)/assignments/[id]/submissions/page.tsx` (제출물 목록 페이지)
  - `src/presentation/web/components/features/assignments/submission-list.tsx` (표/필터/정렬)
  - `src/presentation/web/components/features/assignments/grade-form.tsx` (점수/피드백 입력 폼, 모달/페이지 공용)

## 2. 구현 순서
1) 제출물 목록 API
- GET `/api/assignments/[id]/submissions` → 소유권 확인 후 목록 반환(학생명, 제출시간, 지각여부, 상태, 점수)

2) 제출물 테이블
- `submission-list`에서 테이블 렌더링, 필터(전체/미채점/채점완료/재제출요청/지각), 정렬(제출시간/이름)

3) 채점 모달/페이지
- 제출물 선택 시 상세/모달 오픈: 제출 내용, 파일 링크, 지각 여부, 현재 점수/피드백 표시

4) 점수, 피드백 입력 폼
- `react-hook-form + zod`로 점수(0-100), 피드백(≤5000자) 검증

5) 채점 저장 API
- POST `/api/grades` with `{ submissionId, score, feedback, resubmitRequested? }`
- 성공 시 `submissions.status = 'graded'` 또는 재제출 요청 시 상태 업데이트(선택 스토리)

## 3. 체크리스트
- 권한/소유권
  - [ ] 과제 소유 Instructor만 목록 조회/채점 가능 (Middleware + 서버 검증)
- 검증/저장
  - [ ] 점수 0-100 범위 검증, 피드백 ≤ 5000자
  - [ ] `graded_by`는 `auth.uid()`로 기록, `graded_at = NOW()`
  - [ ] `graded_by_name` 자동 채움: DB Trigger 또는 조인으로 표시 용도 처리
  - [ ] 재제출 요청 체크박스 지원(선택): 요청 시 `submissions.status = 'resubmit_requested'`
- UX
  - [ ] 저장 로딩/에러/성공 토스트, 목록 상태 즉시 반영
  - [ ] 파일 다운로드 실패 처리 및 재시도 안내
