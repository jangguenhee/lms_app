import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { HttpError } from '@/lib/auth/guards';
import type { AssignmentRow, SubmissionRow } from '@/types/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarIcon, ClockIcon } from 'lucide-react';

export const dynamic = 'force-dynamic';

type AssignmentWithSubmission = AssignmentRow & {
  submission?: SubmissionRow | null;
};

async function loadAssignments(courseId: string): Promise<AssignmentWithSubmission[]> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    throw new HttpError(401, '로그인이 필요합니다.');
  }

  const userId = session.user.id;

  // 수강 여부 확인
  const { data: enrollment, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('learner_id', userId)
    .maybeSingle();

  if (enrollmentError || !enrollment) {
    throw new HttpError(403, '이 코스에 수강 신청을 하지 않았습니다.');
  }

  // 과제 목록 조회
  const { data: assignments, error: assignmentsError } = await supabase
    .from('assignments')
    .select('*')
    .eq('course_id', courseId)
    .eq('status', 'published')
    .order('due_date', { ascending: true });

  if (assignmentsError) {
    console.error('[assignments] failed to load', { error: assignmentsError, courseId });
    throw new HttpError(500, '과제를 불러오는 중 오류가 발생했습니다.');
  }

  if (!assignments || assignments.length === 0) {
    return [];
  }

  // 제출 내역 조회
  const assignmentIds = assignments.map((a) => a.id);
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .in('assignment_id', assignmentIds)
    .eq('learner_id', userId);

  const submissionMap = new Map<string, SubmissionRow>();
  submissions?.forEach((s) => {
    submissionMap.set(s.assignment_id, s);
  });

  return assignments.map((a) => ({
    ...a,
    submission: submissionMap.get(a.id) ?? null,
  }));
}

type Props = {
  params: Promise<{ courseId: string }>;
};

export default async function LearnerAssignmentsPage({ params }: Props) {
  const { courseId } = await params;

  try {
    const assignments = await loadAssignments(courseId);

    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-3xl font-semibold">과제 목록</h1>
          <p className="text-sm text-muted-foreground">제출해야 할 과제를 확인하고 제출하세요.</p>
        </header>

        {assignments.length === 0 ? (
          <Card>
            <CardContent className="flex min-h-[200px] items-center justify-center">
              <p className="text-muted-foreground">아직 게시된 과제가 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <AssignmentListItem key={assignment.id} assignment={assignment} courseId={courseId} />
            ))}
          </div>
        )}
      </div>
    );
  } catch (error) {
    if (error instanceof HttpError) {
      return (
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-destructive">
            {error.code === 403 ? '수강 신청이 필요합니다' : '오류가 발생했습니다'}
          </h1>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      );
    }

    console.error('[assignments] unexpected error', { error, courseId });
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-destructive">과제를 불러오는 중 오류가 발생했습니다</h1>
        <p className="text-sm text-muted-foreground">
          잠시 후 다시 시도하거나 문제가 지속되면 관리자에게 문의해주세요.
        </p>
      </div>
    );
  }
}

function AssignmentListItem({
  assignment,
  courseId,
}: {
  assignment: AssignmentWithSubmission;
  courseId: string;
}) {
  const dueDate = new Date(assignment.due_date);
  const now = new Date();
  const isPastDue = now > dueDate;
  const hasSubmission = !!assignment.submission;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl">{assignment.title}</CardTitle>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-4 w-4" />
                <span>마감: {dueDate.toLocaleString()}</span>
              </div>
              {assignment.allow_late_submission && assignment.late_submission_deadline && (
                <div className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />
                  <span>지각 마감: {new Date(assignment.late_submission_deadline).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
          <SubmissionStatusBadge
            hasSubmission={hasSubmission}
            isLate={assignment.submission?.is_late ?? false}
            isPastDue={isPastDue}
          />
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
          {assignment.description ?? '설명이 없습니다.'}
        </p>
        <Link
          href={`/learner/courses/${courseId}/assignments/${assignment.id}`}
          className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
        >
          {hasSubmission ? '제출 내역 보기' : '과제 제출하기'}
        </Link>
      </CardContent>
    </Card>
  );
}

function SubmissionStatusBadge({
  hasSubmission,
  isLate,
  isPastDue,
}: {
  hasSubmission: boolean;
  isLate: boolean;
  isPastDue: boolean;
}) {
  if (!hasSubmission && isPastDue) {
    return (
      <span className="inline-flex items-center rounded-full border border-red-200 bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
        미제출 (기한 초과)
      </span>
    );
  }

  if (!hasSubmission) {
    return (
      <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
        미제출
      </span>
    );
  }

  if (isLate) {
    return (
      <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
        제출 완료 (지각)
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-green-200 bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
      제출 완료
    </span>
  );
}
