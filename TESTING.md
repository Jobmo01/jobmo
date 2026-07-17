# JobMo — Phase 1 Test Checklist

Work through this after following the setup steps in `README.md`. Check off
each item; anything that fails, note the exact steps to reproduce.

## Job location, apply-form layout, text overflow, referral bug, auto CV summary

- [ ] Run migrations `0026_fix_job_postings_created_by_constraint.sql`
      and `0027_job_postings_location.sql`, in that order
- [ ] Post a new job, fill in a Location (e.g. "Colombo"), publish it —
      confirm the location shows on Browse Jobs and the job detail page
- [ ] On that job's detail page, click Apply — confirm the optional note
      textarea now takes full width, not squeezed next to the Share button
- [ ] In your profile's Experience tab, add an entry with a very long,
      space-less string in the description (e.g. paste a long URL with
      no spaces) — confirm the page no longer scrolls sideways
- [ ] Copy your own referral link, register a brand-new account through
      it (try both email/password and Google), then check the referring
      account's dashboard — the "Refer friends" progress should now
      correctly show the new count (this was silently failing before)
- [ ] As an applicant with a 100%-complete profile who has **never**
      clicked "Generate insights" before, go straight to Resume Builder
      and download a CV — confirm it includes an AI-written professional
      summary automatically, without needing that separate manual step
      first

## Referral program and job-boost credits

- [ ] Run migration `0025_referrals_and_job_boosts.sql`
- [ ] As an applicant, open the dashboard Overview — confirm a "Refer
      friends" card appears with a share button and a "0 of 3" progress bar
- [ ] Click "Share your link," copy it, then open it in an incognito/
      private window and register a brand-new account through it (try
      both email/password and Google, in separate tests)
- [ ] After that new account is confirmed and logged in at least once,
      go back to the referrer's dashboard — progress should now show "1
      of 3"
- [ ] Repeat with 2 more referred signups — on the 3rd, confirm the card
      switches to showing the "Talent Scout" badge instead of the
      progress bar
- [ ] As an employer who has referred candidates in their pipeline or
      talent pool, open one of those candidate profiles — if that
      candidate has 3+ referrals, confirm the Talent Scout badge shows
      next to their name
- [ ] As an employer, publish jobs until you hit your 3rd, 6th, or 9th
      published job (draft jobs and jobs that were only ever saved as
      drafts don't count) — confirm a "boost credit" banner appears on
      the Jobs page
- [ ] Click "Boost this job" on any published listing, confirm the
      dialog warns it's irreversible, confirm it, and check that a
      "Boosted" badge now shows on that job
- [ ] Visit Browse Jobs (or the public /jobs page) as an applicant —
      confirm the boosted job appears at the very top of the list,
      above jobs published more recently
- [ ] Confirm the Terms of Service page mentions the boost-credit ban
      policy, and that the same warning text shows directly on the
      employer Jobs page

## Match notifications, notification icons, company/candidate profile links

- [ ] Post a new job as an employer whose required skills clearly match an
      existing applicant's profile — check that applicant's notifications;
      they should receive a match notification without needing to visit
      Browse Jobs first
- [ ] As an applicant, visit Browse Jobs and find any job showing 75%+
      match that you haven't been notified about before — refresh the
      page, then check Notifications; you should now see it
- [ ] Confirm each notification type shows a distinct icon and color
      (AI match, application update, interview, offer, system) — open
      Notifications with a mix of types if you have them
- [ ] On any job listing page, click the company name — should navigate to
      that company's public profile
- [ ] As an employer, open a candidate's pipeline card, click "View full
      profile" — should show their complete profile, not just the summary
- [ ] Try guessing a candidate profile URL for someone who has **not**
      applied to any of your jobs and isn't in your talent pool — should
      show "not found," not their profile

## Google Login troubleshooting

The code for this was reviewed and is correct — if "Continue with Google"
isn't working, it's almost certainly one of these four settings, not a bug.
Check them in this order:

- [ ] **What actually happens when you click it?** This determines which
      of the checks below matters — an error page from Google itself
      points at #2; landing back on `/login?error=oauth_failed` points at
      #1, #3, or #4.
- [ ] **Supabase → Authentication → Providers → Google is enabled**, with a
      real Client ID and Client Secret entered (from Google Cloud Console
      → APIs & Services → Credentials)
- [ ] **Google Cloud Console → your OAuth Client → Authorized redirect
      URIs** includes `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
      exactly — this is the single most common cause of Google login
      failing. Find your project ref in the Supabase dashboard URL.
- [ ] **Vercel → Environment Variables → `NEXT_PUBLIC_SITE_URL`** is set to
      `https://www.jobmo.lk` (not blank, not `localhost`, not the old
      demo domain) — if this is wrong, Google login can silently redirect
      to the wrong place after signing in
