# AGENTS.md

## Base Development Guidelines

### Project Overview

**VMC_LMS** - Instructor-centric course marketplace platform

**Architecture:** Layered Architecture (Presentation → Application → Domain → Infrastructure)

**Key Principles:**
- SOLID principles
- Dependency Inversion (DIP)
- Clean separation of concerns

---

## Must

- **Layered Architecture 준수**: Presentation → Application → Domain → Infrastructure
- **의존성 방향**: 바깥쪽 → 안쪽 (Infrastructure → Domain, not reverse)
- **Domain Layer는 순수**: 외부 라이브러리 의존 금지 (date-fns, ts-pattern만 허용)
- **항상 Interface 사용**: Repository, Service는 interface로 정의
- **Use Case 중심**: 비즈니스 로직은 Use Case에서 조율
- **Promise params**: page.tsx params는 Promise 사용
- **한국어 응답**: 항상 한국어로 응답

---

## Tech Stack

### Core
- **Next.js 14** (App Router, Server Components)
- **TypeScript** (strict mode)
- **Hono** (API routes)

### Data
- **Supabase** (Auth, PostgreSQL, Storage)
- **@tanstack/react-query** (Server state)

### UI
- **Tailwind CSS** + **shadcn/ui**
- **react-hook-form** + **zod**
- **lucide-react**

### Domain Logic
- **date-fns** (날짜 계산)
- **ts-pattern** (패턴 매칭)
- **neverthrow** (Result 타입)

### Utilities
- **es-toolkit** (lodash 대체)
- **nanoid** (ID 생성)

---

## Directory Structure
src/
├── presentation/
│   ├── web/
│   │   ├── app/                      # Next.js pages
│   │   │   ├── (public)/
│   │   │   ├── (auth)/
│   │   │   ├── (learner)/
│   │   │   └── (instructor)/
│   │   └── components/               # UI components only
│   │       ├── ui/                   # shadcn/ui
│   │       └── features/
│   └── api/
│       ├── routes/                   # Hono routes
│       ├── dto/                      # Request/Response DTOs
│       └── middleware/               # HTTP middleware
│
├── application/
│   ├── use-cases/                    # Business workflows
│   │   ├── course/
│   │   ├── enrollment/
│   │   ├── assignment/
│   │   └── submission/
│   ├── ports/                        # Interfaces (DIP)
│   │   ├── repositories/
│   │   └── services/
│   └── services/                     # Application services
│
├── domain/
│   ├── entities/                     # Domain entities
│   ├── value-objects/                # Value objects
│   ├── services/                     # Domain services
│   ├── events/                       # Domain events
│   └── exceptions/                   # Domain exceptions
│
├── infrastructure/
│   ├── persistence/
│   │   ├── supabase/
│   │   ├── repositories/             # Repository implementations
│   │   └── mappers/                  # DB ↔ Domain
│   ├── external/
│   │   ├── storage/
│   │   └── auth/
│   └── config/
│
└── shared/
├── types/
├── constants/
└── utils/

---

## Layered Architecture Rules

### 1. Presentation Layer

**책임:** UI 렌더링, HTTP 요청 처리

**허용 의존성:**
- → Application Layer (Use Cases)
- → Shared utilities

**금지:**
- ❌ Domain entities 직접 사용
- ❌ Infrastructure 직접 접근 (DI Container 통해서만)

**Components:**
- Server Component 기본
- `'use client'`는 필요시만 (hooks, events, browser APIs)

**API Routes 예시:**
```typescript
// presentation/api/routes/submissions.routes.ts
app.post('/submissions', async (c) => {
  const dto = await c.req.json();
  
  // Use Case 호출
  const result = await submitAssignmentUseCase.execute(dto);
  
  return result.match(
    (submission) => c.json(submission, 200),
    (error) => c.json({ error: error.message }, 400)
  );
});
```

### 2. Application Layer

**책임:** Use Case 조율, 비즈니스 워크플로우

**허용 의존성:**
- → Domain Layer (Entities, Services)
- → Ports (Interfaces only, not implementations)

**금지:**
- ❌ Infrastructure 구현체 직접 import
- ❌ HTTP, DB 라이브러리 직접 사용

**Use Case Pattern:**
```typescript
// application/use-cases/submission/submit-assignment.use-case.ts
export class SubmitAssignmentUseCase {
  constructor(
    private submissionRepo: ISubmissionRepository,  // Interface
    private assignmentRepo: IAssignmentRepository,
    private enrollmentChecker: EnrollmentCheckerService
  ) {}

  async execute(input: SubmitInput): Promise<Result<Submission, Error>> {
    // 1. Load domain entities
    const assignment = await this.assignmentRepo.findById(input.assignmentId);
    
    // 2. Check business rules
    const canSubmit = assignment.canAcceptSubmission(new Date());
    if (!canSubmit) return err(new LateSubmissionNotAllowed());
    
    // 3. Create entity
    const submission = Submission.create(input);
    
    // 4. Persist
    return ok(await this.submissionRepo.save(submission));
  }
}
```

### 3. Domain Layer

**책임:** 순수 비즈니스 로직

