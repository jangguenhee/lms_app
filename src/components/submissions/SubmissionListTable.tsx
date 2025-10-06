'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { GradeDialog } from './GradeDialog';

type Submission = {
  id: string;
  content: string | null;
  file_url: string | null;
  submitted_at: string;
  is_late: boolean;
  status: string;
  learner_id: string;
  profiles: {
    id: string;
    name: string;
    email: string;
  } | null;
  grades: {
    id: string;
    score: number;
    feedback: string | null;
    graded_at: string;
  }[];
};

type SubmissionListTableProps = {
  submissions: Submission[];
  courseId: string;
  assignmentId: string;
};

export function SubmissionListTable({ submissions, courseId, assignmentId }: SubmissionListTableProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>학습자</TableHead>
            <TableHead>제출 시간</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>점수</TableHead>
            <TableHead className="text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions.map((submission) => {
            const grade = submission.grades[0];
            const learnerName = submission.profiles?.name || '알 수 없음';

            return (
              <TableRow key={submission.id}>
                <TableCell className="font-medium">{learnerName}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">
                      {new Date(submission.submitted_at).toLocaleString('ko-KR')}
                    </span>
                    {submission.is_late && (
                      <Badge variant="destructive" className="w-fit">
                        지각
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <SubmissionStatusBadge status={submission.status} />
                </TableCell>
                <TableCell>{grade ? `${grade.score}점` : '-'}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant={grade ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => setSelectedSubmission(submission)}
                  >
                    {grade ? '수정하기' : '채점하기'}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {selectedSubmission && (
        <GradeDialog
          submission={selectedSubmission}
          courseId={courseId}
          assignmentId={assignmentId}
          onClose={() => setSelectedSubmission(null)}
        />
      )}
    </>
  );
}

function SubmissionStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'submitted':
      return <Badge variant="secondary">제출됨</Badge>;
    case 'graded':
      return <Badge variant="default">채점완료</Badge>;
    case 'resubmit_requested':
      return <Badge variant="outline">재제출 요청</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}
