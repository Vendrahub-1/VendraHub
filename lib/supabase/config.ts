// Supabase publishable configuration is safe to expose in browser bundles.
// These defaults keep Cloudflare builds working when build-time NEXT_PUBLIC_*
// variables are not injected. Runtime environment values still take precedence.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szishzerqvbdvhmysqpv.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_ZCjQbRtevq1pla9Qv_TGTA_0OIXpWEM';
