import { notFound, redirect } from 'next/navigation';
import { AssignmentForm } from '@/components/assignments/AssignmentForm';
import { requireCourseOwnership, HttpError } from '@/lib/auth/guards';
import type { AssignmentRow } from '@/types/db';

type PageProps = {
  params: Promise<{ courseId: string; assignmentId: string }>;
};

async function loadAssignment(courseId: string, assignmentId: string): Promise<AssignmentRow | null> {
  try {
    const { supabase } = await requireCourseOwnership(courseId);

    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (error) {
      console.error('[assignment edit] failed to load assignment', { error, assignmentId, courseId });
      return null;
    }

    return data;
  } catch (error) {
    console.error('[assignment edit] unexpected error', { error, assignmentId, courseId });
    return null;
  }
}

export default async function EditAssignmentPage({ params }: PageProps) {
  const { courseId, assignmentId } = await params;

  try {
    await requireCourseOwnership(courseId);
  } catch (error) {
    if (error instanceof HttpError) {
      if (error.code === 401) {
        redirect('/signin');
      }
      redirect(`/instructor/courses/${courseId}/edit?alert=forbidden`);
    }
    throw error;
  }

  const assignment = await loadAssignment(courseId, assignmentId);

  if (!assignment) {
    notFound();
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 lg:py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">과제 수정</h1>
        <p className="text-sm text-muted-foreground">
          과제 정보를 수정하고 저장하세요. 게시 전까지는 학습자에게 표시되지 않습니다.
        </p>
      </header>

      <AssignmentForm
        mode="edit"
        courseId={courseId}
        assignmentId={assignmentId}
        initial={assignment}
      />
    </div>
  );
}
