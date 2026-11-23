import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase/config';
import { ADMIN_RECOVERY_COOKIE, verifyAdminRecoveryProof } from '@/lib/admin-recovery';

const OWNER_EMAIL = 'vendrahub@hotmail.com';

export async function middleware(request: NextRequest) {
  const url = SUPABASE_URL;
  const key = SUPABASE_PUBLISHABLE_KEY;
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isAdminLogin = pathname === '/admin/login';
  const isAdminRecovery = pathname === '/admin/recover';
  const isAdminResetPassword = pathname === '/admin/reset-password';
  const isAdminRecoveryPasswordApi = pathname === '/api/admin/recovery-password';
  const isAdminMfa = pathname === '/admin/mfa';
  const isCustomerPrivate = pathname.startsWith('/customer/account') || pathname.startsWith('/api/customer');

  if (!url || !key) {
    if ((isAdminRoute && !isAdminLogin && !isAdminRecovery) || isCustomerPrivate) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Authentication service is not configured.' }, { status: 503 });
      return NextResponse.redirect(new URL(isAdminResetPassword ? '/admin/recover?error=config' : '/admin/login?error=configuration', request.url));
    }
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (isAdminLogin) {
    if (user?.email?.toLowerCase() === OWNER_EMAIL) {
      const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (level?.currentLevel === 'aal2') return NextResponse.redirect(new URL('/admin', request.url));
      if (level?.nextLevel === 'aal2') return NextResponse.redirect(new URL('/admin/mfa', request.url));
    }
    return response;
  }

  if (isAdminRecovery) return response;

  if (isAdminResetPassword || isAdminRecoveryPasswordApi) {
    const isApi = isAdminRecoveryPasswordApi;
    const destination = '/admin/recover?error=expired';
    if (!user) {
      return isApi
        ? NextResponse.json({ error: 'A verified recovery session is required.' }, { status: 401 })
        : NextResponse.redirect(new URL(destination, request.url));
    }
    if (user.email?.toLowerCase() !== OWNER_EMAIL) {
      return isApi
        ? NextResponse.json({ error: 'Owner access only.' }, { status: 403 })
        : NextResponse.redirect(new URL('/admin/login?error=not_authorised', request.url));
    }
    const validRecovery = await verifyAdminRecoveryProof(
      request.cookies.get(ADMIN_RECOVERY_COOKIE)?.value,
      user.id,
      process.env.ADMIN_RECOVERY_COOKIE_SECRET,
    );
    if (!validRecovery) {
      return isApi
        ? NextResponse.json({ error: 'A verified recovery link is required.' }, { status: 403 })
        : NextResponse.redirect(new URL(destination, request.url));
    }
    return response;
  }

  if (isAdminRoute) {
    if (!user) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    if (user.email?.toLowerCase() !== OWNER_EMAIL) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Owner access only.' }, { status: 403 });
      return NextResponse.redirect(new URL('/admin/login?error=not_authorised', request.url));
    }
    const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (level?.currentLevel !== 'aal2' && !isAdminMfa) {
      if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Multi-factor authentication required.' }, { status: 403 });
      return NextResponse.redirect(new URL('/admin/mfa', request.url));
    }
  }

  if (isCustomerPrivate && !user) {
    if (pathname.startsWith('/api/')) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    return NextResponse.redirect(new URL('/customer/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*', '/customer/account/:path*', '/api/customer/:path*'],
};
