-- M06-P01 approved cart boundary. Reuse existing tables/fields only.
-- Tokens are 256-bit random values; only SHA-256 hashes are stored.
create function private.cart_guest_hash()
returns text language sql stable security invoker set search_path = ''
as $$
  select case when auth.uid() is null and token ~ '^[0-9a-f]{64}$'
    then encode(sha256(convert_to(token, 'UTF8')), 'hex') end
  from (select nullif(current_setting('request.headers', true), '')::jsonb ->> 'x-cart-token' as token) h;
$$;
revoke all on function private.cart_guest_hash() from public, anon, authenticated;
grant execute on function private.cart_guest_hash() to anon, authenticated;

-- Table writes must not bypass authoritative checks or atomic increments.
revoke all on public.carts, public.cart_items from anon, authenticated;
revoke update (status, updated_at) on public.carts from authenticated;
drop policy carts_own on public.carts;
drop policy cart_items_own on public.cart_items;
grant select (id, user_id, status, updated_at) on public.carts to anon, authenticated;
grant select on public.cart_items to anon, authenticated;
create policy carts_owner_read on public.carts for select to anon, authenticated
using (
  (user_id = (select auth.uid()) and guest_token is null)
  or ((select auth.uid()) is null and user_id is null
    and guest_token = (select private.cart_guest_hash()))
);
create policy cart_items_owner_read on public.cart_items for select to anon, authenticated
using (exists (select 1 from public.carts c where c.id = cart_id));
create unique index carts_active_user_unique on public.carts(user_id)
where user_id is not null and status = 'active';

-- Private routines re-check identity themselves because privileged stock reads
-- cannot rely on the caller's inventory RLS. No cart/owner ID is accepted.
create function private.read_cart()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  guest_hash text := private.cart_guest_hash();
  owned_cart uuid;
  result jsonb;
begin
  if actor is null and guest_hash is null then
    return jsonb_build_object('id', null, 'items', '[]'::jsonb, 'subtotal', '0');
  end if;
  select c.id into owned_cart from public.carts c
  where c.status = 'active' and
    ((actor is not null and c.user_id = actor and c.guest_token is null)
      or (actor is null and c.user_id is null and c.guest_token = guest_hash));
  select jsonb_build_object(
    'id', owned_cart,
    'items', coalesce(jsonb_agg(jsonb_build_object(
      'variantId', v.id,
      'productSlug', case when p.status = 'active' and v.active then p.slug end,
      'productName', case when p.status = 'active' and v.active then p.name else 'Unavailable product' end,
      'variantName', case when p.status = 'active' and v.active then v.title else 'Unavailable option' end,
      'quantity', ci.quantity,
      'unitPrice', case when p.status = 'active' and v.active then v.price::text end,
      'lineTotal', case when p.status = 'active' and v.active then (v.price * ci.quantity)::text end,
      'available', p.status = 'active' and v.active and coalesce(i.quantity_on_hand, 0) > 0,
      'quantityValid', p.status = 'active' and v.active and coalesce(i.quantity_on_hand, 0) >= ci.quantity
    ) order by ci.id), '[]'::jsonb),
    'subtotal', coalesce(sum(case when p.status = 'active' and v.active then v.price * ci.quantity else 0 end), 0)::text
  ) into result
  from public.cart_items ci
  join public.product_variants v on v.id = ci.variant_id
  join public.products p on p.id = v.product_id
  left join public.inventory i on i.variant_id = v.id
  where ci.cart_id = owned_cart;
  return result;
end;
$$;
revoke all on function private.read_cart() from public, anon, authenticated;
grant execute on function private.read_cart() to anon, authenticated;

create function private.mutate_cart(operation text, variant_id uuid, quantity integer default null)
returns jsonb language plpgsql volatile security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  guest_hash text := private.cart_guest_hash();
  owned_cart uuid;
  current_quantity integer;
  next_quantity bigint;
  stock integer;
begin
  if actor is null and guest_hash is null then
    raise exception 'Cart identity required.' using errcode = '28000';
  end if;
  if operation is null or operation not in ('add', 'set', 'remove') or variant_id is null
    or (operation in ('add', 'set') and (quantity is null or quantity <= 0))
    or (operation = 'remove' and quantity is not null) then
    raise exception 'Invalid cart request.' using errcode = '22023';
  end if;
  -- Serialize first-cart creation and all mutations for this actor. Hash
  -- collisions only serialize unrelated requests; they do not confer ownership.
  perform pg_advisory_xact_lock(hashtextextended(
    case when actor is not null then 'cart:user:' || actor::text else 'cart:guest:' || guest_hash end, 0));
  select c.id into owned_cart from public.carts c
  where c.status = 'active' and
    ((actor is not null and c.user_id = actor and c.guest_token is null)
      or (actor is null and c.user_id is null and c.guest_token = guest_hash))
  for update;
  if operation = 'remove' then
    delete from public.cart_items ci where ci.cart_id = owned_cart and ci.variant_id = mutate_cart.variant_id;
  else
    -- Locks protect validation during this mutation; the cart reserves no stock.
    perform v.id
    from public.product_variants v join public.products p on p.id = v.product_id
    where v.id = mutate_cart.variant_id and v.active and p.status = 'active'
    for share of v, p;
    if not found then
      raise exception 'This option is unavailable.' using errcode = '22023';
    end if;
    select i.quantity_on_hand into stock from public.inventory i
    where i.variant_id = mutate_cart.variant_id for share;
    select ci.quantity into current_quantity from public.cart_items ci
    where ci.cart_id = owned_cart and ci.variant_id = mutate_cart.variant_id;
    if operation = 'set' and current_quantity is null then
      raise exception 'Cart item was not found.' using errcode = '22023';
    end if;
    next_quantity := case when operation = 'add' then coalesce(current_quantity, 0)::bigint + quantity else quantity end;
    if stock is null or next_quantity > stock then
      raise exception 'Requested quantity is unavailable.' using errcode = '22023';
    end if;
    if owned_cart is null then
      insert into public.carts(user_id, guest_token, status)
      values (actor, case when actor is null then guest_hash end, 'active') returning id into owned_cart;
    end if;
    if current_quantity is null then
      insert into public.cart_items(cart_id, variant_id, quantity)
      values (owned_cart, mutate_cart.variant_id, next_quantity::integer);
    else
      update public.cart_items ci set quantity = next_quantity::integer
      where ci.cart_id = owned_cart and ci.variant_id = mutate_cart.variant_id;
    end if;
  end if;
  update public.carts set updated_at = now() where id = owned_cart;
  return private.read_cart();
end;
$$;
revoke all on function private.mutate_cart(text, uuid, integer) from public, anon, authenticated;
grant execute on function private.mutate_cart(text, uuid, integer) to anon, authenticated;

-- SQL-standard bodies bind private references at creation time, like views.
-- The private schema stays unexposed and has no caller USAGE grant.
create function public.read_cart()
returns jsonb language sql stable security invoker set search_path = ''
begin atomic
  select private.read_cart();
end;
create function public.mutate_cart(operation text, variant_id uuid, quantity integer default null)
returns jsonb language sql volatile security invoker set search_path = ''
begin atomic
  select private.mutate_cart(operation, variant_id, quantity);
end;
revoke all on function public.read_cart() from public, anon, authenticated;
revoke all on function public.mutate_cart(text, uuid, integer) from public, anon, authenticated;
grant execute on function public.read_cart() to anon, authenticated;
grant execute on function public.mutate_cart(text, uuid, integer) to anon, authenticated;
