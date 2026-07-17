# Changelog

All notable changes to JobMo are documented here, phase by phase.

## Performance fix — redundant auth/DB round trips on every page load — 2026-07-14

### Fixed
Root-caused the "every page feels slow" report by tracing the actual
request path rather than guessing:

- **`profileRepository.getCurrent()` was called twice per page load** on
  most dashboard routes — once in the layout, once again in the page
  itself — and each call independently did its own `auth.getUser()`
  (a real network round trip to Supabase's Auth server, not a local JWT
  decode) plus a fresh `profiles` query. Wrapped it in React's `cache()`
  (official Next.js per-request memoization, torn down after every
  request — not a staleness risk) so repeated calls within one page load
  now execute the actual fetch once instead of 2+ times. Applied the same
  fix to `companyRepository.getByOwner()`, called across 6 different
  employer pages with the same duplication pattern.
- **Middleware ran 3 sequential DB/auth round trips on every single
  request** (`auth.getUser()` → `profiles` query → `platform_settings`
  query for maintenance mode), one after another, before Next.js even
  started rendering the page. The profile query and the maintenance-mode
  query are independent of each other — parallelized them with
  `Promise.all`. Also added a 15-second in-memory cache for the
  maintenance-mode flag specifically (global config that changes maybe a
  few times a year, not something that needs a fresh DB hit on every page
  load — a toggle in Platform Settings still takes effect within seconds,
  not "requires a redeploy").
- Combined, a single dashboard page load previously triggered up to ~7
  redundant network round trips to Supabase (mostly re-fetching the
  identical user/profile data 2-3 times) before any page-specific data
  fetching even began. This is very likely the dominant cause of the
  slowness — each of those round trips costs real latency depending on
  distance to your Supabase project's region, and they were stacking up
  serially rather than running once or in parallel.

### Not changed (deliberately)
- Middleware still calls `auth.getUser()` (not the faster `getSession()`)
  — this is Supabase's own recommended pattern for middleware specifically,
  since `getSession()` reads cookies without server-side verification and
  could act on a stale or tampered session. Swapping it would trade
  security for speed; not worth it for one round trip that's now running
  in parallel with the other middleware work anyway.
- The `profiles` query in middleware itself is intentionally NOT cached —
  role/status (e.g., a suspension) needs to take effect immediately, not
  after a cache TTL expires.

### If pages are still slow after this
A few things outside the codebase itself worth checking, roughly in order
of likely impact:
1. **`npm run dev` is inherently much slower than production** — it
   compiles each route on-demand the first time you visit it in a given
   session. If most of the slowness is on first-visit-per-route and much
   faster on repeat visits, that's expected dev behavior, not a real bug —
   compare against a production build (`npm run build && npm run start`)
   or the actual Netlify deployment before concluding it's still slow.
2. **Supabase project region vs. where you're testing from** — every
   remaining database round trip pays for physical distance to whichever
   region your project lives in. Check Supabase Dashboard → Project
   Settings → General for the region; Singapore is typically the closest
   option to Sri Lanka.
3. **Supabase's free tier** shares compute resources and can have added
   latency under load compared to a paid tier — see `DEPLOYMENT.md`'s
   note on this under "Supabase production project."

## UI fixes — filter dropdown widths, admin analytics gap — 2026-07-14

### Fixed
- **Search box too narrow, filter dropdowns too wide** on Browse Jobs,
  Applied Jobs, and the admin Users list. Root cause: `SelectTrigger` has
  `w-full` baked into its base styles, and a width override passed as
  `className="sm:w-40"` on the trigger itself doesn't reliably win against
  that base class. Fixed by wrapping each `<Select>` in its own
  width-constrained `<div>` instead — the trigger's own `w-full` then
  correctly fills that container, rather than fighting it. Swept the rest
  of the codebase for the same pattern and fixed every instance found,
  not just Browse Jobs.
- **Admin's own Analytics page (`/dashboard/admin/analytics`) was still
  showing the old placeholder** ("Full analytics dashboards... are on the
  roadmap") even after the Platform Analytics redesign — that redesign
  only ever touched the super_admin version of the page, and admin has
  its own separate route that was never updated to match. Extracted the
  real analytics dashboard into a shared `PlatformAnalyticsContent`
  component so both `/dashboard/admin/analytics` and
  `/dashboard/super-admin/analytics` render the identical, real dashboard
  — both roles see the same platform-wide data, so there's no reason for
  two different implementations to drift apart again.

### Not a bug
- Reports not appearing in the nav for admin/super_admin — verified
  directly against the current code and the production build output;
  the link is correctly present in both roles' navigation and the page
  builds successfully. This is very likely a deployment that predates
  the Reports feature being added — worth a full clean reinstall
  (`node_modules`, `.next`, `package-lock.json` removed, then
  `npm install` fresh) rather than a hot-reload, to rule out stale
  build artifacts.

## Reports export, applicant search/filters, homepage cleanup — 2026-07-14

### Added
- **Reports export** (`/dashboard/admin/reports`, admin & super_admin):
  export Jobs, Users, Applications, or Companies data as a real PDF or
  Excel (.xlsx) file, with a date range filter (applies to each type's
  own creation/applied date) plus type-specific filters (job status/work
  type/employment type, user role/account status, application status,
  company verification status). New `/api/reports/export` route handles
  generation — checked explicitly for admin/super_admin auth, since API
  routes aren't covered by the dashboard middleware's role gating (it
  deliberately excludes `/api`). PDF generation reuses the
  `@react-pdf/renderer` dependency already in the project (used for
  resumes/offer letters/certificates); Excel generation adds `xlsx`
  (SheetJS) as a new dependency. Both generation functions were smoke-
  tested directly with real and empty-data inputs before shipping, not
  just typechecked.
- **Applicant search & filters**: Browse Jobs now has a search box (title/
  company) plus Work Type and Employment Type filters; Applied Jobs has a
  search box plus a Status filter — both client-side over the already-
  fetched list (instant, no server round-trip per keystroke), extracted
  into new `BrowseJobsList` / `AppliedJobsList` client components rather
  than filtering inline in the page.

### Changed
- Removed the homepage's search bar and "Search Jobs" button — it was
  purely decorative (no `onSubmit` handler, never actually searched
  anything), and real job search now lives inside the applicant dashboard
  per the earlier "simplify the marketing site" direction.

## Job location, apply-form layout, text overflow, referral bug, auto CV summary — 2026-07-17

### Fixed
- **Referral links weren't crediting the referrer — root cause found and
  fixed.** `recordReferral()` and `findReferrerIdByCode()` used the
  normal cookie-bound Supabase client, but both are called in the very
  same request as `signUp()` / `signInWithPassword()` /
  `exchangeCodeForSession()` — right after a brand-new session is
  established. A freshly-created client's read of that just-written
  session isn't reliably visible within that same request/response
  cycle, so the RLS check on the `referrals` table (`referred_id =
  auth.uid()`) was very likely evaluating against no session at all,
  failing silently every time — the error was caught and logged, never
  surfaced, so registration itself looked completely fine while the
  referral simply never got recorded. Fixed by using the service-role
  client for both functions instead, which sidesteps the whole timing
  question since it doesn't depend on session/RLS for what is,
  semantically, a system operation (crediting an event), not a
  user-scoped one.
- **Long, unbroken text (e.g. a URL with no spaces) in the Experience
  description caused the whole page to scroll sideways**, not just the
  text box. Root cause: the base `Textarea` component had no
  `overflow-wrap` handling, so a single word with no natural break point
  could force the textarea (and its containing dialog) wider than
  intended. Fixed at the source (`break-words` added to the shared
  `Textarea` component, fixing this everywhere it's used, not just
  Experience) plus a defensive `overflow-x-hidden` added to `DialogContent`
  itself, so no future case of this same category of bug can ever bubble
  up to page-level scroll again, regardless of what causes it. Also
  added the same `break-words` protection to the two places that display
  an already-saved description as read-only text, in case anything was
  saved with this problem before the fix.
- **The optional application note got visually compressed** once the
  Share button was added next to Apply — both were flex siblings with no
  explicit width, so the note's textarea just shrank to fit alongside
  Share rather than taking the full row. Fixed by giving the expanded
  form (and the "complete your profile" prompt state) explicit full
  width, which pushes Share onto its own line instead of squeezing
  against it.

### Added
- **Job postings now have their own location field** — previously only
  inferred from the employer's general company locations list, meaning
  two jobs at the same company in different cities had no way to show
  that. Shown on Browse Jobs, the job detail page, and used directly in
  the JobPosting structured-data schema (falling back to the company's
  general location only for older jobs that predate this field).
- **CV downloads now auto-generate the AI professional summary** if one
  doesn't exist yet, using the applicant's actual skills, experience, and
  education — previously this required a separate, easy-to-miss manual
  "Generate insights" click on the Resume Builder page before ever
  downloading. Persisted to the profile the same way the manual button
  already does (so the Resume Builder's own Insights panel stays in
  sync), and gracefully skipped — not a failed download — if AI isn't
  configured on this deployment.

## Bug fix — job_postings.created_by foreign key constraint — 2026-07-17

### Fixed
- `job_postings.created_by` has always been `NOT NULL`, but its foreign
  key was defined as `ON DELETE SET NULL` — a genuine, self-contradictory
  bug from when the table was first created: if the referenced profile
  is deleted, Postgres tries to null this column out to satisfy the FK
  action, and the `NOT NULL` constraint rejects that, blocking the
  delete entirely. Sat unnoticed until the first time a profile owning a
  job posting was actually deleted. Fixed by cascading the delete
  instead — a job posting genuinely can't exist without its creator, so
  removing it along with the deleted account is the correct, consistent
  behavior.

## Added — referral program (Talent Scout badge) and employer job-boost credits — 2026-07-17

### Added
- **Candidate referrals**: every applicant gets a unique shareable link
  (`jobmo.lk/register?ref=CODE`, generated lazily the first time they open
  the new "Refer friends" section on their dashboard, not upfront for
  every signup). Refer 3 people who successfully register through it and
  earn a **Talent Scout** badge — shown on their own dashboard and on the
  employer-facing candidate profile page as a trust signal. Reused the
  generic `ShareButton` built for job sharing (see below) rather than
  building a second share dialog from scratch.
- **Referral crediting is genuinely non-trivial and handled carefully**:
  a referral can only be recorded once a real session exists for the
  referred person, but that isn't always true immediately after
  email/password signup — if email confirmation is required, there's no
  session until they click the link and log in for the first time.
  Solved with a `pending_referral_code` column, captured at signup via
  the same `requested_account_type` metadata pattern already used for
  role assignment, credited either immediately (if no confirmation is
  needed) or at first login (if it is) — whichever comes first. Google
  OAuth doesn't need this at all: that flow always has a real session
  the instant the callback runs, so it credits directly, the same way
  the account-type selection already does.
- **Employer job-boost credits**: 1 free credit automatically for every
  3 genuine jobs a company has ever published (checked right after each
  publish, non-fatal if it fails — same defensive pattern as the
  existing match-notification step in that same action). Redeemable on
  any published job to move it to the top of all public listings for as
  long as it stays published. Explicit ban warning added to the **Terms
  of Service** and shown directly in the employer's Jobs page: posting
  fake or placeholder listings to farm credits is a bannable offense,
  not just a discouraged practice.
- **New generic `ShareButton` component** — copy link, WhatsApp, email,
  plus native OS share where supported. The job-specific share button
  built earlier this session was refactored into a thin wrapper around
  this, rather than duplicating the whole dialog for referral links.
- New schema: `profiles.referral_code` / `pending_referral_code`,
  `referrals` table (RLS: insert scoped to your own id as the referred
  person, select scoped to referrals you personally made),
  `companies.boost_credits`, `job_postings.is_boosted`.
- **No leaderboard was built for this** — deliberately left out per
  explicit direction; a different gamification approach is planned
  separately later.
- Verified the two riskiest pieces of pure logic directly before
  trusting them: referral code generation (1,000 generated, zero
  collisions, correct format/alphabet) and the "award a credit every
  3rd published job" milestone math (tested against 3, 6, 9 and several
  non-multiples).