- [ ] **Supabase → Authentication → URL Configuration → Redirect URLs**
      includes `https://www.jobmo.lk/**`

## Reports export, applicant search/filters, homepage cleanup

- [ ] Homepage no longer shows a search bar or "Search Jobs" button
- [ ] As an applicant, go to Browse Jobs — type into the search box,
      confirm the list filters instantly as you type (title or company
      match); try the Work Type and Employment Type filters, alone and
      combined with the search text
- [ ] Go to Applied Jobs — same check with the search box and Status filter
- [ ] As admin, go to `/dashboard/admin/reports`
- [ ] Select "Jobs," leave all filters empty, click "Export as Excel" —
      a real .xlsx file downloads; open it and confirm it has a header
      row and one row per job posting
- [ ] Set a Status filter (e.g. "published") and a date range, export
      again — confirm the row count actually reflects the filters, not
      just the full unfiltered list
- [ ] Repeat with "Export as PDF" — confirm it opens as a real PDF with a
      table, and the subtitle line describes which filters were applied
- [ ] Switch to "Users," "Applications," and "Companies" tabs — confirm
      each shows its own relevant filters (not leftover Jobs filters),
      and export each as both formats at least once
- [ ] Try exporting with zero matching rows (a filter combination with no
      results) — should still download a valid (empty) file, not error

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

## Phase 2 — Applicant Module

### Profile — Personal details & DOB & N/A flags
- [ ] Run the new `0006_profile_na_flags.sql` migration if you haven't yet
- [ ] On the Personal tab, check the "N/A" box next to Passport number —
      the field disables, clears, and shows "Marked as not applicable"
- [ ] Save — reload the page — the N/A checkbox stays checked
- [ ] Repeat for Driving license number, GitHub, LinkedIn, Behance,
      Portfolio, and Website
- [ ] With passport and driving license both marked N/A (or filled in) along
      with the rest of the required personal fields, "Personal details" in
      the completion checklist shows as done (✓)
- [ ] Visit `/dashboard/applicant/profile` — Personal tab loads with the DOB
      section (read-only) and the personal details form
- [ ] Fill in personal details (name, phone, address, district, NIC, etc.)
      and save — success toast appears, values persist on reload
- [ ] Click "Request a change" on DOB, upload at least one document, submit —
      success, and a "pending" row appears in Request history
- [ ] Try submitting the DOB request again while one is pending — button
      shows "Request pending review" and is disabled
- [ ] In Supabase Table Editor, confirm a row exists in `dob_change_requests`
      with your uploaded document path(s) under `documents` bucket → Storage
- [ ] As a temporary test (SQL Editor has no logged-in user, so `auth.uid()`
      is null there and `review_dob_change_request()` will reject the call —
      this is expected, not a bug; the RPC only works from an authenticated
      admin session, which the Phase 6 Admin UI will provide), simulate the
      approval directly instead — run this single query, changing only the
      email to the applicant's real login email (no UUID to copy/paste needed):
      ```sql
      with target as (
        select r.id as request_id, r.applicant_id, r.requested_dob
        from public.dob_change_requests r
        join public.profiles p on p.id = r.applicant_id
        where p.email = 'test-applicant@example.com'  -- <- change this
        order by r.created_at desc
        limit 1
      ),
      upd_request as (
        update public.dob_change_requests
        set status = 'approved', reviewed_at = now(), review_comment = 'test approval'
        where id = (select request_id from target)
        returning id
      )
      update public.applicant_profiles
      set date_of_birth = (select requested_dob from target)
      where id = (select applicant_id from target);
      ```
      Then reload the profile page and confirm the DOB shown updated and the
      request status shows "approved". (If you already tested this before and
      only ran the first `update` — or ran the RPC directly and it silently
      failed — your DOB will still show "Not set yet" even with an "approved"
      badge; run the query above to fix existing test data.)

