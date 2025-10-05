'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Role = 'instructor' | 'learner';

interface RoleSelectorProps {
  selectedRole: Role | null;
  onSelectRole: (role: Role) => void;
}

export function RoleSelector({ selectedRole, onSelectRole }: RoleSelectorProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card
        className={cn(
          'cursor-pointer transition-all hover:border-primary',
          selectedRole === 'instructor' && 'border-primary bg-primary/5'
        )}
        onClick={() => onSelectRole('instructor')}
      >
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>강사로 시작하기</CardTitle>
          <CardDescription>코스를 만들고 학생을 가르칩니다</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <ul className="space-y-1">
            <li>• 코스 생성 및 관리</li>
            <li>• 과제 출제 및 채점</li>
            <li>• 학생 관리</li>
          </ul>
        </CardContent>
      </Card>

      <Card
        className={cn(
          'cursor-pointer transition-all hover:border-primary',
          selectedRole === 'learner' && 'border-primary bg-primary/5'
        )}
        onClick={() => onSelectRole('learner')}
      >
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>학생으로 시작하기</CardTitle>
          <CardDescription>코스를 수강하고 학습합니다</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          <ul className="space-y-1">
            <li>• 코스 수강</li>
            <li>• 과제 제출</li>
            <li>• 성적 확인</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
