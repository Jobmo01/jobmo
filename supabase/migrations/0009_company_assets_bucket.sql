-- =============================================================================
-- JobMo — Phase 3: Company assets storage bucket
-- Name this query: "phase3_storage_bucket"
-- Run AFTER 0008_phase3_rls_policies.sql
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('company-assets', 'company-assets', true, 5242880, array['image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

-- Public read (logos/cover images/gallery need to render on public company
-- pages). Owner-only write, keyed by the same ${auth.uid()}/... convention.
drop policy if exists "company_assets_public_read" on storage.objects;
create policy "company_assets_public_read"
  on storage.objects for select
  using (bucket_id = 'company-assets');

drop policy if exists "company_assets_owner_write" on storage.objects;
create policy "company_assets_owner_write"
  on storage.objects for insert
  with check (bucket_id = 'company-assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "company_assets_owner_update" on storage.objects;
create policy "company_assets_owner_update"
  on storage.objects for update
  using (bucket_id = 'company-assets' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "company_assets_owner_delete" on storage.objects;
create policy "company_assets_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'company-assets' and (storage.foldername(name))[1] = auth.uid()::text);
