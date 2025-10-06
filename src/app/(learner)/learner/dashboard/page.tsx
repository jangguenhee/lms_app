import Link from 'next/link';
import { requireLearner, HttpError } from '@/lib/auth/guards';
import { MyCourseCard } from '@/components/courses/MyCourseCard';
import { EmptyState } from '@/components/courses/EmptyState';
import { Button } from '@/components/ui/button';
import { UpcomingAssignments } from '@/components/dashboard/UpcomingAssignments';
import { ProgressCard } from '@/components/dashboard/ProgressCard';
import { RecentFeedback } from '@/components/dashboard/RecentFeedback';
import type { CourseRow } from '@/types/db';

export const dynamic = 'force-dynamic';

type DashboardData = {
  courses: CourseRow[];
  upcomingAssignments: Array<{
    id: string;
    course_id: string;
    title: string;
    due_date: string;
    course_title: string;
  }>;
  progressStats: {
    totalAssignments: number;
    submittedAssignments: number;
    averageScore: number | null;
  };
  recentFeedback: Array<{
    id: string;
    assignment_title: string;
    course_title: string;
    course_id: string;
    assignment_id: string;
    score: number;
    feedback: string | null;
    graded_at: string;
  }>;
};

async function loadDashboardData(): Promise<DashboardData> {
  const { supabase, user } = await requireLearner();

  // 1. Load enrolled courses
  const coursesResponse = await supabase
    .from('enrollments')
    .select(
      `
      course_id,
      courses:course_id (
        id,
        instructor_id,
        title,
        description,
        thumbnail_url,
        status,
        created_at,
        updated_at
      )
    `,
    )
    .eq('learner_id', user.id)
    .order('enrolled_at', { ascending: false });

  if (coursesResponse.error) {
    console.error('[dashboard] failed to load courses', {
      error: coursesResponse.error,
      userId: user.id,
    });
    throw new HttpError(500, '수강 중인 코스를 불러오지 못했습니다.');
  }

  const courses: CourseRow[] = (coursesResponse.data ?? [])
    .map((enrollment: any) => enrollment.courses)
    .filter((course: any): course is CourseRow => course !== null);

  const courseIds = courses.map((c) => c.id);

  // 2. Load upcoming assignments (due within 7 days, not submitted yet)
  let upcomingAssignments: DashboardData['upcomingAssignments'] = [];
  if (courseIds.length > 0) {
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const assignmentsResponse = await supabase
      .from('assignments')
      .select(
        `
        id,
        course_id,
        title,
        due_date,
        courses:course_id (
          title
        )
      `,
      )
      .in('course_id', courseIds)
      .eq('status', 'published')
      .gte('due_date', new Date().toISOString())
      .lte('due_date', sevenDaysFromNow.toISOString())
      .order('due_date', { ascending: true })
      .limit(5);

    if (!assignmentsResponse.error && assignmentsResponse.data) {
      // Filter out assignments already submitted
      const submissionsResponse = await supabase
        .from('submissions')
        .select('assignment_id')
        .eq('learner_id', user.id)
        .in(
          'assignment_id',
          assignmentsResponse.data.map((a: any) => a.id),
        );

      const submittedAssignmentIds = new Set(
        (submissionsResponse.data ?? []).map((s: any) => s.assignment_id),
      );

      upcomingAssignments = assignmentsResponse.data
        .filter((a: any) => !submittedAssignmentIds.has(a.id))
        .map((a: any) => ({
          id: a.id,
          course_id: a.course_id,
          title: a.title,
          due_date: a.due_date,
          course_title: a.courses?.title ?? '알 수 없는 코스',
        }));
    }
  }

  // 3. Calculate progress stats
  let progressStats: DashboardData['progressStats'] = {
    totalAssignments: 0,
    submittedAssignments: 0,
    averageScore: null,
  };

  if (courseIds.length > 0) {
    // Total assignments
    const totalAssignmentsResponse = await supabase
      .from('assignments')
      .select('id', { count: 'exact', head: true })
      .in('course_id', courseIds)
      .eq('status', 'published');

    progressStats.totalAssignments = totalAssignmentsResponse.count ?? 0;

    // Submitted assignments
    const submittedResponse = await supabase
      .from('submissions')
      .select('id, assignment_id', { count: 'exact' })
      .eq('learner_id', user.id);

    if (!submittedResponse.error) {
      // Filter submissions for enrolled courses only
      const enrolledAssignmentsResponse = await supabase
        .from('assignments')
        .select('id')
        .in('course_id', courseIds);

      const enrolledAssignmentIds = new Set(
        (enrolledAssignmentsResponse.data ?? []).map((a: any) => a.id),
      );

      progressStats.submittedAssignments = (submittedResponse.data ?? []).filter((s: any) =>
        enrolledAssignmentIds.has(s.assignment_id),
      ).length;
    }

    // Average score
    const gradesResponse = await supabase
      .from('grades')
      .select(
        `
        score,
        submissions:submission_id (
          assignment_id
        )
      `,
      )
      .eq('submissions.learner_id', user.id);

    if (!gradesResponse.error && gradesResponse.data && gradesResponse.data.length > 0) {
      const scores = gradesResponse.data
        .filter((g: any) => g.score !== null)
        .map((g: any) => g.score);
      if (scores.length > 0) {
        progressStats.averageScore =
          scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
      }
    }
  }

  // 4. Load recent feedback (last 3)
  let recentFeedback: DashboardData['recentFeedback'] = [];
  if (courseIds.length > 0) {
    const feedbackResponse = await supabase
      .from('grades')
      .select(
        `
        id,
        score,
        feedback,
        graded_at,
        submissions:submission_id (
          assignment_id,
          assignments:assignment_id (
            title,
            course_id,
            courses:course_id (
              title
            )
          )
        )
      `,
      )
      .order('graded_at', { ascending: false })
      .limit(3);

    if (!feedbackResponse.error && feedbackResponse.data) {
      recentFeedback = feedbackResponse.data
        .filter((g: any) => g.submissions?.assignments)
        .map((g: any) => ({
          id: g.id,
          assignment_title: g.submissions.assignments.title,
          course_title: g.submissions.assignments.courses?.title ?? '알 수 없는 코스',
          course_id: g.submissions.assignments.course_id,
          assignment_id: g.submissions.assignment_id,
          score: g.score,
          feedback: g.feedback,
          graded_at: g.graded_at,
        }));
    }
  }

  return {
    courses,
    upcomingAssignments,
    progressStats,
    recentFeedback,
  };
}

