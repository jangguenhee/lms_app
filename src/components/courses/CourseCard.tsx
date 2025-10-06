import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import type { CourseRow } from '@/types/db';
import { CourseStatusBadge } from './CourseStatusBadge';

type CourseCardProps = {
  course: CourseRow;
  href?: string;
  showDescription?: boolean;
};

const DEFAULT_THUMBNAIL = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop';

export function CourseCard({ course, href, showDescription = true }: CourseCardProps) {
  const thumbnailUrl = course.thumbnail_url || DEFAULT_THUMBNAIL;

  return (
    <Card className="overflow-hidden border-muted/40">
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <Image
          src={thumbnailUrl}
          alt={course.title || '코스 썸네일'}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="line-clamp-1 text-lg font-semibold">
            {course.title || '제목 없는 코스'}
          </CardTitle>
          <CourseStatusBadge status={course.status} />
        </div>
      </CardHeader>
      {showDescription && (
        <CardContent>
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {course.description ?? '아직 설명이 작성되지 않았습니다.'}
          </p>
        </CardContent>
      )}
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
