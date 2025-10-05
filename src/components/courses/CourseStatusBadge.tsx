import { Badge } from '@/components/ui/badge';
import type { CourseRow } from '@/types/db';

const statusStyles: Record<CourseRow['status'], { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  published: { label: 'Published', className: 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200' },
  archived: { label: 'Archived', className: 'bg-amber-100 text-amber-900 hover:bg-amber-200' },
};

type CourseStatusBadgeProps = {
  status: CourseRow['status'];
};

export function CourseStatusBadge({ status }: CourseStatusBadgeProps) {
  const { label, className } = statusStyles[status];
  return <Badge className={className}>{label}</Badge>;
}
