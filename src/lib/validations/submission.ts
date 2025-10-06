import { z } from 'zod';

const contentSchema = z
  .string({ required_error: '제출 내용을 입력해주세요.' })
  .trim()
  .min(1, '제출 내용을 입력해주세요.')
  .max(10000, '제출 내용은 10000자 이하여야 합니다.');

const fileUrlSchema = z
  .string()
  .url('유효한 URL을 입력해주세요.')
  .optional()
  .or(z.literal(''));

export const submissionCreateSchema = z.object({
  content: contentSchema,
  fileUrl: fileUrlSchema,
});

export type SubmissionCreateInput = z.infer<typeof submissionCreateSchema>;
