'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { RoleSelector, type Role } from '@/presentation/web/components/features/auth/role-selector';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/types';

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleComplete() {
    if (!selectedRole) {
      toast({
        variant: 'destructive',
        title: '역할을 선택해주세요',
        description: '강사 또는 학생 중 하나를 선택해야 합니다',
      });
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({
          variant: 'destructive',
          title: '인증 오류',
          description: '로그인 정보를 찾을 수 없습니다',
        });
        router.push('/signin');
        return;
      }

      const profileUpdate: Database['public']['Tables']['profiles']['Update'] = {
        role: selectedRole,
        onboarded: true,
      };

      const { error } = await (supabase.from('profiles') as any)
        .update(profileUpdate)
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: '온보딩 완료',
        description: '대시보드로 이동합니다',
      });

      if (selectedRole === 'instructor') {
        router.push('/instructor/dashboard');
      } else {
        router.push('/learner/dashboard');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      toast({
        variant: 'destructive',
        title: '오류 발생',
        description: '온보딩 처리 중 오류가 발생했습니다',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-3xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">VMC LMS에 오신 것을 환영합니다</CardTitle>
          <CardDescription>어떤 방식으로 시작하시겠어요?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RoleSelector selectedRole={selectedRole} onSelectRole={setSelectedRole} />

          <Button
            onClick={handleComplete}
            disabled={!selectedRole || isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? '처리 중...' : '시작하기'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
