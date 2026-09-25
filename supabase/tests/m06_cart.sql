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
select pg_temp.check_true(public.read_cart()->'items' = '[]'::jsonb,'no identity reads empty');
select pg_temp.expect_error(format('select public.mutate_cart(''add'',%L,1)',pg_temp.id('stock')),'28000');
select set_config('request.headers','{"x-cart-token":"malformed"}',true);
select pg_temp.expect_error(format('select public.mutate_cart(''add'',%L,1)',pg_temp.id('stock')),'28000');
select pg_temp.actor(null,'a');
select pg_temp.check_true(public.mutate_cart('add',pg_temp.id('stock'),2)->>'subtotal' = '20.50','DB price and subtotal');
select pg_temp.check_true((public.mutate_cart('add',pg_temp.id('stock'),1)#>>'{items,0,quantity}')::int=3,'duplicate adds increment');
select pg_temp.check_true(jsonb_array_length(public.read_cart()->'items')=1,'one variant line');
select pg_temp.check_true((public.mutate_cart('set',pg_temp.id('stock'),2)#>>'{items,0,quantity}')::int=2,'positive quantity update');
select pg_temp.expect_error(format('select public.mutate_cart(''set'',%L,-5)',pg_temp.id('stock')),'22023');
select pg_temp.expect_error(format('select public.mutate_cart(''set'',%L,0)',pg_temp.id('stock')),'22023');
select pg_temp.expect_error(format('select public.mutate_cart(''set'',%L,6)',pg_temp.id('stock')),'22023');
select pg_temp.expect_error(format('select public.mutate_cart(''add'',%L,4)',pg_temp.id('stock')),'22023');
select pg_temp.expect_error(format('select public.mutate_cart(''add'',%L,2147483647)',pg_temp.id('stock')),'22023');
select pg_temp.expect_error(format('select public.mutate_cart(''remove'',%L,0)',pg_temp.id('stock')),'22023');
select pg_temp.expect_error(format('select public.mutate_cart(''other'',%L,1)',pg_temp.id('stock')),'22023');
select pg_temp.expect_error(format('select public.mutate_cart(''add'',%L,1)',pg_temp.id('zero')),'22023');
select pg_temp.expect_error(format('select public.mutate_cart(''add'',%L,1)',pg_temp.id('missing')),'22023');
select pg_temp.expect_error(format('select public.mutate_cart(''add'',%L,1)',pg_temp.id('inactive')),'22023');
select pg_temp.expect_error(format('select public.mutate_cart(''add'',%L,1)',pg_temp.id('hidden_variant')),'22023');
select pg_temp.check_true((public.read_cart()#>>'{items,0,quantity}')::int=2,'failed mutation preserves cart');
select pg_temp.check_true((select count(*)=1 from public.cart_items where variant_id=pg_temp.id('stock')),'guest own line visible through RLS');
select pg_temp.check_true(not has_table_privilege(current_user,'public.inventory','select'),'no raw stock access');
select pg_temp.expect_error(format('update public.cart_items set quantity=100 where variant_id=%L',pg_temp.id('stock')),'42501');
select pg_temp.expect_error('select guest_token from public.carts','42501');
select pg_temp.check_true(not has_schema_privilege(current_user,'private','usage'),'private schema remains closed');

select pg_temp.actor(null,'b');
select pg_temp.check_true(public.read_cart()->'items'='[]'::jsonb,'guest B cannot read A');
select pg_temp.check_true((select count(*)=0 from public.cart_items where variant_id=pg_temp.id('stock')),'RLS denies other guest line');
select pg_temp.check_true(public.mutate_cart('remove',pg_temp.id('stock'))->'items'='[]'::jsonb,'remove does not touch another guest cart');
select pg_temp.check_true((public.mutate_cart('add',pg_temp.id('stock'),1)#>>'{items,0,quantity}')::int=1,'guest B independent cart');
select pg_temp.actor(null,'a');
select pg_temp.check_true((public.read_cart()#>>'{items,0,quantity}')::int=2,'guest A preserved');
reset role;
select pg_temp.check_true((select count(*)=2 from public.carts where guest_token in (
encode(sha256(convert_to(pg_temp.token('a'),'UTF8')),'hex'),
encode(sha256(convert_to(pg_temp.token('b'),'UTF8')),'hex'))),'only guest hashes stored');
select pg_temp.check_true(not exists(select 1 from public.carts where guest_token in(pg_temp.token('a'),pg_temp.token('b'))),'raw tokens absent');
select pg_temp.check_true((select quantity_on_hand=5 from public.inventory where variant_id=pg_temp.id('stock')),'cart does not deduct or reserve stock');

set local role authenticated;
select pg_temp.actor('user_a','a');
select pg_temp.check_true(public.read_cart()->'items'='[]'::jsonb,'login does not merge guest cart');
select pg_temp.check_true((public.mutate_cart('add',pg_temp.id('stock'),1)#>>'{items,0,quantity}')::int=1,'customer own cart');
select pg_temp.check_true(not has_table_privilege(current_user,'public.carts','insert'),'direct cart creation denied');
select pg_temp.check_true(not has_column_privilege(current_user,'public.carts','status','update'),'old column write grant removed');
select pg_temp.expect_error(format('insert into public.cart_items(cart_id,variant_id,quantity) values(gen_random_uuid(),%L,100)',pg_temp.id('stock')),'42501');
select pg_temp.actor('user_b','a');
select pg_temp.check_true(public.read_cart()->'items'='[]'::jsonb,'other customer and guest token cannot read customer A');
select pg_temp.check_true((select count(*)=0 from public.cart_items where variant_id=pg_temp.id('stock')),'customer RLS cross-owner denial');
select pg_temp.check_true(public.mutate_cart('remove',pg_temp.id('stock'))->'items'='[]'::jsonb,'customer cannot remove another cart line');
select pg_temp.actor('user_a',null);
select pg_temp.check_true((public.read_cart()#>>'{items,0,quantity}')::int=1,'signed-in cart persists without guest cookie');
reset role;
set local role anon;
select pg_temp.actor(null,'a');
select pg_temp.check_true((public.read_cart()#>>'{items,0,quantity}')::int=2,'signout restores separate guest cart');
reset role;

update public.product_variants set price=12.50 where id=pg_temp.id('stock');
update public.inventory set quantity_on_hand=1 where variant_id=pg_temp.id('stock');
set local role anon;
select pg_temp.actor(null,'a');
select pg_temp.check_true(public.read_cart()->>'subtotal'='25.00','fresh DB price reflected');
select pg_temp.check_true(public.read_cart()#>>'{items,0,quantityValid}'='false','stock reduction flagged');
select pg_temp.check_true(public.read_cart()#>>'{items,0,available}'='true','some stock is distinct from requested quantity');
select pg_temp.check_true(not (public.read_cart()#>'{items,0}') ? 'quantity_on_hand','no stock count in payload');
select pg_temp.expect_error(format('select public.mutate_cart(''set'',%L,2)',pg_temp.id('stock')),'22023');
reset role;
update public.products set status='inactive',name='Private changed draft' where id=pg_temp.id('product');
set local role anon;
select pg_temp.actor(null,'a');
select pg_temp.check_true(public.read_cart()#>>'{items,0,productName}'='Unavailable product','draft names hidden from historical cart');
select pg_temp.check_true(public.read_cart()#>'{items,0,unitPrice}'='null'::jsonb,'unavailable line has no purchasable price');
select pg_temp.check_true(public.mutate_cart('remove',pg_temp.id('stock'))->'items'='[]'::jsonb,'inactive line can be removed');
select pg_temp.check_true(public.read_cart()->>'subtotal'='0','empty subtotal');
reset role;
select pg_temp.check_true((select bool_and(relrowsecurity) from pg_class where oid in('public.carts'::regclass,'public.cart_items'::regclass)),'cart RLS remains enabled');
select pg_temp.check_true((select not prosecdef from pg_proc where oid='public.read_cart()'::regprocedure),'public read wrapper is invoker');
select pg_temp.check_true((select not prosecdef from pg_proc where oid='public.mutate_cart(text,uuid,integer)'::regprocedure),'public mutation wrapper is invoker');
rollback;
select 'PASS: M06 ownership, quantities, current prices/stock, permissions and guest/account separation' as result;
