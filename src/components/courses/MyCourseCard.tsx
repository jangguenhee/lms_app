import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CourseStatusBadge } from './CourseStatusBadge';
import type { CourseRow } from '@/types/db';

type MyCourseCardProps = {
  course: CourseRow;
};

export function MyCourseCard({ course }: MyCourseCardProps) {
  const description = course.description
    ? course.description.substring(0, 100) + (course.description.length > 100 ? '...' : '')
    : '설명이 없습니다.';

  return (
    <Card className="h-full overflow-hidden border-2 transition-colors hover:border-primary">
      {course.thumbnail_url && (
        <div className="h-40 w-full overflow-hidden bg-muted">
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <CardHeader className="pb-3">
        <div className="mb-2">
          <CourseStatusBadge status={course.status} />
        </div>
        <CardTitle className="line-clamp-2">{course.title}</CardTitle>
        <CardDescription className="line-clamp-2 text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-3 text-xs text-muted-foreground">
          수강 시작일: {new Date(course.created_at).toLocaleDateString()}
        </p>
        <div className="flex gap-2">
          <Link
            href={`/courses/${course.id}`}
            className="flex-1 text-center rounded-md border border-input bg-background px-3 py-2 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            코스 보기
          </Link>
          <Link
            href={`/learner/courses/${course.id}/assignments`}
            className="flex-1 text-center rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            과제 목록
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