## Added — share this job — 2026-07-17

### Added
- **"Share" button on job listings** — copy link, WhatsApp, and email, the
  three channels explicitly wanted, plus a native OS share sheet on
  devices that support it (mobile browsers mostly). Reuses the existing
  `Dialog` component rather than adding a new dropdown-menu primitive to
  the design system for one feature.
- The shared link always points to the **public** job page
  (`/jobs/[id]`), even when shared from the in-dashboard version — a
  friend clicking the link almost certainly isn't logged in, so sending
  them to a `/dashboard` route would just bounce them to a login page
  first instead of the job itself.
- Native-share detection is done inside a `useEffect`, not directly
  during render — checking `navigator.share` in the render body risks a
  server/client hydration mismatch, since `navigator` behaves differently
  in Next.js's server-rendered pass than in the real browser.

## Added — data-driven email reminders (Part 2) — 2026-07-17

### Added
- **4 new automated reminder conditions**, checked once daily by a new
  cron job (`/api/cron/email-reminders`, scheduled via `vercel.json`) —
  each notifies Brevo by updating contact attributes, which Brevo's own
  automation editor then watches to send the actual email (same "app
  detects, Brevo sends" split used for the earlier signup sync):
  - **Abandoned profile** — account 3+ days old, still incomplete, never
    reminded before
  - **High match, not applied** — 75%+ match on a still-published job,
    no application yet, the email echo of the existing in-app
    notification
  - **Interview reminder** — interview scheduled roughly 24 hours out
  - **Employer follow-up** — applications sitting unreviewed 3+ days,
    grouped per company, rate-limited to once a week so it nudges rather
    than nags
- Each condition tracks its own "already reminded" state (new columns:
  `applicant_profiles.abandoned_reminder_sent_at`,
  `job_matches.email_reminded_at`, `interviews.reminder_sent_at`,
  `companies.last_follow_up_email_at`) so nothing gets sent twice — an
  applicant stuck at 80% for two weeks gets one nudge, not fourteen.
- Deliberately uses **contact attribute updates** rather than Brevo's
  newer custom-events API for triggering these — "attribute updated" is
  a long-established, reliable Brevo automation trigger; there are
  multiple reports in Brevo's own community forum of API-created custom
  events not reliably firing automations, not a risk worth taking for
  something meant to run completely unattended every day.
- **Uses the service-role Supabase client** (already scaffolded earlier,
  never used until now) rather than the normal cookie-bound client —
  necessary because a cron invocation has no logged-in user, so every
  RLS policy in the app (all written around an authenticated session)
  would otherwise block it from reading almost anything.
- The profile-completion check duplicates (rather than reuses)
  `getProfileCompletion()`'s logic, deliberately — that function always
  builds its own cookie-bound client internally, which would hit the
  same RLS problem in a cron context, and threading a client parameter
  through it and everything it internally calls would touch several
  already-working call sites for a fairly small piece of logic. Verified
  the duplicated version directly with a standalone test against 5
  scenarios (fully N/A, missing personal details, fully real entries,
  one of six extras missing, insufficient skill count) before trusting
  it to decide who gets an email.
- New environment variable `CRON_SECRET` — protects the reminder route
  from being triggered by anyone who finds the URL; Vercel automatically
  sends it back as an `Authorization` header for its own scheduled calls
  once set.

## Added — Google Analytics — 2026-07-15

### Added
- **Google Analytics (GA4)**, wired up via `next/script` using Next.js's
  official pattern, entirely optional based on
  `NEXT_PUBLIC_GA_MEASUREMENT_ID` — the site works completely normally
  without it configured, GA simply doesn't load. IP anonymization is
  turned on by default (Google Analytics never stores a full IP, only
  enough to estimate general location), and no advertising features
  (Google Signals / Ads linking) are enabled — this stays a usage-stats
  tool, not an ad-tracking one.
- Updated the **Privacy Policy** and **Cookie Policy** to accurately
  reflect this — they previously stated explicitly that no analytics
  platform was in use, which was true when written but would have become
  misleading the moment this shipped without also updating them. Also
  fixed a real, unrelated staleness issue found while in there: the
  Privacy Policy's service-providers list still said "Netlify" (the
  originally-planned host) instead of Vercel (the actual one) — and
  added Brevo to that list too, since it wasn't mentioned at all despite
  already handling account-related email.
- **Note for finding "logins" in GA4**: Google Analytics doesn't track
  logins as a concept out of the box — no code changes were made to add
  a custom login event for this pass, since simply looking at pageviews
  to `/dashboard/applicant`, `/dashboard/employer`, etc. in GA4's
  standard reports already gives an accurate, automatic proxy (only a
  successful login can reach those pages), broken down by role for
  free. A dedicated `login` event (split by email vs. Google) is a
  reasonable future enhancement if more precision is ever needed, but
  wasn't necessary to satisfy what was actually asked for here.

## Added — automatic Brevo contact sync — 2026-07-15

