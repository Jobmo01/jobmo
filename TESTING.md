# JobMo — Phase 1 Test Checklist

Work through this after following the setup steps in `README.md`. Check off
each item; anything that fails, note the exact steps to reproduce.

## Environment

- [ ] `npm install` completes with no errors
- [ ] `npm run dev` starts and `localhost:3000` loads the landing page
- [ ] `npm run typecheck` passes with no TypeScript errors
- [ ] `npm run lint` passes (warnings OK, no errors)

## Database

- [ ] `0001_init_schema.sql` runs with no errors in Supabase SQL Editor
- [ ] `0002_rls_policies.sql` runs with no errors
- [ ] `profiles` and `audit_logs` tables exist in Table Editor
- [ ] RLS is enabled (shield icon) on both tables

## Landing website

- [ ] Home page loads with hero, stats, how-it-works, latest jobs, AI
      features, testimonials, and final CTA sections
- [ ] Nav links work: Jobs, Companies, Learning Center, Pricing, About
- [ ] Footer links all resolve (no 404s) — Privacy, Terms, Cookies, Careers,
      Features, Success Stories, Press, Blog, FAQ, Contact
- [ ] Mobile menu opens/closes correctly below 768px width
- [ ] Theme toggle switches light/dark and persists on reload
- [ ] Live chat placeholder opens/closes and links to Contact
- [ ] Lighthouse (Chrome DevTools) run on the home page — note scores here:
      Performance ___  Accessibility ___  Best Practices ___  SEO ___

## Authentication

- [ ] Register as an **applicant** with email/password → confirmation email
      sent (or session created, depending on your Supabase email settings)
- [ ] Confirm email → land on `/dashboard/applicant`
- [ ] Log out → redirected to `/login`
- [ ] Log back in with the same credentials → back on `/dashboard/applicant`
- [ ] Register a second account as an **employer** → same flow works
- [ ] Try registering with a password under 8 characters → validation error
      shown inline, no request sent
- [ ] Try registering with mismatched password/confirm password → validation
      error shown
- [ ] "Forgot password" sends a reset email and shows the confirmation screen
- [ ] Google sign-in button redirects to Google and back to a dashboard
      (requires Google provider configured in Supabase)

## RBAC / route protection

- [ ] Logged out, visiting `/dashboard/applicant` directly → redirected to
      `/login?redirect=/dashboard/applicant`
- [ ] Logged in as applicant, visiting `/dashboard/employer` → redirected back
      to `/dashboard/applicant`
- [ ] Logged in as applicant, visiting `/dashboard/admin` → redirected back
- [ ] After promoting an account to `super_admin` via SQL (see README step 6),
      that account can visit `/dashboard/admin`, `/dashboard/super-admin`,
      and its own `/dashboard/applicant` or `/dashboard/employer` without
      being redirected
- [ ] Manually setting a profile's `status` to `suspended` in Table Editor,
      then visiting any dashboard route → redirected to `/account-suspended`

## Error handling & empty states

- [ ] Visiting a nonexistent route (e.g. `/this-does-not-exist`) shows the
      custom 404 page, not Next's default
- [ ] Throwing a test error in a Server Component shows the custom error
      page with a "Try again" button (temporarily add `throw new Error("test")`
      to verify, then remove it)
- [ ] Dashboard pages show skeleton loaders on slow network (throttle to
      "Slow 3G" in DevTools and reload)

## Responsiveness & accessibility

- [ ] Landing page and dashboards are usable at 375px, 768px, and 1440px
      widths
- [ ] Tab key navigates through nav links, form fields, and buttons in a
      sensible order, with a visible focus ring
- [ ] All icon-only buttons (theme toggle, chat, notifications) have an
      accessible name (test with a screen reader or the browser's
      Accessibility inspector)

## Sign-off

- [ ] All boxes above checked, or issues logged below, before starting Phase 2

## Issues found

| # | Description | Steps to reproduce | Severity |
|---|---|---|---|
|   |             |                     |          |
