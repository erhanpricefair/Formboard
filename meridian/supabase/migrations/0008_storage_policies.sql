-- Meridian Property Partners
-- Migration 8: Storage bucket setup + Row-Level Security on storage.objects
-- Mirrors docs/investment-platform/ARCHITECTURE.md §7.
--
-- Path convention (enforced by application code, relied on by policies
-- below via storage.foldername(name)):
--   listing-images/{listing_id}/{filename}
--   listing-documents/{listing_id}/{filename}
--   developer-assets/{developer_id}/{filename}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('listing-images', 'listing-images', true, 10485760, array['image/png','image/jpeg','image/webp']),
  ('listing-documents', 'listing-documents', false, 20971520, array['application/pdf']),
  ('developer-assets', 'developer-assets', false, 10485760, null)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- listing-images: public read (bucket is public; published-only gating
-- happens at the app layer, which only ever requests URLs for published
-- listings — see ARCHITECTURE.md §7). Write/delete restricted to the
-- owning developer or admin.
-- ---------------------------------------------------------------------
create policy "listing_images_object_select" on storage.objects for select
  using (bucket_id = 'listing-images');

create policy "listing_images_object_insert" on storage.objects for insert
  with check (
    bucket_id = 'listing-images'
    and (owns_listing((storage.foldername(name))[1]::uuid) or is_admin())
  );

create policy "listing_images_object_delete" on storage.objects for delete
  using (
    bucket_id = 'listing-images'
    and (owns_listing((storage.foldername(name))[1]::uuid) or is_admin())
  );

-- ---------------------------------------------------------------------
-- listing-documents: private. Owning developer and admin can read/write
-- directly; investor access is intentionally NOT granted here — investors
-- receive a time-boxed signed URL issued by a server action (using the
-- service-role client) only after the profile-completion gate passes
-- (PRD FR-4, ARCHITECTURE.md §7). That server-side path bypasses RLS by
-- design and is the only investor-facing access route.
-- ---------------------------------------------------------------------
create policy "listing_documents_object_select" on storage.objects for select
  using (
    bucket_id = 'listing-documents'
    and (owns_listing((storage.foldername(name))[1]::uuid) or is_admin())
  );

create policy "listing_documents_object_insert" on storage.objects for insert
  with check (
    bucket_id = 'listing-documents'
    and (owns_listing((storage.foldername(name))[1]::uuid) or is_admin())
  );

create policy "listing_documents_object_delete" on storage.objects for delete
  using (
    bucket_id = 'listing-documents'
    and (owns_listing((storage.foldername(name))[1]::uuid) or is_admin())
  );

-- ---------------------------------------------------------------------
-- developer-assets: authenticated read (broker portal "download marketing
-- material", FR-6), owning developer/admin write.
-- ---------------------------------------------------------------------
create policy "developer_assets_object_select" on storage.objects for select
  using (bucket_id = 'developer-assets' and auth.role() = 'authenticated');

create policy "developer_assets_object_insert" on storage.objects for insert
  with check (
    bucket_id = 'developer-assets'
    and (owns_developer((storage.foldername(name))[1]::uuid) or is_admin())
  );

create policy "developer_assets_object_delete" on storage.objects for delete
  using (
    bucket_id = 'developer-assets'
    and (owns_developer((storage.foldername(name))[1]::uuid) or is_admin())
  );
