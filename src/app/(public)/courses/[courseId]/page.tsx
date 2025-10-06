import { notFound } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { EnrollButton } from '@/components/courses/EnrollButton';
import { CourseStatusBadge } from '@/components/courses/CourseStatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { CourseRow } from '@/types/db';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ courseId: string }>;
};

async function loadCourse(courseId: string): Promise<CourseRow | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    console.error('[course detail] failed to load course', { error, courseId });
    return null;
  }

  return data;
}

async function checkEnrollmentStatus(courseId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return false;
  }

  const { data, error } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('learner_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[course detail] failed to check enrollment', {
      error,
      courseId,
      userId: user.id,
    });
    return false;
  }

  return !!data;
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { courseId } = await params;
  const course = await loadCourse(courseId);

  if (!course) {
    notFound();
  }

  const isEnrolled = await checkEnrollmentStatus(courseId);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-3xl">{course.title}</CardTitle>
              <CardDescription className="mt-2">
                <span className="inline-flex items-center gap-2">
                  <CourseStatusBadge status={course.status} />
                  <span className="text-xs text-muted-foreground">
                    생성일: {new Date(course.created_at).toLocaleDateString()}
                  </span>
                </span>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {course.thumbnail_url && (
            <div className="mb-6">
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="h-64 w-full rounded-lg object-cover"
              />
            </div>
          )}
          <div className="prose prose-sm max-w-none">
            <h3 className="text-lg font-semibold">코스 설명</h3>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {course.description || '코스 설명이 없습니다.'}
            </p>
          </div>
          <div className="mt-8 flex justify-center">
            <EnrollButton courseId={course.id} initialEnrolled={isEnrolled} className="w-full max-w-md" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