### Profile — Repeatable sections
- [ ] Add an Education entry — appears in the list immediately after save
- [ ] Edit that entry — changes persist
- [ ] Delete it — confirmation dialog appears, then it's removed
- [ ] Repeat add/edit/delete for Experience, Skills, Languages,
      Certifications, Projects, Awards, Volunteer experience, Hobbies,
      References — each behaves the same way
- [ ] Profile completion percentage increases as you fill in sections, and
      the "what's missing" checklist updates accordingly

### Preferences
- [ ] Set expected salary, availability date, preferred locations,
      industries, remote preference, employment types, and toggle profile
      visibility — save succeeds and values reload correctly

### Resume Builder
- [ ] With profile <100% complete, `/dashboard/applicant/resume` shows the
      locked state with a progress bar and a link back to the profile
- [ ] Complete every section until the dashboard shows 100%
- [ ] Resume Builder now shows both free templates as downloadable
- [ ] Click "Download PDF" on Classic — a real PDF downloads with your
      actual profile data in it
- [ ] Same for Modern
- [ ] Premium template cards show "Coming Soon" and their button is disabled
- [ ] Manually hit `/api/resume?template=classic` while profile is <100% —
      returns a 403 with an error message, not a PDF

### Notifications
- [ ] In SQL Editor, run (replace only the email with your test account's login email — no ID to look up):
      ```sql
      select public.create_notification(
        (select id from public.profiles where email = 'test-applicant@example.com'),
        'system',
        'Test notification',
        'This is a test',
        null
      );
      ```
- [ ] Reload any dashboard page — the bell icon shows an unread badge
- [ ] Visit `/dashboard/applicant/notifications` — the notification appears,
      unread (highlighted)
- [ ] Click it — marked as read, highlight disappears, badge count drops
- [ ] Create two more test notifications, then click "Mark all as read" —
      all clear at once

### Settings
- [ ] Change password with a new value 8+ characters — success, then log out
      and log back in with the new password to confirm it took effect
- [ ] Toggle notification preferences and save — no errors
- [ ] Attempt "Delete my account" with the wrong password — rejected with an
      error, account NOT deleted
- [ ] Attempt again with correct password but wrong confirmation text (not
      exactly "DELETE") — blocked by validation
- [ ] Complete it correctly — signed out, redirected to home, and the
      `profiles` row now shows `status = 'deleted'` with `deleted_at` set
      (check Table Editor) — the row itself still exists (soft delete)
- [ ] Try logging back in with that account — middleware should redirect to
      `/account-suspended`

## Phase 3 — Employer Module

### Employer registration & company profile
- [ ] Register a new account at `/register?type=employer` — lands directly
      on `/dashboard/employer` (no SQL bootstrap needed)
- [ ] Go to Company Profile — fill in name, tagline, description, industry,
      size, locations, website, socials, benefits, culture — save succeeds
- [ ] Upload a logo — appears immediately after upload
- [ ] Upload a cover image — appears immediately
- [ ] Add a gallery photo, then remove it — both work
- [ ] Visit `/companies` on the public site — your company appears with a
      "Verification pending" state (expected — no admin UI yet)
- [ ] Click through to `/companies/[id]` — your public profile renders
      correctly with everything you filled in

### Job posting
- [ ] Go to Job Postings → Post a job
- [ ] Fill in title, description (try bold/italic/bullet list in the editor),
      required/preferred skills, work type, employment type, salary range,
      benefits, deadline, and add 1-2 screening questions
- [ ] Click "Save as draft" — redirects to edit mode, no errors
- [ ] Click "Publish job" — status badge shows "published"
- [ ] Visit `/jobs` on the public site — your job appears
- [ ] Click into the job detail page — all fields render correctly,
      including the rich-text description with formatting intact

### Applying (as an applicant)
- [ ] Log in as a different account with role `applicant`
- [ ] Visit the published job's detail page — "Apply now" button appears
- [ ] Click it, optionally add a cover note, submit — success toast, button
      changes to "Applied ✓"
- [ ] Try applying again — blocked ("You've already applied")
- [ ] Go to `/dashboard/applicant/jobs` — the application appears with status "applied"

### Pipeline (as the employer)
- [ ] Go to Job Postings → click the applicant count on your job → pipeline
      board loads with the applicant's card under "Applied"
- [ ] Click the card — detail dialog opens showing the candidate's info,
      any education/experience/skills they've filled in, and the notes section
- [ ] Add an internal note — appears immediately in the list
- [ ] Add a tag via the tag input — appears on the card in the board view
- [ ] Change status via the dropdown to "Shortlisted" — card moves to the
      Shortlisted column after refresh
- [ ] Drag the card from one column to another (e.g. Applied → Shortlisted) —
      status updates accordingly
- [ ] Drag a card into the "Interview" column — a Schedule Interview dialog
      opens instead of an immediate status change

### Interview scheduling
- [ ] Fill in the schedule interview form (mode: online, platform: Google
      Meet, a meeting link, a future date/time, panel members, instructions)
      and submit — success, application status becomes "interview_scheduled"
- [ ] Log in as the applicant, go to their application detail page
      (`/dashboard/applicant/jobs/[id]`) — the interview card appears with
      all the details you entered
- [ ] Click "Accept" — status updates, employer's pipeline reflects it
- [ ] On a second test interview, click "Request reschedule" with a note —
      submits without error
- [ ] On a third, click "Decline" — submits without error

### Offers
- [ ] From the pipeline detail dialog, click "Send offer" — fill in position
      title, salary, start date, benefits, terms — submit — status becomes
      "offer_sent"
- [ ] As the applicant, open the application detail page — the offer card
      appears with all details
- [ ] Click "Download offer letter" — a real PDF downloads with the correct
      company name, position, salary, and terms
- [ ] Click "Accept offer" — status updates to "offer_accepted" on both sides
- [ ] On a second test offer, click "Decline" — status updates to "offer_rejected"

### Notifications (automatic, this time — not manual SQL)
- [ ] After any status change above, log in as the applicant and check the
      notification bell — a new notification should appear automatically
      without running any SQL (this is the real `change_application_status()`
      RPC firing `create_notification()` every time)

## Phase 3 patch — pipeline fixes & simplified site

### Critical fixes
- [ ] Run migration `0011_offer_response_fix.sql` (after `0010`)
- [ ] As the applicant, on an offer with status "sent", click "Accept
      offer" — succeeds, status updates to "accepted", employer gets a
      notification linking to that job's pipeline
- [ ] On a second test offer, click "Decline" — succeeds, status updates
      to "rejected"
- [ ] If anything still fails anywhere in the app, the toast should now show
      the actual error message rather than a generic "Failed to X" — if you
      still see a generic message, that's worth flagging too
- [ ] Run migration `0010_pipeline_fixes.sql` first
- [ ] On the pipeline board, the applicant's real name (not the word
      "Applicant") shows on their card and in the detail dialog
