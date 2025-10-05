'use client';

import { useCallback, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { publishCourse } from '@/app/(instructor)/instructor/courses/[id]/actions';
import { useToast } from '@/hooks/use-toast';
import { toToastMessage } from '@/lib/utils/toast';

type PublishButtonProps = {
  courseId: string;
  status: 'draft' | 'published' | 'archived';
  className?: string;
};

export function PublishButton({ courseId, status, className }: PublishButtonProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isPublished = status === 'published';
  const isDraft = status === 'draft';

  const handlePublish = useCallback(() => {
    startTransition(async () => {
      const result = await publishCourse(courseId);
      toast(toToastMessage(result.message));

      if (result.ok) {
        setOpen(false);
      }
    });
  }, [courseId, toast]);

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        className={className ?? 'bg-emerald-600 text-white hover:bg-emerald-700'}
        disabled={!isDraft || isPending}
        onClick={() => setOpen(true)}
      >
        {isPublished ? '이미 게시됨' : '게시하기'}
      </Button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
          role="presentation"
          onClick={() => !isPending && setOpen(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="publish-dialog-title"
            aria-describedby="publish-dialog-description"
            className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-3">
              <h2 id="publish-dialog-title" className="text-lg font-semibold">
                코스를 게시하시겠습니까?
              </h2>
              <p id="publish-dialog-description" className="text-sm text-muted-foreground">
                코스를 게시하면 학습자에게 공개됩니다. 게시 후에는 코스 내용이 즉시 노출됩니다.
              </p>
            </div>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                onClick={() => setOpen(false)}
              >
                취소
              </Button>
              <Button
                type="button"
                className="bg-emerald-600 text-white hover:bg-emerald-700"
                disabled={isPending}
                onClick={handlePublish}
              >
                {isPending ? '게시 중...' : '게시 확인'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
