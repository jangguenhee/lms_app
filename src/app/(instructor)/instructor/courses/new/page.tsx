import { redirect } from 'next/navigation';
import { CourseForm } from '@/components/courses/CourseForm';
import { requireInstructor, HttpError } from '@/lib/auth/guards';

export default async function NewCoursePage() {
  try {
    await requireInstructor();
  } catch (error) {
    if (error instanceof HttpError) {
      if (error.code === 401) {
        redirect('/signin');
      }
      redirect('/instructor/dashboard?alert=forbidden');
    }
    throw error;
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 lg:py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">새 코스 만들기</h1>
        <p className="text-sm text-muted-foreground">
          강의 제목과 내용을 입력하고 초안으로 저장하세요. 언제든지 다시 편집하거나 게시할 수 있습니다.
        </p>
      </header>

      <CourseForm mode="create" />
    </div>
  );
}