- [ ] Schedule an interview, then as the applicant click "Accept" — it
      succeeds (previously failed with "Failed to respond to interview")
- [ ] As the applicant, click "Request reschedule" with a note — succeeds,
      and the employer sees a notification linking directly to that job's
      pipeline (not the generic jobs list)
- [ ] As the employer, open the application detail dialog — the interview
      appears under "Interviews" with a "Reschedule" button
- [ ] Click Reschedule, change the date/time, save — the interview's status
      resets to "proposed" and the applicant gets a new notification
- [ ] As the applicant, confirm the interview now shows the new time and
      can be accepted/declined/rescheduled again

### Simplified site & dashboard job visibility
- [ ] Visit the home page — nav now shows "For Job Seekers", "For
      Employers", "How it Works" instead of Jobs/Companies/Pricing/About
- [ ] Clicking those nav links scrolls to the matching section on the same
      page rather than navigating away
- [ ] The home page has clear, plain-language sections explaining the
      business for both job seekers and employers, each with its own CTA
- [ ] Log in as an applicant — the Overview page shows real application and
      interview counts (not zeroed placeholders) and an "Open roles for
      you" widget with real job listings
- [ ] Click "Browse all" (or the new "Browse Jobs" sidebar link) — a full
      list of open roles appears inside the dashboard, with "Applied"
      badges on jobs you've already applied to
- [ ] The homepage's "Latest roles" section shows real published jobs, not
      the old mock companies (Dialog Axiata, WSO2, etc.)

## Phase 4 — AI Engine

