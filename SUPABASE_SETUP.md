# Supabase 설정 가이드

## 1. 이메일 확인 설정

### Supabase Dashboard → Authentication → URL Configuration

**Site URL 설정:**
- Development: `http://localhost:3000`
- Production: `https://vmclms.vercel.app`

**Redirect URLs 추가:**
- `http://localhost:3000/api/auth/callback`
- `https://vmclms.vercel.app/api/auth/callback`

### Email Templates

**Confirm signup 템플릿:**

```html
<h2>Confirm your signup</h2>

<p>Follow this link to confirm your email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm your email</a></p>
```

**중요:** `{{ .ConfirmationURL }}`은 자동으로 `/api/auth/callback?token_hash=...`로 리다이렉트됩니다.

## 2. 환경 변수 설정

### Vercel Production

```bash
NEXT_PUBLIC_APP_URL=https://vmclms.vercel.app
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Local Development (.env.local)

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 3. 이메일 확인 설정 켜기/끄기

### Supabase Dashboard → Authentication → Providers → Email

- **Enable email confirmations**: 체크 ✅
  - 회원가입 시 이메일 확인 링크 발송
  - 확인 후에만 로그인 가능

- **Enable email confirmations**: 체크 해제 ❌
  - 즉시 로그인 가능
  - 이메일 확인 불필요

## 4. 문제 해결

### "OTP expired" 에러

**원인:**
- 이메일 확인 링크가 만료됨 (기본 24시간)
- 링크를 이미 사용했을 때

**해결:**
1. 새로운 이메일로 다시 회원가입
2. 또는 Supabase Dashboard에서 사용자를 삭제 후 재가입

### "Invalid login credentials" 에러

**원인:**
- 이메일 확인을 하지 않은 상태에서 로그인 시도
- 잘못된 비밀번호

**해결:**
1. 이메일 확인 후 로그인
2. 비밀번호 확인

### 로컬 환경으로 리다이렉트되는 문제

**원인:**
- Supabase Site URL이 `http://localhost:3000`으로 설정됨
- 프로덕션 URL이 Redirect URLs에 없음

**해결:**
1. Supabase Site URL을 프로덕션 URL로 변경
2. 또는 둘 다 Redirect URLs에 추가

## 5. 테스트 플로우

### 개발 환경
1. `http://localhost:3000/signup`에서 회원가입
2. 이메일 확인 링크 클릭
3. `http://localhost:3000/api/auth/callback`로 리다이렉트
4. 온보딩 페이지로 이동

### 프로덕션 환경
1. `https://vmclms.vercel.app/signup`에서 회원가입
2. 이메일 확인 링크 클릭
3. `https://vmclms.vercel.app/api/auth/callback`로 리다이렉트
4. 온보딩 페이지로 이동
