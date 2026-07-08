# Changelog

All notable changes to JobMo are documented here, phase by phase.

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

### Known limitations (see README "Known issues")
- Marketing stub pages have routing/SEO but placeholder content
- Dashboard stats are zeroed placeholders pending Phase 2/3 data
- Live chat widget is UI-only
- No automated tests yet (planned for Phase 7, can move earlier on request)
