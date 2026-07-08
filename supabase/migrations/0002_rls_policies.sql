-- =============================================================================
-- JobMo — Phase 1: Row Level Security policies
-- Name this query: "phase1_rls_policies"
-- Run AFTER 0001_init_schema.sql
-- =============================================================================

alter table public.profiles enable row level security;
alter table public.audit_logs enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

-- Anyone signed in can read their own profile.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- Admins and super_admins can read every profile (user management screens).
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin());

-- Users can update their own profile EXCEPT protected columns.
-- Column-level protection (role, permissions, status, date_of_birth in Phase 2)
-- is enforced in application code / a dedicated function, not by RLS alone,
-- since RLS cannot restrict which columns an UPDATE touches. See the
-- `admin_update_profile_role()` function below for the only sanctioned path
-- to change a role.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can update any profile (status, permissions) — used by approval flows.
drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin());

-- No client-side INSERT policy: profiles are only created via the
-- handle_new_user() trigger (security definer), never directly by clients.

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------

-- Only admins/super_admins may read audit logs.
drop policy if exists "audit_logs_select_admin" on public.audit_logs;
create policy "audit_logs_select_admin"
  on public.audit_logs for select
  using (public.is_admin());

-- No INSERT/UPDATE/DELETE policies for any client role: audit_logs is
-- written exclusively via `public.log_audit_event()` (security definer)
-- called from server actions / edge functions, never directly from the client.

create or replace function public.log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_metadata)
  returning id into v_id;
  return v_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Guarded role-change function — the ONLY way a profile's role changes.
-- Callable only by super_admin (enforced inside the function, not just RLS),
-- and always writes an audit log entry.
-- ---------------------------------------------------------------------------
create or replace function public.admin_update_profile_role(
  p_target_user_id uuid,
  p_new_role public.user_role
)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_super_admin() then
    raise exception 'Only super_admin can change user roles';
  end if;

  update public.profiles
  set role = p_new_role
  where id = p_target_user_id;

  perform public.log_audit_event(
    'profile.role_changed',
    'profile',
    p_target_user_id,
    jsonb_build_object('new_role', p_new_role, 'changed_by', auth.uid())
  );
end;
$$;
