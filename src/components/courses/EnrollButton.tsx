'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { enrollCourse, unenrollCourse } from '@/app/(learner)/learner/courses/[courseId]/actions';
import { useToast } from '@/hooks/use-toast';
import { toToastMessage } from '@/lib/utils/toast';
import { Button } from '@/components/ui/button';

type EnrollButtonProps = {
  courseId: string;
  initialEnrolled: boolean;
  className?: string;
};

export function EnrollButton({ courseId, initialEnrolled, className }: EnrollButtonProps) {
  const [isEnrolled, setIsEnrolled] = useState(initialEnrolled);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleEnroll() {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const result = await enrollCourse(courseId);

      if (result.ok) {
        setIsEnrolled(true);
        toast(toToastMessage(result.message));
        router.refresh();
      } else {
        toast(toToastMessage(result.message));
        if (result.code === 401) {
          router.push('/signin');
        }
      }
    } catch (error) {
      console.error('[EnrollButton] unexpected error during enroll', { error, courseId });
      toast({
        title: '오류 발생',
        description: '수강 신청 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleUnenroll() {
    if (isLoading) return;

    setIsLoading(true);

    try {
      const result = await unenrollCourse(courseId);

      if (result.ok) {
        setIsEnrolled(false);
        toast(toToastMessage(result.message));
        router.refresh();
      } else {
        toast(toToastMessage(result.message));
      }
    } catch (error) {
      console.error('[EnrollButton] unexpected error during unenroll', { error, courseId });
      toast({
        title: '오류 발생',
        description: '수강 취소 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button
      onClick={isEnrolled ? handleUnenroll : handleEnroll}
      disabled={isLoading}
      className={className}
      variant={isEnrolled ? 'outline' : 'default'}
      aria-label={isEnrolled ? '수강 취소' : '수강 신청'}
    >
      {isLoading ? '처리 중...' : isEnrolled ? '수강 취소' : '수강 신청'}
    </Button>
  );
}
