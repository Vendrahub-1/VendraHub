# VendraHub owner password recovery

The owner reset flow requires a recovery-specific Supabase email link. It does not accept a normal password session as proof of recovery.

## Supabase recovery email template

In Supabase Dashboard → Authentication → Email Templates → Reset Password, replace the default confirmation link with:

```html
<h2>Reset your VendraHub owner password</h2>
<p>A password reset was requested for the VendraHub owner account.</p>
<p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=recovery">Verify recovery and choose a new password</a></p>
<p>If you did not request this, ignore this email.</p>
```

The application requests the email with a redirect URL ending in `/auth/confirm`. The `token_hash` is verified by Supabase with type `recovery`; a short-lived signed HttpOnly cookie is then issued for the reset page. Expired or invalid links return to `/admin/recover`.

Add the exact app origins that will be used for recovery (the Cloudflare Workers preview hostname and, later, the production hostname) to Supabase Dashboard → Authentication → URL Configuration → Redirect URLs.

## Cloudflare secret

Generate a unique secret of at least 32 characters, for example with `openssl rand -base64 48`. Add it to the Cloudflare Worker as a secret named `ADMIN_RECOVERY_COOKIE_SECRET`. Do not use a `NEXT_PUBLIC_` variable and do not commit the value. Recovery fails closed if the secret is missing or too short.

## Expected security behavior

- The reset form is only served after Supabase verifies a token hash whose type is exactly `recovery`.
- A signed cookie bound to the owner user ID expires after 10 minutes.
- The middleware and password-update route both verify the signed cookie.
- The password update is performed server-side, then the Supabase session and recovery cookie are cleared.
- Normal owner password sessions cannot access the reset form or recovery update endpoint.
- Admin APIs continue to require the designated owner identity and AAL2; email confirmation is not an authorization condition.
