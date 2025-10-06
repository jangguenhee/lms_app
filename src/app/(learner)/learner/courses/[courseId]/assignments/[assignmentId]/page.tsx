import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { HttpError } from '@/lib/auth/guards';
import type { AssignmentRow, SubmissionRow } from '@/types/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SubmissionForm } from '@/components/submissions/SubmissionForm';
import { CalendarIcon, ClockIcon, CheckCircle2, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

type AssignmentWithSubmission = {
  assignment: AssignmentRow;
  submission: SubmissionRow | null;
};

async function loadAssignmentWithSubmission(
  courseId: string,
  assignmentId: string
): Promise<AssignmentWithSubmission> {
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

  // 과제 조회
  const { data: assignment, error: assignmentError } = await supabase
    .from('assignments')
    .select('*')
    .eq('id', assignmentId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (assignmentError || !assignment) {
    throw new HttpError(404, '과제를 찾을 수 없습니다.');
  }

  // 제출 내역 조회
  const { data: submission } = await supabase
    .from('submissions')
    .select('*')
    .eq('assignment_id', assignmentId)
    .eq('learner_id', userId)
    .maybeSingle();

  return {
    assignment,
    submission: submission ?? null,
  };
}

type Props = {
  params: Promise<{ courseId: string; assignmentId: string }>;
};

export default async function LearnerAssignmentDetailPage({ params }: Props) {
  const { courseId, assignmentId } = await params;

  try {
    const { assignment, submission } = await loadAssignmentWithSubmission(courseId, assignmentId);

    const dueDate = new Date(assignment.due_date);
    const now = new Date();
    const isPastDue = now > dueDate;
    const canSubmit = !submission && (!isPastDue || assignment.allow_late_submission);

    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <header>
          <h1 className="text-3xl font-semibold">{assignment.title}</h1>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>과제 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>마감일: {dueDate.toLocaleString()}</span>
              {isPastDue && (
                <span className="ml-2 text-red-600 font-medium">(마감 기한 초과)</span>
              )}
            </div>

            {assignment.allow_late_submission && assignment.late_submission_deadline && (
              <div className="flex items-center gap-2 text-sm">
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
                <span>지각 마감일: {new Date(assignment.late_submission_deadline).toLocaleString()}</span>
              </div>
            )}

            {assignment.description && (
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-medium">과제 설명</h3>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {assignment.description}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {submission ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>제출 완료</CardTitle>
                {submission.is_late ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-100 px-3 py-1 text-xs font-medium text-orange-800">
                    <AlertCircle className="h-3 w-3" />
                    지각 제출
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                    <CheckCircle2 className="h-3 w-3" />
                    정시 제출
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  제출 시간: {new Date(submission.submitted_at).toLocaleString()}
                </p>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-medium">제출 내용</h3>
                <p className="whitespace-pre-wrap rounded-md border bg-muted/50 p-4 text-sm">
                  {submission.content}
                </p>
              </div>

              {submission.file_url && (
                <div>
                  <h3 className="mb-2 text-sm font-medium">첨부 파일</h3>
                  <a
                    href={submission.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    {submission.file_url}
                  </a>
                </div>
              )}

              <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                제출이 완료되었습니다. 강사의 채점을 기다려주세요.
              </div>
            </CardContent>
          </Card>
        ) : canSubmit ? (
          <div>
            <h2 className="mb-4 text-xl font-semibold">과제 제출</h2>
            <SubmissionForm courseId={courseId} assignmentId={assignmentId} />
          </div>
        ) : (
          <Card>
            <CardContent className="flex min-h-[200px] items-center justify-center">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
                <p className="mt-4 text-lg font-medium text-destructive">제출 기한이 지났습니다</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {assignment.allow_late_submission
                    ? '지각 마감일도 초과했습니다.'
                    : '이 과제는 지각 제출이 허용되지 않습니다.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  } catch (error) {
    if (error instanceof HttpError) {
      return (
        <div className="mx-auto flex max-w-4xl flex-col gap-3 px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-destructive">
            {error.code === 403
              ? '수강 신청이 필요합니다'
              : error.code === 404
                ? '과제를 찾을 수 없습니다'
                : '오류가 발생했습니다'}
          </h1>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      );
    }

    console.error('[assignment-detail] unexpected error', { error, courseId, assignmentId });
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
