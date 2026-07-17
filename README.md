# JobMo — Phase 7: Polish & Production

AI-powered hiring & recruitment platform for Sri Lanka. This package contains
**all seven phases** — Foundation, Applicant Module, Employer Module, AI
Engine, Learning Center, Administration, and now Polish & Production. This
is the complete platform as originally scoped.

## What's new in Phase 7

- **Security headers**: CSP, HSTS, X-Frame-Options, X-Content-Type-Options,
  Referrer-Policy, and Permissions-Policy applied to every route via
  `next.config.js` — see `SECURITY.md` for the full reasoning behind each.
- **Login rate limiting**: 5 failed attempts per email locks further tries
  for 15 minutes, tracked server-side (`login_attempts` table + 3 guarded
  functions), independent of whatever Supabase Auth enforces on its own.
- **Real automated tests**: Vitest, with 17 tests covering the job-matching
  algorithm (verifying a strong-fit candidate scores high and a weak-fit
  candidate scores low — not just "it runs"), the `getErrorMessage` helper
  (directly covering the bug class that caused the Phase 3 offer-response
  incident), and validation schemas. Run with `npm test`.
- **PWA support**: a real web manifest (installable, themed to the actual
  brand colors), plus a deliberately minimal service worker that does
  exactly one thing — show an offline page on failed navigation — rather
  than aggressively caching a highly dynamic, auth-gated app in ways that
  could serve stale dashboard data.
- **SEO structured data**: job postings now emit schema.org `JobPosting`
  JSON-LD, which is what actually gets a listing into Google's dedicated
  job search results, not just a generic web search result.
- **Accessibility pass**: a skip-to-content link, and an audit that found
  (and fixed) 6 icon-only buttons across the admin/employer UI missing
  `aria-label`.
- **Maintenance mode, for real**: already wired into the middleware in
  Phase 6 — Phase 7 didn't need to touch it, which is itself a small proof
  that it was built correctly the first time.
- **A performance attempt that got reverted, on purpose**: tried making the
  public `/jobs` and `/companies` listings statically generated for real
  caching benefit. It surfaced a genuine tradeoff — static generation means
  Next.js fetches data at *build* time, so every deploy would need working
  Supabase credentials reachable during the build itself, turning a
  transient data hiccup into a failed deployment instead of just a slow
  page load. Reverted rather than ship something unverified; the
  `lib/supabase/public-client.ts` groundwork is left in place with the
  tradeoff documented for a future attempt with a build pipeline that can
  guarantee it.
- **`DEPLOYMENT.md`** and **`SECURITY.md`**: a real pre-launch checklist
  and an honest security model writeup, not boilerplate.

## What's in Phase 6 (unchanged, see below for Phase 1-5 details)

- **DOB change approval — the real UI, finally.** Every phase since Phase 2
  has said "the RPC works today, the admin UI comes in Phase 6." It's here:
  `/dashboard/admin/approvals` lists every request, lets you open the
  uploaded ID documents (signed URLs, 5-minute expiry), and approve/reject
  with a required comment — calling the exact `review_dob_change_request()`
  function that's existed since Phase 2.
- **Company verification — same story.** `companies.verification_status`
  has existed since Phase 3 with no way to change it except a raw SQL
  update. Added a proper guarded `review_company_verification()` function
  (audit-logged, notifies the employer) and a real approval UI in the same
  Approvals page.
- **User management**: search/filter all applicants and employers, suspend
  or reactivate any account (`admin_update_profile_status()`, audit-logged).
- **Audit log viewer**: every audit-logged action across the entire
  platform (role changes, approvals, application status changes, account
  deletions, interview/offer responses, and more) — filterable by entity
  type. This data has been accumulating since Phase 1; there was just no
  way to see it until now.
- **Support tickets**: the Contact page now actually submits somewhere — a
  real ticket inbox at `/dashboard/admin/support` with status tracking and
  two-way replies.
- **Super Admin — Admins & Roles**: promote any user to admin/super_admin
  by email (calls the existing `admin_update_profile_role()` guarded RPC),
  assign granular permissions to admin accounts.
- **Super Admin — CMS & Announcements**: create announcements that appear
  as a dismissible banner across every signed-in user's dashboard.
