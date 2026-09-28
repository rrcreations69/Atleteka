-- M11-P01: admin catalog management and product media.

-- Archive, not delete: the only product states.
alter table public.products add constraint products_status_known check (status in ('active', 'inactive'));

-- Defense in depth behind the server checks: type and size limits on the public bucket.
update storage.buckets
set file_size_limit = 4194304, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
where id = 'product-images';

-- Admin-only writes under products/; public reads use the public bucket URL.
create policy product_images_admin_insert on storage.objects for insert to authenticated
with check (
  bucket_id = 'product-images' and (storage.foldername(name))[1] = 'products'
  and (select role = 'admin' from public.profiles where id = (select auth.uid()))
);
create policy product_images_admin_update on storage.objects for update to authenticated
using (bucket_id = 'product-images' and (select role = 'admin' from public.profiles where id = (select auth.uid())))
with check (
  bucket_id = 'product-images' and (storage.foldername(name))[1] = 'products'
  and (select role = 'admin' from public.profiles where id = (select auth.uid()))
);
create policy product_images_admin_delete on storage.objects for delete to authenticated
using (bucket_id = 'product-images' and (select role = 'admin' from public.profiles where id = (select auth.uid())));
-- Upserts and removal responses read the object row back; limit that to admins too.
create policy product_images_admin_select on storage.objects for select to authenticated
using (bucket_id = 'product-images' and (select role = 'admin' from public.profiles where id = (select auth.uid())));
