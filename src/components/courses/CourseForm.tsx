'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { courseDraftSchema, type CourseDraftInput } from '@/lib/validations/course';
import {
  createCourse,
  updateCourse,
  type CourseActionResult,
} from '@/app/(instructor)/instructor/courses/[id]/actions';
import { toToastMessage } from '@/lib/utils/toast';
import type { CourseRow } from '@/types/db';

type CourseFormMode = 'create' | 'edit';

type CourseFormProps = {
  mode: CourseFormMode;
  courseId?: string;
  initial?: Partial<CourseRow>;
};

const DEFAULT_VALUES: CourseDraftInput = {
  title: '',
  description: undefined,
  thumbnailUrl: undefined,
};

export function CourseForm({ mode, courseId, initial }: CourseFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<CourseDraftInput>({
    resolver: zodResolver(courseDraftSchema),
    defaultValues: {
      title: initial?.title ?? DEFAULT_VALUES.title,
      description: initial?.description ?? DEFAULT_VALUES.description,
      thumbnailUrl: initial?.thumbnail_url ?? DEFAULT_VALUES.thumbnailUrl,
    },
    mode: 'onChange',
  });

  useEffect(() => {
    form.reset({
      title: initial?.title ?? DEFAULT_VALUES.title,
      description: initial?.description ?? DEFAULT_VALUES.description,
      thumbnailUrl: initial?.thumbnail_url ?? DEFAULT_VALUES.thumbnailUrl,
    });
  }, [form, initial?.title, initial?.description, initial?.thumbnail_url]);

  const watchedDescription = form.watch('description') ?? '';
  const watchedTitle = form.watch('title') ?? '';

  const isSubmitting = form.formState.isSubmitting || isPending;

  const onSubmit = form.handleSubmit((values) => {
    setFormError(null);

    startTransition(async () => {
      let result: CourseActionResult;

      if (mode === 'create') {
        result = await createCourse(values);
      } else {
        if (!courseId) {
          setFormError('코스 ID를 확인할 수 없습니다.');
          return;
        }
        result = await updateCourse(courseId, values);
      }

      toast(toToastMessage(result.message));

      if (!result.ok) {
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, message]) => {
            form.setError(field as keyof CourseDraftInput, {
              type: 'server',
              message,
            });
          });
        }
        setFormError(result.message.description ?? result.message.title);
        return;
      }

      setFormError(null);

      if (mode === 'create' && result.courseId) {
        router.replace(`/instructor/courses/${result.courseId}/edit`);
      } else if (mode === 'edit') {
        form.reset(values);
      }
    });
  });

  const descriptionHelpText = useMemo(() => {
    const length = watchedDescription.length;
    const suffix = length === 0 ? '게시하려면 10자 이상 입력해야 합니다.' : '';
    return `${length}/5000 ${suffix}`.trim();
  }, [watchedDescription]);

  return (
    <Card className="border-muted">
      <CardContent className="pt-6">
        <Form {...form}>
          <form
            noValidate
            onSubmit={onSubmit}
            aria-describedby={formError ? 'course-form-error' : undefined}
            className="space-y-8"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel htmlFor="course-title">코스 제목</FormLabel>
                    <FormControl>
                      <Input
                        id="course-title"
                        placeholder="예: 모던 자바스크립트 입문"
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
                    <FormLabel htmlFor="course-description">코스 설명</FormLabel>
                    <FormControl>
                      <Textarea
                        id="course-description"
                        placeholder="코스의 학습 목표와 커리큘럼을 설명해주세요."
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
                name="thumbnailUrl"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel htmlFor="course-thumbnail">썸네일 URL</FormLabel>
                    <FormControl>
                      <Input
                        id="course-thumbnail"
                        placeholder="https://example.com/thumbnail.png"
                        disabled={isSubmitting}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">선택 사항입니다.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {formError ? (
              <div
                id="course-form-error"
                role="alert"
                className="rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {formError}
              </div>
            ) : null}

            <div className="flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button asChild variant="ghost" disabled={isSubmitting}>
                <Link href="/instructor/dashboard">취소</Link>
              </Button>
              <div className="flex gap-3 sm:justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? '저장 중...' : mode === 'create' ? '초안 저장' : '변경사항 저장'}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
