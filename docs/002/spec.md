# 002. 로그인

## Primary Actor
Registered User (등록된 사용자)

## Precondition
- 사용자가 회원가입을 완료한 상태
- 유효한 이메일과 비밀번호 보유
- 온보딩을 완료한 상태 (`onboarded = true`)

## Trigger
사용자가 "로그인" 버튼 클릭 또는 `/auth/signin` 페이지 직접 접속

## Main Scenario

1. 사용자가 `/auth/signin` 페이지 접속
2. 이메일, 비밀번호 입력
3. "로그인" 버튼 클릭
4. 시스템이 클라이언트 유효성 검사 수행
   - 이메일 형식 검증
   - 비밀번호 입력 여부 확인
5. 시스템이 Supabase Auth로 인증 요청
6. 인증 성공 시 JWT 세션 토큰 생성
7. 시스템이 `profiles` 테이블에서 사용자 정보 조회
   - `id`, `email`, `name`, `role`, `onboarded` 조회
8. `onboarded` 상태 확인
   - `onboarded = false` → `/onboarding`으로 리다이렉트 (역할 선택 필요)
   - `onboarded = true` → 다음 단계 진행
9. `role` 확인 후 역할별 대시보드로 리다이렉트
   - `role = 'instructor'` → `/instructor/dashboard`
   - `role = 'learner'` → `/learner/dashboard`
10. 세션 쿠키 설정 (자동 로그인 유지)

## Edge Cases

### 1. 이메일/비밀번호 불일치
- **상황**: 잘못된 이메일 또는 비밀번호 입력
- **처리**:
  - HTTP 401 Unauthorized 반환
  - "이메일 또는 비밀번호가 올바르지 않습니다" 메시지 표시
  - 입력 필드 하이라이트 (보안상 어느 필드가 틀렸는지 명시하지 않음)
  - "비밀번호 찾기" 링크 제공
  - 실패 횟수 증가 (레이트 리밋 카운트)

### 2. 계정 미존재
- **상황**: 등록되지 않은 이메일로 로그인 시도
- **처리**:
  - 이메일/비밀번호 불일치와 동일한 메시지 (보안: 계정 존재 여부 노출 방지)
  - "회원가입" 링크 제공

### 3. 온보딩 미완료
- **상황**: 회원가입 후 역할 선택 없이 이탈한 사용자 (`onboarded = false`)
- **처리**:
  - 로그인 성공 후 `/onboarding`으로 강제 리다이렉트
  - "역할 선택이 필요합니다" 안내 메시지

### 4. 역할 정보 손상
- **상황**: `role = null` (비정상 상태, DB 직접 수정 등)
- **처리**:
  - `/onboarding`으로 리다이렉트
  - 에러 로그 기록 (모니터링 필요)
  - "계정 정보를 확인할 수 없습니다. 역할을 다시 선택해주세요"

### 5. 레이트 리밋 초과
- **상황**: 동일 계정/IP에서 5분 내 5회 이상 로그인 실패
- **처리**:
  - HTTP 429 Too Many Requests 반환
  - "너무 많은 로그인 시도가 감지되었습니다. 5분 후 다시 시도해주세요" 메시지
  - 타이머 표시 (남은 차단 시간)
  - CAPTCHA 추가 인증 요구 (선택)

### 6. 세션 충돌
- **상황**: 이미 다른 기기에서 로그인된 상태
- **처리**:
  - 새 세션 생성 (기존 세션 무효화)
  - "다른 기기에서 로그아웃되었습니다" 안내 (선택)
  - 또는 다중 세션 허용 (정책에 따름)

### 7. 이메일 미인증 (선택)
- **상황**: 이메일 인증이 활성화된 경우, 미인증 상태로 로그인 시도
- **처리**:
  - HTTP 403 Forbidden 반환
  - "이메일 인증이 필요합니다" 메시지
  - "인증 메일 재발송" 버튼 제공 (레이트 리밋: 1분 1회)

### 8. 계정 비활성화/삭제
- **상황**: 관리자가 비활성화한 계정 또는 소프트 삭제된 계정
- **처리**:
  - HTTP 403 Forbidden 반환
  - "계정이 비활성화되었습니다. 고객센터로 문의해주세요" 메시지
  - 고객센터 링크/이메일 제공

### 9. 네트워크 오류
- **상황**: Supabase Auth 요청 중 네트워크 단절
- **처리**:
  - "서버 연결에 실패했습니다" 에러 메시지
  - "재시도" 버튼 제공
  - 입력한 이메일 유지 (재입력 방지)

### 10. Supabase 서비스 장애
- **상황**: Supabase Auth 서비스 다운
- **처리**:
  - HTTP 503 Service Unavailable 반환
  - "일시적인 서버 오류입니다. 잠시 후 다시 시도해주세요" 메시지
  - 재시도 버튼 + 자동 재시도 옵션 (10초 후)