### Added
- **Every new signup is now automatically added to Brevo** (the free
  email marketing tool set up for the growth strategy's email phase),
  split into an Applicants or Employers list by role — from both
  registration paths (email/password and Google OAuth), so the Welcome/
  onboarding automations built in Brevo's own UI can pick up new users
  without any manual export step.
- **Deliberately fail-safe by design**: if the Brevo API keys aren't
  configured, or Brevo is briefly unreachable, or the request fails for
  any reason, registration still succeeds normally — this is a marketing
  side effect, not part of the actual signup flow, and a third-party
  tool being down should never be able to block someone from creating a
  JobMo account. Verified this directly: ran the sync function with no
  credentials configured and with a deliberately invalid API key, and
  confirmed it never throws either way.
- Deliberately **awaited**, not fire-and-forget, despite never throwing —
  on Vercel's serverless platform, an un-awaited network call can be
  killed mid-flight the instant the response is sent, before it actually
  reaches Brevo. Awaiting it guarantees the sync genuinely completes.
- New optional environment variables: `BREVO_API_KEY`,
  `BREVO_APPLICANT_LIST_ID`, `BREVO_EMPLOYER_LIST_ID` — documented in
  both `README.md` and `.env.example`. None of these are required for
  the app to function; omitting them just means new signups aren't
  synced to Brevo yet.

## Fix — Google sign-up always created applicant accounts — 2026-07-15

### Fixed
- **Signing up with Google always created an applicant account, with no
  way to sign up as an employer.** Root cause: email/password signup
  passes the chosen account type through Supabase's `signUp()` metadata
  option, which a database trigger reads to set the role — but Google
  OAuth has no equivalent. The metadata Supabase records for an OAuth
  user comes entirely from Google's own response (name, email, avatar),
  so there was never a way for the "I'm hiring" / "I'm looking for a job"
  choice to reach the database for a Google sign-up; every new Google
  account silently fell through to the default (`applicant`).
- Fixed by encoding the chosen type directly into the OAuth redirect URL
  when the button is clicked from the register page (Supabase preserves
  the full URL, including query string, through the entire OAuth round
  trip), and reading it back out in the callback route. **Deliberately
  gated to brand-new signups only** — determined by comparing the
  account's creation time to its first sign-in time, which land within
  seconds of each other for a genuine new signup but are far apart for
  someone returning later. This means the login page's Google button
  (used by existing users signing back in) can never have someone's
  established role silently changed, even though it shares the same
  underlying action — it just never sends a type to change to.

## Bug fix — Vercel build failure on /register — 2026-07-15

### Fixed
- **Production build failed on Vercel** with `useSearchParams() should be
  wrapped in a suspense boundary`, even though the Suspense boundary was
  already structurally present around the component using it. This is a
  known Next.js edge case: having the page-reading-`useSearchParams`
  component defined in the *same file* as the page itself (both marked
  `"use client"`) is less reliable for Next's build-time detection than
  Next's own recommended pattern — a separate client component file,
  imported into a plain page file and wrapped in `<Suspense>` there. This
  hadn't surfaced in local builds run in this session, but did on
  Vercel's build infrastructure — fixed by moving to the officially
  recommended split-file pattern, which is more robust regardless of the
  underlying cause. `/register` is the only page in the app that uses
  `useSearchParams()` — confirmed via a full-codebase search — so this
  was an isolated, one-page fix. Verified with a full production build
  afterward: `/register` now builds as a static page alongside all other
  65+ routes.

## Match notifications, notification icons, company/candidate profile links — 2026-07-15

### Fixed
- **High matches (75%+) weren't notifying applicants when a job was
  published.** Root cause: notifications only ever fired from the
  one-time batch matching job that runs at publish time, and only for
  applicants who were already active accounts *at that exact moment*.
  Every other place a match score gets computed — Browse Jobs, the
  applicant dashboard, job detail pages — silently cached the score
  without ever checking whether it crossed the notification threshold.
  So an applicant who registered after a job was posted, or simply
  hadn't visited since, could see a 90%+ match badge on screen and never
  get notified about it. Extracted the notify-if-high-match logic into
  one shared, reusable function and called it from every place a match
  score gets computed, not just the publish-time batch. Also made it
  retroactive where cheap to do so (Browse Jobs and the dashboard already
  have the cached match data in memory) — so real high matches that were
  already sitting un-notified from before this fix get caught and
  notified too, not just newly-computed ones going forward.

### Added
- **Notification icons** — each notification type (AI match, application
  update, interview, offer, system) now gets its own icon and color, so
  they're distinguishable at a glance instead of only by reading the
  text — the actual complaint. Falls back gracefully for any
  unrecognized type. Also warmed up the one notification's wording that
  lives in application code rather than a database function (the AI
  match notification) — the rest are generated by database triggers and
  were left as-is for this pass, since rewriting those safely needs a
  dedicated migration rather than a quick text tweak.
- **Company name is now a link** on the job listing page — clicking it
  goes to that company's public profile.
- **Employer-facing candidate profile page** — click "View full profile"
  from a pipeline card or the Talent Pool to see a candidate's complete
  profile (experience, education, certifications, projects, awards,
  volunteer work, languages, hobbies, references), not just the summary
  that fits in the compact pipeline dialog. Access-controlled: an
  employer can only view a candidate who has actually applied to one of
  their jobs, or who's in their talent pool — not any arbitrary
  applicant by guessing a URL.

### Investigated, not a code bug
- **Google Login** — reviewed both the sign-in action and the OAuth
  callback route; both follow the correct, standard Supabase pattern
  with no bug found. This almost always means a configuration issue
  (Google Cloud Console redirect URI, Supabase provider settings, or the
  `NEXT_PUBLIC_SITE_URL` environment variable) rather than application
  code — a checklist for diagnosing which one is in `TESTING.md`.

## Fix — SEO code now matches the real live domain — 2026-07-15

### Fixed
- All SEO/structured-data code (JobPosting schema, sitemap, robots.txt,
  Organization schema, breadcrumbs, metadata) used `https://jobmo.lk`
  (no `www`) as a placeholder throughout. Once the real Vercel deployment
  went live, it turned out the actual production address redirects
  `jobmo.lk` → `www.jobmo.lk` (a normal, intentional setup — Vercel
  redirects one to the other so there's a single canonical address).
  Updated all 11 references across 6 files to `https://www.jobmo.lk` to
  match what's actually live, so search engines see one consistent
  address instead of following a redirect on every crawl. Verified with
  a full typecheck, lint, test run, and production build afterward.

## SEO foundation — structured data, dynamic sitemap — 2026-07-15

### Added
- **JobPosting structured data**, fixed and improved on the public job page.
  A basic version already existed but was missing Google's required
  `validThrough` date on jobs without a deadline (now defaults to 60 days
  out instead of being omitted) and didn't include the company's actual
  location in `jobLocation` (was hardcoded to country-level only).
  Consolidated into one reusable `lib/seo/schema.ts` builder instead of an
  inline object, so job-detail-page and any future job-page variant stay
  in sync.
- **Organization schema**, sitewide (root layout) — establishes JobMo as a
  real named entity to Google and AI answer engines. Wasn't present
  before.
- **BreadcrumbList schema** on job and company pages.
- **Dynamic sitemap** — `app/sitemap.ts` previously only listed static
  marketing pages (home, pricing, about, etc.) and completely omitted
  every individual job and company page, which are the actual content a
  job board needs indexed. Now includes up to 2,000 published jobs and
  500 public companies, with a safe fallback to static-only pages if the
  database call ever fails, so a DB hiccup can't take down the whole
  sitemap.
- Added `locations` to the company data already being fetched on the
  public job page, needed for the location fix above — a one-line
  addition to an existing query, not a new one.

All of this is free — no new paid tools, no new infrastructure, pure code.
Full production build and typecheck verified after these changes with
every existing route still building successfully.

## Bug fixes — talent pool button state, AI description rewrite (take 2) — 2026-07-14

### Fixed
- **"Save to Talent Pool" always showed the actionable button, even for
  candidates already saved from a previous session.** The dialog only
  tracked whether *it* had just performed the save in the current render
  — reopening the dialog (or a fresh page load) always started from
  "not saved," regardless of what was actually in the database. Now the
  pipeline page fetches which applicants are already in the company's
  talent pool (one lightweight batched query, not one per card) and
  seeds the dialog's state from that, so an already-saved candidate
  correctly shows a disabled "Saved to Talent Pool" indicator immediately
  instead of the clickable action button.
- **"Improve with AI" still didn't visibly update the description after
  the previous fix.** That fix (comparing against the editor's last
  emitted value) was logically correct on inspection, but a
  contentEditable-based editor trying to distinguish "did this value
  change come from the user's own typing or from outside" via diffing is
  inherently a bit fragile. Switched to a more bulletproof pattern
  instead: the parent form now bumps a `descriptionResetKey` whenever the
  AI rewrite succeeds, and `RichTextEditor` receives that as its React
  `key` — changing a component's `key` makes React fully unmount and
  remount a fresh instance, with the new value baked in as the initial
  content. This sidesteps the whole "internal vs. external change"
  distinction entirely rather than trying to detect it.

## Bug fix — rich text editor ignored external updates — 2026-07-14

### Fixed
- **"Improve with AI" (job description) updated the underlying state but
  never visibly changed the editor.** `RichTextEditor` wraps a raw
  contentEditable div, which React doesn't control the innerHTML of
  directly — the component only ever synced its `value` prop into the DOM
  once, on first mount, and never again. So calling `setDescription()`
  from outside (the AI rewrite) updated React state correctly, but the
  editor kept showing the old text. Fixed by tracking the last value the
  editor itself emitted and only re-syncing the DOM when an incoming
  `value` differs from that — this distinguishes a genuine external
  change (AI rewrite, form reset) from the user's own keystroke echoing
  back through controlled-component state, so typing still doesn't fight
  the cursor position while external updates now actually show up.
  Confirmed this is the only place `RichTextEditor` is used in the app
  (the job posting description field), so no other feature was silently
  affected by the same bug.

## Bug fix — wrong column name in new dashboard queries — 2026-07-14

### Fixed
- **Employer dashboard (and the admin user detail page) crashed with
  "column job_applications.created_at does not exist."** My mistake, not
  a migration issue: `job_applications` has always used `applied_at` as
  its timestamp column (not `created_at`, unlike every other table) —
  three new queries I wrote in the last batch
  (`listLightForCompany()`, `listAllLight()`, and the admin user detail
  page's applications query) assumed `created_at` without checking the
  actual schema. Fixed by querying the real column, aliased back to
  `created_at` in the two lightweight functions (`created_at:applied_at`)
  so none of the downstream chart code that already expects `.created_at`
  needed to change.
- Swept the rest of the codebase for the same mistake — confirmed no
  other query makes this assumption (the two pre-existing `listForJob()`/
  `listForApplicant()` functions already correctly used `applied_at`).

## AI fix — unsupported temperature parameter — 2026-07-14

### Fixed
- **Every AI feature failed with "400 Unsupported value: 'temperature' does
  not support 0.4 with this model."** The single shared AI call function
  (`callAIForJSON`) hardcoded `temperature: 0.4` — fine for older chat
  models, but newer OpenAI models (including the GPT-5.6 family) reject
  any temperature value other than their default and error out entirely.
  Removed the parameter rather than special-casing which models support
  it — every model now just uses its own default, which is simpler and
  won't break again on a future model swap.

## Talent Pool, admin one-stop views, announcement targeting, dashboard charts — 2026-07-14

### Added
- **Talent Pool** (new feature): employers can save a candidate's profile
  for future roles directly from the pipeline detail dialog ("Save to
  Talent Pool," with an optional note) without needing to hire them for
  the role they applied to. New `/dashboard/employer/talent-pool` page
  lists everyone saved, with their note and when they were added. New
  `talent_pool` table, RLS-scoped to the owning company.
- **Companies now have a contact phone number** (`companies.phone`) —
  collected on the Company Profile form, shown in the admin Companies
  list and detail page for phone-inquiry lookups.
- **Admin "one-stop view" for phone inquiries**: clicking any user in
  `/dashboard/admin/users` or any company in the new
  `/dashboard/admin/companies` opens a full detail page — profile info,
  phone number where available, applications or jobs posted, every
  support ticket they've filed, and recent audit log activity — all in
  one place, reachable by searching an email and clicking through.
- **Announcement role targeting**: the CMS announcement form now has
  checkboxes for Applicants / Employers / Admins — leave all unchecked to
  show to everyone (unchanged default behavior), or target specific
  audiences. New `announcements.target_roles` column; each of the 4
  dashboard layouts now passes the viewer's actual role when checking for
  an active announcement.
- **Employer dashboard redesign**: a candidate-pipeline donut chart
  (reusing the same component built for the applicant dashboard, since
  the underlying shape — applications grouped by status — is identical),
  an "applications received" trend chart, top jobs by applicant count,
  a talent pool count and preview, and a recent activity feed. Also
  **fixed a real bug found while rebuilding this page**: "Offers pending"
  had been hardcoded to `0` since it was first built — now queries the
  actual count.
- **Admin dashboard redesign**: a user-growth chart (applicants vs.
  employers, weekly), a user-composition donut, and a recent
  platform-activity feed pulling from the audit log — on top of the
  existing stat cards and pending-approvals shortcuts.
- **Platform Analytics redesign**: went from 6 plain numbers to growth
  charts (signups, applications, job postings over the last 8 weeks),
  job-status and support-ticket-status breakdowns, top companies by jobs
  posted, and Learning Center engagement stats (quiz attempts, passes,
  certificates issued).
- New shared chart components: `TimeSeriesBarChart` (single or grouped
  bars, used for every "over time" chart above) and `CategoryDonutChart`
  (generic version of the pipeline donut, used for role/status
  breakdowns) — both colored with the actual brand CSS variables, not
  recharts defaults, and reused across all three redesigned dashboards
  rather than one-off implementations per page.
- New lightweight, purpose-built repository queries for every chart
  above (e.g. `applicationRepository.listAllLight()`,
  `adminRepository.getSignupTimeline()`, `quizRepository.getPlatformStats()`)
  — minimal columns, no heavy joins, consistent with the N+1/over-fetching
  discipline established in the earlier performance pass.

## Careers, Privacy, Terms, and Cookies pages — 2026-07-14

### Added
- **Careers page**: a custom SVG illustration (not a hotlinked stock
  photo — kept self-contained and copyright-safe, styled with the site's
  existing faceted-gem visual language and brand gradient) plus an
  optimized version of the requested "not hiring yet" message, and a
  small values section so the page has substance beyond one line, with a
  "Get in touch" link into the existing Contact/support-ticket flow
  rather than a dead end.
- **Privacy Policy**: written to reflect JobMo's actual data practices —
  specifically calls out NIC/passport/driving-license/ID-document
  handling, the OpenAI AI-feature data flow, and the private-storage/
  signed-URL approach used for ID documents — not generic boilerplate.
  Includes an explicit "not legal advice, have this reviewed" disclaimer
  given the sensitivity of government ID data.
- **Terms of Service**: covers applicant/employer responsibilities,
  prohibited uses, an AI-generated-content disclaimer, and an explicit
  "no guarantee of employment outcomes" clause — same legal-review
  disclaimer as Privacy.
- **Cookie Policy**: verified directly against the codebase rather than
  assumed — confirmed only one real cookie exists (the Supabase auth
  session) and no analytics/ad-tracking scripts are present anywhere
  (grepped for `gtag`/`google-analytics`/etc., found nothing), and that
  theme preference uses `localStorage` via `next-themes`, not a cookie —
  so the policy accurately distinguishes the two instead of overclaiming
  cookie usage that doesn't exist.
- New shared `LegalPageLayout` component for consistent heading/list/link
  styling across all three legal pages (no `@tailwindcss/typography`
  plugin is installed in this project, so styling uses the same manual
  arbitrary-selector pattern already used for rendered HTML elsewhere).

## Applicant dashboard redesign — 2026-07-14

### Changed
- **Profile completion banner now hides itself once the profile hits
  100%** — previously stayed visible forever with just its CTA button
  swapping labels. No reason to keep showing a "complete your profile"
  card to someone who already has.
- **The Overview page was genuinely bland — addressed with real data, not
  decoration.** Added:
  - A donut chart (`recharts`) showing the applicant's own application
    pipeline broken down by stage (Applied / In progress / Hired / Not
    selected) — colored with the actual brand tokens (`hsl(var(--primary))`
    etc.), not recharts' defaults
  - A "Recent activity" feed pulling the 5 most recent notifications
  - Stat cards expanded from 3 to 4, adding Quizzes Passed and
    Certificates Earned — broadens the dashboard beyond just job-search
    stats into Learning Center engagement, which existed but was
    invisible from the Overview before this
  - "Open roles for you" now shows each job's match score inline (reusing
    the batched matching functions from the earlier performance pass —
    one cache-check query, not one per job)

### Added
- `recharts` dependency — only real charting library added to the
  project; used exclusively in a small, isolated client component
  (`PipelineStatusChart`) rather than pulled into server components.

## Refinement — per-section N/A flags — 2026-07-14

### Changed
- The "Certifications & More" tab's single blanket N/A checkbox (added
  last round) was too broad — someone might genuinely have projects to
  list but no certifications, and one toggle for the whole tab forced an
  all-or-nothing choice. Replaced with **6 independent toggles**, one
  directly above each section (Certifications, Projects, Awards,
  Volunteer experience, Hobbies, References) — new columns
  `projects_not_applicable`, `awards_not_applicable`,
  `volunteer_not_applicable`, `hobbies_not_applicable`,
  `references_not_applicable` (`certifications_not_applicable` already
  existed and is reused for that specific sub-section now).
- The completion weight for this tab (15%) is now split evenly across the
  6 sections (2.5% each) rather than one aggregate "any 3 of 6" bucket —
  each one independently counts once it either has an entry or is marked
  N/A. This also means the "what's missing" list on the Apply gate now
  names the exact section still needed (e.g. "A project (or marked N/A)")
  instead of one vague catch-all line.
- **Fixed a pre-existing mismatch found while making this change**: the
  completion calculation counted `languagesRepository` toward this
  bucket, but Languages is actually displayed on the *Skills & Languages*
  tab, not "Certifications & More" — while Hobbies (which *is* shown on
  this tab) was never counted at all. Swapped Languages out for Hobbies
  so the calculation matches what's actually on the tab.

## Feature batch + dev performance — 2026-07-14

### Investigated: "pages still take a long time" after the query fixes
Reviewed the actual `npm run dev` terminal output line by line rather than
guessing further. The evidence was conclusive: nearly every slow request
(8-18 seconds) directly followed a `Compiling X... Compiled in Ys` line —
webpack compiling that route for the first time in the dev session, a
one-time cost that has nothing to do with query performance and doesn't
exist in production (which is pre-compiled). Once warm, the same routes
in the same log landed at 500ms-2.4s. Two real, actionable findings:
- **Switched `npm run dev` to Turbopack** (`next dev --turbopack`) — Next
  15's faster dev compiler, directly targets the 5-13 second compile times
  visible in the log.
- **Windows Defender / antivirus scanning `.next/` in real time** is a
  very common, very large slowdown for Next.js dev specifically on
  Windows — added a concrete exclusion instruction to the README rather
  than leaving this as a vague "environment issue."

### Fixed
- **Employer notification bell did nothing** — it was hardcoded to only
  render as a clickable link for `role === "applicant"`; every other role
  got a plain non-interactive `<span>`. The underlying notifications page
  logic was already entirely role-agnostic (same table, keyed by
  `user_id`), so the real fix was extracting it into a shared
  `NotificationsPageContent` component and adding thin pages for employer
  and admin (super_admin reuses the admin one, consistent with the
  Users/Jobs/Approvals pattern from the last bug-fix batch) — not
  patching the bell in isolation, which would've left the pages missing.

### Added
- **Profile completion N/A flags** for Education, Experience, Skills, and
  the Certifications-and-more bucket — mirrors the existing passport/
  driving-license N/A pattern from Phase 2. A fresh graduate with no work
  history, or someone with no formal certifications, can now reach 100%
  profile completion without fabricating entries. New columns:
  `education_not_applicable`, `experience_not_applicable`,
  `skills_not_applicable`, `certifications_not_applicable` on
  `applicant_profiles`.
- **Applying is gated behind 100% profile completion** — enforced in two
  places deliberately: `ApplyButton` shows a proactive "Complete your
  profile to apply" prompt (with the exact missing sections listed, and a
  link straight to the profile page) before they even try, and
  `applyToJobAction()` checks again server-side, since the UI gate is a
  convenience, not a security boundary — a direct request could skip it
  otherwise.

## Performance pass — N+1 query fixes — 2026-07-14

### Fixed
Found by grepping the whole codebase for `.map(async ...)` — the reliable
signature of "one query per item in a loop." Two real ones remained, plus
one more heavy-fetch-just-to-count pattern:

- **Employer pipeline board** (`/dashboard/employer/jobs/[id]/pipeline`):
  fetched education, experience, skills, notes, interviews, and offer
  *separately per applicant* — 6 queries × N applicants (60+ simultaneous
  queries for a 10-applicant job). Added batched `listForMany()` /
  `listForApplications()` / `getForApplications()` methods across five
  repositories (each grouping results by ID in one query instead of one
  query per ID) and rewrote the page to use them — 6 queries total,
  regardless of applicant count.
- **Browse Jobs** (`/dashboard/applicant/browse-jobs`): checked for a
  cached match score *per job* (N queries just for the cache check, even
  when everything was already cached), and on a cache miss, recomputed
  each job's score with its own full set of ~6 queries (up to ~70 total
  for a 10-job list). Added `jobMatchRepository.listForApplicantAcrossJobs()`
  (1 query for all cache checks) and
  `computeMatchesForApplicantAcrossJobs()` in the matching service (fetches
  the applicant's own profile/education/experience/skills exactly once,
  batches company lookups, then scores every job in memory — no I/O in the
  per-job loop) plus `jobMatchRepository.upsertMany()` for a single bulk
  write. Fully-cached page loads (the common case after first visit) now
  cost 1 query instead of N.