### Job matching (works with no OpenAI key — it's a real algorithm, not AI)
- [ ] As an employer, publish a job with specific required skills (e.g.
      "React, TypeScript")
- [ ] As an applicant with those exact skills listed in their profile, visit
      that job's detail page (`/jobs/[id]`) — a "Your match score" card
      appears with a score, matched skills, and any missing skills
- [ ] Check `/dashboard/applicant/browse-jobs` — jobs are sorted with the
      best match first, and each shows a "X% match" badge
- [ ] If the match score is 75% or higher, check the applicant's
      notification bell — a "X% match: [job title]" notification should
      appear automatically, with no manual SQL needed this time
- [ ] As the employer, open that job's pipeline — the applicant's card
      shows their match score, and cards are sorted highest-match-first

### AI features — WITHOUT an OpenAI key configured
- [ ] On the Resume Builder page (profile at 100%), the AI section shows
      "AI features aren't set up yet" instead of crashing
- [ ] On the profile's Skills tab, click "Suggest from my experience" —
      same graceful message, no crash
- [ ] On the job posting form, click "Improve with AI" and "Suggest salary
      range" — same graceful message
- [ ] On the pipeline detail dialog, click "Generate interview questions"
      — same graceful message

### AI features — WITH an OpenAI key configured
- [ ] Add a real `OPENAI_API_KEY` to `.env.local`, restart the dev server
- [ ] Resume Builder → "Generate insights" — produces a real professional
      summary, a resume score, and specific feedback; download a PDF and
      confirm the summary appears at the top
- [ ] Profile → Skills tab → "Suggest from my experience" — produces
      relevant skill suggestions based on your actual experience entries;
      click one to add it (should appear in your skills list immediately)
- [ ] Job posting form → "Improve with AI" — rewrites the description,
      keeping your original intent; "Suggest salary range" — fills in
      min/max with a reasoning toast
- [ ] Pipeline detail dialog → "Generate interview questions" — produces
      questions referencing both the job and the specific candidate's
      listed skills/experience

## Phase 5 — Learning Center

### Set up test content (as super_admin)
- [ ] Go to `/dashboard/admin/learning-center` — three tabs: Categories, Content, Quizzes
- [ ] Add a category (e.g. "Interview Preparation")
- [ ] Add a piece of content: type "article", assign the category, write a
      short body, save — it starts as a draft
- [ ] Click "Publish" on it — status badge changes to "published"
- [ ] Add a video (type "video", paste a YouTube URL as the body) and publish it
- [ ] Add a quiz (title, category, time limit e.g. 5 minutes, passing score
      e.g. 70%) — this redirects you straight to "add questions"
- [ ] Add at least 3 questions, each with 3-4 options and one marked correct
- [ ] Go back to the Quizzes tab and click "Publish" on the quiz

### Applicant experience
- [ ] Log in as an applicant, go to "Learning Center" in the sidebar
- [ ] Your category appears with an item count; click into it
- [ ] Open the article — content renders correctly; click "Mark as complete"
      — button changes to "Completed"
- [ ] Open the video — it embeds and plays inline
- [ ] Go to "Practice Quizzes" — your quiz appears; click it
- [ ] Click "Start quiz" — the timer starts counting down immediately
- [ ] Answer all questions, watch the "X of Y answered" progress update
- [ ] Submit before time runs out — results show immediately: score,
      correct count, pass/fail
- [ ] If you passed: a "certificate has been added" message appears; click
      "View certificates" — the certificate is listed
- [ ] Download the certificate — a real PDF opens with your name, the
      quiz title, and today's date
- [ ] Go back to the quiz, click "Leaderboard" — your score appears
- [ ] Take the quiz again but let the timer run out without submitting —
      confirm it auto-submits and shows a result (even if incomplete)
- [ ] Go back to the Learning Center overview — completed lesson count,
      quizzes passed count, and any earned badges should reflect reality

## Phase 6 — Administration

### DOB approval (the real thing, finally)
- [ ] As your super_admin account, go to `/dashboard/admin/approvals`
- [ ] A pending DOB change request from earlier testing appears under "DOB Requests"
- [ ] Click any uploaded document button (NIC/Passport/Driving license) —
      opens in a new tab (signed URL, works even though the bucket is private)
- [ ] Click "Review", try submitting with no comment — blocked ("Add a comment...")
- [ ] Add a comment, click "Approve" — succeeds; the applicant's actual
      `date_of_birth` updates (check their profile page — no more "Not set yet")
