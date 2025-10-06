import { z } from 'zod';

const titleSchema = z
  .string({ required_error: '과제 제목을 입력해주세요.' })
  .trim()
  .min(1, '과제 제목을 입력해주세요.')
  .max(200, '과제 제목은 200자 이하여야 합니다.');

const draftDescriptionSchema = z
  .string()
  .optional()
  .transform((value) => (value ?? '').trim())
  .refine((value) => value.length === 0 || value.length >= 10, {
    message: '과제 설명은 10자 이상이어야 합니다.',
  })
  .refine((value) => value.length === 0 || value.length <= 5000, {
    message: '과제 설명은 5000자 이하여야 합니다.',
  })
  .transform((value) => (value.length === 0 ? undefined : value));

const publishDescriptionSchema = z
  .string({ required_error: '과제 설명을 입력해주세요.' })
  .trim()
  .min(10, '과제 설명은 10자 이상이어야 합니다.')
  .max(5000, '과제 설명은 5000자 이하여야 합니다.');

const dueDateSchema = z
  .string({ required_error: '마감일을 입력해주세요.' })
  .refine((value) => !isNaN(Date.parse(value)), {
    message: '유효한 날짜를 입력해주세요.',
  })
  .transform((value) => new Date(value).toISOString());

const allowLateSubmissionSchema = z.boolean().default(false);

const lateSubmissionDeadlineSchema = z
  .string()
  .optional()
  .refine(
    (value) => {
      if (!value) return true;
      return !isNaN(Date.parse(value));
    },
    {
      message: '유효한 날짜를 입력해주세요.',
    }
  )
  .transform((value) => {
    if (!value) return undefined;
    return new Date(value).toISOString();
  });

export const assignmentDraftSchema = z
  .object({
    title: titleSchema,
    description: draftDescriptionSchema,
    dueDate: dueDateSchema,
    allowLateSubmission: allowLateSubmissionSchema,
    lateSubmissionDeadline: lateSubmissionDeadlineSchema,
  })
  .refine(
    (data) => {
      if (!data.allowLateSubmission) return true;
      if (!data.lateSubmissionDeadline) return false;
      return new Date(data.lateSubmissionDeadline) > new Date(data.dueDate);
    },
    {
      message: '지각 마감일은 정시 마감일보다 늦어야 합니다.',
      path: ['lateSubmissionDeadline'],
    }
  );

export const assignmentPublishSchema = z
  .object({
    title: titleSchema,
    description: publishDescriptionSchema,
    dueDate: dueDateSchema,
    allowLateSubmission: allowLateSubmissionSchema,
    lateSubmissionDeadline: lateSubmissionDeadlineSchema,
  })
  .refine(
    (data) => {
      if (!data.allowLateSubmission) return true;
      if (!data.lateSubmissionDeadline) return false;
      return new Date(data.lateSubmissionDeadline) > new Date(data.dueDate);
    },
    {
      message: '지각 마감일은 정시 마감일보다 늦어야 합니다.',
      path: ['lateSubmissionDeadline'],
    }
  );

export type AssignmentDraftInput = z.infer<typeof assignmentDraftSchema>;
export type AssignmentPublishInput = z.infer<typeof assignmentPublishSchema>;
