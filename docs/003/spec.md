# 003. 코스 생성 (Instructor)

## Primary Actor
Instructor (강사)

## Precondition
- 사용자가 Instructor 역할로 로그인된 상태
- 온보딩 완료 (`onboarded = true`, `role = 'instructor'`)

## Trigger
Instructor가 "새 코스 만들기" 버튼 클릭

## Main Scenario

1. Instructor가 `/instructor/courses/new` 페이지 접속
2. Middleware가 역할 확인 (`role = 'instructor'`)
3. 코스 생성 폼 표시
   - 제목 (필수)
   - 설명 (필수)
   - 썸네일 이미지 업로드 (선택)
4. Instructor가 정보 입력
5. "저장" 버튼 클릭
6. 시스템이 클라이언트 유효성 검사 수행
   - 제목 길이 검증 (1-200자)
   - 설명 길이 검증 (10-5000자)
   - 썸네일 파일 형식/크기 검증 (선택 시)
7. 썸네일 이미지가 있는 경우:
   - Supabase Storage에 업로드
   - 업로드 경로: `courses/{instructor_id}/{timestamp}_{filename}`
   - 공개 URL 생성
8. 시스템이 `courses` 테이블에 레코드 생성
   - `instructor_id = auth.uid()`
   - `status = 'draft'`
   - `thumbnail_url = 업로드된 이미지 URL` (선택)
9. 생성 성공 후 `/instructor/courses/{course_id}` 상세 페이지로 리다이렉트
10. "코스가 생성되었습니다" 성공 메시지 표시

## Edge Cases

### 1. 권한 없음
- **상황**: Learner 역할 사용자가 `/instructor/courses/new` 접근 시도
- **처리**:
  - Middleware에서 차단
  - HTTP 403 Forbidden 반환
  - `/learner/dashboard`로 강제 리다이렉트
  - "접근 권한이 없습니다" 메시지

### 2. 제목 길이 초과
- **상황**: 201자 이상의 제목 입력
- **처리**:
  - 클라이언트에서 실시간 검증
  - 입력 제한 (maxLength=200)
  - "제목은 200자 이내로 입력해주세요" 메시지
  - 현재 글자 수 / 200 카운터 표시

### 3. 설명 미입력
- **상황**: 설명 필드를 비워두고 저장 시도
- **처리**:
  - "설명은 필수 항목입니다" 에러 메시지
  - 설명 필드 하이라이트
  - 제출 버튼 비활성화

### 4. 설명 너무 짧음
- **상황**: 10자 미만의 설명 입력
- **처리**:
  - "설명은 최소 10자 이상 입력해주세요" 메시지
  - 현재 글자 수 표시
  - 제출 버튼 비활성화

### 5. 썸네일 파일 형식 오류
- **상황**: 지원하지 않는 파일 형식 업로드 시도 (예: .exe, .zip)
- **처리**:
  - "지원하지 않는 파일 형식입니다" 에러 메시지
  - 지원 형식 안내: "JPG, PNG, WebP만 가능합니다"
  - 파일 선택 초기화

### 6. 썸네일 파일 크기 초과
- **상황**: 5MB 초과 이미지 업로드 시도
- **처리**:
  - "파일 크기는 5MB 이하여야 합니다" 에러 메시지
  - 현재 파일 크기 표시 (예: "현재: 7.2MB")
  - 파일 선택 초기화
  - 이미지 압축 도구 안내 링크 제공 (선택)

### 7. 썸네일 업로드 실패
- **상황**: Supabase Storage 업로드 중 네트워크 오류
- **처리**:
  - "이미지 업로드에 실패했습니다" 에러 메시지
  - "재시도" 버튼 제공
  - 또는 "썸네일 없이 저장" 옵션 제공
  - 입력한 제목/설명 유지 (재입력 방지)

### 8. 중복 제목 (선택)
- **상황**: 동일한 제목의 코스가 이미 존재
- **처리**:
  - 경고 메시지: "동일한 제목의 코스가 있습니다. 계속하시겠습니까?"
  - 확인/취소 선택
  - 확인 시 정상 저장 (중복 허용)

### 9. 데이터베이스 저장 실패
- **상황**: `courses` 테이블 INSERT 실패 (DB 오류)
- **처리**:
  - HTTP 500 Internal Server Error 반환
  - "코스 생성에 실패했습니다. 잠시 후 다시 시도해주세요" 메시지
  - 에러 로그 기록 (모니터링)
  - 이미 업로드된 썸네일 이미지 삭제 (정리)

### 10. 네트워크 단절
- **상황**: 저장 요청 중 네트워크 연결 끊김
- **처리**:
  - "네트워크 연결이 끊어졌습니다" 메시지
  - "재시도" 버튼 제공
  - 로컬 스토리지에 입력 내용 임시 저장 (선택)
  - 재접속 시 복구 가능하도록 처리

### 11. 코스 생성 한도 초과 (선택)
- **상황**: 무료 티어 제한 (예: Instructor당 최대 5개 코스)
- **처리**:
  - "무료 플랜은 최대 5개 코스까지 생성 가능합니다" 메시지
  - 업그레이드 안내 또는 기존 코스 삭제 제안

