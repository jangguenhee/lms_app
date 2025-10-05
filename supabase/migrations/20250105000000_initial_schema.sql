-- =====================================================
-- VMC_LMS Initial Schema Migration
-- Description: 회원가입, 코스, 과제, 제출, 채점 전체 플로우
-- Date: 2025-01-05
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- Utility Functions
-- =====================================================

-- 1. Updated_at Trigger Function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Fill Grader Name Function (for grades table)
CREATE OR REPLACE FUNCTION fill_grader_name()
RETURNS TRIGGER AS $$
BEGIN
  NEW.graded_by_name = (
    SELECT name FROM profiles WHERE id = NEW.graded_by
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 1. Profiles Table
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT CHECK (role IN ('instructor', 'learner')),
    onboarded BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger: updated_at auto-update
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: auto-create profile on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', 'User')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- RLS: Enable
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

-- =====================================================
-- 2. Courses Table
-- =====================================================
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index
CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);

-- Trigger: updated_at
CREATE TRIGGER courses_updated_at
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS: Enable
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view published courses"
    ON courses FOR SELECT
    USING (status = 'published');

CREATE POLICY "Instructors can view own courses"
    ON courses FOR SELECT
    USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can create courses"
    ON courses FOR INSERT
    WITH CHECK (auth.uid() = instructor_id);

CREATE POLICY "Instructors can update own courses"
    ON courses FOR UPDATE
    USING (auth.uid() = instructor_id);

CREATE POLICY "Instructors can delete own courses"
    ON courses FOR DELETE
    USING (auth.uid() = instructor_id);

-- =====================================================
-- 3. Enrollments Table
-- =====================================================
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    learner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(course_id, learner_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_enrollments_learner_id ON enrollments(learner_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);

-- RLS: Enable
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Learners can view own enrollments"
    ON enrollments FOR SELECT
    USING (auth.uid() = learner_id);

CREATE POLICY "Instructors can view course enrollments"
    ON enrollments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = enrollments.course_id
            AND courses.instructor_id = auth.uid()
        )
    );

CREATE POLICY "Learners can enroll in published courses"
    ON enrollments FOR INSERT
    WITH CHECK (
        auth.uid() = learner_id
        AND EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = enrollments.course_id
            AND courses.status = 'published'
        )
    );

CREATE POLICY "Learners can unenroll"
    ON enrollments FOR DELETE
    USING (auth.uid() = learner_id);

-- =====================================================
-- 4. Assignments Table
-- =====================================================
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    allow_late_submission BOOLEAN DEFAULT false NOT NULL,
    late_submission_deadline TIMESTAMPTZ,
    status TEXT CHECK (status IN ('draft', 'published', 'closed')) DEFAULT 'draft' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CHECK (
        late_submission_deadline IS NULL
        OR late_submission_deadline > due_date
    )
);

-- Index
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);

-- Trigger: updated_at
CREATE TRIGGER assignments_updated_at
    BEFORE UPDATE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS: Enable
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Learners can view enrolled published assignments"
    ON assignments FOR SELECT
    USING (
        status = 'published'
        AND EXISTS (
            SELECT 1 FROM enrollments
            WHERE enrollments.course_id = assignments.course_id
            AND enrollments.learner_id = auth.uid()
        )
    );

CREATE POLICY "Instructors can view own course assignments"
    ON assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = assignments.course_id
            AND courses.instructor_id = auth.uid()
        )
    );

CREATE POLICY "Instructors can create assignments"
    ON assignments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = assignments.course_id
            AND courses.instructor_id = auth.uid()
        )
    );

CREATE POLICY "Instructors can update own assignments"
    ON assignments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = assignments.course_id
            AND courses.instructor_id = auth.uid()
        )
    );

CREATE POLICY "Instructors can delete own assignments"
    ON assignments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = assignments.course_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- =====================================================
