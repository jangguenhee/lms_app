import Link from 'next/link';
import { requireInstructor, HttpError } from '@/lib/auth/guards';
import { CourseCard } from '@/components/courses/CourseCard';
import { PublishButton } from '@/components/courses/PublishButton';
import { EmptyState } from '@/components/courses/EmptyState';
import type { CourseRow } from '@/types/db';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function loadInstructorCourses(): Promise<CourseRow[]> {
  const { supabase, user } = await requireInstructor();

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('instructor_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[dashboard] failed to load courses', { error, userId: user.id });
    throw new HttpError(500, '코스를 불러오는 중 오류가 발생했습니다.');
  }

  return data ?? [];
}

export default async function InstructorDashboardPage() {
  try {
    const courses = await loadInstructorCourses();

    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">내 코스</h1>
            <p className="text-sm text-muted-foreground">
              생성한 코스를 확인하고, 편집하거나 게시를 완료하세요.
            </p>
          </div>
          <Link
            href="/instructor/courses/new"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            새 코스 만들기
          </Link>
        </header>

        {courses.length === 0 ? (
          <EmptyState
            title="아직 생성된 코스가 없습니다."
            description="첫 번째 코스를 만들어 학습자에게 제공해 보세요!"
            actionLabel="코스 생성하기"
            actionHref="/instructor/courses/new"
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseDashboardItem key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    if (error instanceof HttpError && error.code === 401) {
      // requireInstructor 내부에서 리다이렉트 처리
      return null;
    }

    console.error('[dashboard] unexpected error', { error });
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-destructive">코스를 불러오는 중 오류가 발생했습니다</h1>
        <p className="text-sm text-muted-foreground">
          잠시 후 다시 시도하거나 문제가 지속되면 관리자에게 문의해주세요.
        </p>
      </div>
    );
  }
}

function CourseDashboardItem({ course }: { course: CourseRow }) {
  const createdAt = new Date(course.created_at);

  return (
    <div className="flex flex-col gap-4">
      <CourseCard course={course} href={`/instructor/courses/${course.id}/edit`} />
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/instructor/courses/${course.id}/edit`}
          className={cn(
            'inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm',
            'hover:bg-accent hover:text-accent-foreground',
          )}
        >
          편집
        </Link>
        <Link
          href={`/instructor/courses/${course.id}/assignments/new`}
          className={cn(
            'inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm',
            'hover:bg-accent hover:text-accent-foreground',
          )}
        >
          과제 관리
        </Link>
        {course.status === 'draft' ? (
          <PublishButton courseId={course.id} status={course.status} />
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">생성일: {createdAt.toLocaleDateString()}</p>
    </div>
  );
}

function ButtonPlaceholder({ label }: { label: string }) {
  return (
    <span className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-muted px-3 text-sm font-medium text-muted-foreground">
      {label}
    </span>
  );
}
