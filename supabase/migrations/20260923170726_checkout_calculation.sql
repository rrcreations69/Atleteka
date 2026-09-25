-- M07-P01: quote-time discount availability, no redemption or payment writes.
alter table public.discounts add column redemption_count integer not null default 0
  check (redemption_count >= 0);
-- Table-wide grants would permit counter writes even with RLS.
revoke insert, update on public.discounts from authenticated;
grant insert (id, code, type, value, active, starts_at, ends_at, usage_limit)
  on public.discounts to authenticated;
grant update (code, type, value, active, starts_at, ends_at, usage_limit)
  on public.discounts to authenticated;

create function private.checkout_quote(coupon_code text default null)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  cart jsonb;
  item jsonb;
  subtotal numeric;
  reduction numeric := 0;
  normalized_code text := nullif(btrim(coupon_code), '');
  coupon public.discounts%rowtype;
begin
  if auth.uid() is null and private.cart_guest_hash() is null then
    raise exception 'Cart identity required.' using errcode = '28000';
  end if;
  cart := private.read_cart();
  if jsonb_array_length(cart->'items') = 0 then
    raise exception 'Empty cart.' using errcode = 'P7001';
  end if;
  -- All reads use the calling statement snapshot; no stock or coupon reservation.
  for item in select value from jsonb_array_elements(cart->'items') loop
    if not (item->>'available')::boolean or not (item->>'quantityValid')::boolean
      or (item->>'quantity')::integer <= 0 then
      raise exception 'Cart availability changed.' using errcode = 'P7002';
    end if;
    if (item->>'unitPrice')::numeric <> round((item->>'unitPrice')::numeric, 2) then
      raise exception 'Unsupported price precision.' using errcode = 'P7004';
    end if;
  end loop;
  subtotal := (cart->>'subtotal')::numeric;
  if normalized_code is not null then
    if length(normalized_code) > 100 then
      raise exception 'Invalid coupon.' using errcode = 'P7003';
    end if;
    select * into coupon from public.discounts d where d.code = normalized_code;
    if not found or not coupon.active
      or (coupon.starts_at is not null and coupon.starts_at > statement_timestamp())
      or (coupon.ends_at is not null and coupon.ends_at <= statement_timestamp())
      or (coupon.usage_limit is not null and coupon.redemption_count >= coupon.usage_limit)
      or coupon.type not in ('fixed', 'percentage')
      or (coupon.type = 'percentage' and coupon.value > 100)
      or (coupon.type = 'fixed' and coupon.value <> round(coupon.value, 2)) then
      raise exception 'Invalid coupon.' using errcode = 'P7003';
    end if;
    reduction := least(subtotal, case when coupon.type = 'fixed' then coupon.value
      else round(subtotal * coupon.value / 100, 2) end);
  end if;
  return jsonb_build_object(
    'cart', cart, 'currency', 'PHP', 'couponCode', normalized_code,
    'subtotal', subtotal::text, 'discountTotal', reduction::text,
    'merchandiseTotal', (subtotal - reduction)::text,
    'taxIncluded', true, 'shippingTotal', null, 'grandTotal', null
  );
end;
$$;
revoke all on function private.checkout_quote(text) from public, anon, authenticated;
grant execute on function private.checkout_quote(text) to anon, authenticated;
create function public.checkout_quote(coupon_code text default null)
returns jsonb language sql stable security invoker set search_path = ''
begin atomic
  select private.checkout_quote(coupon_code);
end;
revoke all on function public.checkout_quote(text) from public, anon, authenticated;
grant execute on function public.checkout_quote(text) to anon, authenticated;
