import { createSupabaseServerClient, type ServerClient } from '../supabase/server';
import type { Database } from '../supabase/types';
import type { CourseRow, ProfileRow } from '../../types/db';

export class HttpError extends Error {
  public readonly code: number;

  constructor(code: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.code = code;
  }
}

type RequireAuthResult = {
  supabase: ServerClient;
  user: NonNullable<Awaited<ReturnType<ServerClient['auth']['getUser']>>['data']['user']>;
};

async function requireAuth(): Promise<RequireAuthResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('[auth] failed to load user', { error });
    throw new HttpError(500, '인증 정보를 확인할 수 없습니다.');
  }

  if (!user) {
    throw new HttpError(401, '로그인이 필요합니다.');
  }

  return { supabase, user };
}

export async function requireInstructor() {
  const { supabase, user } = await requireAuth();

  const profileResponse = await supabase
    .from('profiles')
    .select('id, role, onboarded')
    .eq('id', user.id)
    .maybeSingle();

  if (profileResponse.error) {
    console.error('[auth] failed to fetch profile', { error: profileResponse.error, userId: user.id });
    throw new HttpError(500, '프로필 정보를 불러오지 못했습니다.');
  }

  const profile = profileResponse.data as ProfileRow | null;

  if (!profile) {
    throw new HttpError(403, '접근 권한이 없습니다.');
  }

  if (profile.role !== 'instructor') {
    throw new HttpError(403, '접근 권한이 없습니다.');
  }

  return { supabase, user, profile } as const;
}

export async function requireLearner() {
  const { supabase, user } = await requireAuth();

  const profileResponse = await supabase
    .from('profiles')
    .select('id, role, onboarded')
    .eq('id', user.id)
    .maybeSingle();

  if (profileResponse.error) {
    console.error('[auth] failed to fetch learner profile', {
      error: profileResponse.error,
      userId: user.id,
    });
    throw new HttpError(500, '프로필 정보를 불러오지 못했습니다.');
  }

  const profile = profileResponse.data as ProfileRow | null;

  if (!profile) {
    throw new HttpError(403, '접근 권한이 없습니다.');
  }

  if (profile.role !== 'learner') {
    throw new HttpError(403, '학생 전용 페이지입니다.');
  }

  return { supabase, user, profile } as const;
}

export async function requireCourseOwnership(courseId: string) {
  const { supabase, user, profile } = await requireInstructor();

  const courseResponse = await supabase
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .maybeSingle();

  if (courseResponse.error) {
    console.error('[courses] failed to load course', { error: courseResponse.error, courseId, userId: user.id });
    throw new HttpError(500, '코스 정보를 불러오지 못했습니다.');
  }

  const course = courseResponse.data as CourseRow | null;

  if (!course) {
    throw new HttpError(404, '코스를 찾을 수 없습니다.');
  }

  if (course.instructor_id !== user.id) {
    throw new HttpError(403, '코스에 대한 권한이 없습니다.');
  }

  return { supabase, user, profile, course } as const;
}
