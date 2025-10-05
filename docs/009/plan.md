# 009. 성적 조회 - 구현 계획

## 1. 파일 목록
- Backend
  - `src/presentation/api/routes/grades.routes.ts`
    - GET `/api/courses/[id]/grades` (코스별 성적 조회)
- Frontend
  - `src/presentation/web/app/(learner)/courses/my/[courseId]/grades/page.tsx` (성적 페이지)
  - `src/presentation/web/components/features/grades/grade-list.tsx` (성적 테이블)
  - `src/presentation/web/components/features/grades/grade-detail.tsx` (피드백 상세 모달/패널)

## 2. 구현 순서
1) 성적 조회 API (과제별 점수, 피드백)
- GET `/api/courses/[id]/grades` → 수강 여부 확인 후 다음 데이터 반환:
  - 과제 목록(게시된 것만), 제출 상태/시간/지각 여부, 점수/피드백

2) 성적 테이블 (과제명, 점수, 상태)
- `grade-list`에서 테이블 렌더링: 과제명, 제출 상태, 제출 시간, 지각 여부, 점수, 상태

3) 평균 점수 계산
- 채점 완료된 항목만 평균 계산하여 상단 요약 영역에 표시

4) 피드백 상세 모달
- 행 클릭 시 `grade-detail` 모달로 과제 정보/제출 내용/점수/피드백/재제출 버튼(해당 시) 표시

## 3. 체크리스트
- 권한/정책
  - [ ] 본인 성적만 조회 (RLS + 서버에서 `learner_id = auth.uid()` 재확인)
  - [ ] 해당 코스 수강 여부 확인 후 접근 허용
- 표시/UX
  - [ ] 채점 완료/대기 상태 명확히 표기 (점수 또는 "-"/"대기 중")
  - [ ] `status='resubmit_requested'`일 때 "재제출하기" 버튼 활성화
  - [ ] 지각(`is_late`) 배지 표시
  - [ ] 평균 점수는 채점 완료 항목만 집계
