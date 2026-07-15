-- =============================================================================
-- JobMo — Phase 2: Storage buckets
-- Name this query: "phase2_storage_buckets"
-- Run AFTER 0004_phase2_rls_policies.sql
--
-- Each bucket uses a `${auth.uid()}/...` path convention so a single storage
-- policy can restrict access to "your own folder" without per-file grants.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('profile-photos', 'profile-photos', true, 5242880, array['image/png','image/jpeg','image/webp']),
  ('resumes',        'resumes',        false, 10485760, array['application/pdf']),
  ('certificates',   'certificates',   false, 10485760, array['application/pdf','image/png','image/jpeg']),
  ('documents',      'documents',      false, 10485760, array['application/pdf','image/png','image/jpeg'])
  -- 'documents' holds sensitive ID uploads for DOB-change requests — private, never public.
on conflict (id) do nothing;

-- profile-photos: public read (needed to render avatars), owner-only write
drop policy if exists "profile_photos_public_read" on storage.objects;
create policy "profile_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'profile-photos');

drop policy if exists "profile_photos_owner_write" on storage.objects;
create policy "profile_photos_owner_write"
  on storage.objects for insert
  with check (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "profile_photos_owner_update" on storage.objects;
create policy "profile_photos_owner_update"
  on storage.objects for update
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "profile_photos_owner_delete" on storage.objects;
create policy "profile_photos_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'profile-photos' and (storage.foldername(name))[1] = auth.uid()::text);

-- resumes, certificates, documents: fully private, owner-only for all operations
do $$
declare
  b text;
begin
  foreach b in array array['resumes','certificates','documents']
  loop
    execute format('drop policy if exists "%s_owner_select" on storage.objects;', b);
    execute format(
      'create policy "%s_owner_select" on storage.objects for select using (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text);',
      b, b
    );
    execute format('drop policy if exists "%s_owner_insert" on storage.objects;', b);
    execute format(
      'create policy "%s_owner_insert" on storage.objects for insert with check (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text);',
      b, b
    );
    execute format('drop policy if exists "%s_owner_delete" on storage.objects;', b);
    execute format(
      'create policy "%s_owner_delete" on storage.objects for delete using (bucket_id = %L and (storage.foldername(name))[1] = auth.uid()::text);',
      b, b
    );
    -- Admins can read every private bucket (needed for DOB document review in Phase 6).
    execute format('drop policy if exists "%s_admin_select" on storage.objects;', b);
    execute format(
      'create policy "%s_admin_select" on storage.objects for select using (bucket_id = %L and public.is_admin());',
      b, b
    );
  end loop;
end $$;