- **Employer Jobs list and Overview pages**: computed applicant counts by
  calling the *heavy* `listForJob()` (full application rows with a joined
  profile merge) once per job just to read `.length`. Added a lightweight
  `applicationRepository.countByJobIds()` — one query, just the `job_id`
  column, counted in memory — used by both pages instead.

### Not changed (documented reasoning, not silently skipped)
- `runMatchingForJob()` (runs once per job publish, not on page load) still
  processes applicants one at a time rather than in parallel — intentional:
  at real scale, bursting dozens of simultaneous writes risks hitting
  Supabase's connection pool limits, which would trade one problem for a
  worse one. This only affects the publish action itself, not any page's
  response time, so it wasn't the priority for this pass.
- Middleware was already reasonably optimized before this pass (parallel
  profile + maintenance-mode checks, 15-second in-memory cache on the
  maintenance flag) — reviewed again here and found no further easy win
  without deeper restructuring.

### What this doesn't cover
Query-level fixes only affect what happens *after* a request reaches your
Next.js server. If pages are still slow after this, the next places to
look are infrastructure, not code:
- **Netlify cold starts** — every server-rendered page is a serverless
  function invocation; a cold start alone can add 1-3+ seconds regardless
  of how fast the queries are. Check Netlify's function logs for cold
  start duration vs. actual execution time.
