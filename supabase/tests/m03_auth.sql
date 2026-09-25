-- Transactional M03 access tests. Run after all migrations; no fixtures persist.
begin;
create temporary table m03_ids (name text primary key, id uuid not null default gen_random_uuid());
insert into m03_ids(name) values ('a'),('b'),('admin'),('active'),('hidden'),('variant'),('cart_a'),('cart_b'),('guest'),('address_a'),('address_b'),('order_a'),('order_b'),('order_guest');
grant select on m03_ids to anon, authenticated, service_role;
create function pg_temp.id(text) returns uuid language sql stable as 'select id from m03_ids where name = $1';
create function pg_temp.check_true(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %', label; end if; end $$;
create function pg_temp.denied(statement text) returns void language plpgsql as $$
begin
  begin execute statement;
  exception when insufficient_privilege or check_violation then return;
  end;
  raise exception 'FAIL: mutation was allowed: %', statement;
end $$;
insert into auth.users(id,raw_user_meta_data) select id, '{"display_name":"M03 fixture","role":"admin"}'::jsonb from m03_ids where name in ('a','b','admin');
select pg_temp.check_true((select count(*) = 3 from public.profiles where id in (select id from m03_ids) and role = 'customer'), 'metadata cannot choose admin');
update public.profiles set role='admin' where id=pg_temp.id('admin');
insert into public.products(id,slug,name,status) values
(pg_temp.id('active'),pg_temp.id('active')::text,'M03 active','active'),
(pg_temp.id('hidden'),pg_temp.id('hidden')::text,'M03 hidden','inactive');
insert into public.product_variants(id,product_id,sku,title,price,active) values
(pg_temp.id('variant'),pg_temp.id('active'),pg_temp.id('variant')::text,'Fixture',10,true);
insert into public.inventory(variant_id,quantity_on_hand) values(pg_temp.id('variant'),9);
insert into public.carts(id,user_id,guest_token,status) values
(pg_temp.id('cart_a'),pg_temp.id('a'),null,'active'),
(pg_temp.id('cart_b'),pg_temp.id('b'),null,'active'),
(pg_temp.id('guest'),null,pg_temp.id('guest')::text,'active');
insert into public.cart_items(cart_id,variant_id,quantity) values(pg_temp.id('cart_b'),pg_temp.id('variant'),1);
insert into public.addresses(id,user_id,name,line1,city,region,postal_code,country)
values(pg_temp.id('address_a'),pg_temp.id('a'),'A','Fixture','Fixture','Fixture','00000','SG'),
(pg_temp.id('address_b'),pg_temp.id('b'),'B','Fixture','Fixture','Fixture','00000','SG');
insert into public.orders(id,user_id,email,status,payment_status,subtotal,discount_total,shipping_total,tax_total,grand_total,currency)
values(pg_temp.id('order_a'),pg_temp.id('a'),'m03-a@example.invalid','pending','unpaid',10,0,0,0,10,'SGD'),
(pg_temp.id('order_b'),pg_temp.id('b'),'m03-b@example.invalid','pending','unpaid',10,0,0,0,10,'SGD'),
(pg_temp.id('order_guest'),null,'m03-guest@example.invalid','pending','unpaid',10,0,0,0,10,'SGD');
insert into public.order_items(order_id,variant_id,sku,product_name,variant_name,unit_price,quantity,line_total)
select id,pg_temp.id('variant'),'fixture','Fixture','Fixture',10,1,10 from m03_ids where name in ('order_a','order_b','order_guest');

set local role anon;
select pg_temp.check_true((select count(*) = 1 from public.products where id in (pg_temp.id('active'),pg_temp.id('hidden'))),'anonymous active catalog only');
select pg_temp.denied('select * from public.profiles');
select pg_temp.denied('select * from public.orders');
select pg_temp.denied('select * from public.inventory');
select pg_temp.denied('select * from public.webhook_events');
select pg_temp.denied('select private.create_customer_profile()');
reset role;

select set_config('request.jwt.claim.sub',pg_temp.id('a')::text,true);
set local role authenticated;
select pg_temp.check_true((select count(*)=1 from public.profiles where id in (select id from m03_ids)),'own profile only');
select pg_temp.check_true((select role='customer' from public.profiles where id=pg_temp.id('a')),'customer role');
update public.profiles set display_name='Updated safe name' where id=pg_temp.id('a');
select pg_temp.check_true((select display_name='Updated safe name' from public.profiles where id=pg_temp.id('a')),'safe profile update');
select pg_temp.denied($q$update public.profiles set role='admin' where id=pg_temp.id('a')$q$);
select pg_temp.denied($q$insert into public.profiles(id,role) values(gen_random_uuid(),'admin')$q$);
select pg_temp.denied($q$delete from public.profiles where id=pg_temp.id('a')$q$);
select pg_temp.check_true((select count(*)=0 from public.profiles where id=pg_temp.id('b')),'other profile hidden');
with changed as (update public.profiles set display_name='Stolen' where id=pg_temp.id('b') returning id)
select pg_temp.check_true((select count(*)=0 from changed),'other profile update blocked');
select pg_temp.check_true((select count(*)=1 from public.orders where id in(select id from m03_ids)),'own orders only; guest and other hidden');
select pg_temp.check_true((select count(*)=1 from public.order_items where order_id in(select id from m03_ids)),'own snapshots only');
select pg_temp.check_true((select count(*)=1 from public.addresses where id in(select id from m03_ids)),'own addresses only');
select pg_temp.check_true((select count(*)=1 from public.carts where id in(select id from m03_ids)),'own carts only; guest denied');
select pg_temp.check_true((select count(*)=0 from public.inventory),'internal stock hidden');
select pg_temp.check_true((select count(*)=0 from public.discounts),'discount administration hidden');
select pg_temp.check_true((select count(*)=0 from public.cart_items where cart_id=pg_temp.id('cart_b')),'other cart items hidden');
insert into public.cart_items(cart_id,variant_id,quantity) values(pg_temp.id('cart_a'),pg_temp.id('variant'),2);
update public.cart_items set quantity=3 where cart_id=pg_temp.id('cart_a');
select pg_temp.check_true((select quantity=3 from public.cart_items where cart_id=pg_temp.id('cart_a')),'own cart item create/update');
select pg_temp.denied($q$update public.cart_items set cart_id=pg_temp.id('cart_b') where cart_id=pg_temp.id('cart_a')$q$);
select pg_temp.denied($q$insert into public.cart_items(cart_id,variant_id,quantity) values(pg_temp.id('guest'),pg_temp.id('variant'),1)$q$);
select pg_temp.denied($q$insert into public.carts(user_id,status) values(pg_temp.id('b'),'active')$q$);
select pg_temp.denied($q$insert into public.carts(guest_token,status) values('guessed-guest','active')$q$);
select pg_temp.denied($q$update public.carts set user_id=pg_temp.id('b') where id=pg_temp.id('cart_a')$q$);
update public.addresses set city='Updated' where id=pg_temp.id('address_a');
select pg_temp.check_true((select city='Updated' from public.addresses where id=pg_temp.id('address_a')),'own address update');
select pg_temp.denied($q$update public.addresses set user_id=pg_temp.id('b') where id=pg_temp.id('address_a')$q$);
select pg_temp.denied($q$insert into public.addresses(user_id,name,line1,city,region,postal_code,country) values(pg_temp.id('b'),'X','X','X','X','X','SG')$q$);
select pg_temp.denied($q$insert into public.products(slug,name,status) values('m03-escalation','Bad','active')$q$);
with changed as(update public.products set name='Bad' where id=pg_temp.id('active') returning id)
select pg_temp.check_true((select count(*)=0 from changed),'direct customer admin update denied');
select pg_temp.denied($q$update public.orders set payment_status='paid' where id=pg_temp.id('order_a')$q$);
select pg_temp.denied($q$update public.orders set grand_total=0 where id=pg_temp.id('order_a')$q$);
select pg_temp.denied($q$update public.orders set status='paid' where id=pg_temp.id('order_a')$q$);
select pg_temp.denied($q$update public.order_items set unit_price=0,line_total=0 where order_id=pg_temp.id('order_a')$q$);
select pg_temp.denied($q$insert into public.orders(email,status,payment_status,subtotal,discount_total,shipping_total,tax_total,grand_total,currency) values('x@example.invalid','paid','paid',0,0,0,0,0,'SGD')$q$);
select pg_temp.denied('select * from public.webhook_events');
reset role;
select set_config('request.jwt.claim.sub',pg_temp.id('admin')::text,true);
set local role authenticated;
select pg_temp.check_true((select count(*)=2 from public.products where id in(pg_temp.id('active'),pg_temp.id('hidden'))),'admin sees inactive catalog');
select pg_temp.check_true((select count(*)=3 from public.orders where id in(select id from m03_ids)),'admin reads orders');
update public.products set name='Admin updated' where id=pg_temp.id('active');
select pg_temp.check_true((select name='Admin updated' from public.products where id=pg_temp.id('active')),'admin catalog mutation allowed');
update public.inventory set quantity_on_hand=8 where variant_id=pg_temp.id('variant');
select pg_temp.check_true((select quantity_on_hand=8 from public.inventory where variant_id=pg_temp.id('variant')),'admin inventory mutation allowed');
select pg_temp.denied($q$update public.profiles set role='admin' where id=pg_temp.id('b')$q$);
select pg_temp.denied($q$update public.orders set payment_status='paid' where id=pg_temp.id('order_a')$q$);
select pg_temp.denied($q$update public.orders set grand_total=0 where id=pg_temp.id('order_a')$q$);
select pg_temp.denied($q$update public.orders set status='paid' where id=pg_temp.id('order_a')$q$);
select pg_temp.denied($q$update public.order_items set unit_price=0,line_total=0 where order_id=pg_temp.id('order_a')$q$);
select pg_temp.denied($q$insert into public.orders(email,status,payment_status,subtotal,discount_total,shipping_total,tax_total,grand_total,currency) values('x@example.invalid','paid','paid',0,0,0,0,0,'SGD')$q$);
select pg_temp.denied('select * from public.webhook_events');
reset role;
set local role service_role;
select pg_temp.check_true((select count(*)=3 from public.profiles where id in(select id from m03_ids)),'service role retains trusted access');
reset role;
select pg_temp.check_true((select count(*)=14 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relrowsecurity),'RLS remains enabled');
select pg_temp.check_true(not has_table_privilege('anon','public.profiles','select'),'no anonymous profile grant');
select pg_temp.check_true(not has_column_privilege('authenticated','public.profiles','role','update'),'role column not writable');
select pg_temp.check_true(not has_function_privilege('authenticated','private.create_customer_profile()','execute'),'trigger not callable by client');
rollback;
select 'PASS: M03 profile, ownership, admin, anonymous and payment boundaries' as result;
