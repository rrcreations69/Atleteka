-- M06 security and behavior tests. Every fixture and mutation rolls back.
begin;
create temporary table m06_ids(name text primary key, id uuid default gen_random_uuid());
insert into m06_ids(name) values
('user_a'),('user_b'),('product'),('hidden_product'),('stock'),('zero'),('missing'),('inactive'),('hidden_variant');
create temporary table m06_tokens(name text primary key, token text);
insert into m06_tokens values
('a', encode(sha256(convert_to(gen_random_uuid()::text,'UTF8')),'hex')),
('b', encode(sha256(convert_to(gen_random_uuid()::text,'UTF8')),'hex'));
grant select on m06_ids, m06_tokens to anon, authenticated;
create function pg_temp.id(text) returns uuid language sql stable as 'select id from m06_ids where name=$1';
create function pg_temp.token(text) returns text language sql stable as 'select token from m06_tokens where name=$1';
create function pg_temp.check_true(ok boolean, label text) returns void language plpgsql as $$
begin if ok is distinct from true then raise exception 'FAIL: %',label; end if; end $$;
create function pg_temp.actor(user_name text, guest_name text) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub',coalesce(pg_temp.id(user_name)::text,''),true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',pg_temp.id(user_name),'role',case when user_name is null then 'anon' else 'authenticated' end)::text,true);
  perform set_config('request.headers',case when guest_name is null then '{}' else jsonb_build_object('x-cart-token',pg_temp.token(guest_name))::text end,true);
end;
$$;
create function pg_temp.expect_error(statement text, expected_code text) returns void language plpgsql as $$
begin
  begin
    execute statement;
  exception when others then
    if sqlstate = expected_code then return; end if;
    raise;
  end;
  raise exception 'FAIL: expected SQLSTATE %',expected_code;
end;
$$;

insert into auth.users(id,raw_user_meta_data)
select id,'{}' from m06_ids where name in ('user_a','user_b');
insert into public.products(id,slug,name,status) values
(pg_temp.id('product'),pg_temp.id('product')::text,'Cart fixture','active'),
(pg_temp.id('hidden_product'),pg_temp.id('hidden_product')::text,'Private draft','inactive');
insert into public.product_variants(id,product_id,sku,title,price,active)
select id,case when name='hidden_variant' then pg_temp.id('hidden_product') else pg_temp.id('product') end,
id::text,name,10.25,name<>'inactive' from m06_ids
where name in ('stock','zero','missing','inactive','hidden_variant');
insert into public.inventory(variant_id,quantity_on_hand)
select id,case when name='zero' then 0 else 5 end from m06_ids
where name in ('stock','zero','inactive','hidden_variant');


