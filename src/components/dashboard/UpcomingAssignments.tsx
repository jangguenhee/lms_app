import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Assignment = {
  id: string;
  course_id: string;
  title: string;
  due_date: string;
  course_title: string;
};

type UpcomingAssignmentsProps = {
  assignments: Assignment[];
};

export function UpcomingAssignments({ assignments }: UpcomingAssignmentsProps) {
  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>마감 임박 과제</CardTitle>
          <CardDescription>7일 이내 마감 예정인 과제가 없습니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>마감 임박 과제</CardTitle>
        <CardDescription>7일 이내 제출 마감되는 과제 목록입니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {assignments.map((assignment) => {
          const dueDate = new Date(assignment.due_date);
          const now = new Date();
          const daysLeft = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isUrgent = daysLeft <= 2;

          return (
            <div
              key={assignment.id}
              className="flex items-start justify-between gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{assignment.title}</h4>
                  {isUrgent && (
                    <Badge variant="destructive" className="text-xs">
                      긴급
                    </Badge>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{assignment.course_title}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  마감: {dueDate.toLocaleString('ko-KR')} ({daysLeft}일 남음)
                </p>
              </div>
              <Button asChild size="sm" variant={isUrgent ? 'default' : 'outline'}>
                <Link href={`/courses/${assignment.course_id}/assignments/${assignment.id}`}>
                  제출하기
                </Link>
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
