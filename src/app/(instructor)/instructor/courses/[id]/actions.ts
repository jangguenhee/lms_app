'use server';

import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import type { PostgrestError } from '@supabase/supabase-js';
import {
  createActionMessage,
  actionMessageFromError,
  actionMessageFromSuccess,
  type ActionMessage,
} from '@/lib/utils/toast';
import { courseDraftSchema, coursePublishSchema } from '@/lib/validations/course';
import { requireCourseOwnership, requireInstructor, HttpError } from '@/lib/auth/guards';
import type { CourseDraftInput } from '@/lib/validations/course';
import type { CourseInsert, CourseUpdate } from '@/types/db';

type FieldErrors = Partial<Record<'title' | 'description' | 'thumbnailUrl', string>>;

export type CourseActionResult = {
  ok: boolean;
  courseId?: string;
  message: ActionMessage;
  fieldErrors?: FieldErrors;
  code?: number;
};

function mapZodErrors(error: unknown): FieldErrors | undefined {
  if (error && typeof error === 'object' && 'flatten' in error) {
    const { fieldErrors } = (error as { flatten: () => { fieldErrors: Record<string, string[]> } }).flatten();
    return Object.entries(fieldErrors).reduce<FieldErrors>((acc, [key, value]) => {
      if (value && value.length > 0) {
        acc[key as keyof FieldErrors] = value[0];
      }
      return acc;
    }, {});
  }
  return undefined;
}

function messageFromHttpError(error: HttpError): ActionMessage {
  if (error.code === 401) {
    return createActionMessage('error', '로그인이 필요합니다', '다시 로그인한 후 이용해주세요.');
  }

  if (error.code === 403) {
    return createActionMessage('error', '접근 권한이 없습니다', error.message);
  }

  if (error.code === 404) {
    return createActionMessage('error', '코스를 찾을 수 없습니다', error.message);
  }

  return createActionMessage('error', '요청 처리에 실패했습니다', error.message);
}

function messageFromPostgrestError(error: PostgrestError): ActionMessage {
  if (error.code === '42501') {
    return createActionMessage('error', '권한 오류', '이 작업을 수행할 수 있는 권한이 없습니다.');
  }

  return createActionMessage('error', '데이터베이스 오류', '요청 처리 중 문제가 발생했습니다.');
}

type ActionDependencies = {
  requireInstructor: typeof requireInstructor;
  requireCourseOwnership: typeof requireCourseOwnership;
  revalidatePath: typeof revalidatePath;
};

const defaultDeps: ActionDependencies = {
  requireInstructor,
  requireCourseOwnership,
  revalidatePath,
};

export async function createCourse(input: CourseDraftInput): Promise<CourseActionResult> {
  return createCourseInternal(defaultDeps, input);
}

export async function updateCourse(courseId: string, input: CourseDraftInput): Promise<CourseActionResult> {
  return updateCourseInternal(defaultDeps, courseId, input);
}

export async function publishCourse(courseId: string): Promise<CourseActionResult> {
  return publishCourseInternal(defaultDeps, courseId);
}

async function createCourseInternal(
  deps: ActionDependencies,
  input: CourseDraftInput,
): Promise<CourseActionResult> {
  try {
    const { supabase, user } = await deps.requireInstructor();

    const parsed = courseDraftSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        fieldErrors: mapZodErrors(parsed.error),
        message: createActionMessage('error', '입력값을 확인해주세요', '필수 입력값을 모두 입력해주세요.'),
        code: 422,
      };
    }

    const payload: CourseInsert = {
      id: nanoid(),
      instructor_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      thumbnail_url: parsed.data.thumbnailUrl ?? null,
      status: 'draft' as const,
    };

    // Supabase 타입 정의는 strictNullChecks가 비활성화된 환경에서 Insert/Update가 never로 추론되는 이슈가 있어
    // 일시적으로 any를 사용합니다. 추후 strictNullChecks 활성화 후 제거 예정.
    const coursesTable = supabase.from('courses') as any;

    const insertResponse = await coursesTable.insert([payload]).select('id').single();
    const insertError = insertResponse.error as PostgrestError | null;
    const inserted = insertResponse.data as { id: string } | null;

    if (insertError) {
      console.error('[courses] createCourse insert failed', { error: insertError, payload });
      return {
        ok: false,
        message: messageFromPostgrestError(insertError),
        code: 500,
      };
    }

    const courseId = inserted?.id;

    if (!courseId) {
      console.error('[courses] createCourse insert returned no data', { payload });
      return {
        ok: false,
        message: createActionMessage('error', '코스 생성 실패', '생성된 코스를 확인할 수 없습니다.'),
        code: 500,
      };
    }

    deps.revalidatePath('/instructor/courses');
    deps.revalidatePath(`/instructor/courses/${courseId}/edit`);

    return {
      ok: true,
      courseId,
      message: actionMessageFromSuccess('코스를 초안으로 저장했습니다.', '코스가 생성되었습니다'),
    };
  } catch (error) {
    if (error instanceof HttpError) {
      return { ok: false, message: messageFromHttpError(error), code: error.code };
    }

    console.error('[courses] createCourse unexpected error', { error });
    return { ok: false, message: actionMessageFromError(error), code: 500 };
  }
}

