# 008. 재제출 요청 및 처리 - 구현 계획

## 1. 파일 목록
- Backend
  - `src/presentation/api/routes/submissions.routes.ts`
    - PATCH `/api/submissions/[id]` (재제출: 기존 제출물 UPDATE)
- Frontend
  - 채점 화면 확장 (007 연동)
    - `src/presentation/web/components/features/assignments/grade-form.tsx`
      - "재제출 요청" 체크박스 추가 → 저장 시 상태 전환
  - 재제출 폼 (006 확장)
    - `src/presentation/web/app/(learner)/courses/my/[courseId]/assignments/[id]/resubmit/page.tsx` (선택: 별도 경로)
    - 또는 기존 상세/제출 페이지 내 조건부 렌더링
  - 재제출 알림 UI
    - `src/presentation/web/app/(learner)/dashboard/page.tsx` 내 "재제출 요청됨" 섹션/배지

## 2. 구현 순서
1) 채점 시 status='resubmit_requested' 설정
- 007의 채점 저장 API 확장: `requestResubmit=true` 시 `submissions.status='resubmit_requested'`, `grades.score=NULL`, 피드백 저장

2) 재제출 요청 알림 (Learner 대시보드)
- Learner 대시보드에서 `submissions.status='resubmit_requested'` 목록 노출, 배지/링크 제공

3) 재제출 폼 (기존 제출물 UPDATE)
- PATCH `/api/submissions/[id]` Body: `{ content?, fileUrl? }`
- 파일 업로드 경로: `submissions/{assignment_id}/{learner_id}/resubmit_{timestamp}_{filename}`
- 기존 파일이 새 파일로 대체되면 이전 파일 정리(선택)

4) resubmission_count 증가
- 서버에서 UPDATE 시 `resubmission_count = resubmission_count + 1`, `submitted_at=NOW()`, `status='submitted'`

## 3. 체크리스트
- 권한/상태
  - [ ] `status='resubmit_requested'`일 때만 재제출 가능
  - [ ] Learner 본인 제출물만 수정 가능, Instructor는 요청만 가능
- 마감/검증
  - [ ] 재제출도 마감 정책(006) 동일 적용: 지각 허용/마감 초과 차단
  - [ ] 텍스트 또는 파일 최소 1개 필수, 파일 형식/크기 검증
- UX
  - [ ] 기존 제출물 내용 표시(텍스트/파일 링크)
  - [ ] 알림/배지 표시 및 이동 링크 제공
  - [ ] 저장 성공 시 토스트 및 상태 갱신
