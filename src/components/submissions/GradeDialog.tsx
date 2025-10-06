'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { gradeCreateSchema, type GradeCreateInput } from '@/lib/validations/grade';
import { gradeSubmission } from '@/app/(instructor)/instructor/courses/[courseId]/assignments/[assignmentId]/submissions/actions';

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

type GradeDialogProps = {
  submission: Submission;
  courseId: string;
  assignmentId: string;
  onClose: () => void;
};

export function GradeDialog({ submission, courseId, assignmentId, onClose }: GradeDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const existingGrade = submission.grades[0];

  const form = useForm<GradeCreateInput>({
    resolver: zodResolver(gradeCreateSchema),
    defaultValues: {
      score: existingGrade?.score ?? 0,
      feedback: existingGrade?.feedback ?? '',
      requestResubmit: false,
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    startTransition(async () => {
      const result = await gradeSubmission(courseId, assignmentId, submission.id, values);

      if (result.ok) {
        toast({
          title: result.message.title,
          description: result.message.description,
        });
        onClose();
      } else {
        toast({
          variant: 'destructive',
          title: result.message.title,
          description: result.message.description,
        });
      }
    });
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>과제 채점</DialogTitle>
          <DialogDescription>
            {submission.profiles?.name || '알 수 없음'} 학습자의 제출물
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 제출물 정보 */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm font-medium">제출 정보</span>
              {submission.is_late && (
                <Badge variant="destructive" className="text-xs">
                  지각
                </Badge>
              )}
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>제출 시간: {new Date(submission.submitted_at).toLocaleString('ko-KR')}</p>
              {submission.file_url && (
                <a
                  href={submission.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  첨부 파일 보기
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          {/* 제출 내용 */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">제출 내용</h3>
            <div className="min-h-[100px] rounded-lg border bg-background p-4">
              {submission.content ? (
                <p className="whitespace-pre-wrap text-sm">{submission.content}</p>
              ) : (
                <p className="text-sm text-muted-foreground">제출된 텍스트 내용이 없습니다.</p>
              )}
            </div>
          </div>

          {/* 채점 폼 */}
          <Form {...form}>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="score"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>점수 (0-100)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="점수를 입력하세요"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="feedback"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>피드백 (선택)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="학습자에게 전달할 피드백을 작성하세요..."
                        className="min-h-[150px]"
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormDescription>최대 5000자</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requestResubmit"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isPending}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>재제출 요청</FormLabel>
                      <FormDescription>
                        체크하면 학습자에게 재제출을 요청합니다. 기존 점수는 임시로 저장됩니다.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                  취소
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? '저장 중...' : existingGrade ? '수정하기' : '채점 완료'}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
