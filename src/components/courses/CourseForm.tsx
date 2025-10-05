'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import type { z } from 'zod';

type CourseFormMode = 'create' | 'edit';

type CourseFormProps = {
  mode: CourseFormMode;
  courseId?: string;
  initial?: Partial<CourseRow>;
};

type FieldErrors = {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
};

const INITIAL_ERRORS: FieldErrors = {};

export function CourseForm({ mode, courseId, initial }: CourseFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>(INITIAL_ERRORS);
  const [formError, setFormError] = useState<string | null>(null);

  const [formValues, setFormValues] = useState<CourseDraftInput>(() => ({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    thumbnailUrl: initial?.thumbnail_url ?? '',
  }));

  const saveButtonLabel = mode === 'create' ? '초안 저장' : '변경사항 저장';

  const handleChange = useCallback(
    (field: keyof CourseDraftInput, value: string) => {
      setFormValues((prev) => ({ ...prev, [field]: value }));
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    },
    [],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFormError(null);

      const parsed = courseDraftSchema.safeParse(formValues);

      if (!parsed.success) {
        setFieldErrors(mapZodErrors(parsed.error));
        setFormError('입력한 정보를 다시 확인해주세요.');
        return;
      }

      startTransition(async () => {
        const payload = parsed.data;
        setFieldErrors(INITIAL_ERRORS);

        let result: CourseActionResult;

        if (mode === 'create') {
          result = await createCourse(payload);
        } else {
          if (!courseId) {
            console.error('[CourseForm] courseId is required for edit mode');
            setFormError('코스 정보를 확인할 수 없습니다.');
            return;
          }
          result = await updateCourse(courseId, payload);
        }

        toast(toToastMessage(result.message));

        if (!result.ok) {
          if (result.fieldErrors) {
            setFieldErrors(result.fieldErrors);
          }
          setFormError(result.message.description ?? result.message.title);
          return;
        }

        setFormError(null);

        if (mode === 'create' && result.courseId) {
          router.replace(`/instructor/courses/${result.courseId}/edit`);
        }
      });
    },
    [courseId, formValues, mode, router, toast],
  );

  const isDisabled = useMemo(() => isPending, [isPending]);

  return (
    <Card className="border-muted">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} noValidate aria-describedby={formError ? 'course-form-error' : undefined}>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="course-title">코스 제목</Label>
              <Input
                id="course-title"
                name="title"
                value={formValues.title}
                onChange={(event) => handleChange('title', event.target.value)}
                placeholder="예: 모던 자바스크립트 입문"
                disabled={isDisabled}
                maxLength={200}
                aria-describedby={fieldErrors.title ? 'course-title-error' : undefined}
              />
              {fieldErrors.title ? (
                <p id="course-title-error" className="mt-2 text-sm text-destructive">
                  {fieldErrors.title}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
                  {formValues.title.length}/200
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="course-description">코스 설명</Label>
              <Textarea
                id="course-description"
                name="description"
                minLength={10}
                value={formValues.description ?? ''}
                onChange={(event) => handleChange('description', event.target.value)}
                placeholder="코스의 학습 목표와 커리큘럼을 설명해주세요."
                className="min-h-[180px]"
                disabled={isDisabled}
                maxLength={5000}
                aria-describedby={fieldErrors.description ? 'course-description-error' : undefined}
              />
              {fieldErrors.description ? (
                <p id="course-description-error" className="mt-2 text-sm text-destructive">
                  {fieldErrors.description}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground" aria-live="polite">
                  {formValues.description?.length ?? 0}/5000 · 게시하려면 10자 이상 입력해야 합니다.
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="course-thumbnail">썸네일 URL</Label>
              <Input
                id="course-thumbnail"
                name="thumbnailUrl"
                value={formValues.thumbnailUrl ?? ''}
                onChange={(event) => handleChange('thumbnailUrl', event.target.value)}
                placeholder="https://example.com/thumbnail.png"
                disabled={isDisabled}
                aria-describedby={fieldErrors.thumbnailUrl ? 'course-thumbnail-error' : undefined}
              />
              {fieldErrors.thumbnailUrl ? (
                <p id="course-thumbnail-error" className="mt-2 text-sm text-destructive">
                  {fieldErrors.thumbnailUrl}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">선택 사항입니다.</p>
              )}
            </div>
          </div>

          {formError ? (
            <div
              id="course-form-error"
              role="alert"
              className="mt-6 rounded-md border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {formError}
            </div>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button asChild variant="ghost" disabled={isDisabled} className="sm:px-6">
              <Link href="/instructor/dashboard">취소</Link>
            </Button>
            <div className="flex gap-3 sm:justify-end">
              <Button type="submit" disabled={isDisabled} className="sm:px-6">
                {isPending ? '저장 중...' : saveButtonLabel}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function mapZodErrors(error: z.ZodError<CourseDraftInput>): FieldErrors {
  const { fieldErrors } = error.flatten();
  return {
    title: fieldErrors.title?.[0],
    description: fieldErrors.description?.[0],
    thumbnailUrl: fieldErrors.thumbnailUrl?.[0],
  };
}
