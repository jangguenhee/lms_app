'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
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
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { assignmentDraftSchema, type AssignmentDraftInput } from '@/lib/validations/assignment';
import {
  createAssignment,
  updateAssignment,
  type AssignmentActionResult,
} from '@/app/(instructor)/instructor/courses/[courseId]/assignments/[assignmentId]/actions';
import { toToastMessage } from '@/lib/utils/toast';
import type { AssignmentRow } from '@/types/db';

type AssignmentFormMode = 'create' | 'edit';

type AssignmentFormProps = {
  mode: AssignmentFormMode;
  courseId: string;
  assignmentId?: string;
  initial?: Partial<AssignmentRow>;
};

const DEFAULT_VALUES: AssignmentDraftInput = {
  title: '',
  description: undefined,
  dueDate: '',
  allowLateSubmission: false,
  lateSubmissionDeadline: undefined,
};

function formatDateTimeLocal(isoString: string | null | undefined): string {
  if (!isoString) return '';
  const date = new Date(isoString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function AssignmentForm({ mode, courseId, assignmentId, initial }: AssignmentFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<AssignmentDraftInput>({
    resolver: zodResolver(assignmentDraftSchema),
    defaultValues: {
      title: initial?.title ?? DEFAULT_VALUES.title,
      description: initial?.description ?? DEFAULT_VALUES.description,
      dueDate: formatDateTimeLocal(initial?.due_date) || DEFAULT_VALUES.dueDate,
      allowLateSubmission: initial?.allow_late_submission ?? DEFAULT_VALUES.allowLateSubmission,
      lateSubmissionDeadline:
        formatDateTimeLocal(initial?.late_submission_deadline) || DEFAULT_VALUES.lateSubmissionDeadline,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    form.reset({
      title: initial?.title ?? DEFAULT_VALUES.title,
      description: initial?.description ?? DEFAULT_VALUES.description,
      dueDate: formatDateTimeLocal(initial?.due_date) || DEFAULT_VALUES.dueDate,
      allowLateSubmission: initial?.allow_late_submission ?? DEFAULT_VALUES.allowLateSubmission,
      lateSubmissionDeadline:
        formatDateTimeLocal(initial?.late_submission_deadline) || DEFAULT_VALUES.lateSubmissionDeadline,
    });
  }, [form, initial]);

  const watchedDescription = form.watch('description') ?? '';
  const watchedTitle = form.watch('title') ?? '';
  const watchedAllowLateSubmission = form.watch('allowLateSubmission');

  const isSubmitting = form.formState.isSubmitting || isPending;

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);

    startTransition(async () => {
      let result: AssignmentActionResult;

      if (mode === 'create') {
        result = await createAssignment(courseId, values);
      } else {
        if (!assignmentId) {
          setFormError('과제 ID를 확인할 수 없습니다.');
          return;
        }
        result = await updateAssignment(courseId, assignmentId, values);
      }

      toast(toToastMessage(result.message));

      if (!result.ok) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, message]) => {
            form.setError(field as keyof AssignmentDraftInput, {
              type: 'server',
              message,
            });
          });
        }
        setFormError(result.message.description ?? result.message.title);
        return;
      }

      setFormError(null);

      if (mode === 'create' && result.assignmentId) {
        router.replace(
          `/instructor/courses/${courseId}/assignments/${result.assignmentId}/edit`
        );
      } else if (mode === 'edit') {
        form.reset(values);
      }
    });
  });

  const descriptionHelpText = `${watchedDescription.length}/5000 ${
    watchedDescription.length === 0 ? '게시하려면 10자 이상 입력해야 합니다.' : ''
  }`.trim();

  return (
    <Card className="border-muted">
      <CardContent className="pt-6">
        <Form {...form}>
          <form
            noValidate
            onSubmit={onSubmit}
            aria-describedby={formError ? 'assignment-form-error' : undefined}
            className="space-y-8"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel htmlFor="assignment-title">과제 제목</FormLabel>
                    <FormControl>
                      <Input
                        id="assignment-title"
                        placeholder="예: 1주차 실습 과제"
                        maxLength={200}
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground" aria-live="polite">
                      {watchedTitle.length}/200
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel htmlFor="assignment-description">과제 설명</FormLabel>
                    <FormControl>
                      <Textarea
                        id="assignment-description"
                        placeholder="과제의 요구사항과 제출 방법을 설명해주세요."
                        minLength={10}
                        maxLength={5000}
                        className="min-h-[200px]"
                        disabled={isSubmitting}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground" aria-live="polite">
                      {descriptionHelpText}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="assignment-due-date">마감일</FormLabel>
                    <FormControl>
                      <Input
                        id="assignment-due-date"
                        type="datetime-local"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>학습자가 과제를 제출해야 하는 시간</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="allowLateSubmission"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>지각 제출 허용</FormLabel>
                      <FormDescription>
                        마감일 이후에도 제출을 받을 수 있습니다
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {watchedAllowLateSubmission && (
                <FormField
                  control={form.control}
                  name="lateSubmissionDeadline"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel htmlFor="assignment-late-deadline">지각 제출 마감일</FormLabel>
                      <FormControl>
                        <Input
                          id="assignment-late-deadline"
                          type="datetime-local"
                          disabled={isSubmitting}
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormDescription>
                        지각 제출을 받을 수 있는 최종 시간 (정시 마감일보다 늦어야 합니다)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {formError ? (
              <div
                id="assignment-form-error"
                role="alert"
                className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {formError}
              </div>
            ) : null}

            <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button asChild variant="ghost" disabled={isSubmitting}>
                <Link href={`/instructor/courses/${courseId}/edit`}>취소</Link>
              </Button>
              <div className="flex gap-3 sm:justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting
                    ? '저장 중...'
                    : mode === 'create'
                      ? '초안 저장'
                      : '변경사항 저장'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
