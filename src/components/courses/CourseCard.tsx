import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { CourseRow } from '@/types/db';
import { CourseStatusBadge } from './CourseStatusBadge';

type CourseCardProps = {
  course: CourseRow;
  href?: string;
};

export function CourseCard({ course, href }: CourseCardProps) {
  return (
    <Card className="border-muted/40">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="line-clamp-1 text-lg font-semibold">
            {course.title || '제목 없는 코스'}
          </CardTitle>
          <CourseStatusBadge status={course.status} />
        </div>
        {course.thumbnail_url ? (
          <p className="text-sm text-muted-foreground">썸네일이 설정되어 있습니다.</p>
        ) : null}
      </CardHeader>
      <CardContent>
        <p className="line-clamp-3 text-sm text-muted-foreground">
          {course.description ?? '아직 설명이 작성되지 않았습니다.'}
        </p>
      </CardContent>
      {href ? (
        <CardFooter>
          <Link
            href={href}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            상세 보기
          </Link>
        </CardFooter>
      ) : null}
    </Card>
  );
}
