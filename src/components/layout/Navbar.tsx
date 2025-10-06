import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

async function getUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user;
}

export async function Navbar() {
  const user = await getUser();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Teachable
          </span>
        </Link>

        {/* Right side buttons */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link href="/courses">
                <Button variant="ghost" size="sm">
                  코스 보기
                </Button>
              </Link>
              <Link href={user.user_metadata?.role === 'instructor' ? '/instructor/dashboard' : '/learner/dashboard'}>
                <Button variant="ghost" size="sm">
                  대시보드
                </Button>
              </Link>
              <form action="/api/auth/signout" method="POST">
                <Button variant="ghost" size="sm" type="submit" className="gap-2">
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link href="/signin">
                <Button variant="ghost" size="sm">
                  로그인
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">
                  Start for free
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
