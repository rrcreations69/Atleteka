-- Run after supabase/seed.sql on a fresh development database.
begin;
do $$
begin
  if (select count(*) from public.products where slug like 'm02-%') <> 3
    or (select count(*) from public.categories where slug='m02-training') <> 1
    or (select count(*) from public.product_variants where sku like 'M02-%') <> 5 then
    raise exception 'Seed fixture counts differ';
  end if;
  if (select count(*) from public.product_variants v
      join public.products p on p.id=v.product_id
      join public.inventory i on i.variant_id=v.id
      join public.product_categories pc on pc.product_id=p.id
      join public.categories c on c.id=pc.category_id
      where c.slug='m02-training' and c.active and p.status='active'
        and v.active and v.price>0 and i.quantity_on_hand>0) <> 2 then
    raise exception 'Seed does not provide two usable in-stock variants';
  end if;
  if not exists (select 1 from public.product_variants v
      join public.inventory i on i.variant_id=v.id
      where v.sku='M02-TOWEL' and v.active and i.quantity_on_hand=0)
    or not exists (select 1 from public.product_variants where sku='M02-SHIRT-L' and not active)
    or not exists (select 1 from public.products where slug='m02-archived-shirt' and status='inactive') then
    raise exception 'Seed lacks sold-out/inactive cases';
  end if;
  if exists (select 1 from public.profiles)
    or exists (select 1 from public.carts)
    or exists (select 1 from public.orders)
    or exists (select 1 from public.discounts)
    or exists (select 1 from public.webhook_events) then
    raise exception 'Future-feature records unexpectedly seeded';
  end if;
end;
$$;
rollback;
select 'PASS: usable synthetic catalog with sold-out/inactive variants' as result;