-- 5. Submissions Table
-- =====================================================
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    learner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT,
    file_url TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_late BOOLEAN DEFAULT false NOT NULL,
    status TEXT CHECK (status IN ('submitted', 'graded', 'resubmit_requested')) DEFAULT 'submitted' NOT NULL,
    resubmission_count INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(assignment_id, learner_id)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_learner_id ON submissions(learner_id);

-- Trigger: updated_at
CREATE TRIGGER submissions_updated_at
    BEFORE UPDATE ON submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS: Enable
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Learners can view own submissions"
    ON submissions FOR SELECT
    USING (auth.uid() = learner_id);

CREATE POLICY "Instructors can view course submissions"
    ON submissions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM assignments a
            JOIN courses c ON c.id = a.course_id
            WHERE a.id = submissions.assignment_id
            AND c.instructor_id = auth.uid()
        )
    );

CREATE POLICY "Learners can create submissions if enrolled and published"
    ON submissions FOR INSERT
    WITH CHECK (
        auth.uid() = learner_id
        AND EXISTS (
            SELECT 1
            FROM assignments a
            JOIN enrollments e ON e.course_id = a.course_id
            WHERE a.id = submissions.assignment_id
            AND e.learner_id = auth.uid()
            AND a.status = 'published'
        )
    );

CREATE POLICY "Learners can update own submissions"
    ON submissions FOR UPDATE
    USING (auth.uid() = learner_id);

-- =====================================================
-- 6. Grades Table
-- =====================================================
CREATE TABLE IF NOT EXISTS grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID UNIQUE NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    score NUMERIC CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
    feedback TEXT,
    graded_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    graded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    graded_by_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index
CREATE INDEX IF NOT EXISTS idx_grades_submission_id ON grades(submission_id);

-- Trigger 1: graded_by_name auto-fill
CREATE TRIGGER grades_fill_grader_name
    BEFORE INSERT OR UPDATE ON grades
    FOR EACH ROW
    EXECUTE FUNCTION fill_grader_name();

-- Trigger 2: updated_at
CREATE TRIGGER grades_updated_at
    BEFORE UPDATE ON grades
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS: Enable
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Learners can view own grades"
    ON grades FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM submissions
            WHERE submissions.id = grades.submission_id
            AND submissions.learner_id = auth.uid()
        )
    );

CREATE POLICY "Instructors can view course grades"
    ON grades FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM submissions s
            JOIN assignments a ON a.id = s.assignment_id
            JOIN courses c ON c.id = a.course_id
            WHERE s.id = grades.submission_id
            AND c.instructor_id = auth.uid()
        )
    );

CREATE POLICY "Instructors can create grades"
    ON grades FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM submissions s
            JOIN assignments a ON a.id = s.assignment_id
            JOIN courses c ON c.id = a.course_id
            WHERE s.id = grades.submission_id
            AND c.instructor_id = auth.uid()
        )
    );

CREATE POLICY "Instructors can update grades"
    ON grades FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM submissions s
            JOIN assignments a ON a.id = s.assignment_id
            JOIN courses c ON c.id = a.course_id
            WHERE s.id = grades.submission_id
            AND c.instructor_id = auth.uid()
        )
    );

-- =====================================================
-- RLS Helper Functions (테이블 생성 후 정의)
-- =====================================================

-- 코스 소유 instructor 여부
CREATE OR REPLACE FUNCTION public.is_course_instructor(cid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = cid AND c.instructor_id = auth.uid()
  );
$$;

-- 코스 수강 여부
CREATE OR REPLACE FUNCTION public.is_enrolled(cid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.enrollments e
    WHERE e.course_id = cid AND e.learner_id = auth.uid()
  );
$$;

-- 과제 소유 instructor 여부
CREATE OR REPLACE FUNCTION public.is_assignment_instructor(aid UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.assignments a
    JOIN public.courses c ON c.id = a.course_id
    WHERE a.id = aid AND c.instructor_id = auth.uid()
  );
$$;

-- =====================================================
-- Migration Complete
-- =====================================================
