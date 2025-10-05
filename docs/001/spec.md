# 001. 회원가입 및 온보딩

## Primary Actor
Guest (미인증 사용자)

## Precondition
- 사용자가 플랫폼에 접속 가능한 상태
- 유효한 이메일 주소 보유

## Trigger
사용자가 "회원가입" 버튼 클릭

## Main Scenario

1. 사용자가 `/auth/signup` 페이지 접속
2. 이메일, 비밀번호, 이름 입력
3. "가입하기" 버튼 클릭
4. 시스템이 클라이언트 유효성 검사 수행
   - 이메일 형식 검증
   - 비밀번호 길이 검증 (최소 6자)
   - 필수 필드 누락 검증
5. 시스템이 서버 유효성 검사 수행
   - 이메일 중복 체크
   - 레이트 리밋 체크
6. Supabase Auth가 사용자 계정 생성 (`auth.users`)
7. Database Trigger가 `profiles` 테이블에 레코드 생성
   - `onboarded = false`
   - `role = null`
8. 시스템이 사용자를 `/onboarding` 페이지로 리다이렉트
9. 사용자가 역할 선택 (Instructor 또는 Learner)
10. 시스템이 `profiles` 업데이트
    - `role = 선택한 역할`
    - `onboarded = true`
11. 역할별 대시보드로 리다이렉트
    - Instructor → `/instructor/dashboard`
    - Learner → `/learner/dashboard`

## Edge Cases

### 1. 이메일 중복
- **상황**: 이미 등록된 이메일로 가입 시도
- **처리**: 
  - HTTP 400 에러 반환
  - "이미 사용 중인 이메일입니다" 메시지 표시
  - 이메일 필드 하이라이트
  - "로그인 페이지로 이동" 링크 제공

### 2. 비밀번호 약함
- **상황**: 6자 미만 비밀번호 입력
- **처리**: 
  - 클라이언트에서 즉시 검증
  - "비밀번호는 최소 6자 이상이어야 합니다" 실시간 피드백
  - 제출 버튼 비활성화

### 3. 네트워크 오류
- **상황**: Supabase Auth 요청 중 네트워크 단절
- **처리**: 
  - "서버 연결에 실패했습니다" 에러 메시지
  - "재시도" 버튼 제공
  - 입력한 데이터 유지 (재입력 방지)

### 4. 역할 미선택 후 이탈
- **상황**: 온보딩 페이지에서 역할 선택 없이 창 닫음
- **처리**: 
  - 다음 로그인 시 `/onboarding`으로 강제 리다이렉트
  - Middleware에서 `onboarded = false` 체크

### 5. 레이트 리밋 초과
- **상황**: 동일 IP에서 5분 내 10회 이상 가입 시도
- **처리**: 
  - HTTP 429 (Too Many Requests) 반환
  - "너무 많은 시도가 감지되었습니다. 5분 후 다시 시도해주세요" 메시지
  - 타이머 표시 (남은 시간)

### 6. 봇/스팸 감지
- **상황**: 자동화된 가입 시도 패턴 감지
- **처리**: 
  - CAPTCHA 추가 인증 요구
  - 또는 이메일 인증 필수화

### 7. Supabase 서비스 장애
- **상황**: Supabase Auth 서비스 다운
- **처리**: 
  - HTTP 503 (Service Unavailable) 반환
  - "일시적인 서버 오류입니다. 잠시 후 다시 시도해주세요" 메시지
  - 상태 페이지 링크 제공 (선택)

## Business Rules

### BR-001-01: 이메일 유니크 제약
- 하나의 이메일은 하나의 계정만 생성 가능
- DB 레벨 UNIQUE 제약 + 애플리케이션 레벨 검증

### BR-001-02: 비밀번호 정책
- 최소 6자 이상 (Supabase Auth 기본값)
- 영문, 숫자, 특수문자 조합 권장 (선택)

### BR-001-03: 역할 불변성
- 온보딩에서 선택한 역할은 변경 불가 (MVP)
- 역할 변경 필요 시 신규 계정 생성 또는 관리자 문의

### BR-001-04: 프로필 자동 생성
- `auth.users` 생성 시 자동으로 `profiles` 레코드 생성 (Database Trigger)
- Trigger 실패 시 회원가입 롤백

### BR-001-05: 온보딩 필수
- `onboarded = false`인 사용자는 모든 페이지에서 `/onboarding`으로 리다이렉트
- Middleware에서 전역 체크

### BR-001-06: 레이트 리밋
- 동일 IP에서 5분 내 10회 가입 시도 시 일시적 차단
- 차단 시간: 5분
- 구현: Redis 또는 Supabase Edge Functions (선택)

### BR-001-07: 이메일 인증 (선택)
- 이메일 인증 활성화 시 인증 완료 전까지 로그인 제한
- MVP에서는 미구현 가능

### BR-001-08: 데이터 최소화
- 회원가입 시 필수 항목만 수집 (이메일, 비밀번호, 이름)
- 추가 정보는 온보딩 후 선택적 입력

---

## Sequence Diagram
```plantuml
@startuml
actor User
participant FE as "Frontend"
participant BE as "Backend API"
database DB as "Database"

User -> FE: 회원가입 페이지 접속
FE -> User: 입력 폼 표시

User -> FE: 이메일, 비밀번호, 이름 입력
User -> FE: "가입하기" 클릭

FE -> FE: 클라이언트 유효성 검사\n(이메일 형식, 비밀번호 길이)

alt 유효성 검사 실패
    FE -> User: 에러 메시지 표시\n(실시간 피드백)
else 유효성 검사 성공
    FE -> BE: POST /auth/signup\n{email, password, name}
    
    BE -> BE: 서버 유효성 검사
    BE -> BE: 레이트 리밋 체크
    
    alt 레이트 리밋 초과
        BE -> FE: 429 Too Many Requests
        FE -> User: "너무 많은 시도. 5분 후 재시도"
    else 레이트 리밋 정상
        BE -> DB: SELECT * FROM profiles\nWHERE email = ?
        
        alt 이메일 중복
            DB -> BE: 레코드 존재
            BE -> FE: 400 Bad Request\n{error: "이메일 중복"}
            FE -> User: "이미 사용 중인 이메일입니다"
        else 이메일 사용 가능
            BE -> DB: Supabase Auth 계정 생성
            DB -> DB: INSERT INTO auth.users
            DB -> DB: Trigger: INSERT INTO profiles\n(onboarded=false, role=null)
            DB -> BE: user_id 반환
            BE -> FE: 201 Created\n{user_id, session}
            
            FE -> User: /onboarding으로 리다이렉트
            
            == 온보딩 (역할 선택) ==
            User -> FE: 온보딩 페이지 진입
            FE -> User: Instructor / Learner 카드 표시
            
            User -> FE: 역할 선택 (예: Instructor)
            FE -> BE: PATCH /profiles/me\n{role: "instructor", onboarded: true}
            BE -> DB: UPDATE profiles\nSET role='instructor', onboarded=true\nWHERE id = auth.uid()
            DB -> BE: 업데이트 성공
            BE -> FE: 200 OK
            
            alt role = instructor
                FE -> User: /instructor/dashboard로 리다이렉트
            else role = learner
                FE -> User: /learner/dashboard로 리다이렉트
            end
        end
    end
end

@enduml