- [ ] Submit a second test DOB request and reject it instead — status shows
      "rejected" with your comment visible

### Company verification
- [ ] Switch to the "Companies" tab — your test employer's company shows
      "pending"
- [ ] Click "Review", add an optional comment, click "Verify" — status
      updates to "verified"; check the employer's own company profile page —
      the "Verification pending" badge is now "Verified"
- [ ] On the public `/companies` page, that company now shows the verified badge

### User management
- [ ] Go to `/dashboard/admin/users` — search and role-filter work
- [ ] Suspend a test account, then log in as that account — redirected to
      `/account-suspended`
- [ ] Reactivate it — they can log in normally again

### Audit logs
- [ ] Go to `/dashboard/admin/audit-logs` — entries from everything you've
      tested across every phase appear (role changes, DOB approvals,
      application status changes, interview/offer responses, etc.)
- [ ] Filter by entity type — list narrows correctly

### Support tickets
- [ ] Go to the public `/contact` page (logged out is fine), submit a message
- [ ] As admin, go to `/dashboard/admin/support` — the ticket appears
- [ ] Open it, change status to "In progress", send a reply — both persist
      on reload

### Super Admin — Admins & Roles
- [ ] Go to `/dashboard/super-admin/admins`
- [ ] Promote your applicant test account's email to "admin" — they can now
      access `/dashboard/admin/*` on next login/refresh
- [ ] Toggle a permission checkbox for that admin — persists on reload
- [ ] Demote them back to "applicant" to undo

### Super Admin — CMS & Announcements
- [ ] Go to `/dashboard/super-admin/cms`, create an announcement
- [ ] Log in as any other role — a dismissible banner appears at the top of
      their dashboard
- [ ] Dismiss it — disappears for that session; deactivate it from CMS —
      doesn't reappear anywhere

### Super Admin — Platform Settings
- [ ] Go to `/dashboard/super-admin/settings` — AI status shows correctly
      based on whether you've added `OPENAI_API_KEY`
- [ ] Toggle "Maintenance mode" on
- [ ] Open an incognito window (logged out) and visit the home page —
      redirected to `/maintenance`
- [ ] Log in as admin/super_admin in that same incognito window — full site
      access still works
- [ ] Turn maintenance mode back off — normal access resumes for everyone

## Phase 7 — Polish & Production

### Automated tests
- [ ] Run `npm test` — 17 tests pass (matching algorithm, validation
      schemas, error-message extraction)

### Security headers
- [ ] After `npm run dev` or a deploy, open any page, check the Network
      tab, inspect the response headers — confirm `Content-Security-Policy`,
      `X-Frame-Options: DENY`, `Strict-Transport-Security`, and
      `X-Content-Type-Options: nosniff` are all present
- [ ] Confirm the site still functions normally with the CSP in place —
      images load, fonts render, YouTube/Vimeo embeds in Learning Center
      still play, OpenAI-backed AI features still work

### Login rate limiting
- [ ] Run migration `0018_rate_limiting_schema.sql`
- [ ] Try logging in with a wrong password 5 times in a row — the 5th (or
      6th, depending on exact timing) attempt shows "Too many failed
      attempts. Please wait 15 minutes and try again." instead of the
      normal "Incorrect email or password"
