import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type PageProps = {
  params: Promise<{ courseId: string }>;
};

async function loadCourseWithAssignments(courseId: string) {
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

  // 과제 목록 가져오기
  const { data: assignments } = await supabase
    .from('assignments')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

  return {
    course,
    assignments: assignments || [],
  };
}

export default async function AssignmentsPage({ params }: PageProps) {
  const { courseId } = await params;
  const { course, assignments } = await loadCourseWithAssignments(courseId);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/instructor/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              대시보드로
            </Button>
          </Link>
        </div>
        <Link href={`/instructor/courses/${courseId}/assignments/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            새 과제 만들기
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold">{course.title}</h1>
        <p className="text-muted-foreground">과제 관리</p>
      </div>

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">아직 생성된 과제가 없습니다.</p>
            <Link href={`/instructor/courses/${courseId}/assignments/new`}>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                첫 과제 만들기
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{assignment.title}</CardTitle>
                    <CardDescription>{assignment.description}</CardDescription>
                  </div>
                  <AssignmentStatusBadge status={assignment.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <p>마감일: {new Date(assignment.due_date).toLocaleString('ko-KR')}</p>
                    {assignment.allow_late_submission && assignment.late_submission_deadline && (
                      <p>지각 마감: {new Date(assignment.late_submission_deadline).toLocaleString('ko-KR')}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/instructor/courses/${courseId}/assignments/${assignment.id}/edit`}>
                      <Button variant="outline" size="sm">
                        수정
                      </Button>
                    </Link>
                    <Link href={`/instructor/courses/${courseId}/assignments/${assignment.id}/submissions`}>
                      <Button variant="default" size="sm">
                        제출물 보기
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AssignmentStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'draft':
      return <Badge variant="secondary">초안</Badge>;
    case 'published':
      return <Badge variant="default">게시됨</Badge>;
    case 'closed':
      return <Badge variant="outline">마감됨</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
