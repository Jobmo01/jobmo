# JobMo — Phase 1: Foundation

AI-powered hiring & recruitment platform for Sri Lanka. This package contains
**Phase 1** only: project architecture, authentication, RBAC, the landing
website, navigation, theming, and the database schema.

## What's in this phase

- Next.js 14 App Router + TypeScript + Tailwind + ShadCN-style components
- Supabase Authentication (email/password + Google OAuth) via `@supabase/ssr`
- Role-based access control: `applicant`, `employer`, `admin`, `super_admin`
- Middleware-enforced route protection per role, with audit-logged role changes
- Landing website: home, jobs, companies, pricing, about, learning center,
  blog, FAQ, contact, privacy, terms, cookies, careers, features, success
  stories, press — all routed, themed, and SEO-tagged (stub content where the
  owning phase hasn't been built yet)
- Light/dark theme, responsive nav, live-chat placeholder, newsletter form shell
- Database schema: `profiles`, `audit_logs`, RBAC helper functions, RLS policies
- Error boundaries, loading skeletons, 404 page, account-suspended page

## 1. Prerequisites

- Node.js 18.18+ (recommend 20.x)
- A free [Supabase](https://supabase.com) account
- A GitHub account (`Jobmo01`) and repo created for this project
- A Netlify account for deployment

## 2. Create your Supabase project

1. Go to https://supabase.com/dashboard → **New project**.
2. Pick a region close to Sri Lanka (Singapore is a good default).
3. Once created, go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret — server only)
4. Enable Google sign-in: **Authentication → Providers → Google** → toggle on,
   add your Google OAuth Client ID/Secret (from Google Cloud Console — create
   an OAuth 2.0 Client ID with authorized redirect URI
   `https://<your-project-ref>.supabase.co/auth/v1/callback`).

## 3. Run the database migrations

Go to **Supabase Dashboard → SQL Editor → New query**.

1. Open `supabase/migrations/0001_init_schema.sql`, paste its full contents,
   name the query **`phase1_init_schema`**, and click Run.
2. Open `supabase/migrations/0002_rls_policies.sql`, paste its full contents,
   name the query **`phase1_rls_policies`**, and click Run.

Verify: **Table Editor** should now show `profiles` and `audit_logs` with RLS
enabled (the shield icon).

## 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the Supabase values from step 2. Leave `OPENAI_API_KEY` and the Stripe
placeholders as-is for now — they're not used until later phases.

## 5. Install and run locally

```bash
npm install
npm run dev
```

Visit http://localhost:3000. Try:
- Registering a new account (as applicant, then as employer) at `/register`
- Confirming the email (check Supabase's built-in email, or your inbox if SMTP is configured)
- Logging in at `/login`
- Visiting `/dashboard/applicant` while logged in as an applicant, then trying
  `/dashboard/employer` — middleware should redirect you back
- Toggling light/dark mode in the top-right corner

## 6. Make yourself a super_admin (for testing admin dashboards)

Since there's no UI for this yet (that's Phase 6), promote your own account
manually. In **Supabase SQL Editor**, name the query `phase1_bootstrap_super_admin` and run:

```sql
update public.profiles
set role = 'super_admin'
where email = 'your-email@example.com';
```

(This bypasses the guarded RPC intentionally — it's a one-time bootstrap step
for the very first super_admin. Every role change after this should go
through `admin_update_profile_role()` from an authenticated super_admin session.)

## 7. Deploy to Netlify

1. Push this repo to `github.com/Jobmo01/jobmo`.
2. In Netlify: **Add new site → Import an existing project → GitHub → jobmo**.
3. Build command and publish directory are already set via `netlify.toml`.
4. Add the same environment variables from `.env.local` under
   **Site settings → Environment variables**.
5. Set `NEXT_PUBLIC_SITE_URL` to your Netlify URL (e.g. `https://jobmo.netlify.app`).
6. Update the Google OAuth redirect URI and Supabase Auth "Site URL" /
   "Redirect URLs" settings to include your Netlify URL once deployed.
7. Deploy.

## Folder structure

```
app/
  (marketing)/        # public landing site — route group, no /marketing prefix
  (auth)/              # login, register, forgot-password + server actions
  auth/callback/       # Google OAuth callback route handler
  dashboard/
    applicant/
    employer/
    admin/
    super-admin/
  account-suspended/
  global-error.tsx
  not-found.tsx
components/
  ui/                  # ShadCN-style primitives (button, card, input, ...)
  marketing/           # landing page sections
  dashboard/           # dashboard shell/sidebar
  theme/               # theme provider + toggle
lib/
  supabase/            # client.ts (browser), server.ts (RSC/actions), middleware.ts
  repositories/         # data-access layer (repository pattern)
  validations/          # Zod schemas
  utils.ts
supabase/
  migrations/           # numbered, idempotent SQL migrations
types/
  database.types.ts     # hand-authored; regenerate via `npm run supabase:types`
middleware.ts            # session refresh + RBAC route enforcement
```

## Known issues / deliberate stubs in this phase

- Marketing pages beyond the home page (jobs, companies, pricing have real
  mock content; about/careers/press/faq/contact/privacy/terms/cookies/
  features/success-stories/blog/learning-center are structural stubs) —
  content and data wiring arrive with the phase that owns each feature.
- Dashboard overview pages show zeroed placeholder stats — real data starts
  in Phase 2 (Applicant) and Phase 3 (Employer).
- Live chat is a UI placeholder only, not connected to a provider.
- No automated tests yet — added in Phase 7 (Polish & Production) per the
  phased plan, though nothing stops us from introducing them earlier if you'd
  prefer.
- `requested_account_type` from registration is stored in auth user metadata
  but does **not** auto-grant the `employer` role — by design, so employer
  accounts go through verification (Phase 3) rather than self-granting.

## Changelog

See `CHANGELOG.md`.
