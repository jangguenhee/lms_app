import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import Module from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CourseDraftInput } from '../src/lib/validations/course';
import type { ActionDependencies } from '../src/app/(instructor)/instructor/courses/[courseId]/actions';
import type { CourseRow } from '../src/types/db';

process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'anon-key';
process.env.SUPABASE_URL ??= 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'service-role-key';

if (!process.env.NODE_PATH) {
  const srcPath = fileURLToPath(new URL('../src', import.meta.url));
  process.env.NODE_PATH = srcPath;
  Module._initPaths();
}

const actionsModule = await import(
  new URL('../src/app/(instructor)/instructor/courses/[courseId]/actions.ts', import.meta.url).href,
);

const { createCourseInternal, publishCourseInternal, updateCourseInternal } = actionsModule;

const noopRevalidate = () => {};

test('createCourse stores draft and returns course id', async () => {
  let insertedPayload: Record<string, unknown> | undefined;

  const supabase = createSupabaseMock({
    onInsert: async (payload) => {
      insertedPayload = payload;
      return { data: { id: 'course-123' }, error: null };
    },
  });

  const deps: ActionDependencies = {
    requireInstructor: async () => ({
      supabase,
      user: { id: 'instructor-1' } as const,
      profile: { id: 'instructor-1', role: 'instructor', onboarded: true } as const,
    }),
    requireCourseOwnership: async () => {
      throw new Error('requireCourseOwnership should not be called in createCourse test');
    },
    revalidatePath: noopRevalidate,
  };

  const input: CourseDraftInput = {
    title: '테스트 코스',
    description: '이 코스는 테스트 용도로 생성되었습니다.',
    thumbnailUrl: undefined,
  };

  const result = await createCourseInternal(deps, input);

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

  const deps: ActionDependencies = {
    requireInstructor: async () => {
      throw new Error('requireInstructor should not be called in publishCourse test (ownership stub provides)');
    },
    requireCourseOwnership: async () => ({
      supabase: createSupabaseMock(),
      user: { id: 'instructor-1' } as const,
      profile: { id: 'instructor-1', role: 'instructor', onboarded: true } as const,
      course,
    }),
    revalidatePath: noopRevalidate,
  };

  const result = await publishCourseInternal(deps, course.id);
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

  const deps: ActionDependencies = {
    requireInstructor: async () => {
      throw new Error('requireInstructor should not be called in publishCourse test (ownership stub provides)');
    },
    requireCourseOwnership: async () => ({
      supabase,
      user: { id: 'instructor-1' } as const,
      profile: { id: 'instructor-1', role: 'instructor', onboarded: true } as const,
      course,
    }),
    revalidatePath: noopRevalidate,
  };

  const result = await publishCourseInternal(deps, course.id);

  assert.equal(result.ok, true);
  assert.ok(updated, 'status should be updated to published');
});

test.skip('new course page renders for instructor without throwing (Next runtime only)', async () => {});

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
        insert(payload: Record<string, unknown> | Record<string, unknown>[]) {
          const rows = Array.isArray(payload) ? payload : [payload];
          return {
            select() {
              return {
                single: async () =>
                  (await options?.onInsert?.(rows[0])) ?? { data: { id: 'course-id' }, error: null },
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
