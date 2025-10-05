import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import type { CourseDraftInput } from '@/lib/validations/course';
import { __testing as actionsTesting } from '@/app/(instructor)/instructor/courses/[id]/actions';
import type { CourseRow } from '@/types/db';

const noopRevalidate = () => {};

test('createCourse stores draft and returns course id', async () => {
  let insertedPayload: Record<string, unknown> | undefined;

  const supabase = createSupabaseMock({
    onInsert: async (payload) => {
      insertedPayload = payload;
      return { data: { id: 'course-123' }, error: null };
    },
  });

  const deps = {
    requireInstructor: async () => ({
      supabase,
      user: { id: 'instructor-1' } as const,
      profile: { id: 'instructor-1', role: 'instructor', onboarded: true } as const,
    }),
    requireCourseOwnership: actionsTesting.defaultDeps.requireCourseOwnership,
    revalidatePath: noopRevalidate,
  };

  const input: CourseDraftInput = {
    title: '테스트 코스',
    description: '이 코스는 테스트 용도로 생성되었습니다.',
    thumbnailUrl: undefined,
  };

  const result = await actionsTesting.createCourseInternal(deps, input);

  assert.equal(result.ok, true, 'action should succeed');
  assert.equal(result.courseId, 'course-123', 'created course id should be returned');
  assert.ok(insertedPayload, 'payload should be passed to insert');
  assert.equal(insertedPayload?.status, 'draft');
  assert.equal(insertedPayload?.instructor_id, 'instructor-1');
});

test('publishCourse blocks when description is missing', async () => {
  const course: CourseRow = {
    id: 'course-404',
    instructor_id: 'instructor-1',
    title: 'Draft Course',
    description: null,
    thumbnail_url: null,
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const deps = {
    requireInstructor: actionsTesting.defaultDeps.requireInstructor,
    requireCourseOwnership: async () => ({
      supabase: createSupabaseMock(),
      user: { id: 'instructor-1' } as const,
      profile: { id: 'instructor-1', role: 'instructor', onboarded: true } as const,
      course,
    }),
    revalidatePath: noopRevalidate,
  };

  const result = await actionsTesting.publishCourseInternal(deps, course.id);
  assert.equal(result.ok, false, 'action should fail');
  assert.equal(result.code, 422);
  assert.ok(result.fieldErrors?.description, 'description error should be present');
});

test('publishCourse succeeds when course is valid', async () => {
  let updated = false;
  const course: CourseRow = {
    id: 'course-200',
    instructor_id: 'instructor-1',
    title: 'Ready Course',
    description: '게시 가능한 충분한 설명입니다.',
    thumbnail_url: null,
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const supabase = createSupabaseMock({
    onUpdate: async () => {
      updated = true;
      return { error: null };
    },
  });

  const deps = {
    requireInstructor: actionsTesting.defaultDeps.requireInstructor,
    requireCourseOwnership: async () => ({
      supabase,
      user: { id: 'instructor-1' } as const,
      profile: { id: 'instructor-1', role: 'instructor', onboarded: true } as const,
      course,
    }),
    revalidatePath: noopRevalidate,
  };

  const result = await actionsTesting.publishCourseInternal(deps, course.id);

  assert.equal(result.ok, true);
  assert.ok(updated, 'status should be updated to published');
});

test('new course page renders for instructor without throwing', async () => {
  const guardsModule = await import('@/lib/auth/guards');
  const restore = mock.method(guardsModule, 'requireInstructor', async () => ({
    supabase: createSupabaseMock(),
    user: { id: 'instructor-1' } as const,
    profile: { id: 'instructor-1', role: 'instructor', onboarded: true } as const,
  }));

  const pageModule = await import('@/app/(instructor)/instructor/courses/new/page');
  const element = await pageModule.default();
  assert.ok(element, 'page should return a React element');

  restore.mock.restore();
});

function createSupabaseMock(options?: {
  onInsert?: (payload: Record<string, unknown>) => Promise<{ data: { id: string }; error: PostgrestLikeError | null }>;
  onUpdate?: (updates: Record<string, unknown>) => Promise<{ error: PostgrestLikeError | null }>;
}) {
  return {
    from(table: string) {
      if (table !== 'courses') {
        throw new Error(`Unexpected table access: ${table}`);
      }

      return {
        insert(payload: Record<string, unknown>) {
          return {
            select() {
              return {
                single: async () =>
                  (await options?.onInsert?.(payload)) ?? { data: { id: 'course-id' }, error: null },
              };
            },
          };
        },
        update(updates: Record<string, unknown>) {
          return {
            eq: async () => (await options?.onUpdate?.(updates)) ?? { error: null },
          };
        },
      };
    },
    auth: {
      getUser: async () => ({
        data: { user: { id: 'instructor-1' } },
        error: null,
      }),
    },
  } as const;
}

type PostgrestLikeError = {
  code?: string;
  message?: string;
};