- [ ] Log in successfully with the correct password afterward — succeeds
      immediately (rate limit doesn't block correct logins) once the
      window passes, or after a successful login clears it

### PWA
- [ ] Visit `/manifest.webmanifest` directly — valid JSON with JobMo's name,
      colors, and icons
- [ ] On a supported browser/device, check for an "Install app" prompt or
      option in the browser menu
- [ ] Turn off your network connection, navigate to a page you haven't
      visited yet — see the offline page instead of a browser error (note:
      this only works for page navigations, not for dashboard data, which
      is intentionally never cached)

### SEO
- [ ] View source on any published job's detail page — a
      `<script type="application/ld+json">` block with `"@type": "JobPosting"`
      is present, with the job title, description, and company populated

### Accessibility
- [ ] Tab through the home page using only the keyboard — the first Tab
      press reveals a "Skip to main content" link
- [ ] Tab through the admin/employer delete buttons (categories, content,
      quizzes, questions, announcements) — screen readers announce them
      correctly instead of just "button"

## Bug fix batch — 11 issues from manual testing

- [ ] Run migration `0020_bugfix_batch.sql` (after `0019`)
- [ ] **DOB first-time set**: as a fresh applicant with no DOB set yet, the
      profile page shows a simple "Save date of birth" form (no document
      upload, no approval wait) — save it, confirm it's set immediately
- [ ] Reload that same applicant's profile — the DOB section now shows the
      locked/read-only view with "Request a change" instead of the
      first-time form
- [ ] Try requesting a change on that same DOB — normal approval flow works
      as before
- [ ] **Company verification message** no longer mentions "Phase 6"
      anywhere on the employer's company profile page
- [ ] **Company size** is a dropdown on the company profile form
- [ ] **Remove a job listing**: on the employer Jobs list, click "Remove
      listing" on any published job with applicants — confirm it disappears
      from the public `/jobs` listing but the applicant still sees their
      full application/interview/offer history intact
- [ ] Try the same on a job with **zero** applicants — a "Delete
      permanently" trash icon should also be available; use it, confirm
      the job is fully gone
- [ ] Try "Delete permanently" is **not** offered on a job that already has
      applicants (only "Remove listing" should show)
- [ ] **Browse Jobs stays in-app**: click any job card from
      `/dashboard/applicant/browse-jobs` — the dashboard sidebar/topbar
      should remain visible (not the public site's nav/footer)
- [ ] On that job detail view, confirm a "← Back to Browse Jobs" link is
      at the top and returns you to the list
- [ ] Apply to a job from there — still works, still stays in-dashboard
- [ ] **Offer decline hides the letter**: as an applicant, decline an
      offer — confirm the offer card no longer shows position/salary
      details or a download button, just a small "You declined this
      offer" notice
- [ ] **Interview decline updates status**: schedule an interview, decline
      it as the applicant, then check the employer's pipeline — the
      application should show "shortlisted," not stuck on "interview
      scheduled"
- [ ] **Hire prompt**: move any application to "Hired" (dropdown or
      drag-and-drop) — a dialog should immediately ask whether to keep the
      listing open or remove it; test both choices
- [ ] **Super Admin navigation**: log in as super_admin, confirm the
      sidebar now shows Users, Jobs, Approvals, Support Tickets, and Audit
      Logs — click each, confirm they load real data
- [ ] On the new `/dashboard/admin/jobs` page, confirm every job posting
      platform-wide appears (not just one company's), and that
      Deactivate/Reactivate works

## Performance fixes — verifying response times

These fixes reduce the number of database round trips per page, but I
can't measure your actual live response times from here — verify directly:

- [ ] Open your browser's Network tab, visit the employer Pipeline page for
      a job with several applicants — the page's own document request
      should complete meaningfully faster than before; count of Supabase
      requests in the Network tab should be roughly flat regardless of
      applicant count now, not scaling with it
- [ ] Visit Browse Jobs twice in a row as the same applicant — the second
      visit (fully cached matches) should be noticeably faster than the first
- [ ] Compare `npm run dev` timing against a production build
      (`npm run build && npm run start`) before concluding anything is
      still slow — dev mode compiles routes on first visit and is not
      representative of real performance
- [ ] If pages are still slow after this, check: Supabase project region
      (Project Settings → General — Singapore is typically closest to
      Sri Lanka), and whether you're on Supabase's free tier (shared
      compute, can throttle under load) — see `DEPLOYMENT.md`

## Feature batch — notifications, profile N/A flags, apply gate

- [ ] Run migration `0021_profile_section_na_flags.sql`, then
      `0022_profile_extras_individual_na_flags.sql`
- [ ] **Dev performance**: stop and restart `npm run dev` — confirm it now
      says using Turbopack; compile times for routes you visit should be
      noticeably faster than before
- [ ] If on Windows, add a Windows Defender exclusion for your project
      folder (see README step 5) and compare compile times again
- [ ] **Employer notifications**: log in as an employer, click the bell
      icon — should navigate to a real notifications page (not bounce back
      to the dashboard home). Trigger a notification (e.g. have an
      applicant respond to an interview) and confirm it shows up here
- [ ] Same check as admin — bell should work there too
- [ ] **Profile N/A flags**: as a fresh applicant, go to the Education tab
      — check "I don't have formal education to list" — confirm profile
      completion increases without adding any entries
- [ ] Repeat for Experience and Skills tabs
- [ ] On the Certifications & More tab, confirm there are **6 separate**
      N/A toggles, one above each section (Certifications, Projects,
      Awards, Volunteer, Hobbies, References) — not one toggle for the
      whole tab
- [ ] Check N/A on just 2 or 3 of those 6 and add a real entry to the
      rest — confirm completion reflects a mix of both correctly
- [ ] Confirm a profile can reach 100% using only N/A flags for all
      sections (plus filling in Personal Details and Preferences normally)
- [ ] Uncheck one N/A flag — confirm completion drops back down until you
      either add a real entry or re-check N/A
- [ ] **Apply gate**: as an applicant with an incomplete profile, visit
      any published job — instead of "Apply now," a "Complete your profile
      to apply" card should show with the exact missing sections listed
      and a link to the profile page
- [ ] Complete the profile to 100%, revisit the same job — the normal
      "Apply now" button should appear and work

## Talent Pool, admin one-stop views, announcement targeting, dashboard charts

- [ ] Run migration `0023_talent_pool_and_targeting_schema.sql`

### Talent Pool
- [ ] On any application's pipeline detail dialog, click "Save to Talent
      Pool," add a note, save — button should show "Saved to Talent Pool"
- [ ] Go to `/dashboard/employer/talent-pool` — the candidate appears with
      your note and today's date
- [ ] Try saving the same candidate again from a different application —
      should be blocked ("Already in your talent pool")
- [ ] Remove them from the Talent Pool page — confirm they're gone

### Companies phone + admin one-stop views
- [ ] As an employer, add a contact phone number on your Company Profile
      page, save
- [ ] As admin, go to `/dashboard/admin/companies` — confirm your company
      shows with its phone number, and clicking it opens a full detail
      page (contact info, jobs posted, support tickets)
- [ ] Go to `/dashboard/admin/users`, search for an applicant by email —
      confirm their phone number shows in the list (if they've set one),
      and clicking them opens a full detail page (profile summary,
      applications, support tickets, recent activity)
- [ ] Repeat for an employer user — detail page should show their company
      and jobs instead of applicant-specific data
- [ ] Submit a support ticket as a test user, then check that it appears
      on their detail page

### Announcement targeting
- [ ] Create an announcement targeted only at "Applicants" — log in as an
      employer, confirm it does NOT show; log in as an applicant, confirm
      it does
- [ ] Create an announcement with no roles checked — confirm it shows to
      every role
- [ ] Confirm each announcement card in the CMS shows its target audience

### Dashboard redesigns
- [ ] Employer dashboard: confirm the pipeline donut, applications trend
      chart, top jobs list, and "Offers pending" stat all show real
      numbers matching your actual data (not zero/placeholder)
- [ ] Admin dashboard: confirm the growth chart and composition donut
      render, and recent platform activity matches the audit log
- [ ] Platform Analytics (Super Admin): confirm all 3 trend charts, both
      breakdown donuts, top companies list, and Learning Center stats
      show real data

## Applicant dashboard redesign

- [ ] As an applicant below 100% profile completion, visit the Overview —
      the "Profile completion" card is visible with its progress bar
- [ ] Complete your profile to 100%, revisit Overview — the card is
      **gone entirely**, not just relabeled
- [ ] Confirm 4 stat cards show: Applications, Upcoming interviews,
      Quizzes passed, Certificates earned — with real numbers matching
      what you've actually done (cross-check against Learning Center)
- [ ] Confirm the "Your application pipeline" donut chart renders and its
      segments match your actual application statuses (hover a segment —
      a tooltip should show the count)
- [ ] Apply to zero, one, and several jobs at different stages (applied,
      interview, hired, rejected) and confirm the chart updates correctly
      each time
- [ ] Confirm "Recent activity" shows your last 5 notifications, most
      recent first, with relative timestamps ("2 hours ago" etc.) —
      clicking one navigates to the right place
- [ ] Confirm "Open roles for you" shows a match % badge on each job card

## Sign-off

- [ ] All boxes above checked, or issues logged below, before starting Phase 2

## Issues found

| # | Description | Steps to reproduce | Severity |
|---|---|---|---|
|   |             |                     |          |
