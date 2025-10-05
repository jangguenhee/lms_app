# 001. 회원가입 및 온보딩 - 구현 계획

## 파일 목록

### 백엔드 (Infrastructure + Application)

#### Infrastructure Layer
```
src/infrastructure/
├── persistence/
│   ├── supabase/
│   │   └── auth-client.ts              # Supabase Auth 클라이언트 래퍼
│   └── repositories/
│       └── profile.repository.ts       # Profile Repository 구현체
├── external/
│   └── auth/
│       └── supabase-auth.service.ts    # Supabase Auth 서비스 래퍼
└── config/
    └── supabase.ts                     # ✅ 이미 생성됨
```

#### Application Layer
```
src/application/
├── use-cases/
│   ├── auth/
│   │   ├── signup.use-case.ts          # 회원가입 Use Case
│   │   └── complete-onboarding.use-case.ts # 온보딩 완료 Use Case
│   └── profile/
│       └── update-profile.use-case.ts  # 프로필 업데이트 Use Case
├── ports/
│   ├── repositories/
│   │   └── profile.repository.ts       # Profile Repository Interface
│   └── services/
│       └── auth.service.ts             # Auth Service Interface
└── services/
    └── rate-limit.service.ts           # 레이트 리밋 서비스
```

#### Domain Layer
```
src/domain/
├── entities/
│   └── profile.entity.ts               # Profile 엔티티
├── value-objects/
│   ├── email.vo.ts                     # Email Value Object
│   └── role.vo.ts                      # Role Value Object
├── services/
│   └── email-validation.service.ts    # 이메일 검증 서비스
└── exceptions/
    ├── email-already-exists.exception.ts
    ├── invalid-email.exception.ts
    ├── weak-password.exception.ts
    └── rate-limit-exceeded.exception.ts
```

#### Presentation Layer (API)
```
src/presentation/
└── api/
    ├── routes/
    │   ├── auth.routes.ts              # 인증 관련 API 라우트
    │   └── profile.routes.ts           # 프로필 관련 API 라우트
    ├── dto/
    │   ├── auth.dto.ts                 # 인증 요청/응답 DTO
    │   └── profile.dto.ts              # 프로필 요청/응답 DTO
    └── middleware/
        ├── rate-limit.middleware.ts    # 레이트 리밋 미들웨어
        └── validation.middleware.ts     # 유효성 검사 미들웨어
```

### 프론트엔드 (Presentation)

#### Pages
```
src/presentation/web/app/
├── (auth)/
│   ├── signup/
│   │   └── page.tsx                    # 회원가입 페이지
│   └── onboarding/
│       └── page.tsx                    # 온보딩 페이지
└── (protected)/
    ├── instructor/
    │   └── dashboard/
    │       └── page.tsx                # 강사 대시보드
    └── learner/
        └── dashboard/
            └── page.tsx                # 학습자 대시보드
```

#### Components
```
src/presentation/web/components/
├── features/
│   ├── auth/
│   │   ├── signup-form.tsx             # 회원가입 폼 컴포넌트
│   │   ├── onboarding-form.tsx         # 온보딩 폼 컴포넌트
│   │   └── role-selection.tsx         # 역할 선택 컴포넌트
│   └── profile/
│       └── profile-update-form.tsx     # 프로필 업데이트 폼
└── ui/
    ├── form.tsx                       # ✅ 이미 존재
    ├── input.tsx                      # ✅ 이미 존재
    ├── button.tsx                     # ✅ 이미 존재
    └── card.tsx                       # ✅ 이미 존재
```

#### Hooks & Utils
```
src/presentation/web/
├── hooks/
│   ├── use-signup.ts                  # 회원가입 훅
│   ├── use-onboarding.ts             # 온보딩 훅
│   └── use-profile.ts                # 프로필 훅
└── lib/
    ├── auth-client.ts                # 클라이언트 인증 유틸
    └── validation.ts                 # 클라이언트 유효성 검사
```

#### Middleware
```
middleware.ts                          # Next.js 미들웨어 (온보딩 체크)
```

---

## 구현 순서

### Phase 1: 기반 구조 (Infrastructure)
1. **Domain Layer**
   - `Profile` 엔티티 생성
   - `Email`, `Role` Value Object 생성
   - Domain Exception 클래스들 생성

2. **Infrastructure Layer**
   - `ProfileRepository` 인터페이스 및 구현체
   - Supabase Auth 서비스 래퍼
   - Mapper 클래스들

3. **Application Layer**
   - Use Case 인터페이스 정의
   - Rate Limit 서비스 구현

### Phase 2: API 구현 (Backend)
4. **API Routes**
   - `/auth/signup` 엔드포인트
   - `/profile/me` 엔드포인트 (PATCH)
   - 레이트 리밋 미들웨어

5. **DTO & Validation**
   - 요청/응답 DTO 정의
   - Zod 스키마 생성
   - 유효성 검사 미들웨어

