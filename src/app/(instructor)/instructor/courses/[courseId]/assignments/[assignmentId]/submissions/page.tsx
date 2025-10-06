import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SubmissionListTable } from '@/components/submissions/SubmissionListTable';

type PageProps = {
  params: Promise<{ courseId: string; assignmentId: string }>;
};

async function loadAssignmentWithSubmissions(courseId: string, assignmentId: string) {
  const supabase = await createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    redirect('/signin');
  }

  // 강사 권한 확인
  const { data: course } = await supabase
    .from('courses')
    .select('id, title, instructor_id')
    .eq('id', courseId)
    .maybeSingle();

  if (!course || course.instructor_id !== session.user.id) {
    redirect('/instructor/dashboard');
  }

  // 과제 정보 가져오기
  const { data: assignment } = await supabase
    .from('assignments')
    .select('id, title, description, due_date, allow_late_submission, late_submission_deadline')
    .eq('id', assignmentId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (!assignment) {
    redirect(`/instructor/courses/${courseId}/assignments`);
  }

  // 제출물 목록 가져오기 (학습자 정보 포함)
  const { data: submissions } = await supabase
    .from('submissions')
    .select(
      `
      id,
      content,
      file_url,
      submitted_at,
      is_late,
      status,
      learner_id,
      profiles!submissions_learner_id_fkey (
        id,
        name,
        email
      ),
      grades (
        id,
        score,
        feedback,
        graded_at
      )
    `
    )
    .eq('assignment_id', assignmentId)
    .order('submitted_at', { ascending: false });

  return {
    course,
    assignment,
    submissions: submissions || [],
  };
}

export default async function SubmissionsPage({ params }: PageProps) {
  const { courseId, assignmentId } = await params;
  const { course, assignment, submissions } = await loadAssignmentWithSubmissions(courseId, assignmentId);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center gap-4">
        <Link href={`/instructor/courses/${courseId}/assignments`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            과제 목록으로
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{assignment.title}</CardTitle>
          <CardDescription>
            {course.title} • 제출물 {submissions.length}개
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assignment.description && (
            <div className="mb-4 rounded-md bg-muted p-4">
              <p className="text-sm text-muted-foreground">{assignment.description}</p>
            </div>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-medium">마감일:</span>
              <span>{new Date(assignment.due_date).toLocaleString('ko-KR')}</span>
            </div>
            {assignment.allow_late_submission && assignment.late_submission_deadline && (
              <div className="flex items-center gap-2">
                <span className="font-medium">지각 제출 마감:</span>
                <span>{new Date(assignment.late_submission_deadline).toLocaleString('ko-KR')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>제출물 목록</CardTitle>
          <CardDescription>학습자들의 과제 제출물을 확인하고 채점하세요</CardDescription>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">아직 제출된 과제가 없습니다.</p>
            </div>
          ) : (
            <SubmissionListTable
              submissions={submissions}
              courseId={courseId}
              assignmentId={assignmentId}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