- **Supabase project region** — if the Supabase project isn't in the same
  region as the Netlify functions serving traffic (or isn't close to
  Sri Lanka), every single query pays extra network latency on top of
  query time. Worth confirming both are aligned.
- **Supabase plan tier** — the free tier has lower connection limits and
  can throttle under concurrent load; worth checking the Supabase
  dashboard's usage/performance tab for throttling or slow-query warnings
  during testing.

### Fixed
1. **Date of birth couldn't be set the first time at all.** App code always
   stripped `date_of_birth` from any direct update, meaning applicants had
   no way to set it except through the change-request-and-approval flow —
   even for a first-time entry. Added `setInitialDobAction()` for a direct
   first-time set, and a database trigger (`protect_date_of_birth()`) that
   allows setting it once but blocks any further change outside the
   approval flow — enforced at the DB level, not just in app code, so it
   can't be bypassed by calling the Supabase client directly.
2. Removed a leaked "(Phase 6)" development-process reference from the
   company verification pending message. Also swept for and fixed two more
   in the same pass: an inaccurate "real-time delivery is wired up" claim
   on the notifications page (no such thing was ever actually built — no
   WebSocket/Realtime subscription exists anywhere in the codebase, so this
   was simply false, not just an internal note), and a confusing
   self-reference to "Phase 6" from within the admin analytics page itself.
3. Company size is now a dropdown (1-10 through 1000+) instead of free text.
4. Employers can now actually remove a job listing — `archiveJobAction()`
   (soft removal, available anytime, preserves all applicant/interview/
   offer history) and a guarded `deleteJobAction()` (hard delete, only
   when zero applications exist, to avoid silently destroying an
   applicant's interview/offer history via cascade delete). Both existed
   as repository functions before this but were never wired to any UI —
   confirmed via grep that neither action was called from anywhere.
5. **Applying to or viewing a job took applicants out of the dashboard**
   entirely — `/jobs/[id]` uses the public marketing layout (full landing-
   page nav/footer), so clicking through from Browse Jobs understandably
   felt like leaving the app. Added a new in-dashboard job detail route
   (`/dashboard/applicant/browse-jobs/[id]`) sharing the same content via
   a new `JobDetailContent` component, and repointed every in-dashboard
   link (Browse Jobs cards, the Overview page's "Open roles" widget, the
   Applied Jobs empty state, and job-match notification links) to it. The
   public `/jobs/[id]` page is unchanged for logged-out visitors and SEO.
6. Added a "← Back to Browse Jobs" (or "← Back to all jobs" on the public
   page) link at the top of the job detail view — same fix as #5, both
   pages share `JobDetailContent`.
7. Once an applicant declines an offer, the offer letter and download
   button no longer show — replaced with a compact "You declined this
   offer" notice instead of the full letter (`OfferCard`).
8. **Declining an interview left the application status stuck on
   "interview scheduled."** `respond_to_interview()` only updated the
   interview row itself for a decline, never the application's overall
   pipeline status. Now reverts it to "shortlisted" with an audit note, so
   the employer sees it needs a decision again instead of looking like a
   scheduled interview that's still pending.
9. When a candidate's status changes to "Hired" (via the dropdown or by
   dragging their card to the Hired column), a prompt now asks whether to
   keep the listing open or remove it immediately — wired to the same
   `archiveJobAction()` from fix #4.
10. **Dev server occasionally stopping** — couldn't reproduce directly, so
    this isn't "fixed" in the sense of a confirmed root cause. Added
    defensive hardening to the most likely culprit: `runMatchingForJob()`'s
    per-applicant loop (runs synchronously during job publish) now wraps
    each applicant's match computation in its own try/catch, so one bad
    row can't abort the whole batch or leave the request hanging. If this
    recurs, the exact terminal output at the moment it happens would help
    pin down the real cause.