### 11. 봇/자동화 탐지
- **상황**: 자동화 도구를 이용한 로그인 시도 패턴 감지
- **처리**:
  - CAPTCHA 추가 인증 요구
  - IP 차단 (악의적인 경우)
  - 보안 팀 알림 (선택)

## Business Rules

### BR-002-01: 세션 기반 인증
- Supabase Auth JWT 토큰 사용
- 토큰 유효기간: 1시간 (기본값)
- Refresh Token으로 자동 갱신
- 갱신 실패 시 재로그인 요구

### BR-002-02: 온보딩 강제
- `onboarded = false`인 사용자는 반드시 온보딩 완료 후 서비스 이용 가능
- Middleware에서 전역 체크 (모든 Protected Routes)

### BR-002-03: 역할별 리다이렉트
- 로그인 성공 시 역할에 따라 자동으로 적절한 대시보드로 이동
- `instructor` → `/instructor/dashboard`
- `learner` → `/learner/dashboard`

### BR-002-04: 레이트 리밋
- **실패 기반 제한**: 동일 이메일로 5분 내 5회 실패 시 해당 계정 일시 차단
- **IP 기반 제한**: 동일 IP에서 5분 내 10회 실패 시 IP 차단
- 차단 시간: 5분
- 구현: Redis 또는 Supabase Edge Functions (선택)

### BR-002-05: 보안 에러 메시지
- 계정 존재 여부를 노출하지 않음
- "이메일 또는 비밀번호가 올바르지 않습니다" (통일된 메시지)
- Timing Attack 방지 (응답 시간 일정하게 유지)

### BR-002-06: 자동 로그인 (Remember Me)
- "로그인 상태 유지" 체크박스 제공 (선택)
- 체크 시 Refresh Token 쿠키 30일 유지
- 미체크 시 브라우저 세션 종료 시 로그아웃

### BR-002-07: 다중 기기 로그인
- 기본: 다중 세션 허용
- 옵션: 단일 세션만 허용 (보안 강화)
- 정책은 프로젝트 설정에서 변경 가능

### BR-002-08: 로그인 기록
- 로그인 성공/실패 이벤트 로그 기록
- IP 주소, User Agent, 시간 저장
- 사용자는 "최근 로그인 기록" 조회 가능 (선택)

### BR-002-09: 이메일 인증 (선택)
- 이메일 인증 활성화 시 인증 완료 전까지 로그인 제한
- MVP에서는 선택적 구현

### BR-002-10: CSRF 보호
- Supabase Auth의 기본 CSRF 보호 활용
- SameSite 쿠키 정책 적용

---

## Sequence Diagram
```plantuml
@startuml
actor User
participant FE as "Frontend"
participant BE as "Backend API"
database DB as "Database"

User -> FE: 로그인 페이지 접속
FE -> User: 이메일/비밀번호 입력 폼 표시

User -> FE: 이메일, 비밀번호 입력
User -> FE: "로그인" 클릭

FE -> FE: 클라이언트 유효성 검사\n(이메일 형식, 필수 입력)

alt 유효성 검사 실패
    FE -> User: 에러 메시지 표시\n(실시간 피드백)
else 유효성 검사 성공
    FE -> BE: POST /auth/signin\n{email, password}
    
    BE -> BE: 레이트 리밋 체크\n(이메일 기준, IP 기준)
    
    alt 레이트 리밋 초과
        BE -> FE: 429 Too Many Requests
        FE -> User: "너무 많은 시도. 5분 후 재시도"
    else 레이트 리밋 정상
        BE -> DB: Supabase Auth 인증 요청
        
        alt 인증 실패 (이메일/비밀번호 불일치)
            DB -> BE: 401 Unauthorized
            BE -> BE: 실패 횟수 증가 (레이트 리밋)
            BE -> FE: 401 Unauthorized\n{error: "인증 실패"}
            FE -> User: "이메일 또는 비밀번호가 올바르지 않습니다"
            FE -> User: "비밀번호 찾기" 링크 표시
        else 인증 성공
            DB -> BE: JWT 토큰 + user_id 반환
            BE -> FE: 200 OK\n{session, user_id}
            
            FE -> BE: GET /profiles/me
            BE -> DB: SELECT * FROM profiles\nWHERE id = auth.uid()
            DB -> BE: {id, email, name, role, onboarded}
            
            alt onboarded = false
                BE -> FE: {onboarded: false}
                FE -> User: /onboarding으로 리다이렉트\n"역할 선택이 필요합니다"
            else onboarded = true and role = null
                BE -> FE: {onboarded: true, role: null}
                FE -> User: /onboarding으로 리다이렉트\n"계정 정보를 확인할 수 없습니다"
                BE -> BE: 에러 로그 기록 (비정상 상태)
            else onboarded = true and role exists
                BE -> FE: {role: "instructor", onboarded: true}
                
                alt role = instructor
                    FE -> User: /instructor/dashboard로 리다이렉트
                else role = learner
                    FE -> User: /learner/dashboard로 리다이렉트
                end
            end
        end
    end
end

@enduml