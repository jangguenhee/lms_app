import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CourseRow } from '@/types/db';
import { cn } from '@/lib/utils';

type CourseCardProps = {
  course: CourseRow;
  href?: string;
};

const statusStyles: Record<CourseRow['status'], string> = {
  draft: 'bg-slate-200 text-slate-900 hover:bg-slate-300',
  published: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200',
  archived: 'bg-amber-100 text-amber-900 hover:bg-amber-200',
};

export function CourseCard({ course, href }: CourseCardProps) {
  const statusLabel = statusLabelMap[course.status];

  return (
    <Card className="border-muted/40">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="line-clamp-1 text-lg font-semibold">
            {course.title || '제목 없는 코스'}
          </CardTitle>
          <Badge className={cn('text-xs capitalize', statusStyles[course.status])}>{statusLabel}</Badge>
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

const statusLabelMap: Record<CourseRow['status'], string> = {
  draft: 'Draft',
  published: 'Published',
  archived: 'Archived',
};
