# Security

This document describes JobMo's actual security model — what's enforced,
where, and why — rather than a generic checklist. If you're auditing this
codebase or handing it to someone else to maintain, start here.

## Authentication & sessions

- Email/password and Google OAuth via Supabase Auth (`@supabase/ssr`),
  session cookies handled server-side — no tokens ever sit in
  `localStorage`.
- **Login rate limiting**: 5 failed attempts per email within 15 minutes
  blocks further tries (`is_login_rate_limited()`, `record_failed_login()`,
  `clear_login_attempts()` — see `supabase/migrations/0018_rate_limiting_schema.sql`).
  This is app-level, on top of whatever Supabase Auth itself enforces —
  GoTrue isn't exposed to our RLS/SQL layer, so we track attempts
  ourselves in a table with RLS enabled and zero policies (fully
  inaccessible except through the two `SECURITY DEFINER` functions).
- Passwords are never logged, and password reset always goes through
  Supabase's own token flow, never a custom implementation.

## Authorization — Row Level Security

Every table has RLS enabled. The general pattern:
- Users can read/write their own rows (matched on `auth.uid()`)
- `admin`/`super_admin` roles get broader read (and sometimes write) access
  via the `is_admin()` / `is_super_admin()` helper functions
- State transitions that matter (application status, DOB changes, company
  verification, role changes) go through a guarded `SECURITY DEFINER`
  function that checks permissions **inside the function**, not just via
  RLS — this is deliberate: RLS can restrict which *rows* you can update,
  not which *columns*, so anything where "you can see the row but
  shouldn't be able to set every field on it" (e.g. `date_of_birth`, `role`)
  is enforced by a function instead of a raw UPDATE policy.

A real bug from this exact pattern, fixed in Phase 3: a guarded function
called *another* guarded function internally, and the inner function's
permission check evaluated the wrong caller (the real end-user, not an
implied "system" context) — see `_apply_application_status()` in
`0010_pipeline_fixes.sql` for the fix and the reasoning. Worth reading if
you add new guarded functions that call each other.

## Secrets

- `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` live in environment
  variables only — never in the database, never in a client bundle.
  `lib/ai/openai-client.ts` and `lib/supabase/server.ts`'s
  `createServiceRoleClient()` are the only places that read them.
- `platform_settings` (feature toggles, maintenance mode) is deliberately
  NOT used for secrets — it's public-readable by design (the middleware
  needs to check `maintenance_mode` even for logged-out visitors), so
  nothing sensitive belongs there.

## File uploads

- Every storage bucket has an explicit `allowed_mime_types` and
  `file_size_limit` set at creation (see the storage bucket migrations).
- Private buckets (`resumes`, `certificates`, `documents`) use a
  `${auth.uid()}/...` path convention enforced by storage policies — you
  can only write inside your own folder.
- DOB-change ID documents are served via short-lived signed URLs (5 minute
  expiry — `dobReviewRepository.getSignedDocumentUrl()`), never public URLs.

## HTTP security headers

Set in `next.config.js`, applied to every route:
- `Content-Security-Policy` — scoped to what the app actually loads
  (Supabase, Google Fonts, YouTube/Vimeo embeds, OpenAI). Currently allows
  `'unsafe-inline'` and `'unsafe-eval'` in `script-src`, which Next.js's
  dev/hydration process needs — tightening this further with per-request
  nonces is a reasonable next hardening step if you want a stricter policy.
- `X-Frame-Options: DENY` and `frame-ancestors 'none'` — the app can't be
  iframed (clickjacking protection).
- `Strict-Transport-Security` — forces HTTPS for a year once a browser has
  loaded the site once.
- `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`
  — standard hardening, no functional tradeoffs.

## Input validation

Every form submission is validated with Zod on the server side (never
trusting client-side validation alone) — see `lib/validations/*.ts`. Server
Actions re-validate regardless of what the client sent.

## Known gaps (honest, not hidden)

- **CSRF**: Next.js Server Actions have built-in Origin-header CSRF
  protection out of the box — no additional token scheme was added on top,
  since it would be redundant.
- **No WAF/DDoS layer** beyond whatever Netlify provides at the edge by
  default. For a platform handling real PII (NIC numbers, ID documents),
  consider Cloudflare in front of Netlify if traffic grows.
- **No automated dependency vulnerability scanning** configured (e.g.
  Dependabot, Snyk) — worth adding to the GitHub repo once it's pushed.
- **No formal penetration test** has been performed on this codebase.
  Everything above describes the design intent, not a third-party audit.

## Reporting a concern

If you (or anyone else working on this) find a security issue, treat it
like any other bug that touches user data — fix it, then check
`audit_logs` and `login_attempts` for any sign it was already exploited
before the fix landed.
