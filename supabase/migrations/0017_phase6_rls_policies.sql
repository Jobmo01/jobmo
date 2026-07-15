-- =============================================================================
-- JobMo — Phase 6: RLS policies
-- Name this query: "phase6_rls_policies"
-- Run AFTER 0016_admin_schema.sql
-- =============================================================================

alter table public.platform_settings enable row level security;
alter table public.announcements enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_ticket_replies enable row level security;

-- ---------------------------------------------------------------------------
-- platform_settings — public read (middleware checks maintenance_mode even
-- for logged-out visitors), super_admin write only. No secrets ever live
-- here, so public readability is intentional and safe.
-- ---------------------------------------------------------------------------
drop policy if exists "platform_settings_select_public" on public.platform_settings;
create policy "platform_settings_select_public"
  on public.platform_settings for select
  using (true);

drop policy if exists "platform_settings_super_admin_write" on public.platform_settings;
create policy "platform_settings_super_admin_write"
  on public.platform_settings for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- announcements — active ones readable by anyone signed in; super_admin
-- manages (create/edit/deactivate).
-- ---------------------------------------------------------------------------
drop policy if exists "announcements_select_active" on public.announcements;
create policy "announcements_select_active"
  on public.announcements for select
  using (is_active = true and auth.uid() is not null);

drop policy if exists "announcements_super_admin_all" on public.announcements;
create policy "announcements_super_admin_all"
  on public.announcements for all
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- support_tickets — owner reads/creates their own; admin reads/updates all.
-- ---------------------------------------------------------------------------
drop policy if exists "support_tickets_owner_select" on public.support_tickets;
create policy "support_tickets_owner_select"
  on public.support_tickets for select
  using (auth.uid() = user_id);

drop policy if exists "support_tickets_owner_insert" on public.support_tickets;
create policy "support_tickets_owner_insert"
  on public.support_tickets for insert
  with check (auth.uid() = user_id or user_id is null);

drop policy if exists "support_tickets_admin_all" on public.support_tickets;
create policy "support_tickets_admin_all"
  on public.support_tickets for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- support_ticket_replies — ticket owner and admin can both read/write
-- (a real two-way support conversation).
-- ---------------------------------------------------------------------------
drop policy if exists "ticket_replies_owner_select" on public.support_ticket_replies;
create policy "ticket_replies_owner_select"
  on public.support_ticket_replies for select
  using (
    exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())
  );

drop policy if exists "ticket_replies_owner_insert" on public.support_ticket_replies;
create policy "ticket_replies_owner_insert"
  on public.support_ticket_replies for insert
  with check (
    exists (select 1 from public.support_tickets t where t.id = ticket_id and t.user_id = auth.uid())
  );

drop policy if exists "ticket_replies_admin_all" on public.support_ticket_replies;
create policy "ticket_replies_admin_all"
  on public.support_ticket_replies for all
  using (public.is_admin())
  with check (public.is_admin());
