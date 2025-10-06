import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Feedback = {
  id: string;
  assignment_title: string;
  course_title: string;
  course_id: string;
  assignment_id: string;
  score: number;
  feedback: string | null;
  graded_at: string;
};

type RecentFeedbackProps = {
  feedbacks: Feedback[];
};

export function RecentFeedback({ feedbacks }: RecentFeedbackProps) {
  if (feedbacks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>최근 피드백</CardTitle>
          <CardDescription>아직 받은 피드백이 없습니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>최근 피드백</CardTitle>
        <CardDescription>최근 채점 완료된 과제의 피드백입니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedbacks.map((feedback) => {
          const gradedDate = new Date(feedback.graded_at);
          const scoreColor =
            feedback.score >= 90
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : feedback.score >= 70
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : 'bg-amber-100 text-amber-800 border-amber-200';

          return (
            <Link
              key={feedback.id}
              href={`/courses/${feedback.course_id}/assignments/${feedback.assignment_id}`}
              className="block rounded-lg border p-4 transition-colors hover:bg-accent"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{feedback.assignment_title}</h4>
                    <Badge className={scoreColor} variant="outline">
                      {feedback.score}점
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{feedback.course_title}</p>
                  {feedback.feedback && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {feedback.feedback}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    채점일: {gradedDate.toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
