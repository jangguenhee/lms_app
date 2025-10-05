import { notFound, redirect } from 'next/navigation';
import { CourseForm } from '@/components/courses/CourseForm';
import { PublishButton } from '@/components/courses/PublishButton';
import { CourseStatusBadge } from '@/components/courses/CourseStatusBadge';
import { HttpError, requireCourseOwnership } from '@/lib/auth/guards';
import type { CourseRow } from '@/types/db';

type EditCoursePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCoursePage({ params }: EditCoursePageProps) {
  const { id } = await params;

  let course: CourseRow;

  try {
    const result = await requireCourseOwnership(id);
    course = result.course;
  } catch (error) {
    if (error instanceof HttpError) {
      if (error.code === 404) {
        notFound();
      }
      if (error.code === 401) {
        redirect('/signin');
      }
      redirect('/instructor/dashboard?alert=forbidden');
    }
    throw error;
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 lg:py-12">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">코스 편집</h1>
          <p className="text-sm text-muted-foreground">코스 정보를 업데이트하고 준비가 되면 게시하세요.</p>
        </div>
        <CourseStatusBadge status={course.status} />
      </header>

      <CourseForm mode="edit" courseId={course.id} initial={course} />

      <div className="flex justify-end">
        <PublishButton courseId={course.id} status={course.status} />
      </div>
    </div>
  );
}
