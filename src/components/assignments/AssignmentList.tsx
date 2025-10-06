import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { AssignmentRow } from '@/types/db';

type AssignmentListProps = {
  courseId: string;
  assignments: AssignmentRow[];
};

function AssignmentStatusBadge({ status }: { status: AssignmentRow['status'] }) {
  const variants: Record<AssignmentRow['status'], { label: string; className: string }> = {
    draft: { label: '초안', className: 'bg-gray-100 text-gray-800 border-gray-200' },
    published: { label: '게시됨', className: 'bg-green-100 text-green-800 border-green-200' },
    closed: { label: '마감', className: 'bg-red-100 text-red-800 border-red-200' },
  };

  const variant = variants[status];

  return (
    <Badge variant="outline" className={variant.className}>
      {variant.label}
    </Badge>
  );
}

export function AssignmentList({ courseId, assignments }: AssignmentListProps) {
  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>과제</CardTitle>
          <CardDescription>아직 생성된 과제가 없습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href={`/instructor/courses/${courseId}/assignments/new`}>첫 과제 만들기</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>과제</CardTitle>
          <CardDescription>{assignments.length}개의 과제</CardDescription>
        </div>
        <Button asChild size="sm">
          <Link href={`/instructor/courses/${courseId}/assignments/new`}>새 과제</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {assignments.map((assignment) => {
            const dueDate = new Date(assignment.due_date);
            const isOverdue = dueDate < new Date() && assignment.status !== 'closed';

            return (
              <Link
                key={assignment.id}
                href={`/instructor/courses/${courseId}/assignments/${assignment.id}/edit`}
                className="block rounded-lg border p-4 transition-colors hover:bg-accent"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{assignment.title}</h4>
                      <AssignmentStatusBadge status={assignment.status} />
                      {isOverdue && (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          마감일 경과
                        </Badge>
                      )}
                    </div>
                    {assignment.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {assignment.description}
                      </p>
                    )}
                    <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                      <span>마감: {dueDate.toLocaleDateString('ko-KR')}</span>
                      {assignment.allow_late_submission && assignment.late_submission_deadline && (
                        <span>
                          지각 마감: {new Date(assignment.late_submission_deadline).toLocaleDateString('ko-KR')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
