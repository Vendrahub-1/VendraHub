import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== 'vendrahub@hotmail.com' || !user.email_confirmed_at) {
    return NextResponse.json({ error: 'Owner access only.' }, { status: 403 });
  }
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== 'aal2') {
    return NextResponse.json({ error: 'Authenticator verification required.' }, { status: 403 });
  }

  const [tickets, audit, suppliers] = await Promise.all([
    supabase.from('support_tickets').select('id', { count: 'exact', head: true }),
    supabase.from('audit_events').select('id', { count: 'exact', head: true }),
    supabase.from('supplier_connections').select('supplier_code, connection_status, integration_method, last_checked_at').order('supplier_code'),
  ]);
  if (tickets.error || audit.error || suppliers.error) {
    return NextResponse.json({ error: 'Could not load administration data.' }, { status: 500 });
  }
  return NextResponse.json({
    ownerEmail: user.email,
    supportTicketCount: tickets.count ?? 0,
    auditEventCount: audit.count ?? 0,
    suppliers: suppliers.data ?? [],
    operations: {
      productImportsEnabled: false,
      supplierPurchasesEnabled: false,
      liveInventoryChangesEnabled: false,
      paymentsEnabled: false,
      liveOrderProcessingEnabled: false,
      fulfilmentAutomationEnabled: false,
    },
  }, { headers: { 'Cache-Control': 'private, no-store' } });
}
