'use server';

import { revalidatePath } from 'next/cache';
import type { PostgrestError } from '@supabase/supabase-js';
import {
  createActionMessage,
  actionMessageFromError,
  actionMessageFromSuccess,
  type ActionMessage,
} from '@/lib/utils/toast';
import { submissionCreateSchema, type SubmissionCreateInput } from '@/lib/validations/submission';
import { HttpError } from '@/lib/auth/guards';
import type { SubmissionInsert } from '@/types/db';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

type FieldErrors = Partial<Record<'content' | 'fileUrl', string>>;

export type SubmissionActionResult = {
  ok: boolean;
  submissionId?: string;
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
    return createActionMessage('error', '과제를 찾을 수 없습니다', error.message);
  }

  return createActionMessage('error', '요청 처리에 실패했습니다', error.message);
}

function messageFromPostgrestError(error: PostgrestError): ActionMessage {
  if (error.code === '42501') {
    return createActionMessage('error', '권한 오류', '이 작업을 수행할 수 있는 권한이 없습니다.');
  }

  if (error.code === '23505') {
    return createActionMessage('error', '이미 제출했습니다', '과제는 한 번만 제출할 수 있습니다.');
  }

  return createActionMessage('error', '데이터베이스 오류', '요청 처리 중 문제가 발생했습니다.');
}

async function requireEnrollment(courseId: string, userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: enrollment, error } = await supabase
    .from('enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('learner_id', userId)
    .maybeSingle();

  if (error || !enrollment) {
    throw new HttpError(403, '이 코스에 수강 신청을 하지 않았습니다.');
  }

  return { supabase, enrollment };
}

export async function submitAssignment(
  courseId: string,
  assignmentId: string,
  input: SubmissionCreateInput
): Promise<SubmissionActionResult> {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      throw new HttpError(401, '로그인이 필요합니다.');
    }

    const userId = session.user.id;

    // 수강 여부 확인
    await requireEnrollment(courseId, userId);

    // 과제 조회 (마감일 확인용)
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (assignmentError || !assignment) {
      return {
        ok: false,
        message: createActionMessage('error', '과제를 찾을 수 없습니다', '해당 과제가 존재하지 않습니다.'),
        code: 404,
      };
    }

    if (assignment.status !== 'published') {
      return {
        ok: false,
        message: createActionMessage('error', '제출할 수 없습니다', '아직 게시되지 않은 과제입니다.'),
        code: 403,
      };
    }

    const parsed = submissionCreateSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        fieldErrors: mapZodErrors(parsed.error),
        message: createActionMessage('error', '입력값을 확인해주세요', '필수 입력값을 모두 입력해주세요.'),
        code: 422,
      };
    }

    // 지각 제출 체크
    const now = new Date();
    const dueDate = new Date(assignment.due_date);
    let isLate = false;

    if (now > dueDate) {
      if (!assignment.allow_late_submission) {
        return {
          ok: false,
          message: createActionMessage('error', '제출 기한이 지났습니다', '지각 제출이 허용되지 않습니다.'),
          code: 403,
        };
      }

      if (assignment.late_submission_deadline) {
        const lateDeadline = new Date(assignment.late_submission_deadline);
        if (now > lateDeadline) {
          return {
            ok: false,
            message: createActionMessage(
              'error',
              '지각 제출 기한도 지났습니다',
              `지각 마감일: ${lateDeadline.toLocaleString()}`
            ),
            code: 403,
          };
        }
      }

      isLate = true;
    }

    const payload: Omit<SubmissionInsert, 'id' | 'submitted_at'> = {
      assignment_id: assignmentId,
      learner_id: userId,
      content: parsed.data.content,
      file_url: parsed.data.fileUrl || null,
      is_late: isLate,
      status: 'submitted' as const,
    };

    const submissionsTable = supabase.from('submissions') as any;
    const insertResponse = await submissionsTable.insert([payload]).select('id').single();
    const insertError = insertResponse.error as PostgrestError | null;
    const inserted = insertResponse.data as { id: string } | null;

    if (insertError) {
      console.error('[submissions] submitAssignment insert failed', { error: insertError, payload });
      return {
        ok: false,
        message: messageFromPostgrestError(insertError),
        code: 500,
      };
    }

    const submissionId = inserted?.id;

    if (!submissionId) {
      console.error('[submissions] submitAssignment insert returned no data', { payload });
      return {
        ok: false,
        message: createActionMessage('error', '제출 실패', '제출된 과제를 확인할 수 없습니다.'),
        code: 500,
      };
    }

    revalidatePath(`/learner/courses/${courseId}/assignments`);
    revalidatePath(`/learner/courses/${courseId}/assignments/${assignmentId}`);

    return {
      ok: true,
      submissionId,
      message: actionMessageFromSuccess(
        isLate ? '과제를 제출했습니다 (지각 제출)' : '과제를 제출했습니다.',
        '제출 완료'
      ),
    };
  } catch (error) {
    if (error instanceof HttpError) {
      return { ok: false, message: messageFromHttpError(error), code: error.code };
    }

    console.error('[submissions] submitAssignment unexpected error', { error });
    return { ok: false, message: actionMessageFromError(error), code: 500 };
  }
}
