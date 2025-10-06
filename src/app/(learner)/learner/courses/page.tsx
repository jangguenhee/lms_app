import { createSupabaseServerClient } from '@/lib/supabase/server';
import { CourseCard } from '@/components/courses/CourseCard';
import { EnrollButton } from '@/components/courses/EnrollButton';
import { EmptyState } from '@/components/courses/EmptyState';
import type { CourseRow } from '@/types/db';

export const dynamic = 'force-dynamic';

async function loadPublishedCourses() {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(24);

  if (error) {
    console.error('[courses] failed to load published courses', { error });
    throw new Error('코스 목록을 불러올 수 없습니다.');
  }

  return data ?? [];
}

async function loadEnrollmentStatus(courseIds: string[]) {
  if (courseIds.length === 0) return new Set<string>();

  const supabase = await createSupabaseServerClient();

  // Get current user - if not logged in or error, return empty set
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Set<string>();
  }

  const { data, error } = await supabase
    .from('enrollments')
    .select('course_id')
    .eq('learner_id', user.id)
    .in('course_id', courseIds);

  if (error) {
    console.error('[enrollments] failed to load enrollment status', { error, userId: user.id });
    return new Set<string>();
  }

  return new Set(data.map((e) => e.course_id));
}

export default async function CourseCatalogPage() {
  try {
    const courses = await loadPublishedCourses();

    if (courses.length === 0) {
      return (
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
          <header>
            <h1 className="text-3xl font-semibold">코스 카탈로그</h1>
            <p className="mt-2 text-sm text-muted-foreground">수강할 코스를 찾아보세요.</p>
          </header>
          <EmptyState
            title="아직 게시된 코스가 없습니다"
            description="곧 다양한 코스가 준비될 예정입니다."
          />
        </div>
      );
    }

    const courseIds = courses.map((c) => c.id);
    const enrolledCourseIds = await loadEnrollmentStatus(courseIds);

    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-3xl font-semibold">코스 카탈로그</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            수강할 코스를 찾아보세요. {courses.length}개의 코스가 있습니다.
          </p>
        </header>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCatalogItem
              key={course.id}
              course={course}
              initialEnrolled={enrolledCourseIds.has(course.id)}
            />
          ))}
        </div>
      </div>
    );
  } catch (error) {
    console.error('[courses catalog] unexpected error', { error });
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-destructive">
          코스 목록을 불러오는 중 오류가 발생했습니다
        </h1>
        <p className="text-sm text-muted-foreground">
          잠시 후 다시 시도하거나 문제가 지속되면 관리자에게 문의해주세요.
        </p>
      </div>
    );
  }
}

function CourseCatalogItem({
  course,
  initialEnrolled,
}: {
  course: CourseRow;
  initialEnrolled: boolean;
}) {
  const description = course.description
    ? course.description.substring(0, 120) + (course.description.length > 120 ? '...' : '')
    : '설명이 없습니다.';

  return (
    <div className="flex flex-col gap-4">
      <CourseCard course={course} href={`/courses/${course.id}`} showDescription={false} />
      <div className="px-6 pb-4">
        <p className="mb-4 text-sm text-muted-foreground">{description}</p>
        <EnrollButton courseId={course.id} initialEnrolled={initialEnrolled} className="w-full" />
      </div>
    </div>
  );
}
