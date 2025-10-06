import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ProgressStats = {
  totalAssignments: number;
  submittedAssignments: number;
  averageScore: number | null;
};

type ProgressCardProps = {
  stats: ProgressStats;
};

export function ProgressCard({ stats }: ProgressCardProps) {
  const progressPercentage =
    stats.totalAssignments > 0
      ? Math.round((stats.submittedAssignments / stats.totalAssignments) * 100)
      : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>학습 진행률</CardTitle>
        <CardDescription>전체 과제에 대한 제출 현황입니다.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium">제출 완료</span>
            <span className="text-muted-foreground">
              {stats.submittedAssignments} / {stats.totalAssignments}
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="mt-2 text-center text-2xl font-bold">{progressPercentage}%</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 border-t pt-4">
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.totalAssignments}</p>
            <p className="text-xs text-muted-foreground">전체 과제</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">{stats.submittedAssignments}</p>
            <p className="text-xs text-muted-foreground">제출 완료</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">
              {stats.averageScore !== null ? stats.averageScore.toFixed(1) : '-'}
            </p>
            <p className="text-xs text-muted-foreground">평균 점수</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