### Phase 3: 프론트엔드 구현
6. **회원가입 페이지**
   - 회원가입 폼 컴포넌트
   - 클라이언트 유효성 검사
   - 에러 핸들링

7. **온보딩 페이지**
   - 역할 선택 컴포넌트
   - 프로필 업데이트 로직

8. **대시보드 페이지**
   - 강사/학습자 대시보드 기본 구조

### Phase 4: 통합 및 테스트
9. **미들웨어**
   - Next.js 미들웨어 구현
   - 온보딩 상태 체크

10. **에러 처리**
    - 전역 에러 핸들링
    - 사용자 친화적 에러 메시지

11. **테스트**
    - Unit 테스트 (Domain/Application)
    - Integration 테스트 (Use Cases)

---

## 체크리스트

### Domain Layer ✅
- [ ] `Profile` 엔티티 생성
- [ ] `Email` Value Object 생성 (유효성 검사 포함)
- [ ] `Role` Value Object 생성 (instructor/learner)
- [ ] Domain Exception 클래스들 생성
- [ ] `EmailValidationService` 구현

### Infrastructure Layer ✅
- [ ] `IProfileRepository` 인터페이스 정의
- [ ] `SupabaseProfileRepository` 구현체
- [ ] `ProfileMapper` (DB ↔ Domain 변환)
- [ ] `SupabaseAuthService` 래퍼
- [ ] Supabase 클라이언트 설정 확인

### Application Layer ✅
- [ ] `SignupUseCase` 구현
- [ ] `CompleteOnboardingUseCase` 구현
- [ ] `UpdateProfileUseCase` 구현
- [ ] `RateLimitService` 구현
- [ ] Use Case 테스트 작성

### API Layer ✅
- [ ] `POST /auth/signup` 엔드포인트
- [ ] `PATCH /profile/me` 엔드포인트
- [ ] `SignupDTO`, `ProfileDTO` 정의
- [ ] Zod 유효성 검사 스키마
- [ ] 레이트 리밋 미들웨어
- [ ] 에러 핸들링 미들웨어

### Frontend Pages ✅
- [ ] `/auth/signup` 페이지
- [ ] `/auth/onboarding` 페이지
- [ ] `/instructor/dashboard` 페이지
- [ ] `/learner/dashboard` 페이지

### Frontend Components ✅
- [ ] `SignupForm` 컴포넌트
- [ ] `OnboardingForm` 컴포넌트
- [ ] `RoleSelection` 컴포넌트
- [ ] 폼 유효성 검사 로직
- [ ] 에러 상태 표시

### Hooks & Utils ✅
- [ ] `useSignup` 훅
- [ ] `useOnboarding` 훅
- [ ] `useProfile` 훅
- [ ] 클라이언트 유효성 검사 유틸
- [ ] API 클라이언트 설정

### Middleware & Routing ✅
- [ ] Next.js 미들웨어 구현
- [ ] 온보딩 상태 체크 로직
- [ ] 역할별 라우팅 가드
- [ ] 인증 상태 체크

### Error Handling ✅
- [ ] 이메일 중복 에러 처리
- [ ] 비밀번호 약함 에러 처리
- [ ] 네트워크 오류 처리
- [ ] 레이트 리밋 에러 처리
- [ ] Supabase 서비스 장애 처리

### Testing ✅
- [ ] Domain 엔티티 단위 테스트
- [ ] Use Case 통합 테스트
- [ ] API 엔드포인트 테스트
- [ ] 컴포넌트 테스트
- [ ] E2E 테스트 (회원가입 → 온보딩 → 대시보드)

### Business Rules ✅
- [ ] 이메일 유니크 제약 검증
- [ ] 비밀번호 정책 검증
- [ ] 역할 불변성 검증
- [ ] 프로필 자동 생성 검증
- [ ] 온보딩 필수 검증
- [ ] 레이트 리밋 구현
- [ ] 데이터 최소화 원칙 적용

### Security ✅
- [ ] RLS 정책 확인
- [ ] 환경변수 보안 설정
- [ ] 클라이언트/서버 키 분리
- [ ] 입력 데이터 검증
- [ ] XSS 방지

### Performance ✅
- [ ] 레이트 리밋 최적화
- [ ] 데이터베이스 인덱스 확인
- [ ] 클라이언트 사이드 캐싱
- [ ] 번들 크기 최적화

---

## 예상 소요 시간

- **Phase 1 (기반 구조)**: 4-6시간
- **Phase 2 (API 구현)**: 6-8시간  
- **Phase 3 (프론트엔드)**: 8-10시간
- **Phase 4 (통합 및 테스트)**: 4-6시간

**총 예상 시간**: 22-30시간

---

## 의존성

- Supabase Auth 설정 완료
- 데이터베이스 스키마 마이그레이션 완료
- 환경변수 설정 완료
- 기본 UI 컴포넌트 (shadcn/ui) 설치 완료

