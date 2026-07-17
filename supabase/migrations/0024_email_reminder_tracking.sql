-- =============================================================================
-- JobMo — Tracking columns for data-driven email reminders (Brevo integration)
-- Name this query: "email_reminder_tracking"
-- Run AFTER 0023_talent_pool_and_targeting_schema.sql
--
-- Each of these marks "have we already sent this specific reminder" so the
-- daily reminder check never sends the same nudge twice — without this, an
-- applicant stuck at 80% profile for two weeks would get a new "finish your
-- profile" email every single day.
-- =============================================================================

alter table public.applicant_profiles
  add column if not exists abandoned_reminder_sent_at timestamptz;

-- Separate from job_matches.notified — that flag is for the in-app
-- notification, this is specifically for the email reminder. They're
-- allowed to fire independently (someone might dismiss/never see the
-- in-app one but still benefit from an email, or vice versa).
alter table public.job_matches
  add column if not exists email_reminded_at timestamptz;

alter table public.interviews
  add column if not exists reminder_sent_at timestamptz;

-- Tracked per company (one follow-up email covers all of that employer's
-- pending applications at once, not one email per application) and rate
-- limited to at most once a week so it nudges rather than nags.
alter table public.companies
  add column if not exists last_follow_up_email_at timestamptz;
