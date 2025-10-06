import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

const signupSchema = z.object({
  email: z.string().email({ message: '유효한 이메일을 입력해주세요' }),
  password: z
    .string()
    .min(8, { message: '비밀번호는 8자 이상이어야 합니다' })
    .max(128, { message: '비밀번호는 128자 이하여야 합니다' }),
  name: z.string().min(1, { message: '이름을 입력해주세요' }).max(100), // 추가
});

type SignupBody = z.infer<typeof signupSchema>;

type SignupSuccess = {
  userId: string;
  onboarded: false;
  needsEmailConfirmation?: boolean;
};

type SignupErrorCode =
  | 'validation_error'
  | 'email_already_exists'
  | 'weak_password'
  | 'service_unavailable';

type ErrorPayload = {
  error: {
    code: SignupErrorCode;
    message: string;
    details?: unknown;
  };
};

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json<ErrorPayload>(
      { error: { code: 'validation_error', message: '잘못된 요청 본문입니다' } },
      { status: 400 },
    );
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json<ErrorPayload>(
      {
        error: {
          code: 'validation_error',
          message: '입력값이 유효하지 않습니다',
          details: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const { email, password, name } = parsed.data as SignupBody; // name 추가

  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name, // raw_user_meta_data에 name 포함
        },
      },
    });

    if (error) {
      const message = (error.message || '회원가입 처리 중 오류가 발생했습니다').toLowerCase();

      if (message.includes('password')) {
        return NextResponse.json<ErrorPayload>(
          { error: { code: 'weak_password', message: '비밀번호 정책을 확인해주세요' } },
          { status: 400 },
        );
      }

      if (message.includes('already') || message.includes('registered') || message.includes('exists')) {
        return NextResponse.json<ErrorPayload>(
          { error: { code: 'email_already_exists', message: '이미 등록된 이메일입니다' } },
          { status: 409 },
        );
      }

      return NextResponse.json<ErrorPayload>(
        { error: { code: 'service_unavailable', message: '일시적인 서버 오류입니다. 잠시 후 다시 시도해주세요' } },
        { status: 503 },
      );
    }

    const userId = data.user?.id;
    if (!userId) {
      return NextResponse.json<ErrorPayload>(
        { error: { code: 'service_unavailable', message: '회원가입 결과를 확인할 수 없습니다' } },
        { status: 503 },
      );
    }

    // 이메일 확인이 필요한지 체크 (Supabase의 identities 배열이 비어있으면 확인 필요)
    const needsEmailConfirmation = !data.user?.identities || data.user.identities.length === 0;

    return NextResponse.json<SignupSuccess>(
      { userId, onboarded: false, needsEmailConfirmation },
      { status: 201 }
    );
  } catch {
    return NextResponse.json<ErrorPayload>(
      { error: { code: 'service_unavailable', message: '일시적인 서버 오류입니다. 잠시 후 다시 시도해주세요' } },
      { status: 503 },
    );
  }
}