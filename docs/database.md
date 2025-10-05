# VMC_LMS - Database Schema

## Overview

VMC_LMS는 Supabase PostgreSQL을 사용하며, 6개의 핵심 테이블로 구성됩니다.

---

## 테이블 구조

### 1. profiles
**목적**: auth.users 확장, 역할 및 온보딩 상태 관리

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK, FK → auth.users | 사용자 ID |
| email | TEXT | UNIQUE, NOT NULL | 이메일 |
| name | TEXT | NOT NULL | 이름 |
| role | TEXT | CHECK (instructor/learner) | 역할 |
| onboarded | BOOLEAN | DEFAULT false | 온보딩 완료 여부 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 생성 시각 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 수정 시각 |

**Trigger**: auth.users 생성 시 자동 INSERT

---

### 2. courses
**목적**: 코스 메타데이터

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 코스 ID |
| instructor_id | UUID | FK → profiles, NOT NULL | 강사 ID |
| title | TEXT | NOT NULL | 제목 (1-200자) |
| description | TEXT | | 설명 (10-5000자) |
| thumbnail_url | TEXT | | 썸네일 URL |
| status | TEXT | CHECK (draft/published/archived), DEFAULT 'draft' | 상태 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 생성 시각 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 수정 시각 |

**인덱스**: instructor_id, status  
**Cascade**: instructor 삭제 시 코스 삭제

---

### 3. enrollments
**목적**: 수강 신청 관계

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 수강신청 ID |
| course_id | UUID | FK → courses, NOT NULL | 코스 ID |
| learner_id | UUID | FK → profiles, NOT NULL | 학습자 ID |
| enrolled_at | TIMESTAMPTZ | DEFAULT NOW() | 수강 신청 시각 |

**제약**: UNIQUE(course_id, learner_id) - 중복 신청 방지  
**인덱스**: learner_id, course_id  
**Cascade**: course 또는 learner 삭제 시 enrollment 삭제

---

### 4. assignments
**목적**: 과제 정보

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 과제 ID |
| course_id | UUID | FK → courses, NOT NULL | 코스 ID |
| title | TEXT | NOT NULL | 제목 (1-200자) |
| description | TEXT | | 설명 (10-5000자) |
| due_date | TIMESTAMPTZ | NOT NULL | 마감일 |
| allow_late_submission | BOOLEAN | DEFAULT false | 지각 제출 허용 |
| late_submission_deadline | TIMESTAMPTZ | | 지각 마감일 |
| status | TEXT | CHECK (draft/published/closed), DEFAULT 'draft' | 상태 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 생성 시각 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 수정 시각 |

**인덱스**: course_id  
**Cascade**: course 삭제 시 assignment 삭제

---

### 5. submissions
**목적**: 과제 제출물

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 제출물 ID |
| assignment_id | UUID | FK → assignments, NOT NULL | 과제 ID |
| learner_id | UUID | FK → profiles, NOT NULL | 학습자 ID |
| content | TEXT | | 텍스트 내용 (최대 10,000자) |
| file_url | TEXT | | 파일 URL |
| submitted_at | TIMESTAMPTZ | DEFAULT NOW() | 제출 시각 |
| is_late | BOOLEAN | DEFAULT false | 지각 여부 |
| status | TEXT | CHECK (submitted/graded/resubmit_requested), DEFAULT 'submitted' | 상태 |
| resubmission_count | INTEGER | DEFAULT 0 | 재제출 횟수 |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 생성 시각 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 수정 시각 |

**제약**: UNIQUE(assignment_id, learner_id) - 과제당 1개 제출  
**인덱스**: assignment_id, learner_id  
**Cascade**: assignment 또는 learner 삭제 시 submission 삭제

---

### 6. grades
**목적**: 채점 결과

| 컬럼 | 타입 | 제약 | 설명 |
|------|------|------|------|
| id | UUID | PK | 성적 ID |
| submission_id | UUID | FK → submissions, UNIQUE, NOT NULL | 제출물 ID |
| score | NUMERIC | CHECK (0 <= score <= 100) | 점수 |
| feedback | TEXT | | 피드백 (최대 5,000자) |
| graded_at | TIMESTAMPTZ | DEFAULT NOW() | 채점 시각 |
| graded_by | UUID | FK → profiles, NOT NULL | 채점자 ID |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | 생성 시각 |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | 수정 시각 |

