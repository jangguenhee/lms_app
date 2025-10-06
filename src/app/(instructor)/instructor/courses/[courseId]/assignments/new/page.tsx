import { redirect } from 'next/navigation';
import { AssignmentForm } from '@/components/assignments/AssignmentForm';
import { requireCourseOwnership, HttpError } from '@/lib/auth/guards';

type PageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function NewAssignmentPage({ params }: PageProps) {
  const { courseId } = await params;

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

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 lg:py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">새 과제 만들기</h1>
        <p className="text-sm text-muted-foreground">
          과제 제목과 내용을 입력하고 초안으로 저장하세요. 언제든지 다시 편집하거나 게시할 수 있습니다.
        </p>
      </header>

      <AssignmentForm mode="create" courseId={courseId} />
    </div>
  );
}
