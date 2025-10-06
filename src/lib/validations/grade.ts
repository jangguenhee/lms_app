import { z } from 'zod';

export const gradeCreateSchema = z.object({
  score: z
    .number({ required_error: '점수를 입력해주세요' })
    .min(0, '점수는 0 이상이어야 합니다')
    .max(100, '점수는 100 이하여야 합니다'),
  feedback: z
    .string()
    .max(5000, '피드백은 5000자 이하여야 합니다')
    .optional()
    .or(z.literal('')),
  requestResubmit: z.boolean().default(false),
});

export const gradeUpdateSchema = z.object({
  score: z
    .number({ required_error: '점수를 입력해주세요' })
    .min(0, '점수는 0 이상이어야 합니다')
    .max(100, '점수는 100 이하여야 합니다'),
  feedback: z
    .string()
    .max(5000, '피드백은 5000자 이하여야 합니다')
    .optional()
    .or(z.literal('')),
});

export type GradeCreateInput = z.infer<typeof gradeCreateSchema>;
export type GradeUpdateInput = z.infer<typeof gradeUpdateSchema>;
