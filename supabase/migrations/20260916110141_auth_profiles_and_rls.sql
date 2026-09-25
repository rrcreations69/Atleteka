-- M03: profiles and access boundaries. No business entities or fields added.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create function private.create_customer_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80), 'customer');
  return new;
end;
$$;
revoke all on function private.create_customer_profile() from public, anon, authenticated;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.create_customer_profile();

-- Existing identities must never be promoted from editable Auth metadata.
insert into public.profiles (id, display_name, role)
select id, left(coalesce(raw_user_meta_data ->> 'display_name', ''), 80), 'customer'
from auth.users
on conflict (id) do nothing;

grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
create policy profiles_read_own on public.profiles for select to authenticated
using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Catalog read access is limited to active rows; writes require the database role.
grant select on public.products to anon, authenticated;
grant insert, update on public.products to authenticated;
create policy products_public_read on public.products for select to anon using (status = 'active');
create policy products_signed_in_read on public.products for select to authenticated using ((status = 'active') or (select role = 'admin' from public.profiles where id = (select auth.uid())));
create policy products_admin_insert on public.products for insert to authenticated with check ((select role = 'admin' from public.profiles where id = (select auth.uid())));
create policy products_admin_update on public.products for update to authenticated using ((select role = 'admin' from public.profiles where id = (select auth.uid()))) with check ((select role = 'admin' from public.profiles where id = (select auth.uid())));
grant select on public.product_variants to anon, authenticated;
grant insert, update on public.product_variants to authenticated;
create policy product_variants_public_read on public.product_variants for select to anon using (active and exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
create policy product_variants_signed_in_read on public.product_variants for select to authenticated using ((active and exists (select 1 from public.products p where p.id = product_id and p.status = 'active')) or (select role = 'admin' from public.profiles where id = (select auth.uid())));
create policy product_variants_admin_insert on public.product_variants for insert to authenticated with check ((select role = 'admin' from public.profiles where id = (select auth.uid())));
create policy product_variants_admin_update on public.product_variants for update to authenticated using ((select role = 'admin' from public.profiles where id = (select auth.uid()))) with check ((select role = 'admin' from public.profiles where id = (select auth.uid())));
grant select on public.product_images to anon, authenticated;
grant insert, update on public.product_images to authenticated;
create policy product_images_public_read on public.product_images for select to anon using (exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));
create policy product_images_signed_in_read on public.product_images for select to authenticated using ((exists (select 1 from public.products p where p.id = product_id and p.status = 'active')) or (select role = 'admin' from public.profiles where id = (select auth.uid())));
create policy product_images_admin_insert on public.product_images for insert to authenticated with check ((select role = 'admin' from public.profiles where id = (select auth.uid())));
create policy product_images_admin_update on public.product_images for update to authenticated using ((select role = 'admin' from public.profiles where id = (select auth.uid()))) with check ((select role = 'admin' from public.profiles where id = (select auth.uid())));
grant select on public.categories to anon, authenticated;
grant insert, update on public.categories to authenticated;
create policy categories_public_read on public.categories for select to anon using (active);
create policy categories_signed_in_read on public.categories for select to authenticated using ((active) or (select role = 'admin' from public.profiles where id = (select auth.uid())));
create policy categories_admin_insert on public.categories for insert to authenticated with check ((select role = 'admin' from public.profiles where id = (select auth.uid())));
create policy categories_admin_update on public.categories for update to authenticated using ((select role = 'admin' from public.profiles where id = (select auth.uid()))) with check ((select role = 'admin' from public.profiles where id = (select auth.uid())));
grant select on public.product_categories to anon, authenticated;
grant insert, update on public.product_categories to authenticated;
create policy product_categories_public_read on public.product_categories for select to anon using (exists (select 1 from public.products p where p.id = product_id and p.status = 'active') and exists (select 1 from public.categories c where c.id = category_id and c.active));
create policy product_categories_signed_in_read on public.product_categories for select to authenticated using ((exists (select 1 from public.products p where p.id = product_id and p.status = 'active') and exists (select 1 from public.categories c where c.id = category_id and c.active)) or (select role = 'admin' from public.profiles where id = (select auth.uid())));
create policy product_categories_admin_insert on public.product_categories for insert to authenticated with check ((select role = 'admin' from public.profiles where id = (select auth.uid())));
create policy product_categories_admin_update on public.product_categories for update to authenticated using ((select role = 'admin' from public.profiles where id = (select auth.uid()))) with check ((select role = 'admin' from public.profiles where id = (select auth.uid())));
-- Unlinking media/category associations does not delete product history.
grant delete on public.product_images, public.product_categories to authenticated;
create policy product_images_admin_delete on public.product_images for delete to authenticated using ((select role = 'admin' from public.profiles where id = (select auth.uid())));
create policy product_categories_admin_delete on public.product_categories for delete to authenticated using ((select role = 'admin' from public.profiles where id = (select auth.uid())));
-- Internal stock counts have no public grant or policy.
grant select, insert, update on public.inventory to authenticated;
create policy inventory_admin_read on public.inventory for select to authenticated using ((select role = 'admin' from public.profiles where id = (select auth.uid())));
create policy inventory_admin_insert on public.inventory for insert to authenticated with check ((select role = 'admin' from public.profiles where id = (select auth.uid())));
create policy inventory_admin_update on public.inventory for update to authenticated using ((select role = 'admin' from public.profiles where id = (select auth.uid()))) with check ((select role = 'admin' from public.profiles where id = (select auth.uid())));

grant select, insert, delete on public.carts to authenticated;
grant update (status, updated_at) on public.carts to authenticated;
create policy carts_own on public.carts for all to authenticated
using (user_id = (select auth.uid()) and guest_token is null)
with check (user_id = (select auth.uid()) and guest_token is null);
grant select, insert, update, delete on public.cart_items to authenticated;
create policy cart_items_own on public.cart_items for all to authenticated
using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()) and c.guest_token is null))
with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()) and c.guest_token is null));

grant select, insert, update, delete on public.addresses to authenticated;
create policy addresses_own on public.addresses for all to authenticated
using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- No client can create orders, change money/payment state or edit item snapshots.
-- Fulfillment writes remain closed until their status rules are implemented.
grant select on public.orders, public.order_items to authenticated;
create policy orders_owner_or_admin_read on public.orders for select to authenticated
using (user_id = (select auth.uid()) or (select role = 'admin' from public.profiles where id = (select auth.uid())));
create policy order_items_owner_or_admin_read on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and (o.user_id = (select auth.uid()) or (select role = 'admin' from public.profiles where id = (select auth.uid())))));

grant select, insert, update on public.discounts to authenticated;
create policy discounts_admin_read on public.discounts for select to authenticated using ((select role = 'admin' from public.profiles where id = (select auth.uid())));
create policy discounts_admin_insert on public.discounts for insert to authenticated with check ((select role = 'admin' from public.profiles where id = (select auth.uid())));
create policy discounts_admin_update on public.discounts for update to authenticated using ((select role = 'admin' from public.profiles where id = (select auth.uid()))) with check ((select role = 'admin' from public.profiles where id = (select auth.uid())));
-- Guest flows and webhook_events remain service-only. RLS stays enabled on all tables.
