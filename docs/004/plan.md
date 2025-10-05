# 004. 코스 수강신청 - 구현 계획

## 1. 파일 목록
- Backend
  - `src/presentation/api/routes/courses.routes.ts`
    - GET `/api/courses` (카탈로그: status='published')
  - `src/presentation/api/routes/enrollments.routes.ts`
    - POST `/api/enrollments` (수강신청)
- Frontend
  - `src/presentation/web/app/(public)/page.tsx` 또는 `src/presentation/web/app/(public)/courses/page.tsx` (카탈로그)
  - `src/presentation/web/app/(public)/courses/[id]/page.tsx` (코스 상세)
  - `src/presentation/web/components/features/courses/course-card.tsx` (코스 카드)
  - `src/presentation/web/components/features/courses/enroll-button.tsx` (수강신청/취소 버튼)

## 2. 구현 순서
1) 코스 카탈로그 API (status='published')
- GET `/api/courses?status=published` → 공개 코스만 목록 반환

2) 코스 카드 리스트
- 카탈로그 페이지에서 카드 그리드 렌더링, 검색/정렬은 MVP 제외 또는 단순화

3) 코스 상세 페이지
- GET `/api/courses/{id}` 결과 표시
- 현재 사용자 기준 수강 여부 조회(API 또는 클라이언트 쿼리)

4) 수강신청 API
- POST `/api/enrollments` with `{ courseId }`
- 서버에서 `role = 'learner'` 확인 및 UNIQUE 제약 위반 처리

5) 수강신청/취소 버튼
- 상태에 따라 "수강 신청"/"수강 취소" 토글
- 성공 시 상태 갱신 및 토스트 노출

## 3. 체크리스트
- 데이터/권한
  - [ ] 카탈로그는 `status='published'`만 노출
  - [ ] `(course_id, learner_id)` UNIQUE로 중복 신청 방지 (409 처리)
  - [ ] Learner만 신청 가능 (Middleware/서버 검증)
- UX/에러
  - [ ] 네트워크/DB 오류 시 메시지 및 재시도 제공
  - [ ] 신청 성공 시 버튼/상태 즉시 업데이트 및 토스트
