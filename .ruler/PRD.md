# VMC_LMS - Product Requirements Document

## 1. 제품 개요

강사가 코스를 개설·운영하고, 학습자가 수강·과제 제출·피드백 수령까지 할 수 있는 경량 LMS 형태의 웹 앱.

**핵심 목표:**
1. 역할 기반 플로우의 정확한 가드 (Instructor/Learner)
2. 상태 기반 비즈니스 룰 구현 (마감/지각/재제출)
3. 문서 주도(Usecase) 개발 프로세스 실전 적용
4. 1일 내 전체 플로우 완성

**인증:** Supabase Auth 기반

---

## 2. Stakeholders

**Learner (학습자)**
- 코스 탐색/수강신청
- 과제 제출 (텍스트/파일)
- 점수/피드백 확인

**Instructor (강사)**
- 코스/과제 개설·운영
- 제출물 채점/피드백
- 재제출 관리

---

## 3. 포함 페이지

### Public
1. **홈/카탈로그**
   - 코스 리스트
   - 검색/필터 (카테고리, 난이도)
   - 정렬 (최신/인기)

2. **코스 상세**
   - 소개/커리큘럼
   - 강사 정보
   - 수강생 수/평균 평점
   - 수강신청/취소 버튼 (권한·상태 가드)

### Auth
3. **회원가입/로그인**
   - 이메일 기반 인증

4. **온보딩**
   - 역할 선택 (Instructor/Learner)
   - 최소 프로필 (이름)

### Learner Pages
5. **Learner 대시보드**
   - 내 코스 목록
   - 진행률
   - 마감 임박 과제
   - 최근 피드백

6. **Assignment 상세 (학습자)**
   - 요구사항/마감일
   - 점수 비중
   - 지각 정책 표시
   - 제출/재제출 UI
   - 상태 표시 (제출됨/지각/채점완료/재제출요청)

7. **성적/피드백 페이지**
   - 과제별 점수
   - 강사 피드백
   - 코스별 성적 요약

### Instructor Pages
8. **Instructor 대시보드**
   - 내 코스 목록
   - 채점 대기 수
   - 최근 제출물

9. **코스 관리**
   - 생성/수정
   - 상태 전환 (draft/published/archived)

10. **과제 관리**
    - 생성/수정
    - 게시 상태 관리 (draft/published/closed)
    - 제출물 테이블 (필터: 미채점/지각/재제출요청)
    - 채점/피드백 작성
    - 재제출 요청

---

## 4. Information Architecture

/ (Home - 카탈로그)
├─ /auth
│  ├─ /signin
│  └─ /signup
├─ /onboarding (역할 선택)
├─ /courses
│  ├─ /[courseId]
│  │  ├─ /about
│  │  └─ /enroll
│  └─ /my (Learner 전용)
│     └─ /[courseId]
│        ├─ /assignments
│        │  └─ /[assignmentId]
│        │     ├─ /submit
│        │     └─ /feedback
│        └─ /grades
└─ /instructor
├─ /dashboard
├─ /courses
│  ├─ /new
│  └─ /[courseId]/edit
└─ /assignments
├─ /new
└─ /[assignmentId]/submissions

---

## 5. 사용자 여정

### 5.1 Learner Journey

1. **회원가입/로그인**
   - 이메일 인증
   - 역할 선택: Learner
   - 프로필 완성

2. **코스 탐색**
   - 코스 카탈로그 검색/필터
   - 코스 상세 확인
   - 수강신청

3. **학습 & 과제**
   - 대시보드에서 마감 임박 과제 확인
   - 과제 상세 페이지 진입
   - 제출 (텍스트/파일)
   - 상태 변화 (제출됨/지각)

4. **성적 확인**
   - 성적/피드백 페이지
   - 재제출 요청 확인
   - 재제출 (필요 시)

### 5.2 Instructor Journey

1. **회원가입/로그인**
   - 이메일 인증
   - 역할 선택: Instructor
   - 프로필 완성

2. **코스 개설**
   - 코스 생성 (draft)
   - 정보 입력 (제목/설명/썸네일)
   - Published 전환

3. **과제 운영**
   - 과제 생성 (draft)
   - 마감일/지각 정책 설정
   - Published (게시)
   - 제출물 수집

4. **채점 & 피드백**
   - 제출물 검토
   - 점수 입력
   - 피드백 작성
   - 재제출 요청 (필요 시)

5. **과제 마감**
   - Closed 전환
   - 성적 정리

---

## 6. 상태 전환 규칙

### 코스 상태

draft → published → archived

**과제:**
draft → published → closed

**제출물:**
미제출 → 제출됨 → 채점완료
↓
지각 제출
↓
재제출 요청됨 → 재제출됨


---

## 7. 비즈니스 룰

### 7.1 역할 기반 접근 제어

**Instructor 전용:**
- 코스 생성/수정/삭제
- 과제 생성/수정/게시
- 제출물 조회/채점
- 피드백 작성/재제출 요청

**Learner 전용:**
- 수강 신청/취소
- 과제 제출/재제출
- 성적 조회

**가드 규칙:**
- Instructor는 Learner 페이지 접근 불가 (리다이렉트)
- Learner는 Instructor 페이지 접근 불가 (리다이렉트)
- 미인증 사용자는 로그인 페이지로 리다이렉트

### 7.2 수강 등록 기반 접근 제어