**제약**: submission_id UNIQUE - 제출물당 1개 성적  
**인덱스**: submission_id  
**Cascade**: submission 삭제 시 grade 삭제

---

## ERD
```mermaid
erDiagram
    auth_users ||--|| profiles : "1:1"
    profiles ||--o{ courses : "instructor creates"
    profiles ||--o{ enrollments : "learner enrolls"
    courses ||--o{ enrollments : "has students"
    courses ||--o{ assignments : "contains"
    assignments ||--o{ submissions : "receives"
    profiles ||--o{ submissions : "learner submits"
    submissions ||--|| grades : "1:1"
    profiles ||--o{ grades : "instructor grades"

    auth_users {
        uuid id PK
        text email
    }
    
    profiles {
        uuid id PK_FK
        text email UK
        text name
        text role
        boolean onboarded
        timestamptz created_at
        timestamptz updated_at
    }
    
    courses {
        uuid id PK
        uuid instructor_id FK
        text title
        text description
        text thumbnail_url
        text status
        timestamptz created_at
        timestamptz updated_at
    }
    
    enrollments {
        uuid id PK
        uuid course_id FK
        uuid learner_id FK
        timestamptz enrolled_at
    }
    
    assignments {
        uuid id PK
        uuid course_id FK
        text title
        text description
        timestamptz due_date
        boolean allow_late_submission
        timestamptz late_submission_deadline
        text status
        timestamptz created_at
        timestamptz updated_at
    }
    
    submissions {
        uuid id PK
        uuid assignment_id FK
        uuid learner_id FK
        text content
        text file_url
        timestamptz submitted_at
        boolean is_late
        text status
        integer resubmission_count
        timestamptz created_at
        timestamptz updated_at
    }
    
    grades {
        uuid id PK
        uuid submission_id FK_UK
        numeric score
        text feedback
        timestamptz graded_at
        uuid graded_by FK
        timestamptz created_at
        timestamptz updated_at
    }
```


### RLS 정책
#### profiles

- SELECT: 본인만 (`auth.uid() = id`)
- UPDATE: 본인만
- INSERT: 시스템 (Trigger)
- DELETE: 금지

#### courses

- SELECT:
  -  `status = 'published'` → 전체 public
  -   `status IN ('draft', 'archived')`→ instructor 본인만

- INSERT: instructor만 (`instructor_id = auth.uid()`)
- UPDATE: 소유 instructor만
- DELETE: 소유 instructor만

#### enrollments

- SELECT: 본인 + 코스 소유 instructor
- INSERT: learner만 (`learner_id = auth.uid()`)
- UPDATE: 금지
- DELETE: 본인만 (수강 취소)

#### assignments

- SELECT:

    - `status = 'published'` → 해당 코스 수강생
    - `status IN ('draft', 'closed')` → 코스 소유 instructor만

- INSERT: 코스 소유 instructor만
- UPDATE: 코스 소유 instructor만
- DELETE: 코스 소유 instructor만

#### submissions

- SELECT: 본인 + 과제 소유 instructor
- INSERT: 본인 learner (enrollment 확인은 서버)
- UPDATE: 본인 learner (재제출 시)
- DELETE: 금지

#### grades

- SELECT: submission 소유 learner + 과제 소유 instructor
- INSERT: 과제 소유 instructor만
- UPDATE: 과제 소유 instructor만
- DELETE: 금지


#### 비즈니스 룰 (서버 검증)
애플리케이션 레벨 검증

- 지각 마감일 검증: `late_submission_deadline > due_date`
- 제출물 내용: `content` OR `file_url` 최소 1개 필수
- 재제출 권한: `status = 'resubmit_requested'` 체크
- 수강 여부: 과제 제출 시 `enrollments` 존재 확인


#### Phase 2 확장 계획

 - `submission_history` 테이블 (재제출 이력)
 - Supabase Storage 버킷 정책
 - 성적 통계 Materialized View
 - `notifications` 테이블
- `assignments.order `컬럼 (과제 순서)
-  `courses.max_students` 컬럼 (정원 제한)