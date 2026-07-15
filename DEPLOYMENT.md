# JobMo — Production Deployment Guide

This is the final pre-launch checklist, written for going from "working on
my machine" to "live for real users." If you've followed each phase's
README instructions, your local setup already works — this is about taking
that same setup to production safely.

## 1. Supabase production project

- [ ] If you've been developing against a free/dev Supabase project,
      decide whether to promote it to production or create a fresh one.
      Either way, confirm the project's region matches your primary user
      base (Singapore is a solid default for Sri Lanka).
- [ ] Run all 18 migrations from `supabase/migrations/` in order, exactly
      as documented in `README.md`, against the production project.
- [ ] In Supabase Dashboard → Authentication → URL Configuration, set
      **Site URL** to your real production domain (not `localhost`).
- [ ] Add your production domain to **Redirect URLs** (needed for Google
      OAuth and password reset links to work).
- [ ] Re-configure the Google OAuth provider with your production domain's
      redirect URI: `https://your-domain.com/auth/callback`.
- [ ] Under Authentication → Email Templates, customize the confirmation/
      reset emails (the Supabase defaults are functional but generic —
      at minimum update the sender name).
- [ ] Consider Supabase's paid tier if you expect real traffic — the free
      tier has connection and bandwidth limits that a live job board with
      real applicants and employers will hit quickly.

## 2. Environment variables (Netlify)

In Netlify → Site settings → Environment variables, set every value from
your local `.env.local`, pointing at production:

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your production Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production service role key — **never** expose this to the client bundle; it's only used server-side |
| `NEXT_PUBLIC_SITE_URL` | Your real domain, e.g. `https://jobmo.lk` |
| `OPENAI_API_KEY` | Set a real budget/usage alert on the OpenAI account before going live — see "Known limitations" below |
| `OPENAI_MODEL` | Optional, defaults to `gpt-4o-mini` |

- [ ] Double-check none of these are committed anywhere in the repo (they
      aren't — `.env.local` is gitignored — but worth a final grep before
      your first real deploy: `git grep -i "sk-\|service_role"`)

## 3. Bootstrap your first real admin

Before inviting real users, promote your own account:

```sql
-- Run once, in Supabase SQL Editor, against production
update public.profiles
set role = 'super_admin'
where email = 'your-real-admin-email@example.com';
```

From then on, use `/dashboard/super-admin/admins` to promote anyone else —
never repeat the raw SQL bootstrap for additional admins.

## 4. Platform settings sanity check

- [ ] Visit `/dashboard/super-admin/settings` and confirm `maintenance_mode`
      is **off** before launch (it defaults to off, but double check).
- [ ] Confirm the AI configuration panel shows "configured" if you're
      using AI features, or is clearly documented as "not yet enabled" for
      your team if you're launching without an OpenAI budget yet.

## 5. Netlify build settings

- [ ] Confirm `netlify.toml`'s Node version (currently pinned to 20) still
      matches what you want at launch time.
- [ ] Do a full production build locally first to catch anything
      environment-specific before pushing: `npm run build`.
- [ ] After the first Netlify deploy, check the deploy log for the
      security headers actually being applied — inspect any page's
      response headers in your browser's Network tab and confirm
      `Content-Security-Policy`, `X-Frame-Options`, and
      `Strict-Transport-Security` are present.

## 6. Post-launch monitoring

There's no built-in error tracking or uptime monitoring in this codebase —
worth adding before real traffic:
- [ ] An error tracking service (Sentry or similar) — `app/global-error.tsx`
      already has a `console.error` call marked for this; wire it up there.
- [ ] Uptime monitoring on your production domain.
- [ ] A dashboard or alert for OpenAI API spend, since nothing in this app
      caps AI usage per user yet (see README "Known issues" under Phase 4).

## 7. Data protection basics

- [ ] Confirm Supabase's automatic backups are enabled for your production
      project tier (check Supabase Dashboard → Database → Backups).
- [ ] Review who has access to the Supabase project dashboard itself — it
      has more power than any role inside the app (including the ability
      to bypass RLS entirely via the SQL Editor).
- [ ] Rotate the service role key if it was ever pasted into a chat, a
      screenshot, or an insecure channel during development.

## What's genuinely production-ready vs. what to revisit

**Solid today:** authentication, RBAC, RLS on every table, input validation
on every form, audit logging, rate-limited login, security headers, a real
test suite for core logic, accessibility basics (skip link, aria-labels,
focus states).

**Worth revisiting before heavy real-world usage** (each already flagged
in the relevant phase's README section, repeated here for one-stop
reference):
- No AI usage caps/rate limiting beyond what OpenAI itself enforces
- Multi-recruiter/team company accounts aren't built (single owner per company)
- No bulk email, calendar sync, or CSV export
- No email notifications for support ticket replies (in-app only)
- Job matching runs synchronously on publish — fine at moderate scale,
  would benefit from a background queue at high volume
- No payment/billing integration (by design — deferred per the original brief)
