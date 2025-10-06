-- =====================================================
-- VMC_LMS RLS 디버깅 SQL
-- =====================================================

-- 1. 현재 적용된 RLS 정책 확인
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('profiles', 'courses', 'enrollments', 'assignments', 'submissions', 'grades')
ORDER BY tablename, policyname;

-- 2. 특정 사용자의 role 확인 (YOUR_USER_ID를 실제 UUID로 교체)
-- SELECT id, email, name, role, onboarded FROM profiles WHERE id = 'YOUR_USER_ID';

-- 3. RLS가 활성화되어 있는지 확인
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'courses', 'enrollments', 'assignments', 'submissions', 'grades');

-- 4. 강사로 코스 생성 테스트 (강사 계정으로 로그인한 상태에서 실행)
-- INSERT INTO courses (instructor_id, title, description, status)
-- VALUES (auth.uid(), '테스트 코스', '테스트 설명', 'draft')
-- RETURNING *;

-- 5. 현재 로그인된 사용자 확인
SELECT auth.uid() as current_user_id;

-- 6. profiles 테이블에서 현재 사용자 정보 확인
SELECT
    id,
    email,
    name,
    role,
    onboarded,
    created_at
FROM profiles
WHERE id = auth.uid();