**허용 의존성:**
- → date-fns, ts-pattern만 (순수 유틸리티)

**금지:**
- ❌ 모든 Framework (Next.js, React, Hono 등)
- ❌ 모든 Infrastructure (Supabase, DB 등)
- ❌ Presentation 관련 모든 것

**Entity Pattern:**
```typescript
// domain/entities/assignment.entity.ts
export class Assignment {
  constructor(
    public readonly id: string,
    public title: string,
    public deadline: Deadline,  // Value Object
    public allowLateSubmission: boolean,
    public lateDeadline?: Deadline
  ) {}

  canAcceptSubmission(submittedAt: Date): boolean {
    return LateSubmissionService.validate(
      this.deadline,
      this.allowLateSubmission,
      this.lateDeadline,
      submittedAt
    );
  }
}
```

**Value Object Pattern:**
```typescript
// domain/value-objects/deadline.vo.ts
export class Deadline {
  private constructor(public readonly value: Date) {}

  static create(date: Date): Deadline {
    if (date < new Date()) throw new DomainException('Past deadline');
    return new Deadline(date);
  }

  isPassed(now = new Date()): boolean {
    return now > this.value;
  }
}
```

### 4. Infrastructure Layer

**책임:** 외부 시스템 연동

**허용 의존성:**
- → Domain Layer (Entities, VOs)
- → 모든 외부 라이브러리 (Supabase, etc.)

**Repository Pattern:**
```typescript
// infrastructure/persistence/repositories/submission.repository.ts
export class SupabaseSubmissionRepository implements ISubmissionRepository {
  constructor(private supabase: SupabaseClient) {}

  async save(submission: Submission): Promise<Submission> {
    const row = SubmissionMapper.toDatabase(submission);
    const { data } = await this.supabase.from('submissions').insert(row);
    return SubmissionMapper.toDomain(data);
  }
}
```

**Mapper Pattern:**
```typescript
// infrastructure/persistence/mappers/submission.mapper.ts
export class SubmissionMapper {
  static toDomain(row: SubmissionRow): Submission {
    return new Submission(
      row.id,
      row.assignment_id,
      row.learner_id,
      row.is_late
    );
  }

  static toDatabase(entity: Submission): SubmissionRow {
    return {
      id: entity.id,
      assignment_id: entity.assignmentId,
      learner_id: entity.learnerId,
      is_late: entity.isLate
    };
  }
}
```

**Dependency Injection (Manual DI 추천):**
```typescript
// infrastructure/di/container.ts
export class DIContainer {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  getSubmitAssignmentUseCase(): SubmitAssignmentUseCase {
    return new SubmitAssignmentUseCase(
      new SupabaseSubmissionRepository(this.supabase),
      new SupabaseAssignmentRepository(this.supabase),
      new EnrollmentCheckerService(this.getEnrollmentRepository())
    );
  }
}
```

**사용 예시:**
```typescript
// presentation/api/routes/submissions.routes.ts
const container = new DIContainer(supabase);
const submitUseCase = container.getSubmitAssignmentUseCase();
```

---

## Code Guidelines

### SOLID Principles
- Single Responsibility: 각 클래스는 하나의 책임만
- Use Case = 하나의 워크플로우
- Repository = 하나의 Entity 저장/조회

- Dependency Inversion: 상위 레이어는 하위 레이어의 interface에만 의존
- Interface Segregation: 큰 interface보다 작은 interface 여러 개

### TypeScript
- Strict mode 사용
- 모든 함수에 return type 명시
- any 금지, unknown 사용
- Interface > Type (객체 형태)

### Naming
- Entity: PascalCase (Course, Assignment)
- Value Object: PascalCase + .vo.ts
- Use Case: PascalCase + .use-case.ts
- Interface: I prefix (IRepository)

### Error Handling (neverthrow)
```typescript
import { Result, ok, err } from 'neverthrow';

async function execute(): Promise<Result<Data, Error>> {
  if (invalid) return err(new ValidationError());
  return ok(data);
}

// 사용
result.match(
  (data) => handleSuccess(data),
  (error) => handleError(error)
);
```

### Testing
- Unit Tests (Domain/Application)
- Integration Tests (Use Cases)

예시:
```typescript
// domain/services/late-submission.service.test.ts
describe('LateSubmissionService', () => {
  it('should allow submission before deadline', () => {
    const result = LateSubmissionService.validate(
      Deadline.create(tomorrow),
      false,
      undefined,
      today
    );
    expect(result.allowed).toBe(true);
    expect(result.isLate).toBe(false);
  });
});
```

---

## Supabase

### Migrations
- supabase/migrations/ 폴더에 SQL 파일
- 파일명: YYYYMMDDHHMMSS_description.sql
- 로컬 실행 금지, 클라우드에서만

### RLS Policies
- 모든 테이블에 RLS 활성화
- Infrastructure Layer의 최종 방어선

---

## Package Manager
- npm 사용
- package-lock.json 커밋

---

## Shadcn UI
- 새 컴포넌트 추가 시:
```bash
npx shadcn@latest add button
npx shadcn@latest add card
```

---

## Korean Text
- UTF-8 인코딩 확인
- 항상 한국어로 응답