- **Super Admin — Platform Settings**: real feature toggles (maintenance
  mode, Google sign-in, registrations) stored in the database and checked
  by the actual middleware — maintenance mode genuinely redirects non-admin
  visitors to a maintenance page. An AI configuration status panel shows
  whether `OPENAI_API_KEY` is configured (status only — the key itself
  stays in environment variables, never touches the database).
- Fixed a couple of pre-existing gaps found while building this out: admin
  dashboard overview and super admin overview both had hardcoded/zeroed
  placeholder stats since Phase 1 — now show real counts.

## What's in Phase 5 (unchanged, see below for Phase 1-4 details)

- **Content library**: categories, videos (YouTube/Vimeo embed), articles
  (rich text), and PDFs — organized and browsable inside the applicant
  dashboard at `/dashboard/applicant/learning`
- **Quizzes with a real countdown timer**: auto-submits when time runs out,
  tracks answered/unanswered progress, and shows results immediately
- **Server-side grading**: correct answers never reach the browser during a
  quiz attempt — grading happens entirely inside the `submit_quiz_attempt()`
  database function, so answers can't be seen by inspecting network
  requests. The applicant-facing question fetch (`getQuestionsForTaking()`)
  explicitly excludes `correct_option_id` at the query level too, as a
  second layer of defense.
- **Certificates**: awarded automatically on first pass of any quiz, with a
  real generated PDF (same `@react-pdf/renderer` approach as the resume and
  offer letter templates)
- **Leaderboard**: per-quiz, ranked by score then speed
- **Progress tracking + simple badges**: lessons completed, quizzes passed,
  and threshold-based badges (first lesson, 5 lessons, first quiz passed,
  3 quizzes passed) — no separate badge-admin system, just derived from
  real activity
- **Lightweight admin content management** at `/dashboard/admin/learning-center`
  (categories, content, quizzes + questions with correct-answer selection) —
  accessible today via your existing super_admin account, since the full
  polished Admin/CMS UI is Phase 6's job. This mirrors how DOB-change
  approval was handled in Phase 2: the real functionality exists now, the
  dedicated admin interface gets built out properly next.
- Fixed a pre-existing gap while touching the admin nav: `/dashboard/admin/users`,
  `/approvals`, and `/analytics` had been dead links since Phase 1 (no pages
  existed) — added stub pages so they at least resolve cleanly until
  Phase 6 builds them out properly.

## What's in Phase 4 (unchanged, see below for Phase 1-3 details)

- **Job matching**: a real, deterministic weighted algorithm
  (`lib/ai/matching.ts`) scores every applicant against every job on
  skills overlap, experience, education, location/remote fit, salary
  range, employment type, and industry — not an opaque AI call, so it's
  free to run at any volume and always explainable. Runs automatically
  when a job is published (`runMatchingForJob()`), and on-demand when an
  applicant views a job that hasn't been scored yet.
- **Automatic notifications**: any match scoring 75%+ notifies the
  applicant automatically — this is the literal spec requirement, wired
  end-to-end through the existing `create_notification()` RPC.
- **"Why you matched"**: applicants see their match %, which required
  skills they have, and which they're missing — on the job detail page
  and the new "Browse Jobs" list (sorted by best match first).
- **Candidate ranking**: employers see each applicant's match score on
  their pipeline board, sorted highest-first within each column.
- **AI Resume Builder**: generates a professional summary, an ATS-style
  resume score (0-100), and specific improvement suggestions — appears in
  the downloaded PDF too. Requires `OPENAI_API_KEY`; shows a clear
  "not configured yet" message otherwise rather than crashing.
- **AI skill extraction**: a button on the Skills tab suggests skills
  based on your actual experience/education text, which you add with one
  click (flagged `is_ai_suggested` for transparency).
- **Employer AI features**: "Improve with AI" rewrites a job description
  for clarity and keywords; "Suggest salary range" estimates a range from
  the role/experience/industry; "Generate interview questions" produces
  candidate-specific questions combining the job requirements with what's
  known about that applicant.
- Every AI feature above degrades gracefully with no `OPENAI_API_KEY`
  configured — verified directly (not assumed): a smoke test confirms
  `getOpenAIClient()` returns `null` and every AI action returns a clear
  "not set up yet" message instead of throwing.

## What's in Phase 3 (unchanged, see below for Phase 1-2 details)

- Company profiles: logo/cover/gallery uploads, description, industry, size,
  locations, social links, benefits, culture — publicly viewable at
  `/companies/[id]`, with a "Verified" badge once admin approval exists (Phase 6)
