-- M04 public availability is read-only and does not reveal stock quantities.
begin;
create temporary table m04_ids(name text primary key,id uuid default gen_random_uuid());
insert into m04_ids(name) values('active'),('hidden'),('stock'),('zero'),('missing'),('inactive'),('hidden_variant');
grant select on m04_ids to anon,authenticated;
create function pg_temp.id(text) returns uuid language sql stable as 'select id from m04_ids where name=$1';
create function pg_temp.check_true(ok boolean,label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %',label; end if; end $$;
insert into public.products(id,slug,name,status) values
(pg_temp.id('active'),pg_temp.id('active')::text,'M04 fixture','active'),
(pg_temp.id('hidden'),pg_temp.id('hidden')::text,'M04 hidden fixture','inactive');
insert into public.product_variants(id,product_id,sku,title,price,active)
select id,case when name='hidden_variant' then pg_temp.id('hidden') else pg_temp.id('active') end,id::text,name,10,name<>'inactive'
from m04_ids where name in('stock','zero','missing','inactive','hidden_variant');
insert into public.inventory(variant_id,quantity_on_hand)
select id,case when name='zero' then 0 else 7 end from m04_ids where name in('stock','zero','inactive','hidden_variant');

set local role anon;
select pg_temp.check_true((select count(*)=3 from public.product_availability where variant_id in(select id from m04_ids)),'only active variants of active products');
select pg_temp.check_true((select in_stock from public.product_availability where variant_id=pg_temp.id('stock')),'positive stock available');
select pg_temp.check_true((select not in_stock from public.product_availability where variant_id=pg_temp.id('zero')),'zero stock unavailable');
select pg_temp.check_true((select not in_stock from public.product_availability where variant_id=pg_temp.id('missing')),'missing stock fails closed');
select pg_temp.check_true(not has_table_privilege(current_user,'public.inventory','select'),'anonymous cannot read exact counts');
select pg_temp.check_true(not has_table_privilege(current_user,'public.inventory','update'),'anonymous cannot adjust stock');
select pg_temp.check_true(not has_table_privilege(current_user,'public.product_availability','insert'),'availability not insertable');
select pg_temp.check_true(not has_table_privilege(current_user,'public.product_availability','update'),'availability not updatable');
reset role;
set local role authenticated;
select pg_temp.check_true((select count(*)=3 from public.product_availability where variant_id in(select id from m04_ids)),'signed-in active availability');
select pg_temp.check_true((select count(*)=0 from public.inventory where variant_id in(select id from m04_ids)),'non-admin counts hidden by RLS');
reset role;
update public.inventory set quantity_on_hand=0 where variant_id=pg_temp.id('stock');
set local role anon;
select pg_temp.check_true((select not in_stock from public.product_availability where variant_id=pg_temp.id('stock')),'availability updates immediately');
reset role;
select pg_temp.check_true((select array_agg(column_name::text order by ordinal_position)=array['variant_id','in_stock'] from information_schema.columns where table_schema='public' and table_name='product_availability'),'projection has no internal fields');
select pg_temp.check_true((select reloptions @> array['security_invoker=true'] from pg_class where oid='public.product_availability'::regclass),'view honors caller RLS');
select pg_temp.check_true(not has_schema_privilege('anon','private','usage'),'private helper not exposed for direct access');
select pg_temp.check_true((select public from storage.buckets where id='product-images'),'catalog bucket publicly readable');
rollback;
select 'PASS: M04 availability, active-only filtering, live stock changes and read-only boundaries' as result;