async function updateCourseInternal(
  deps: ActionDependencies,
  courseId: string,
  input: CourseDraftInput,
): Promise<CourseActionResult> {
  try {
    const { supabase } = await deps.requireCourseOwnership(courseId);

    const parsed = courseDraftSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        fieldErrors: mapZodErrors(parsed.error),
        message: createActionMessage('error', '입력값을 확인해주세요', '필수 입력값을 모두 입력해주세요.'),
        code: 422,
      };
    }

    const updates: CourseUpdate = {
      title: parsed.data.title,
      description: parsed.data.description,
      thumbnail_url: parsed.data.thumbnailUrl ?? null,
    };

    const updateResponse = await (supabase.from('courses') as any)
      .update(updates)
      .eq('id', courseId);

    const { error } = updateResponse;

    if (error) {
      console.error('[courses] updateCourse failed', { error, courseId, updates });
      return { ok: false, message: messageFromPostgrestError(error), code: 500 };
    }

    deps.revalidatePath(`/instructor/courses/${courseId}/edit`);
    deps.revalidatePath('/instructor/courses');

    return {
      ok: true,
      courseId,
      message: actionMessageFromSuccess('변경 사항을 저장했습니다.'),
    };
  } catch (error) {
    if (error instanceof HttpError) {
      return { ok: false, message: messageFromHttpError(error), code: error.code };
    }

    console.error('[courses] updateCourse unexpected error', { error, courseId });
    return { ok: false, message: actionMessageFromError(error), code: 500 };
  }
}

async function publishCourseInternal(
  deps: ActionDependencies,
  courseId: string,
): Promise<CourseActionResult> {
  try {
    const { supabase, course } = await deps.requireCourseOwnership(courseId);

    const parsed = coursePublishSchema.safeParse({
      title: course.title,
      description: course.description ?? '',
      thumbnailUrl: course.thumbnail_url ?? undefined,
    });

    if (!parsed.success) {
      return {
        ok: false,
        fieldErrors: mapZodErrors(parsed.error),
        message: createActionMessage('error', '게시할 수 없습니다', '필수 정보를 모두 입력해야 합니다.'),
        code: 422,
      };
    }

    if (course.status === 'published') {
      return {
        ok: true,
        courseId,
        message: actionMessageFromSuccess('이미 게시된 코스입니다.'),
      };
    }

    const publishResponse = await (supabase.from('courses') as any)
      .update({ status: 'published' as const })
      .eq('id', courseId);

    const { error } = publishResponse;

    if (error) {
      console.error('[courses] publishCourse failed', { error, courseId });
      return { ok: false, message: messageFromPostgrestError(error), code: 500 };
    }

    deps.revalidatePath(`/instructor/courses/${courseId}/edit`);
    deps.revalidatePath('/instructor/courses');

    return {
      ok: true,
      courseId,
      message: actionMessageFromSuccess('코스를 게시했습니다.', '게시 완료'),
    };
  } catch (error) {
    if (error instanceof HttpError) {
      return { ok: false, message: messageFromHttpError(error), code: error.code };
    }

    console.error('[courses] publishCourse unexpected error', { error, courseId });
    return { ok: false, message: actionMessageFromError(error), code: 500 };
  }
}

export const __testing = {
  createCourseInternal,
  updateCourseInternal,
  publishCourseInternal,
  defaultDeps,
};