- Registration fix: accounts that choose "I'm hiring" now get `role='employer'`
  directly at sign-up (previously deferred, which had no working path to
  actually grant it) — verification gates trust in the *company*, not the role
- Job posting: title, rich-text description (lightweight built-in editor —
  bold/italic/lists/links, no heavy dependency), required/preferred skills,
  experience & education requirements, salary range with a public/private
  toggle, benefits, work type, employment type, application deadline, and
  repeatable screening questions. Save as draft or publish.
- Public job board (`/jobs`, `/jobs/[id]`) now reads real published jobs —
  no more mock data — with one-click apply for logged-in applicants
- Full applicant pipeline: a Kanban board (Applied → Shortlisted → Interview →
  Offer → Hired, plus Rejected) with native drag-and-drop, a detail view
  showing the candidate's education/experience/skills, internal notes, tags,
  and the complete 13-status dropdown for granular control
- Interview scheduling: online/offline/hybrid, platform, meeting link,
  location, date/time, duration, panel members, instructions — applicants can
  accept, decline, or request a reschedule
- Offer management: employer sends an offer (position, salary, start date,
  benefits, terms); applicant can accept, reject, or download a generated PDF
  offer letter; every response is audit-logged
- Every pipeline status change **automatically notifies the applicant**
  (via the guarded `change_application_status()` RPC — this is the only way
  status ever changes, guaranteeing the notification fires every time)
- Employer-read RLS policies added retroactively to Phase 2's profile section
  tables (education, experience, skills, etc.) — a gap where employers
  couldn't see applicant details even though `applicant_profiles` itself
  already allowed it

## What's in Phase 2 (unchanged, see below for Phase 1 details)

- Full applicant profile: personal details, education, experience, skills,
  certifications, projects, awards, volunteer experience, languages, hobbies,
  social links, references, and job preferences (salary, availability,
  locations, remote preference, industry, employment type, notice period)
- Date-of-birth change workflow: applicants upload ID documents and request a
  change; nothing updates `date_of_birth` directly — only the guarded
  `review_dob_change_request()` RPC can, and only for admin/super_admin
  (now with a real approval UI at `/dashboard/admin/approvals` — see Phase 6)
- Weighted profile completion calculation (real data, not a placeholder),
  shown on the dashboard and gating the Resume Builder
- Resume Builder: 2 free, fully working PDF templates (Classic, Modern)
  rendered server-side from real profile data via `@react-pdf/renderer`,
  plus 3 "Coming Soon" premium template cards, gated behind 100% completion
