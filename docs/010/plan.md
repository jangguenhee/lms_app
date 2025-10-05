# 010. 코스 상태 관리 - 구현 계획

## 1. 파일 목록
- Backend
  - `src/presentation/api/routes/courses.routes.ts`
    - PATCH `/api/courses/[id]` (상태 전환: draft/published/archived)
- Frontend
  - `src/presentation/web/app/(instructor)/courses/[id]/page.tsx` (코스 상세 확장)
  - `src/presentation/web/components/features/courses/course-status-actions.tsx` (상태 변경 버튼/드롭다운 + 확인 모달)

## 2. 구현 순서
1) 상태 전환 API (draft/published/archived)
- PATCH `/api/courses/{id}` Body: `{ status: 'draft' | 'published' | 'archived' }`
- 서버 검증: 소유권(`instructor_id = auth.uid()`), 전환 가능성, 필수 정보(게시 시) 확인
- 성공 시 업데이트: `status`, `updated_at=NOW()`

2) 상태 버튼 UI
- 상세 페이지 상단에 현재 상태 배지 + 드롭다운/버튼 그룹
- 상태별 활성 버튼: Draft→게시, Published→보관, Archived→재게시

3) 확인 모달 (각 상태별 메시지)
- Draft→Published: 게시 안내
- Published→Archived: 신규 신청 중단 경고(수강생/활성 과제 수 표시 가능)
- Archived→Published: 재게시 안내

4) 전환 조건 검증
- Draft→Published: 제목/설명 필수, (과제 없음 시 경고만)
- Published→Archived: 활성 과제/수강생 경고 모달
- 동일 상태 전환 요청 차단(400)

## 3. 체크리스트
- 권한/정책
  - [ ] Instructor 본인만 상태 전환 가능 (Middleware + 서버 검증)
- 전환 규칙
  - [ ] Draft→Published 시 필수 정보 확인(제목 1-200, 설명 10-5000)
  - [ ] Published→Archived 시 경고 표시(신규 신청 중단, 활성 과제/수강생 안내)
  - [ ] Archived→Published 시 재게시 정상 동작
  - [ ] 동일 상태 전환 차단 및 메시지 처리
- 노출/UX
  - [ ] Published만 카탈로그 노출 확인(목록/검색 반영)
  - [ ] 상태 배지/버튼 활성화 로직 일관성
  - [ ] 성공/실패 토스트, 로딩/비활성화 처리
