'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  createActionMessage,
  actionMessageFromError,
  actionMessageFromSuccess,
  type ActionMessage,
} from '@/lib/utils/toast';

export type EnrollmentActionResult = {
  ok: boolean;
  message: ActionMessage;
  code?: number;
};

export async function enrollCourse(courseId: string): Promise<EnrollmentActionResult> {
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle();

    if (profile?.role !== 'learner') {
      return {
        ok: false,
        message: createActionMessage('error', '수강 신청 불가', '학습자만 수강 신청할 수 있습니다.'),
        code: 403,
      };
    }

    const { error } = await (supabase.from('enrollments') as any).insert([{
      course_id: courseId,
      learner_id: session.user.id,
    }]);

    if (error) {
      console.error('[enroll] failed to enroll', { error, courseId, userId: session.user.id });
      return {
        ok: false,
        message: createActionMessage('error', '수강 신청 실패', '다시 시도해주세요.'),
        code: 500,
      };
    }

    revalidatePath(`/courses/${courseId}`);
    revalidatePath('/learner/dashboard');

    return {
      ok: true,
      message: actionMessageFromSuccess('수강 신청이 완료되었습니다.'),
    };
  } catch (error) {
    console.error('[enroll] unexpected error', { error, courseId });
    return {
      ok: false,
      message: actionMessageFromError(error),
      code: 500,
    };
  }
}

export async function unenrollCourse(courseId: string): Promise<EnrollmentActionResult> {
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

    const { error } = await supabase
      .from('enrollments')
      .delete()
      .eq('course_id', courseId)
      .eq('learner_id', session.user.id);

    if (error) {
      console.error('[unenroll] failed to unenroll', { error, courseId, userId: session.user.id });
      return {
        ok: false,
        message: createActionMessage('error', '수강 취소 실패', '다시 시도해주세요.'),
        code: 500,
      };
    }

    revalidatePath(`/courses/${courseId}`);
    revalidatePath('/learner/dashboard');

    return {
      ok: true,
      message: actionMessageFromSuccess('수강 취소가 완료되었습니다.'),
    };
  } catch (error) {
    console.error('[unenroll] unexpected error', { error, courseId });
    return {
      ok: false,
      message: actionMessageFromError(error),
      code: 500,
    };
  }
}