11. **Super Admin couldn't reach Users or Jobs** — not a permissions bug
    (middleware already allowed super_admin onto `/dashboard/admin/*`
    routes), just a missing navigation link — the super_admin sidebar
    never linked to those admin-level pages at all. Added Users, Jobs,
    Approvals, Support Tickets, and Audit Logs to the super_admin nav
    (reusing the same admin pages), and added the same missing links
    (Jobs, Support Tickets, Audit Logs) to the admin nav too, since it had
    the same gap. Also built the previously-missing admin Jobs page
    (`/dashboard/admin/jobs`) — a platform-wide job moderation view with
    activate/deactivate, since "job adverts" specifically had nowhere to
    be seen or managed from any admin account before this.

## Post-Phase-7 patch — job_matches RLS fix — 2026-07-13

### Fixed
- **Browsing jobs as an applicant threw "new row violates row-level
  security policy for table job_matches."** Root cause: `job_matches` only
  had insert/update policies checking `is_company_owner()` — correct for
  the employer-triggered batch matching on job publish, but the
  applicant-facing on-demand match computation (Browse Jobs, job detail
  page) runs under the *applicant's* own session, which that policy
  doesn't cover. Added a second set of policies allowing an applicant to
  write only their own row (`auth.uid() = applicant_id`) — both policy
  sets coexist without conflict, since Postgres OR's multiple permissive
  policies together for the same command.

## Phase 7 — Polish & Production — 2026-07-13

### Added
- **Security headers** (`next.config.js`): CSP, HSTS, X-Frame-Options,
  X-Content-Type-Options, Referrer-Policy, Permissions-Policy on every
  route. CSP scoped to exactly what the app loads (Supabase, Google Fonts,
  YouTube/Vimeo, OpenAI) rather than a blanket allow-all.
- **Login rate limiting**: `login_attempts` table (RLS enabled, zero
  policies — only reachable via 3 `SECURITY DEFINER` functions),
  `is_login_rate_limited()`, `record_failed_login()`,
  `clear_login_attempts()`. 5 failed attempts per email locks further
  tries for 15 minutes. Wired into `loginAction()`.
