'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  gradeCreateSchema,
  gradeUpdateSchema,
  type GradeCreateInput,
  type GradeUpdateInput,
} from '@/lib/validations/grade';
import {
  createActionMessage,
  actionMessageFromError,
  actionMessageFromSuccess,
  type ActionMessage,
} from '@/lib/utils/toast';
import type { GradeInsert } from '@/lib/supabase/types';

export type GradeActionResult = {
  ok: boolean;
  message: ActionMessage;
  code?: number;
};

export async function gradeSubmission(
  courseId: string,
  assignmentId: string,
  submissionId: string,
  input: GradeCreateInput
): Promise<GradeActionResult> {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return {
        ok: false,
        message: createActionMessage('error', '로그인이 필요합니다', '다시 로그인한 후 이용해주세요.'),
        code: 401,
      };
    }

    // 강사 권한 확인 (코스 소유자인지 체크)
    const { data: course } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', courseId)
      .maybeSingle();

    if (!course || course.instructor_id !== session.user.id) {
      return {
        ok: false,
        message: createActionMessage('error', '권한이 없습니다', '해당 코스의 강사만 채점할 수 있습니다.'),
        code: 403,
      };
    }

    // 입력값 검증
    const parsed = gradeCreateSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: createActionMessage(
          'error',
          '입력값 오류',
          parsed.error.errors.map((e) => e.message).join(', ')
        ),
        code: 400,
      };
    }

    // 제출물 존재 확인
    const { data: submission } = await supabase
      .from('submissions')
      .select('id, assignment_id, status')
      .eq('id', submissionId)
      .eq('assignment_id', assignmentId)
      .maybeSingle();

    if (!submission) {
      return {
        ok: false,
        message: createActionMessage('error', '제출물을 찾을 수 없습니다'),
        code: 404,
      };
    }

    // 이미 채점된 경우 기존 grade 업데이트
    const { data: existingGrade } = await supabase
      .from('grades')
      .select('id')
      .eq('submission_id', submissionId)
      .maybeSingle();

    if (existingGrade) {
      // 기존 grade 업데이트
      const { error: updateError } = await supabase
        .from('grades')
        .update({
          score: parsed.data.score,
          feedback: parsed.data.feedback || null,
          graded_by: session.user.id,
          graded_at: new Date().toISOString(),
        })
        .eq('id', existingGrade.id);

      if (updateError) {
        console.error('[gradeSubmission] failed to update grade', { error: updateError, submissionId });
        return {
          ok: false,
          message: createActionMessage('error', '채점 업데이트 실패', '다시 시도해주세요.'),
          code: 500,
        };
      }
    } else {
      // 강사 이름 가져오기
      const { data: instructor } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', session.user.id)
        .single();

      // 새 grade 생성
      const gradePayload: Omit<GradeInsert, 'id' | 'graded_at' | 'created_at' | 'updated_at'> = {
        submission_id: submissionId,
        score: parsed.data.score,
        feedback: parsed.data.feedback || null,
        graded_by: session.user.id,
        graded_by_name: instructor?.name || 'Unknown',
      };

      const { error: gradeError } = await (supabase.from('grades') as any).insert([gradePayload]);

      if (gradeError) {
        console.error('[gradeSubmission] failed to create grade', { error: gradeError, submissionId });
        return {
          ok: false,
          message: createActionMessage('error', '채점 실패', '다시 시도해주세요.'),
          code: 500,
        };
      }
    }

    // 제출물 상태 업데이트
    const newStatus = parsed.data.requestResubmit ? 'resubmit_requested' : 'graded';
    const { error: statusError } = await supabase
      .from('submissions')
      .update({ status: newStatus })
      .eq('id', submissionId);

    if (statusError) {
      console.error('[gradeSubmission] failed to update submission status', {
        error: statusError,
        submissionId,
      });
      // 상태 업데이트 실패는 경고만 하고 성공으로 처리
    }

    revalidatePath(`/instructor/courses/${courseId}/assignments/${assignmentId}/submissions`);
    revalidatePath(`/learner/courses/${courseId}/assignments`);

    return {
      ok: true,
      message: actionMessageFromSuccess(
        parsed.data.requestResubmit ? '재제출 요청이 완료되었습니다.' : '채점이 완료되었습니다.'
      ),
    };
  } catch (error) {
    console.error('[gradeSubmission] unexpected error', { error, submissionId });
    return {
      ok: false,
      message: actionMessageFromError(error),
      code: 500,
    };
  }
}

export async function updateGrade(
  courseId: string,
  assignmentId: string,
  gradeId: string,
  input: GradeUpdateInput
): Promise<GradeActionResult> {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return {
        ok: false,
        message: createActionMessage('error', '로그인이 필요합니다'),
        code: 401,
      };
    }

    // 강사 권한 확인
    const { data: course } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', courseId)
      .maybeSingle();

    if (!course || course.instructor_id !== session.user.id) {
      return {
        ok: false,
        message: createActionMessage('error', '권한이 없습니다'),
        code: 403,
      };
    }

    // 입력값 검증
    const parsed = gradeUpdateSchema.safeParse(input);
    if (!parsed.success) {
      return {
        ok: false,
        message: createActionMessage(
          'error',
          '입력값 오류',
          parsed.error.errors.map((e) => e.message).join(', ')
        ),
        code: 400,
      };
    }

    // Grade 업데이트
    const { error } = await supabase
      .from('grades')
      .update({
        score: parsed.data.score,
        feedback: parsed.data.feedback || null,
        graded_at: new Date().toISOString(),
      })
      .eq('id', gradeId);

    if (error) {
      console.error('[updateGrade] failed to update', { error, gradeId });
      return {
        ok: false,
        message: createActionMessage('error', '수정 실패', '다시 시도해주세요.'),
        code: 500,
      };
    }

    revalidatePath(`/instructor/courses/${courseId}/assignments/${assignmentId}/submissions`);

    return {
      ok: true,
      message: actionMessageFromSuccess('수정이 완료되었습니다.'),
    };
  } catch (error) {
    console.error('[updateGrade] unexpected error', { error, gradeId });
    return {
      ok: false,
      message: actionMessageFromError(error),
      code: 500,
    };
  }
}
