import { z } from 'zod';

const titleSchema = z
  .string({ required_error: '제목을 입력해주세요.' })
  .trim()
  .min(1, '제목을 입력해주세요.')
  .max(200, '제목은 200자 이하여야 합니다.');

const draftDescriptionSchema = z
  .string()
  .optional()
  .transform((value) => (value ?? '').trim())
  .refine((value) => value.length === 0 || value.length >= 10, {
    message: '설명은 10자 이상이어야 합니다.',
  })
  .refine((value) => value.length === 0 || value.length <= 5000, {
    message: '설명은 5000자 이하여야 합니다.',
  })
  .transform((value) => (value.length === 0 ? undefined : value));

const publishDescriptionSchema = z
  .string({ required_error: '설명을 입력해주세요.' })
  .trim()
  .min(10, '설명은 10자 이상이어야 합니다.')
  .max(5000, '설명은 5000자 이하여야 합니다.');

const thumbnailOptionalSchema = z
  .string()
  .optional()
  .transform((value) => value?.trim() ?? '')
  .refine((value) => value.length === 0 || z.string().url().safeParse(value).success, {
    message: '유효한 이미지 URL을 입력해주세요.',
  })
  .transform((value) => (value.length === 0 ? undefined : value));

export const courseDraftSchema = z.object({
  title: titleSchema,
  description: draftDescriptionSchema,
  thumbnailUrl: thumbnailOptionalSchema,
});

export const coursePublishSchema = courseDraftSchema.extend({
  description: publishDescriptionSchema,
});

export type CourseDraftInput = z.infer<typeof courseDraftSchema>;
export type CoursePublishInput = z.infer<typeof coursePublishSchema>;
