'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { submissionCreateSchema, type SubmissionCreateInput } from '@/lib/validations/submission';
import {
  submitAssignment,
  type SubmissionActionResult,
} from '@/app/(learner)/learner/courses/[courseId]/assignments/[assignmentId]/actions';
import { toToastMessage } from '@/lib/utils/toast';

type SubmissionFormProps = {
  courseId: string;
  assignmentId: string;
};

const DEFAULT_VALUES: SubmissionCreateInput = {
  content: '',
  fileUrl: '',
};

export function SubmissionForm({ courseId, assignmentId }: SubmissionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<SubmissionCreateInput>({
    resolver: zodResolver(submissionCreateSchema),
    defaultValues: DEFAULT_VALUES,
    mode: 'onChange',
  });

  const watchedContent = form.watch('content') ?? '';
  const isSubmitting = form.formState.isSubmitting || isPending;

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);

    startTransition(async () => {
      const result: SubmissionActionResult = await submitAssignment(courseId, assignmentId, values);

      toast(toToastMessage(result.message));

      if (!result.ok) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, message]) => {
            form.setError(field as keyof SubmissionCreateInput, {
              type: 'server',
              message,
            });
          });
        }
        setFormError(result.message.description ?? result.message.title);
        return;
      }

      setFormError(null);
      router.refresh();
    });
  });

  return (
    <Card className="border-muted">
      <CardContent className="pt-6">
        <Form {...form}>
          <form
            noValidate
            onSubmit={onSubmit}
            aria-describedby={formError ? 'submission-form-error' : undefined}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="submission-content">제출 내용</FormLabel>
                  <FormControl>
                    <Textarea
                      id="submission-content"
                      placeholder="과제 답안을 작성해주세요."
                      minLength={1}
                      maxLength={10000}
                      className="min-h-[300px]"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground" aria-live="polite">
                    {watchedContent.length}/10000
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="submission-file">파일 URL (선택)</FormLabel>
                  <FormControl>
                    <Input
                      id="submission-file"
                      placeholder="https://example.com/your-file.pdf"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    파일을 업로드한 경우 URL을 입력해주세요.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {formError ? (
              <div
                id="submission-form-error"
                role="alert"
                className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {formError}
              </div>
            ) : null}

            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '제출 중...' : '과제 제출'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => router.back()}
              >
                취소
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