### 12. XSS 공격 시도
- **상황**: 제목/설명에 `<script>` 태그 등 악의적 코드 입력
- **처리**:
  - 서버에서 입력값 Sanitize
  - 위험한 태그 제거 또는 이스케이프 처리
  - 안전한 HTML만 허용 (마크다운 지원 시)

## Business Rules

### BR-003-01: Instructor 전용
- 코스 생성은 `role = 'instructor'`인 사용자만 가능
- Middleware에서 라우트 레벨 차단
- API에서도 이중 검증

### BR-003-02: 초기 상태는 Draft
- 새로 생성된 코스의 기본 상태는 `draft`
- `draft` 상태 코스는 Instructor 본인만 조회 가능
- Learner에게 노출되지 않음 (카탈로그에서 제외)

### BR-003-03: 필수 입력 항목
- 제목: 1-200자 (필수)
- 설명: 10-5000자 (필수)
- 썸네일: 선택 (없으면 기본 이미지 사용)

### BR-003-04: 썸네일 업로드 정책
- 지원 형식: JPG, PNG, WebP
- 최대 크기: 5MB
- 저장 경로: `courses/{instructor_id}/{timestamp}_{filename}`
- 공개 접근 가능 (RLS: SELECT policy for all)

### BR-003-05: 제목 중복 허용
- 동일한 제목의 코스 생성 가능 (경고만 표시)
- UUID로 구분되므로 충돌 없음

### BR-003-06: 소유권
- 생성한 Instructor만 해당 코스 수정/삭제 가능
- `instructor_id = auth.uid()` 조건으로 RLS 정책 적용

### BR-003-07: 레이트 리밋 (선택)
- 동일 Instructor가 1분 내 10개 이상 코스 생성 시 차단
- 봇/스팸 방지 목적

### BR-003-08: 자동 타임스탬프
- `created_at`: 생성 시각 자동 기록 (DB default)
- `updated_at`: 수정 시각 자동 갱신 (DB trigger)

### BR-003-09: 삭제 정책
- 소프트 삭제 사용 (선택)
- 또는 하드 삭제 후 관련 데이터 Cascade 삭제
- MVP에서는 하드 삭제

### BR-003-10: 썸네일 기본값
- 썸네일 미제공 시 시스템 기본 이미지 사용
- 기본 이미지 경로: `/public/default-course-thumbnail.jpg`

---

## Sequence Diagram
```plantuml
@startuml
actor Instructor
participant FE as "Frontend"
participant BE as "Backend API"
database DB as "Database"
participant Storage as "Supabase Storage"

Instructor -> FE: "새 코스 만들기" 클릭
FE -> BE: GET /instructor/courses/new
BE -> BE: Middleware: 역할 확인\n(role = instructor?)

alt role != instructor
    BE -> FE: 403 Forbidden
    FE -> Instructor: /learner/dashboard로 리다이렉트\n"접근 권한이 없습니다"
else role = instructor
    BE -> FE: 200 OK
    FE -> Instructor: 코스 생성 폼 표시

    Instructor -> FE: 제목, 설명, 썸네일 입력
    Instructor -> FE: "저장" 클릭
    
    FE -> FE: 클라이언트 유효성 검사\n(제목 길이, 설명 길이, 파일 형식/크기)
    
    alt 유효성 검사 실패
        FE -> Instructor: 에러 메시지 표시\n(필드 하이라이트)
    else 유효성 검사 성공
        
        alt 썸네일 이미지 있음
            FE -> Storage: PUT /courses/{instructor_id}/{timestamp}_{filename}
            
            alt 업로드 실패
                Storage -> FE: 500 Upload Error
                FE -> Instructor: "이미지 업로드 실패"\n"재시도" 버튼
            else 업로드 성공
                Storage -> FE: 200 OK\n{public_url}
                FE -> BE: POST /api/courses\n{title, description, thumbnail_url}
            end
        else 썸네일 없음
            FE -> BE: POST /api/courses\n{title, description}
        end
        
        BE -> BE: 서버 유효성 검사\nXSS 필터링
        BE -> BE: 레이트 리밋 체크 (선택)
        
        alt 레이트 리밋 초과
            BE -> FE: 429 Too Many Requests
            FE -> Instructor: "너무 많은 요청. 잠시 후 재시도"
        else 정상 처리
            BE -> DB: INSERT INTO courses\n(instructor_id, title, description,\nthumbnail_url, status='draft')
            
            alt DB 저장 실패
                DB -> BE: 500 DB Error
                BE -> BE: 에러 로그 기록
                
                alt 썸네일 업로드됨
                    BE -> Storage: DELETE /courses/{instructor_id}/{filename}
                    Storage -> BE: 삭제 완료 (정리)
                end
                
                BE -> FE: 500 Internal Server Error
                FE -> Instructor: "코스 생성 실패. 다시 시도해주세요"
            else DB 저장 성공
                DB -> BE: {course_id, created_at}
                BE -> FE: 201 Created\n{course_id}
                FE -> Instructor: /instructor/courses/{course_id}로 리다이렉트
                FE -> Instructor: "코스가 생성되었습니다" 토스트 메시지
            end
        end
    end
end

@enduml