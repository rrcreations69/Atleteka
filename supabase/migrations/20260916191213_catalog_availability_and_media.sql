-- M04: derived public availability, never internal stock counts.
create function private.variant_in_stock(requested_variant uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.product_variants v
    join public.products p on p.id = v.product_id
    join public.inventory i on i.variant_id = v.id
    where v.id = requested_variant and v.active and p.status = 'active'
      and i.quantity_on_hand > 0
  );
$$;
revoke all on function private.variant_in_stock(uuid) from public;
grant execute on function private.variant_in_stock(uuid) to anon, authenticated, service_role;
-- The private schema is not exposed through the Data API. The helper itself
-- restricts active rows, even if called directly by a trusted SQL connection.
create view public.product_availability with (security_invoker = true) as
select v.id as variant_id, private.variant_in_stock(v.id) as in_stock
from public.product_variants v
join public.products p on p.id = v.product_id
where v.active and p.status = 'active';
revoke all on public.product_availability from public, anon, authenticated, service_role;
grant select on public.product_availability to anon, authenticated, service_role;

-- Catalog media is public. Upload/admin media workflows remain M11.
-- Do not alter the visibility of an existing bucket.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;
