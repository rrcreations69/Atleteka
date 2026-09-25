-- Synthetic development catalog only. Prices are sample decimal amounts, not
-- a currency decision. No customer, Auth, order, payment or media data is seeded.
-- Natural keys make replay non-destructive: existing rows are never overwritten.
insert into public.categories (slug, name, active)
values ('m02-training', 'Sample training', true)
on conflict (slug) do nothing;

insert into public.products (slug, name, description, status)
values
  ('m02-training-shirt', 'Sample training shirt', 'Development fixture with two sizes.', 'active'),
  ('m02-training-towel', 'Sample training towel', 'Development fixture for sold-out stock.', 'active'),
  ('m02-archived-shirt', 'Sample archived shirt', 'Development fixture excluded from active catalog.', 'inactive')
on conflict (slug) do nothing;

insert into public.product_variants (product_id, sku, title, price, active)
select p.id, v.sku, v.title, v.price, v.active
from (values
  ('m02-training-shirt', 'M02-SHIRT-S', 'Small', 25.00::numeric, true),
  ('m02-training-shirt', 'M02-SHIRT-M', 'Medium', 25.00::numeric, true),
  ('m02-training-shirt', 'M02-SHIRT-L', 'Large', 25.00::numeric, false),
  ('m02-training-towel', 'M02-TOWEL', 'Standard', 12.50::numeric, true),
  ('m02-archived-shirt', 'M02-ARCHIVED', 'Standard', 20.00::numeric, true)
) as v(slug, sku, title, price, active)
join public.products p on p.slug = v.slug
on conflict (sku) do nothing;

insert into public.product_categories (product_id, category_id)
select p.id, c.id
from public.products p
cross join public.categories c
where p.slug in ('m02-training-shirt', 'm02-training-towel', 'm02-archived-shirt')
  and c.slug = 'm02-training'
on conflict (product_id, category_id) do nothing;

insert into public.inventory (variant_id, quantity_on_hand)
select v.id, s.quantity
from (values
  ('M02-SHIRT-S', 8), ('M02-SHIRT-M', 5), ('M02-SHIRT-L', 4),
  ('M02-TOWEL', 0), ('M02-ARCHIVED', 3)
) as s(sku, quantity)
join public.product_variants v on v.sku = s.sku
on conflict (variant_id) do nothing;