- Notification center with real Postgres-backed notifications, unread badge
  in the dashboard header, mark-as-read/mark-all-read (Realtime-enabled table,
  ready for Phase 4's automated match/status notifications)
- Settings: change password, notification preferences, and a soft-delete
  account flow (password + typed confirmation, audit-logged, status flips to
  `deleted` rather than erasing the row)
- One reusable `RepeatableSection` component + a server-action factory power
  all ten "add unlimited entries" profile sections — not ten bespoke CRUD UIs

## What's in Phase 1 (unchanged, see below for details)

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

Run these twenty-five migrations **in order**, naming each query as shown:

1. `supabase/migrations/0001_init_schema.sql` → name it **`phase1_init_schema`**
2. `supabase/migrations/0002_rls_policies.sql` → name it **`phase1_rls_policies`**
3. `supabase/migrations/0003_applicant_profile_schema.sql` → name it **`phase2_applicant_profile_schema`**
4. `supabase/migrations/0004_phase2_rls_policies.sql` → name it **`phase2_rls_policies`**
5. `supabase/migrations/0005_storage_buckets.sql` → name it **`phase2_storage_buckets`**
6. `supabase/migrations/0006_profile_na_flags.sql` → name it **`phase2_profile_na_flags`**
7. `supabase/migrations/0007_employer_schema.sql` → name it **`phase3_employer_schema`**
8. `supabase/migrations/0008_phase3_rls_policies.sql` → name it **`phase3_rls_policies`**
9. `supabase/migrations/0009_company_assets_bucket.sql` → name it **`phase3_storage_bucket`**
10. `supabase/migrations/0010_pipeline_fixes.sql` → name it **`phase3_pipeline_fixes`**
11. `supabase/migrations/0011_offer_response_fix.sql` → name it **`phase3_offer_response_fix`**
12. `supabase/migrations/0012_ai_engine_schema.sql` → name it **`phase4_ai_engine_schema`**
13. `supabase/migrations/0013_phase4_rls_policies.sql` → name it **`phase4_rls_policies`**
14. `supabase/migrations/0014_learning_center_schema.sql` → name it **`phase5_learning_center_schema`**
15. `supabase/migrations/0015_phase5_rls_policies.sql` → name it **`phase5_rls_policies`**
16. `supabase/migrations/0016_admin_schema.sql` → name it **`phase6_admin_schema`**
17. `supabase/migrations/0017_phase6_rls_policies.sql` → name it **`phase6_rls_policies`**
18. `supabase/migrations/0018_rate_limiting_schema.sql` → name it **`phase7_rate_limiting_schema`**
19. `supabase/migrations/0019_job_matches_rls_fix.sql` → name it **`phase4_job_matches_rls_fix`**
20. `supabase/migrations/0020_bugfix_batch.sql` → name it **`phase2_3_bugfix_batch`**
21. `supabase/migrations/0021_profile_section_na_flags.sql` → name it **`profile_section_na_flags`**
22. `supabase/migrations/0022_profile_extras_individual_na_flags.sql` → name it **`profile_extras_individual_na_flags`**
23. `supabase/migrations/0023_talent_pool_and_targeting_schema.sql` → name it **`talent_pool_and_targeting_schema`**
24. `supabase/migrations/0024_email_reminder_tracking.sql` → name it **`email_reminder_tracking`**
25. `supabase/migrations/0025_referrals_and_job_boosts.sql` → name it **`referrals_and_job_boosts`**

Supabase's SQL Editor may warn that `0007` "creates tables without enabling
Row Level Security" — that's expected and safe here: schema and RLS are
deliberately split into separate files (`0007` then `0008`), same pattern as
every phase. Click **"Run without RLS"** for `0007`, then run `0008`
immediately after.

Verify: **Table Editor** should show `profiles`, `audit_logs`, `applicant_profiles`,
`dob_change_requests`, `education_entries`, `experience_entries`, `skills`,
`certifications`, `projects`, `awards`, `volunteer_experience`, `languages`,
`hobbies`, `applicant_references`, and `notifications` — all with RLS enabled.
**Storage** should show four buckets: `profile-photos`, `resumes`,
`certificates`, `documents`.

## 4. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the Supabase values from step 2. Leave the Stripe placeholders as-is
— they're not used until billing is built.

**To enable AI features (Phase 4)**, get an API key from
https://platform.openai.com/api-keys and set:
```
OPENAI_API_KEY=sk-...your real key...
```
Without this, the app still works completely — job matching (the scoring
algorithm) runs regardless, since it's not AI-based. Only the OpenAI-backed
features (AI resume summary/score, skill suggestions, job description
improvement, salary suggestions, interview question generation) show a
"AI features aren't set up yet" message until you add a key. There's no
separate flag to toggle — adding the key is all that's needed.

**To enable automatic Brevo contact sync** (adds every new signup to the
matching marketing list in Brevo — see `CHANGELOG.md` for why this is
deliberately fail-safe), set:
```
BREVO_API_KEY=xkeysib-...your real key...
BREVO_APPLICANT_LIST_ID=...the numeric list ID from Brevo...
BREVO_EMPLOYER_LIST_ID=...the numeric list ID from Brevo...
```
Without these, registration still works completely normally — the sync
silently skips itself if any of the three are missing. No separate flag
needed here either.

**To secure the daily email-reminder cron job**, set:
```
CRON_SECRET=any-random-string-you-pick
```
Pick any random value (a password generator works fine) — this isn't
something Vercel hands you, you choose it yourself, then Vercel
automatically sends it back as an `Authorization` header on its own
scheduled calls to `/api/cron/email-reminders`. Without this set, the
route still works but isn't protected from being triggered by anyone
who finds the URL.

## 5. Install and run locally

```bash
npm install
npm run dev
```

`npm run dev` now uses Turbopack (`next dev --turbopack`) — Next.js 15's
faster dev compiler. If you hit any dev-only weirdness that a normal
`next dev` doesn't have, you can temporarily drop the flag in
`package.json`'s `dev` script to fall back to webpack; it won't affect
production builds either way.

**A real gotcha on Windows**: dev-mode compiles each route on first visit
in a session (expected — production is pre-compiled, this isn't), but on
Windows this is often made much worse by antivirus/Windows Defender
scanning every file webpack writes to `.next/` in real time. Add an
exclusion for your project folder in Windows Security → Virus & threat
protection → Manage settings → Add exclusion → Folder. This is a very
common, very large speedup for Next.js dev on Windows specifically.

Visit http://localhost:3000. Try:
- Registering a new account (as applicant, then as employer) at `/register`
- Confirming the email (check Supabase's built-in email, or your inbox if SMTP is configured)
- Logging in at `/login`
- Visiting `/dashboard/applicant` while logged in as an applicant, then trying
  `/dashboard/employer` — middleware should redirect you back
- Toggling light/dark mode in the top-right corner

### Running the automated test suite

```bash
npm test
```

This runs 17 Vitest unit tests covering the job-matching algorithm,
validation schemas, and the `getErrorMessage` error-handling helper — no
Supabase connection needed, these test pure logic. Add `npm run test:watch`
during development to re-run on file changes.

## 6. Testing employer accounts (no bootstrap needed)

As of Phase 3, registering with "I'm hiring" selected gives that account
`role='employer'` immediately — no SQL needed. Just register normally at
`/register?type=employer` and you'll land on `/dashboard/employer`. Set up
a company profile there, then post a job.

## 7. Make yourself a super_admin (for testing admin dashboards)

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

## 8. Deploy to Netlify

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

- **Only 17 unit tests, no end-to-end tests.** These cover pure logic
  (matching algorithm, validation, error handling) reliably and fast, but
  nothing exercises a real browser flow (login → apply → pipeline →
  offer). Adding Playwright for a handful of critical-path e2e tests would
  be the natural next investment.
- **CSP allows `'unsafe-inline'` and `'unsafe-eval'`** in `script-src` —
  required by Next.js's current dev/hydration behavior. Tightening this
  with per-request nonces is a reasonable next hardening pass; see
  `SECURITY.md` for detail.
- **No error tracking service wired up** — `app/global-error.tsx` has a
  `console.error` call marked as the integration point for Sentry or
  similar; nothing sends errors anywhere yet.
- **Static generation for public listings was attempted and reverted** —
  see the README's Phase 7 summary above and `lib/supabase/public-client.ts`
  for the full reasoning; this remains dynamically rendered by design, not
  by oversight.
- See `DEPLOYMENT.md` for the full pre-launch checklist and `SECURITY.md`
  for the complete security model writeup — both are new in this phase and
  more detailed than what fits here.

- **No dedicated "Jobs moderation" admin view** — admins can suspend an
  employer account, but there's no direct "unpublish this specific job"
  admin action yet. Worth adding if content moderation needs grow.
- **"Reports" (spec) overlaps with Analytics + Audit Logs** rather than
  being a separate report-generation feature — interpreted narrowly given
  the overlap; revisit if you need actual exportable reports (CSV/PDF).
- **Email/Payment/API key settings are intentionally not built** —
  these need real provider decisions (which email service, Stripe
  integration, a public API surface that doesn't exist yet) rather than
  empty placeholder forms. Same reasoning as billing being deferred
  throughout the whole build.
- **Backup/database management and system health monitoring are out of
  scope** — Supabase's own dashboard already provides this at the
  infrastructure level; duplicating it inside the app wouldn't add value.
- **Support tickets have no email notifications** — replies show up in the
  ticket thread in-app only; the submitter would need to check back or you'd
  need an email integration to notify them, which doesn't exist yet.

- **Content management is functional but not polished** — it lives at
  `/dashboard/admin/learning-center` today (reachable by your super_admin
  account), built with the same design system as everything else, but
  Phase 6 will give it a proper place in a fuller Admin/CMS experience
  (bulk actions, richer media upload instead of pasting URLs, etc.)
- **No content exists until you add some** — after running the migrations,
  Categories/Content/Quizzes will all be empty. See "Testing" below for the
  quickest path to a working test quiz.
- **Practice Tests vs. Quizzes**: the spec lists these as separate concepts;
  they're implemented as one system here (a "quiz" can be a short practice
  test or a longer graded one — same underlying feature, just described
  differently depending on how you title/frame it when creating one).
- **Video content requires a YouTube or Vimeo URL** — other video hosts
  will just link out rather than embed. Uploading video files directly
  isn't supported (would need its own storage bucket + player, deferred).

- **Duplicate applicant / fake profile detection is deferred** — this needs
  its own design pass (what counts as a duplicate, how false positives get
  reviewed) rather than a quick bolt-on.
- **Matching runs synchronously when a job is published** — fine at the
  scale this is being tested at, but at real volume this should move to a
  background job/queue rather than looping through every applicant inline.
  Flagged in the code comments where this happens
  (`lib/ai/matching-service.ts`).
- **AI cost/rate limits aren't managed yet** — every AI button call hits
  OpenAI directly with no caching beyond what's persisted (resume summary/
  score are stored; job description improvements and interview questions
  are not, so regenerating costs another API call each time). Worth adding
  usage limits before opening this to real users at scale.
- The salary suggestion and job description improvement are genuinely
  useful drafts, not authoritative — the AI is explicit in its own
  reasoning text that this is an estimate, not real market data.

- **Team/multi-recruiter company accounts are deferred.** Each company has a
  single owner for this phase — "Recruiters, Departments, Hiring managers"
  from the spec is real but bigger scope; the schema is intentionally left
  easy to extend with a `company_members` table later without touching
  `companies` itself.
- **Bulk email / email templates (the "Communication" spec section) are
  deferred** — this needs an actual email provider decision (Resend, SES,
  etc.), not just a DB table, so it's better scoped as its own piece of work
  rather than half-built now.
- **Calendar integration (Google Calendar sync) is deferred** — interview
  scheduling stores everything needed (date/time/duration/link), but doesn't
  push to an external calendar yet; that requires OAuth scopes beyond what
  Google sign-in currently requests.
- **Candidate search, AI ranking, duplicate detection, and interview-question
  generation are Phase 4 (AI Engine) by design** — same reasoning as Phase 2's
  AI deferrals. The pipeline board's "detail" view already surfaces a
  candidate's education/experience/skills for manual review in the meantime.
- **Employer analytics is a handful of counts on the dashboard overview**, not
  charts — deeper analytics fits better once there's real usage data to chart.
- **CSV export and bulk pipeline actions are not built yet** — noted as a
  fast-follow, not fundamental to the core loop.
- Job descriptions use a lightweight custom rich-text editor (bold/italic/
  lists/links via `contentEditable`), not a full WYSIWYG framework — kept
  deliberately small to avoid another heavy dependency after the React 19
  upgrade experience in Phase 2.

- **AI writing is not wired up yet** — the Resume Builder's PDFs render your
  profile data directly into the two free templates. Grammar improvement,
  generated summaries, ATS scoring, and skill extraction all arrive in
  Phase 4 (AI Engine) once `OPENAI_API_KEY` is live — this matches the
  phase plan, it's not a shortcut.
- The 3 premium resume templates are visible but intentionally disabled
  ("Coming Soon") — no download is possible for them, per spec.
- `/dashboard/applicant/jobs` (Applied Jobs) is a stub — real applications
  arrive once job postings exist in Phase 3.
- Notifications table is Realtime-enabled and the UI supports it, but nothing
  creates notifications automatically yet — that starts with Phase 3 (status
  changes) and Phase 4 (AI match alerts). You can test the UI by manually
  calling `create_notification()` via the SQL Editor.
- ~~DOB change requests can be submitted and stored correctly, but there's no
  admin UI to approve/reject them yet (Phase 6)~~ **Resolved in Phase 6** —
  approve/reject them for real at `/dashboard/admin/approvals`, no SQL
  workarounds needed anymore.
- Marketing pages beyond the home page: jobs, companies, and pricing have
  real mock/live content; contact, careers, privacy, terms, and cookies
  are fully written; about/press/faq/features/success-stories/blog/
  learning-center remain structural stubs — content and data wiring
  arrive with the phase that owns each one.
- Live chat is a UI placeholder only, not connected to a provider.
- No automated tests yet — added in Phase 7 (Polish & Production) per the
  phased plan, though nothing stops us from introducing them earlier if you'd
  prefer.
- `requested_account_type` from registration is stored in auth user metadata
  but does **not** auto-grant the `employer` role — by design, so employer
  accounts go through verification (Phase 3) rather than self-granting.

## Changelog

See `CHANGELOG.md`.
