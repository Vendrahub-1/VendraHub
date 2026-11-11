import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: level } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  // Login and MFA pages are public to the authenticated owner session only;
  // middleware separately handles the login route and owner identity.
  if (!user || user.email?.toLowerCase() !== 'vendrahub@hotmail.com' || !user.email_confirmed_at) {
    redirect('/admin/login');
  }
  const pathIsMfa = false;
  if (level.currentLevel !== 'aal2' && !pathIsMfa) {
    // The MFA route is handled by middleware before this layout; render the
    // MFA screen at its own route without mounting the protected dashboard.
    redirect('/admin/mfa');
  }
  return <>{children}</>;
}
