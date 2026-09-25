-- Run as the database owner with psql -v ON_ERROR_STOP=1 -f this_file.
-- Tests use only disposable rows and roll back, including temporary grants.
begin;

do $$
declare
  expected text[] := array[
    'profiles','products','product_variants','product_images','categories',
    'product_categories','inventory','carts','cart_items','addresses',
    'orders','order_items','discounts','webhook_events'
  ];
  actual text[];
  table_name text;
  role_name text;
begin
  select array_agg(tablename::text order by tablename) into actual
  from pg_tables where schemaname = 'public';
  if actual <> (select array_agg(x order by x) from unnest(expected) x) then
    raise exception 'Application table inventory does not match the PRD';
  end if;
  foreach table_name in array expected loop
    if not (select relrowsecurity from pg_class where oid = format('public.%I', table_name)::regclass) then
      raise exception 'RLS disabled on %', table_name;
    end if;
    foreach role_name in array array['anon', 'authenticated'] loop
      if has_table_privilege(role_name, format('public.%I', table_name), 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') then
        raise exception 'Unexpected % grant on %', role_name, table_name;
      end if;
    end loop;
  end loop;
  if to_regprocedure('public.rls_auto_enable()') is not null then
    if has_function_privilege('anon','public.rls_auto_enable()','EXECUTE')
      or has_function_privilege('authenticated','public.rls_auto_enable()','EXECUTE') then
      raise exception 'Administrative platform helper is client-executable';
    end if;
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public') then
    raise exception 'M03 policies unexpectedly exist';
  end if;
end;
$$;

do $$
declare
  p uuid;
  v uuid;
  c uuid;
  o uuid;
  item uuid;
  test record;
  caught boolean;
begin
  insert into public.products (slug,name,status) values ('m02-test-product','Original product','active') returning id into p;
  insert into public.product_variants (product_id,sku,title,price,active) values (p,'M02-TEST-SKU','Original variant',10,true) returning id into v;
  insert into public.inventory values (v,2);
  insert into public.carts (guest_token,status) values ('m02-test-token','test') returning id into c;
  insert into public.cart_items (cart_id,variant_id,quantity) values (c,v,1);
  insert into public.orders (email,status,payment_status,subtotal,discount_total,shipping_total,tax_total,grand_total,currency,stripe_checkout_session_id)
    values ('fixture@example.invalid','test','test',20,0,0,0,20,'XXX','m02-test-session') returning id into o;
  insert into public.order_items (order_id,variant_id,sku,product_name,variant_name,unit_price,quantity,line_total)
    values (o,v,'M02-TEST-SKU','Original product','Original variant',10,2,20) returning id into item;
  insert into public.webhook_events values ('m02-test-event','test',now());

  for test in select * from (values
    ('negative price', format('update public.product_variants set price=-1 where id=%L',v),'23514'),
    ('NaN price', format('update public.product_variants set price=''NaN'' where id=%L',v),'23514'),
    ('infinite price', format('update public.product_variants set price=''Infinity'' where id=%L',v),'23514'),
    ('negative stock', format('update public.inventory set quantity_on_hand=-1 where variant_id=%L',v),'23514'),
    ('zero cart quantity', format('update public.cart_items set quantity=0 where cart_id=%L',c),'23514'),
    ('negative cart quantity', format('update public.cart_items set quantity=-5 where cart_id=%L',c),'23514'),
    ('duplicate product slug', 'insert into public.products(slug,name,status) values (''m02-test-product'',''duplicate'',''active'')','23505'),
    ('duplicate SKU', format('insert into public.product_variants(product_id,sku,title,price) values (%L,''M02-TEST-SKU'',''duplicate'',1)',p),'23505'),
    ('duplicate inventory', format('insert into public.inventory values (%L,1)',v),'23505'),
    ('duplicate cart line', format('insert into public.cart_items(cart_id,variant_id,quantity) values (%L,%L,1)',c,v),'23505'),
    ('missing product FK', 'insert into public.product_variants(product_id,sku,title,price) values (gen_random_uuid(),''M02-MISSING-FK'',''invalid'',1)','23503'),
    ('missing Auth FK', 'insert into public.profiles(id) values (gen_random_uuid())','23503'),
    ('invalid role', 'insert into public.profiles(id,role) values (gen_random_uuid(),''owner'')','23514'),
    ('cart without owner', 'insert into public.carts(status) values (''test'')','23514'),
    ('cart with two owners', format('update public.carts set user_id=gen_random_uuid() where id=%L',c),'23514'),
    ('duplicate guest token', 'insert into public.carts(guest_token,status) values (''m02-test-token'',''test'')','23505'),
    ('invalid order total', format('update public.orders set grand_total=1 where id=%L',o),'23514'),
    ('negative discount', format('update public.orders set discount_total=-1 where id=%L',o),'23514'),
    ('invalid line total', format('insert into public.order_items(order_id,sku,product_name,variant_name,unit_price,quantity,line_total) values (%L,''T'',''T'',''T'',10,2,1)',o),'23514'),
    ('zero order quantity', format('insert into public.order_items(order_id,sku,product_name,variant_name,unit_price,quantity,line_total) values (%L,''T'',''T'',''T'',10,0,0)',o),'23514'),
    ('snapshot update', format('update public.order_items set product_name=''changed'' where id=%L',item),'23514'),
    ('snapshot delete', format('delete from public.order_items where id=%L',item),'23514'),
    ('duplicate webhook', 'insert into public.webhook_events values (''m02-test-event'',''test'',now())','23505'),
    ('invalid discount dates', 'insert into public.discounts(code,type,value,starts_at,ends_at) values (''M02-BAD'',''test'',1,''2026-02-01'',''2026-01-01'')','23514'),
    ('invalid usage limit', 'insert into public.discounts(code,type,value,usage_limit) values (''M02-BAD'',''test'',1,0)','23514')
  ) as t(label,statement,expected_state)
  loop
    caught := false;
    begin
      execute test.statement;
    exception when others then
      if sqlstate <> test.expected_state then
        raise exception 'Test % expected %, got %: %',test.label,test.expected_state,sqlstate,sqlerrm;
      end if;
      caught := true;
    end;
    if not caught then raise exception 'Invalid data accepted: %',test.label; end if;
  end loop;

  update public.products set name='Changed catalog name' where id=p;
  update public.product_variants set price=99, title='Changed variant' where id=v;
  if not exists (select 1 from public.order_items where id=item and product_name='Original product' and variant_name='Original variant' and unit_price=10 and line_total=20) then
    raise exception 'Catalog mutation changed order snapshot';
  end if;
end;
$$;

-- Prove RLS independently of the revoked grants. These grants are rolled back.
grant select, insert on all tables in schema public to anon, authenticated;
set local role anon;
do $$
declare
  t text;
  row_count bigint;
begin
  foreach t in array array[
    'profiles','products','product_variants','product_images','categories',
    'product_categories','inventory','carts','cart_items','addresses',
    'orders','order_items','discounts','webhook_events'
  ] loop
    execute format('select count(*) from public.%I',t) into row_count;
    if row_count <> 0 then raise exception 'Anonymous RLS leak: %',t; end if;
  end loop;
  begin
    insert into public.products(slug,name,status) values ('m02-rls-attempt','forbidden','active');
    raise exception 'Anonymous write allowed';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

set local role authenticated;
do $$
declare
  t text;
  row_count bigint;
begin
  foreach t in array array[
    'profiles','products','product_variants','product_images','categories',
    'product_categories','inventory','carts','cart_items','addresses',
    'orders','order_items','discounts','webhook_events'
  ] loop
    execute format('select count(*) from public.%I',t) into row_count;
    if row_count <> 0 then raise exception 'Authenticated RLS leak: %',t; end if;
  end loop;
  begin
    insert into public.products(slug,name,status) values ('m02-rls-attempt','forbidden','active');
    raise exception 'Authenticated write allowed';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
rollback;
select 'PASS: schema, constraints, snapshots, grants and default-deny RLS' as result;