set local role anon;
select pg_temp.actor(null,null);
select pg_temp.expect_error('select public.checkout_quote()', '28000');
select pg_temp.actor(null,'a');
select pg_temp.expect_error('select public.checkout_quote()', 'P7001');
select public.mutate_cart('add',pg_temp.id('stock'),2);
select pg_temp.check_true((public.checkout_quote()->>'merchandiseTotal')::numeric=20.50,'database subtotal');
select pg_temp.check_true(public.checkout_quote()->'shippingTotal'='null'::jsonb and public.checkout_quote()->'grandTotal'='null'::jsonb,'unknown shipping/final never zero');
select pg_temp.check_true(public.checkout_quote()->>'currency'='PHP' and (public.checkout_quote()->>'taxIncluded')::boolean,'approved currency/tax');
select pg_temp.expect_error('select public.checkout_quote(''missing'')','P7003');
reset role;
insert into public.discounts(code,type,value,active,usage_limit,redemption_count) values
('M07-FIX','fixed',5,true,null,0),('M07-PCT','percentage',10,true,5,4),
('M07-CAP','fixed',100,true,null,0),('M07-USED','fixed',1,true,1,1),
('M07-BAD','unexpected',1,true,null,0),('M07-OFF','fixed',1,false,null,0),
('M07-PRECISION','fixed',0.001,true,null,0),('M07-OVER','percentage',101,true,null,0);
insert into public.discounts(code,type,value,active,starts_at,ends_at) values
('M07-EXPIRED','fixed',1,true,null,statement_timestamp()-interval '1 day'),
('M07-FUTURE','fixed',1,true,statement_timestamp()+interval '1 day',null);
set local role anon;
select pg_temp.check_true((public.checkout_quote(' M07-FIX ')->>'merchandiseTotal')::numeric=15.50,'fixed trimmed coupon');
select pg_temp.check_true((public.checkout_quote('M07-PCT')->>'discountTotal')::numeric=2.05,'percentage coupon');
select pg_temp.check_true((public.checkout_quote('M07-CAP')->>'merchandiseTotal')::numeric=0,'discount capped');
select pg_temp.expect_error('select public.checkout_quote(''m07-fix'')','P7003');
select pg_temp.expect_error('select public.checkout_quote(''M07-USED'')','P7003');
select pg_temp.expect_error('select public.checkout_quote(''M07-BAD'')','P7003');
select pg_temp.expect_error('select public.checkout_quote(''M07-OFF'')','P7003');
select pg_temp.expect_error('select public.checkout_quote(''M07-PRECISION'')','P7003');
select pg_temp.expect_error('select public.checkout_quote(''M07-OVER'')','P7003');
select pg_temp.expect_error('select public.checkout_quote(''M07-EXPIRED'')','P7003');
select pg_temp.expect_error('select public.checkout_quote(''M07-FUTURE'')','P7003');
select pg_temp.expect_error('select public.checkout_quote(repeat(''a'',101))','P7003');
select pg_temp.expect_error('select * from public.discounts','42501');
select pg_temp.actor(null,'b');
select pg_temp.expect_error('select public.checkout_quote()', 'P7001');
reset role;
update public.inventory set quantity_on_hand=1 where variant_id=pg_temp.id('stock');
set local role anon;
select pg_temp.actor(null,'a');
select pg_temp.expect_error('select public.checkout_quote()', 'P7002');
reset role;
update public.inventory set quantity_on_hand=5 where variant_id=pg_temp.id('stock');
update public.product_variants set active=false where id=pg_temp.id('stock');
set local role anon;
select pg_temp.expect_error('select public.checkout_quote()', 'P7002');
reset role;
update public.product_variants set active=true,price=0.05 where id=pg_temp.id('stock');
set local role anon;
select public.mutate_cart('set',pg_temp.id('stock'),1);
select pg_temp.check_true((public.checkout_quote('M07-PCT')->>'discountTotal')::numeric=0.01,'half-up rounding');
reset role;
update public.product_variants set price=0.001 where id=pg_temp.id('stock');
set local role anon;
select pg_temp.expect_error('select public.checkout_quote()', 'P7004');
reset role;
update public.product_variants set price=10.25 where id=pg_temp.id('stock');
set local role authenticated;
select pg_temp.actor('user_a','a');
select pg_temp.expect_error('select public.checkout_quote()', 'P7001');
select public.mutate_cart('add',pg_temp.id('stock'),3);
select pg_temp.check_true((public.checkout_quote()->>'subtotal')::numeric=30.75,'account uses separate cart');
insert into public.addresses(user_id,name,line1,city,region,postal_code,country)
values(pg_temp.id('user_a'),'Test name','Test street','Test city','Test region','1000','PH');
select pg_temp.expect_error(format('insert into public.addresses(user_id,name,line1,city,region,postal_code,country) values(%L,''Other'',''Street'',''City'',''Region'',''1000'',''PH'')',pg_temp.id('user_b')),'42501');
select pg_temp.actor('user_b','a');
select pg_temp.expect_error('select public.checkout_quote()', 'P7001');
select pg_temp.check_true((select count(*)=0 from public.addresses where user_id=pg_temp.id('user_a')),'address ownership');
select pg_temp.expect_error('update public.discounts set redemption_count=0','42501');
reset role;
update public.profiles set role='admin' where id=pg_temp.id('user_b');
set local role authenticated;
select pg_temp.expect_error('update public.discounts set redemption_count=0','42501');
select pg_temp.expect_error('insert into public.discounts(code,type,value,redemption_count) values(''bad'',''fixed'',1,10)','42501');
update public.discounts set value=6 where code='M07-FIX';
reset role;
select pg_temp.check_true((select redemption_count=4 from public.discounts where code='M07-PCT'),'quotes never consume coupon');
select pg_temp.check_true((select quantity_on_hand=5 from public.inventory where variant_id=pg_temp.id('stock')),'quotes never deduct stock');
select pg_temp.check_true(not has_schema_privilege('anon','private','usage'),'private schema stays closed');
select pg_temp.expect_error('update public.discounts set redemption_count=-1','23514');
rollback;