export default async function LearnerDashboardPage() {
  try {
    const { courses, upcomingAssignments, progressStats, recentFeedback } =
      await loadDashboardData();

    if (courses.length === 0) {
      return (
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">대시보드</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                아직 수강 중인 코스가 없습니다.
              </p>
            </div>
            <Button asChild>
              <Link href="/courses">코스 둘러보기</Link>
            </Button>
          </header>

          <EmptyState
            title="수강 중인 코스가 없습니다"
            description="코스 카탈로그에서 관심 있는 코스를 찾아보세요."
            action={
              <Button asChild className="mt-6">
                <Link href="/courses">코스 카탈로그 보기</Link>
              </Button>
            }
          />
        </div>
      );
    }

    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-3xl font-semibold">대시보드</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {courses.length}개의 코스를 수강 중입니다.
          </p>
        </header>

        {/* Stats & Upcoming */}
        <div className="grid gap-6 md:grid-cols-2">
          <ProgressCard stats={progressStats} />
          <UpcomingAssignments assignments={upcomingAssignments} />
        </div>

        {/* Recent Feedback */}
        {recentFeedback.length > 0 && (
          <div>
            <RecentFeedback feedbacks={recentFeedback} />
          </div>
        )}

        {/* My Courses */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold">내 코스</h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/courses">더 많은 코스 찾기</Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <MyCourseCard key={course.id} course={course} />
            ))}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof HttpError && error.code === 401) {
      return null;
    }

    console.error('[learner dashboard] unexpected error', { error });
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-destructive">
          대시보드를 불러오는 중 오류가 발생했습니다
        </h1>
        <p className="text-sm text-muted-foreground">
          잠시 후 다시 시도하거나 문제가 지속되면 관리자에게 문의해주세요.
        </p>
      </div>
    );
  }
}