- **Vitest test suite**: 17 real unit tests — the matching algorithm
  (verified a strong-fit candidate scores ≥90 and a weak-fit candidate
  scores <40 on the same two job fixtures, not just "it runs without
  throwing"), `getErrorMessage()` (directly covers the exact bug class
  from the Phase 3 offer-response incident — a plain object with a
  `message` property that isn't `instanceof Error`), and job posting /
  personal details validation schemas. `npm test` / `npm run test:watch`.
- **PWA**: `app/manifest.ts` (installable, branded), a deliberately
  minimal service worker (`public/sw.js`) that only shows an offline page
  on failed navigation — no aggressive caching of a highly dynamic,
  auth-gated app, which would risk serving stale dashboard data.
- **SEO structured data**: schema.org `JobPosting` JSON-LD on every job
  detail page — this is what actually surfaces a listing in Google's
  dedicated job search results.
- **Accessibility**: skip-to-content link in the root layout; audited and
  fixed 6 icon-only buttons across admin/employer components missing
  `aria-label` (delete category/content/question/quiz/announcement,
  remove screening question).
- `DEPLOYMENT.md`: a real pre-launch checklist (Supabase production
  config, environment variables, admin bootstrap, monitoring gaps called
  out explicitly).
- `SECURITY.md`: the actual security model — what's enforced, where, and
  why — including the exact guarded-function-calling-guarded-function bug
  from Phase 3 as a worked example for anyone adding new ones.

### Attempted and reverted (documented, not hidden)
- Tried switching the public `/jobs` and `/companies` listing pages to a
  cookie-free Supabase client (`lib/supabase/public-client.ts`) so they
  could be genuinely statically generated instead of always dynamic.
  Verified directly with a real build attempt — it surfaced that static
  generation fetches data at *build time*, so every deploy would need
  live Supabase credentials reachable during the build, turning a
  transient data-layer hiccup into a failed deployment instead of a slow
  page load. Reverted rather than ship an unverified tradeoff; the client
  helper is left in place with the reasoning documented for a future
  attempt once a build pipeline can guarantee Supabase reachability.

### Known limitations (see README "Known issues", `DEPLOYMENT.md`, `SECURITY.md`)
- No end-to-end tests yet, only unit tests of pure logic
- CSP still allows `unsafe-inline`/`unsafe-eval` (Next.js dev/hydration
  requirement) — nonce-based tightening is the natural next step
- No error tracking service wired up yet (integration point exists in
  `app/global-error.tsx`)

## Phase 6 — Administration — 2026-07-13

### Added
- **DOB change approval UI** at `/dashboard/admin/approvals` — signed-URL
  document viewing (5-minute expiry, works despite the private bucket),
  approve/reject with a required comment, full history. Calls the exact
  `review_dob_change_request()` function that's existed since Phase 2 —
  this closes out a gap flagged in every phase since.
- **Company verification UI**, same page, "Companies" tab. Added the
  missing `review_company_verification()` guarded function (audit-logged,
  notifies the employer) — previously only a raw admin-privileged UPDATE
  could change `companies.verification_status`.
- **User management** (`/dashboard/admin/users`): search/filter, suspend/
  reactivate any account via the new `admin_update_profile_status()`
  function (audit-logged, matches every other admin action's discipline)
- **Audit log viewer** (`/dashboard/admin/audit-logs`): every audit-logged
  action across the whole platform, filterable by entity type — this data
  has existed since Phase 1 with no way to see it until now
- **Support tickets**: `support_tickets` + `support_ticket_replies` tables;
  the Contact page now actually submits somewhere; admin inbox with status
  tracking and two-way replies at `/dashboard/admin/support`
- **Super Admin — Admins & Roles**: promote/demote by email (calls the
  existing `admin_update_profile_role()` RPC), per-admin permission toggles
- **Super Admin — CMS & Announcements**: `announcements` table, a
  dismissible-per-session banner shown across every signed-in user's
  dashboard while active
- **Super Admin — Platform Settings**: `platform_settings` table for real
  feature toggles — maintenance mode is wired into the actual middleware
  (verified: non-admins get redirected to `/maintenance`, admins retain
  full access so they can turn it back off) — plus Google sign-in and
  registration toggles, and an AI configuration status panel (reads
  whether `OPENAI_API_KEY` is set; the key itself never touches the
  database, staying in environment variables where it belongs)
- Fixed pre-existing gaps found while building this: admin and super admin
  dashboard overviews had hardcoded/zeroed stats since Phase 1 — now show
  real counts

### Known limitations (see README "Known issues")
- No dedicated job-moderation view (suspend the employer, not individual jobs)
- Email/payment/API-key settings intentionally not built — need real
  provider decisions, not empty forms
- Backup/database/system-health management left to Supabase's own dashboard
- Support ticket replies are in-app only, no email notification

## Phase 5 — Learning Center — 2026-07-13

### Added
- `learning_categories`, `learning_content` (video/article/pdf), `quizzes`,
  `quiz_questions`, `quiz_attempts`, `learning_progress`, `certificates`
  tables with RLS — applicants read published content, admins manage
  everything
- `submit_quiz_attempt()`: grades entirely server-side inside the database
  function — correct answers never need to reach the client during a real
  attempt. The applicant-facing question query
  (`getQuestionsForTaking()`) additionally excludes `correct_option_id` at
  the column level, as defense in depth beyond the grading design itself.
- Quiz-taking UI with a real countdown timer that auto-submits on
  time-up, tracks answered/unanswered progress, and shows immediate results
- Certificates awarded automatically on first pass (via
  `submit_quiz_attempt()`), downloadable as a real generated PDF
  (`@react-pdf/renderer`, consistent with the resume/offer letter templates)
- Per-quiz leaderboard (score, then speed as tiebreaker)
- Progress tracking (`mark_content_complete()`) and simple derived badges
  (lessons completed, quizzes passed thresholds) — no separate badge-admin
  system, computed from real activity counts
- Lightweight admin content management at `/dashboard/admin/learning-center`
  — categories, content (with publish/unpublish toggle), quizzes, and a
  dedicated question editor with correct-answer selection

### Fixed (found while touching admin nav, not directly Phase 5 scope)
- `/dashboard/admin/users`, `/dashboard/admin/approvals`, and
  `/dashboard/admin/analytics` had been dead links since Phase 1 — no pages
  existed for them despite being in the sidebar nav. Added stub pages
  (matching the existing "coming in Phase 6" pattern used elsewhere) so
  they resolve cleanly instead of hitting the custom 404.

### Known limitations (see README "Known issues")
- Content management works but isn't the polished Phase 6 Admin/CMS
  experience yet — deliberately, same reasoning as Phase 2's DOB-approval
  RPC existing before its dedicated admin UI
- No content exists until an admin adds some — nothing to test out of the box
- Video embeds support YouTube/Vimeo URLs only, not direct file uploads

## Phase 4 — AI Engine — 2026-07-12

### Added
- **Deterministic job matching algorithm** (`lib/ai/matching.ts`): weighted
  scoring across skills overlap (40%), experience (15%), education (10%),
  location/remote fit (15%), salary range (10%), employment type (5%), and
  industry (5%). Verified with a smoke test showing a strong-fit candidate
  scoring 100% and a weak-fit candidate scoring 26% on the same two jobs —
  not just "it compiles," actual sensible relative output.
- `job_matches` table storing every computed score + breakdown, with RLS
  scoping visibility to the applicant themselves and the hiring company
- `runMatchingForJob()`: runs when a job is published, scores every
  applicant, and auto-notifies anyone scoring 75%+ via the existing
  `create_notification()` RPC — the literal spec requirement. Deliberately
  **awaited**, not fire-and-forget, since serverless functions (Netlify)
  can terminate before unawaited background work finishes.
- `computeMatchForApplicant()`: on-demand scoring for jobs published before
  a given applicant's profile existed or changed
- Match score displayed on the job detail page ("why you matched" — matched
  and missing required skills), the Browse Jobs list (sorted best-match
  first), and the employer's pipeline board (candidate ranking, sorted
  highest-first per column)
- **AI Resume Builder**: `analyzeResume()` generates a professional summary,
  an ATS-style resume score (0-100), and specific feedback via OpenAI;
  results persist on `applicant_profiles` and appear in the downloaded PDF
- **AI skill extraction**: suggests skills from actual experience/education
  text, added with one click (flagged `is_ai_suggested`)
- **Employer AI features**: job description improvement (rewrites for
  clarity/keywords, preserves original intent), salary range suggestion
  (explicit in its own output that it's an estimate), and interview
  question generation (combines job requirements with the specific
  candidate's actual skills/experience, not generic questions)
- `lib/ai/openai-client.ts`: every AI feature checks for a configured
  `OPENAI_API_KEY` and throws a typed `AIUnavailableError` if absent, caught
  by every calling action and surfaced as a clear "not set up yet" message
  — verified directly with a smoke test (not assumed): confirmed
  `getOpenAIClient()` returns `null` and `analyzeResume()` throws the
  correct typed error with no key configured, matching exactly what
  happens in this sandbox and what would happen on a fresh deploy

### Known limitations (see README "Known issues")
- Duplicate/fake profile detection deferred — needs its own design pass
- Matching runs synchronously in the publish action — fine at test scale,
  would need a queue at real production volume (flagged in code comments)
- No AI usage caching/rate limiting yet beyond what's persisted

## Phase 3 patch 2 — 2026-07-12

### Fixed
- **Accepting/declining an offer failed with "Failed to respond to offer"**,
  even though the parallel interview-accept fix (previous patch) worked.
  Hardened `respond_to_offer()`: replaced an inline `CASE WHEN...THEN...END`
  expression passed directly as a function argument with an explicitly
  typed local variable, removing any ambiguity in how Postgres resolves the
  literal against the `application_status` enum at the call boundary. Also
  added an explicit "offer not found" check.
- **Root cause of why this was hard to diagnose**: every server action's
  error handling used `e instanceof Error ? e.message : "generic fallback"`.
  Supabase's `PostgrestError` (thrown by every `.rpc()` and `.from()` call)
  is a plain object, not an instance of the native `Error` class — so that
  check silently missed it everywhere, hiding the actual database error
  message behind a generic fallback across the entire app, not just this
  one action. Added `getErrorMessage()` to `lib/utils.ts` and replaced the
  pattern in all 8 affected action files. Real error messages (permission
  checks, constraint violations, etc.) now surface in the toast instead of
  a generic "Failed to X" — this should make any future issue much faster
  to diagnose from a screenshot alone.

## Phase 3 patch — 2026-07-12

### Fixed (critical)
- **Accepting an interview failed with "Failed to respond to interview".**
  Root cause: `respond_to_interview()` (called by the applicant) internally
  called `change_application_status()`, which checks "is the caller the
  hiring company?" — correctly true for employer-initiated changes, but
  false here, since `auth.uid()` still reflects the real caller even inside
  a `SECURITY DEFINER` function. Fixed by splitting the actual status
  mutation into an internal helper (`_apply_application_status()`) with no
  caller check, called directly by the already-verified applicant/employer
  paths instead of through the ownership-gated wrapper.
- **Applicant's name showed as the literal word "Applicant" on the pipeline
  board.** `applicant_profiles` had an employer-visibility RLS policy, but
  the base `profiles` table (full_name, email) never got an equivalent one
  — so the join silently returned nothing. Added a tightly-scoped policy:
  employers can read the profiles of people who have actually applied to
  one of their own jobs (not a broad "any employer can see anyone" policy,
  since this table holds more sensitive contact info than the opt-in
  `applicant_profiles` visibility toggle).
- **No way to reschedule an interview.** Previously the only option was
  "Schedule Interview" again as a brand-new row — there was no path to edit
  an existing one. Added `reschedule_interview()` RPC + a "Reschedule"
  button per interview in the pipeline detail view; it updates the existing
  interview's time/details, resets its status to `proposed`, and notifies
  the applicant.
- Notification links for interview/offer responses now deep-link to the
  specific job's pipeline (`/dashboard/employer/jobs/[id]/pipeline`) instead
  of the generic jobs list, and the reschedule-request notification body
  now reads clearly ("requested a reschedule for") instead of the raw
  enum value with underscores swapped for spaces.

### Changed — simplified the marketing site per direct feedback
- Replaced the multi-page marketing site's primary navigation (Jobs,
  Companies, Learning Center, Pricing, About) with a single scrollable
  landing page: Hero → "For Job Seekers" → "For Employers" → How it Works →
  Latest Roles → AI Features → Testimonials → CTA. Nav and footer now link
  to in-page anchors (`/#job-seekers`, `/#employers`, `/#how-it-works`)
  instead of separate pages. The individual pages (`/jobs`, `/companies`,
  `/pricing`, etc.) still exist and still work — they're just no longer
  the primary navigation, since browsing now happens inside the dashboard.
- Added two new plain-language sections (`AudienceSections`) explaining the
  business for each side of the marketplace in a few bullet points each,
  with its own CTA — this is the "explain our whole business simply and
  strongly" content.
- **Fixed a real gap the feedback surfaced**: the applicant dashboard
  overview still had Phase 2's placeholder stats ("Applications: 0", "Saved
  jobs: 0") and a "populate once Phase 3 goes live" message — Phase 3 had
  gone live, but this page was never updated to match. Now shows real
  application/interview counts and a live "Open roles for you" widget.
  Same gap existed in the homepage's "Latest Roles" widget (still Phase 1
  mock data) — also fixed.
- Added a dedicated "Browse Jobs" page inside the applicant dashboard
  (`/dashboard/applicant/browse-jobs`), so job search doesn't require
  leaving the logged-in experience at all.

## Phase 3 — Employer Module — 2026-07-09

### Added
- Company profiles: `companies` table, logo/cover/gallery upload to a new
  `company-assets` storage bucket, public company pages at `/companies/[id]`
- Job postings: `job_postings` table with rich-text description (lightweight
  custom `contentEditable` editor — bold/italic/lists/links), skills,
  salary range with public/private toggle, benefits, work/employment type,
  deadline, and repeatable screening questions (JSON). Draft/publish flow.
- Public job board wired to real data: `/jobs` and `/jobs/[id]` now query
  published postings directly, replacing Phase 1's mock data, with one-click
  apply for logged-in applicants
- Full pipeline: `job_applications`, `application_notes`,
  `application_status_history` tables; a Kanban board with native
  drag-and-drop, a candidate detail view (education/experience/skills pulled
  from Phase 2 tables), internal notes, tags, and the full 13-status dropdown
- The guarded `change_application_status()` RPC is the **only** way an
  application's status changes — every call writes an audit row AND fires a
  notification to the applicant automatically, satisfying the spec's "every
  status change immediately notifies applicant" requirement by construction
- Interview scheduling: `interviews` table, online/offline/hybrid modes,
  platform/link/location, panel members, instructions; applicant can accept,
  decline, or request a reschedule via the guarded `respond_to_interview()` RPC
- Offer management: `offers` table, employer sends salary/start
  date/benefits/terms; applicant can accept/reject via the guarded
  `respond_to_offer()` RPC, or download a generated PDF offer letter
  (`@react-pdf/renderer`, same approach as Phase 2's resume templates)
- Registration fix: `handle_new_user()` now assigns `role='employer'`
  directly when the person chose "I'm hiring" at sign-up — previously this
  was deferred with no working grant path; verification status on the
  company (not the account role) is the actual trust gate
- Retroactive fix: added employer-read RLS policies to all ten Phase 2
  repeatable profile-section tables (education, experience, skills, etc.) —
  employers could see `applicant_profiles` itself but not these related
  tables, which would have made the pipeline's candidate view empty

### Fixed (found during verification, before shipping)
- `applicationRepository` originally tried to embed `applicant_profiles`
  directly inside a `job_applications` query — these two tables share no
  direct foreign key (both merely reference `profiles` independently), so
  PostgREST would have rejected the query at runtime. Fixed by fetching
  `applicant_profiles` separately and merging in application code. Caught by
  manually auditing every embedded `.select()` across the repository layer,
  not just by typecheck/lint (this class of bug is invisible to both).
- Next.js 15's async `params` change (same pattern as `cookies()`) applies to
  page and route handler dynamic segments too, not just Server Components —
  fixed across all five new `[id]` routes
- Verified with a full production build (`next build`) after every round of
  fixes, not just typecheck/lint — all 43 routes compiling is the actual bar,
  same discipline as Phase 2's patches

### Known limitations (see README "Known issues")
- Team/multi-recruiter company accounts, bulk email, calendar sync, candidate
  search/AI ranking, and CSV export are explicitly deferred — see README for
  the reasoning on each

## Phase 2 — Applicant Module — 2026-07-09

### Fixed (post-delivery patch 3)
- Added real "Not applicable" boolean flags (`passport_not_applicable`,
  `driving_license_not_applicable`, and one for each of the five
  social/portfolio links) via new migration `0006_profile_na_flags.sql` —
  not a magic string stuffed into the text column, actual typed columns
- Personal details completion now requires passport number AND driving
  license number to be either filled in or explicitly marked N/A (this is
  what was silently blocking 100% completion before, compounded by the DOB
  issue below)
- Personal Details form: each of passport, driving license, GitHub,
  LinkedIn, Behance, portfolio, and website now has an "N/A" checkbox next
  to it that disables and clears the field, and counts as answered
- Corrected misleading testing guidance: `review_dob_change_request()` can't
  be called directly from the Supabase SQL Editor (no logged-in user, so
  `auth.uid()` is null and the admin check fails) — README and TESTING.md
  now give a working manual-update workaround for testing before the Phase 6
  Admin UI exists, and a fix for anyone whose test data is already stuck in
  this state (status "approved" but `date_of_birth` never actually applied)

### Fixed (post-delivery patch 2)
- Fixed a real bug: `RepeatableSection` received `renderSummary` as a plain
  function prop from a Server Component (`profile/page.tsx`) — only Server
  Actions can cross that boundary as functions. Replaced it with a
  declarative `SummaryConfig` (plain data: field names + optional badge
  logic) resolved client-side instead. Updated all ten section usages.
- Fixed `useSearchParams()` in `/register` needing a Suspense boundary for
  static prerendering under Next 15 — split into `RegisterForm` +
  a `Suspense`-wrapped `RegisterPage`.
- Verified with a **full production build** (`next build`), not just
  typecheck/lint this time — all 38 routes compile and prerender
  successfully. (Confirmed the font-fetch failures seen in earlier phases
  are specific to this sandbox's restricted network, not the app itself, by
  temporarily swapping in local fonts to get a complete build signal, then
  restoring the real Google Fonts config.)

### Fixed (post-delivery patch)
- Upgraded React 18.3 → **React 19** (`^19.1.3`) to match what Next.js 15
  actually targets, resolving the `useFormState` deprecation warning
  properly instead of living with the transitional shim. Updated
  `next-themes` → `0.4.6` and `@react-pdf/renderer` → `4.5.1` for React 19
  peer-dependency support (verified: PDF rendering still works correctly
  under React 19 — smoke-tested directly, not just type-checked)
- Replaced `useFormState` (react-dom) with `useActionState` (react) in
  `login`, `register`, `forgot-password`, and `DobSection`
- Added `suppressHydrationWarning` to `Button`, `Input`, and the sidebar
  logout button — these were showing hydration mismatches caused by a
  browser extension (password manager / form-filler) injecting an
  `fdprocessedid` attribute before React hydrates. This is an external DOM
  mutation, not an app bug (confirmed by Next.js's own error message); the
  suppression targets exactly that known, benign case

### Added
- Full applicant profile schema: `applicant_profiles`, `dob_change_requests`,
  `education_entries`, `experience_entries`, `skills`, `certifications`,
  `projects`, `awards`, `volunteer_experience`, `languages`, `hobbies`,
  `applicant_references`, `notifications` — with RLS on every table
- Storage buckets: `profile-photos` (public read), `resumes`, `certificates`,
  `documents` (all private, owner-only + admin-read), each using a
  `${auth.uid()}/...` path convention enforced by policy
- Guarded `review_dob_change_request()` RPC (admin/super_admin only,
  audit-logged) as the sole path by which `date_of_birth` ever changes;
  applicants can request changes with supporting ID uploads today, admin
  approval UI lands in Phase 6
- `create_notification()` RPC + Realtime-enabled `notifications` table
- Repository layer: a generic `createSectionRepository()` factory serving all
  ten repeatable-section tables, plus `applicantProfileRepository`,
  `notificationsRepository`, and `getProfileCompletion()` (real, weighted
  calculation — personal details 25%, education 15%, experience 15%,
  skills 15%, preferences 15%, any-3-of-six extras 15%)
- One reusable `<RepeatableSection>` component (dynamic form from field
  config + Dialog/AlertDialog) powers all ten "unlimited entries" sections,
  backed by a matching server-action factory
- Full profile editor UI: Personal, Education, Experience, Skills &
  Languages, Certifications & More, Preferences — tabbed, with a live
  completion breakdown showing exactly what's missing
- Resume Builder: 2 free PDF templates (Classic, Modern) via
  `@react-pdf/renderer`, gated behind 100% completion; 3 premium templates
  shown as "Coming Soon" with download disabled
- Notification center UI with unread badge in the dashboard header,
  mark-as-read / mark-all-read
- Settings page: change password, notification preferences, soft-delete
  account (password + typed confirmation, audit-logged)

### Known limitations (see README "Known issues")
- AI writing/scoring/extraction deferred to Phase 4 by design (matches the
  phase plan — AI Engine owns OpenAI integration)
- No admin UI yet for DOB-change approval (Phase 6) — the RPC requires an
  authenticated admin session (`auth.uid()`), so it can't be called directly
  from the SQL Editor for testing; see README for a manual test workaround
- Applied Jobs page is a stub pending Phase 3 job postings
- Notifications table has no automatic triggers yet — those arrive with
  Phase 3 (status changes) and Phase 4 (AI match alerts)

## Phase 1 — Foundation — 2026-07-09

### Added
- Next.js 14 App Router project scaffold (TypeScript, Tailwind, ShadCN-style
  UI primitives, Framer Motion, Zustand/React Query dependencies pre-wired
  for Phase 2+)
- Design system: sapphire/gold "gem" token palette, Space Grotesk + Inter +
  IBM Plex Mono type system, light and dark themes, faceted signature motif
  used for the logo and match-score visuals
- Supabase Authentication: email/password + Google OAuth, via `@supabase/ssr`
- RBAC: `applicant` / `employer` / `admin` / `super_admin` roles, enforced in
  `middleware.ts`, with a guarded `admin_update_profile_role()` RPC as the
  only path to change a role (always audit-logged)
- Database schema: `profiles`, `audit_logs`, RBAC helper functions
  (`is_admin`, `is_super_admin`, `has_permission`, `current_user_role`),
  `handle_new_user()` trigger, `log_audit_event()` RPC
- Row Level Security policies for `profiles` and `audit_logs`
- Landing website: home (hero, animated stats, how it works, latest jobs,
  AI features, testimonials, final CTA), jobs, companies, pricing (with mock
  data), plus routed/SEO-tagged stubs for about, careers, press, FAQ,
  contact, privacy, terms, cookies, features, success stories, blog,
  learning center
- Dashboard shells for all four roles with role-specific sidebar navigation
- Error boundaries (`global-error.tsx`), custom 404, loading skeletons,
  account-suspended page
- `robots.ts` / `sitemap.ts`, Open Graph metadata
- Repository pattern (`lib/repositories/profile-repository.ts`) as the only
  data-access path to `profiles`
- Netlify deployment config, `.env.example`, README setup guide, test
  checklist

### Updated — Branding
- Replaced the placeholder hand-drawn mark with the real JobMo logo (magnifying
  glass / briefcase mark), processed into an icon-only crop
  (`public/logo-icon.png`) and a full icon+wordmark+tagline lockup
  (`public/logo-full.png`), plus generated favicons (`app/icon.png`,
  `app/apple-icon.png`)
- Rebuilt the color token system around colors sampled directly from the
  logo: royal purple (`#7235BC`, wordmark) as primary, gradient blue
  (`#1B84E5`, wordmark) as the brand gradient color, gold/orange
  (`#F5B73C`, star + location pin) as accent
- Added a `.bg-brand-gradient` / `.text-brand-gradient` utility (blue → purple,
  matching the wordmark exactly) and applied it to the hero's signature
  match-score visual and the testimonials section background

### Known limitations (see README "Known issues")
- Marketing stub pages have routing/SEO but placeholder content
- Dashboard stats are zeroed placeholders pending Phase 2/3 data
- Live chat widget is UI-only
- No automated tests yet (planned for Phase 7, can move earlier on request)
