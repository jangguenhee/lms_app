'use server';

import { revalidatePath } from 'next/cache.js';
import type { PostgrestError } from '@supabase/supabase-js';
import {
  createActionMessage,
  actionMessageFromError,
  actionMessageFromSuccess,
  type ActionMessage,
} from '@/lib/utils/toast';
import {
  assignmentDraftSchema,
  assignmentPublishSchema,
  type AssignmentDraftInput,
} from '@/lib/validations/assignment';
import { requireCourseOwnership, requireInstructor, HttpError } from '@/lib/auth/guards';
import type { AssignmentInsert, AssignmentUpdate } from '@/types/db';

type FieldErrors = Partial<
  Record<'title' | 'description' | 'dueDate' | 'allowLateSubmission' | 'lateSubmissionDeadline', string>
>;

export type AssignmentActionResult = {
  ok: boolean;
  assignmentId?: string;
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

export async function createAssignment(
  courseId: string,
  input: AssignmentDraftInput
): Promise<AssignmentActionResult> {
  try {
    const { supabase } = await requireCourseOwnership(courseId);

    const parsed = assignmentDraftSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        fieldErrors: mapZodErrors(parsed.error),
        message: createActionMessage('error', '입력값을 확인해주세요', '필수 입력값을 모두 입력해주세요.'),
        code: 422,
      };
    }

    const payload: Omit<AssignmentInsert, 'id' | 'created_at' | 'updated_at'> = {
      course_id: courseId,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      due_date: parsed.data.dueDate,
      allow_late_submission: parsed.data.allowLateSubmission,
      late_submission_deadline: parsed.data.lateSubmissionDeadline ?? null,
      status: 'draft' as const,
    };

    const assignmentsTable = supabase.from('assignments') as any;
    const insertResponse = await assignmentsTable.insert([payload]).select('id').single();
    const insertError = insertResponse.error as PostgrestError | null;
    const inserted = insertResponse.data as { id: string } | null;

    if (insertError) {
      console.error('[assignments] createAssignment insert failed', { error: insertError, payload });
      return {
        ok: false,
        message: messageFromPostgrestError(insertError),
        code: 500,
      };
    }

    const assignmentId = inserted?.id;

    if (!assignmentId) {
      console.error('[assignments] createAssignment insert returned no data', { payload });
      return {
        ok: false,
        message: createActionMessage('error', '과제 생성 실패', '생성된 과제를 확인할 수 없습니다.'),
        code: 500,
      };
    }

    revalidatePath(`/instructor/courses/${courseId}/edit`);
    revalidatePath(`/instructor/courses/${courseId}/assignments`);

    return {
      ok: true,
      assignmentId,
      message: actionMessageFromSuccess('과제를 초안으로 저장했습니다.', '과제가 생성되었습니다'),
    };
  } catch (error) {
    if (error instanceof HttpError) {
      return { ok: false, message: messageFromHttpError(error), code: error.code };
    }

    console.error('[assignments] createAssignment unexpected error', { error });
    return { ok: false, message: actionMessageFromError(error), code: 500 };
  }
}

export async function updateAssignment(
  courseId: string,
  assignmentId: string,
  input: AssignmentDraftInput
): Promise<AssignmentActionResult> {
  try {
    const { supabase } = await requireCourseOwnership(courseId);

    // Verify assignment belongs to course
    const { data: assignment, error: fetchError } = await supabase
      .from('assignments')
      .select('id, course_id')
      .eq('id', assignmentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (fetchError || !assignment) {
      return {
        ok: false,
        message: createActionMessage('error', '과제를 찾을 수 없습니다', '해당 과제가 존재하지 않습니다.'),
        code: 404,
      };
    }

    const parsed = assignmentDraftSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        fieldErrors: mapZodErrors(parsed.error),
        message: createActionMessage('error', '입력값을 확인해주세요', '필수 입력값을 모두 입력해주세요.'),
        code: 422,
      };
    }

    const updates: AssignmentUpdate = {
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      due_date: parsed.data.dueDate,
      allow_late_submission: parsed.data.allowLateSubmission,
      late_submission_deadline: parsed.data.lateSubmissionDeadline ?? null,
    };

    const updateResponse = await (supabase.from('assignments') as any).update(updates).eq('id', assignmentId);

    const { error } = updateResponse;

    if (error) {
      console.error('[assignments] updateAssignment failed', { error, assignmentId, updates });
      return { ok: false, message: messageFromPostgrestError(error), code: 500 };
    }

    revalidatePath(`/instructor/courses/${courseId}/edit`);
    revalidatePath(`/instructor/courses/${courseId}/assignments/${assignmentId}/edit`);

    return {
      ok: true,
      assignmentId,
      message: actionMessageFromSuccess('변경 사항을 저장했습니다.'),
    };
  } catch (error) {
    if (error instanceof HttpError) {
      return { ok: false, message: messageFromHttpError(error), code: error.code };
    }

    console.error('[assignments] updateAssignment unexpected error', { error, assignmentId });
    return { ok: false, message: actionMessageFromError(error), code: 500 };
  }
}

export async function publishAssignment(
  courseId: string,
  assignmentId: string
): Promise<AssignmentActionResult> {
  try {
    const { supabase } = await requireCourseOwnership(courseId);

    // Fetch and verify assignment
    const { data: assignment, error: fetchError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (fetchError || !assignment) {
      return {
        ok: false,
        message: createActionMessage('error', '과제를 찾을 수 없습니다', '해당 과제가 존재하지 않습니다.'),
        code: 404,
      };
    }

    const parsed = assignmentPublishSchema.safeParse({
      title: assignment.title,
      description: assignment.description ?? '',
      dueDate: assignment.due_date,
      allowLateSubmission: assignment.allow_late_submission,
      lateSubmissionDeadline: assignment.late_submission_deadline ?? undefined,
    });

    if (!parsed.success) {
      return {
        ok: false,
        fieldErrors: mapZodErrors(parsed.error),
        message: createActionMessage('error', '게시할 수 없습니다', '필수 정보를 모두 입력해야 합니다.'),
        code: 422,
      };
    }

    if (assignment.status === 'published') {
      return {
        ok: true,
        assignmentId,
        message: actionMessageFromSuccess('이미 게시된 과제입니다.'),
      };
    }

    const publishResponse = await (supabase.from('assignments') as any)
      .update({ status: 'published' as const })
      .eq('id', assignmentId);

    const { error } = publishResponse;

    if (error) {
      console.error('[assignments] publishAssignment failed', { error, assignmentId });
      return { ok: false, message: messageFromPostgrestError(error), code: 500 };
    }

    revalidatePath(`/instructor/courses/${courseId}/edit`);
    revalidatePath(`/instructor/courses/${courseId}/assignments/${assignmentId}/edit`);

    return {
      ok: true,
      assignmentId,
      message: actionMessageFromSuccess('과제를 게시했습니다.', '게시 완료'),
    };
  } catch (error) {
    if (error instanceof HttpError) {
      return { ok: false, message: messageFromHttpError(error), code: error.code };
    }

    console.error('[assignments] publishAssignment unexpected error', { error, assignmentId });
    return { ok: false, message: actionMessageFromError(error), code: 500 };
  }
}