**규칙:**
- 등록한 코스만 과제 제출 가능
- 등록하지 않은 코스의 과제는 조회만 가능 (제출 버튼 비활성화)
- 수강 취소 시 제출했던 과제도 접근 불가

**체크 로직:**
```typescript
const isEnrolled = await checkEnrollment(userId, courseId);
if (!isEnrolled && action === 'submit') {
  return error('수강 신청이 필요합니다');
}
```

### 7.3 지각 제출 로직
**규칙:**
```typescript
function canSubmit(assignment, submittedAt) {
  const { due_date, allow_late_submission, late_submission_deadline } = assignment;
  
  // 1. 정시 제출
  if (submittedAt <= due_date) {
    return { allowed: true, is_late: false };
  }
  
  // 2. 지각 제출 허용 여부 체크
  if (!allow_late_submission) {
    return { allowed: false, reason: '마감 후 제출 불가' };
  }
  
  // 3. 지각 마감일 체크
  if (submittedAt <= late_submission_deadline) {
    return { allowed: true, is_late: true };
  }
  
  // 4. 지각 마감일 이후
  return { allowed: false, reason: '지각 마감일 초과' };
}
```
**표시:**

- 정시 제출: "제출 완료"
- 지각 제출: "제출 완료 (지각)" + 배지
- 제출 불가: "마감됨" + 사유

### 7.4 재제출 규칙
**조건:**

- Instructor가 "재제출 요청" 상태로 변경한 경우에만
- 재제출 시 이전 제출물 보관 (버전 관리)
- 재제출도 지각 제출 로직 적용

**상태 변화:**
- 채점완료 → (강사) 재제출 요청 → 재제출 요청됨
- 재제출 요청됨 → (학생) 재제출 → 재제출됨 → 채점 대기

## 8. 데이터베이스 스키마
**profiles**
```sql
id            UUID PRIMARY KEY
email         TEXT UNIQUE NOT NULL
name          TEXT NOT NULL
role          TEXT CHECK (role IN ('instructor', 'learner'))
onboarded     BOOLEAN DEFAULT FALSE
created_at    TIMESTAMPTZ DEFAULT NOW()
```
**courses**
```sql
id            UUID PRIMARY KEY
instructor_id UUID REFERENCES profiles(id)
title         TEXT NOT NULL
description   TEXT
thumbnail_url TEXT
status        TEXT CHECK (status IN ('draft', 'published', 'archived'))
created_at    TIMESTAMPTZ DEFAULT NOW()
```
**enrollments**
```sql
id            UUID PRIMARY KEY
course_id     UUID REFERENCES courses(id)
learner_id    UUID REFERENCES profiles(id)
enrolled_at   TIMESTAMPTZ DEFAULT NOW()
UNIQUE(course_id, learner_id)
```
**assignments**
```sql 
id                        UUID PRIMARY KEY
course_id                 UUID REFERENCES courses(id)
title                     TEXT NOT NULL
description               TEXT
due_date                  TIMESTAMPTZ NOT NULL
allow_late_submission     BOOLEAN DEFAULT FALSE
late_submission_deadline  TIMESTAMPTZ
status                    TEXT CHECK (status IN ('draft', 'published', 'closed'))
created_at                TIMESTAMPTZ DEFAULT NOW()
```
**submissions**
```sql
id              UUID PRIMARY KEY
assignment_id   UUID REFERENCES assignments(id)
learner_id      UUID REFERENCES profiles(id)
content         TEXT
file_url        TEXT
submitted_at    TIMESTAMPTZ DEFAULT NOW()
is_late         BOOLEAN DEFAULT FALSE
status          TEXT CHECK (status IN ('submitted', 'graded', 'resubmit_requested'))
UNIQUE(assignment_id, learner_id)
```
**grades**
```sql
id              UUID PRIMARY KEY
submission_id   UUID REFERENCES submissions(id) UNIQUE
score           NUMERIC
feedback        TEXT
graded_at       TIMESTAMPTZ DEFAULT NOW()
graded_by       UUID REFERENCES profiles(id)
```

## 9. 성공 지표
**기능 완성도**

 - 모든 페이지 에러 없이 로딩
 - Learner Journey 완주 (회원가입 → 수강 → 제출 → 성적)
 - Instructor Journey 완주 (회원가입 → 코스 생성 → 채점)
 - 지각 제출 로직 검증 (정시/지각/불가 케이스)
 - 재제출 플로우 검증

**권한 제어**

 - 역할별 페이지 접근 제어 동작
 - 수강 여부 기반 제출 제어 동작
 - RLS 정책 적용 확인

**배포**

 - Vercel 배포 성공
 - 데모 계정 2개 동작 (Instructor 1,2, Learner 1,2)
 - 공개 URL 접속 가능

## 10. 제약사항
**기술적 제약**
- 프레임워크: Next.js 14 App Router
- 데이터베이스: Supabase PostgreSQL
- 스토리지: Supabase Storage
- 배포: Vercel
- 인증: Supabase Auth

**비즈니스 제약**

- 무료 티어: Supabase Free + Vercel Hobby
- 초기 사용자: 데모용 (10명 미만)
- 콘텐츠: 텍스트 + 파일만 (비디오 제외)
- 결제: 없음 (모든 코스 무료)

**범위 제약 (MVP 제외)**

- 커리큘럼 빌더 (Sections/Lessons)
- 비디오 콘텐츠
- 결제 시스템
- 이메일 알림
- 리뷰/평점
- 수료증