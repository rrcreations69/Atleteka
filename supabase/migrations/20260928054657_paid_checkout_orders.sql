-- M09-P01: orders from verified PayMongo payments. Hosted orders were empty before this migration.

-- B: provider-neutral payment references (PayMongo per M08-P01).
alter table public.orders rename column stripe_checkout_session_id to payment_session_id;
alter table public.orders rename column stripe_payment_intent_id to payment_id;

-- A: immutable delivery address snapshot taken at payment time.
alter table public.orders add column shipping_address jsonb not null
  check (
    jsonb_typeof(shipping_address) = 'object'
    and shipping_address ?& array['name', 'line1', 'city', 'region', 'postal_code', 'country']
  );

-- C: M09 only creates paid orders; M12 extends fulfillment states.
alter table public.orders add constraint orders_payment_status_known check (payment_status in ('paid'));
alter table public.orders add constraint orders_status_known check (status in ('unfulfilled', 'needs_review'));

-- F: shipping is paid to the courier and tax is included in prices, so neither is collected separately.
comment on column public.orders.shipping_total is 'Shipping collected online. 0: the customer pays the courier on delivery (M08-P01).';
comment on column public.orders.tax_total is 'Tax collected separately. 0: tax is included in item prices (M07-P01).';

/*
  Records one verified paid checkout atomically. Callers must have verified the webhook signature and
  re-read the session from PayMongo. Duplicate events and repeated sessions return the existing order.
  D: insufficient stock records the paid order as needs_review without deducting anything.
  E: a coupon past its limit (or missing) is still honored, counted, and flagged needs_review.
*/
create function public.record_paid_checkout(
  p_event_id text, p_event_type text, p_session_id text, p_payment_ref text, p_customer_email text,
  p_customer_id uuid, p_cart_ref uuid, p_coupon_code text, p_lines jsonb,
  p_subtotal numeric, p_discount_total numeric, p_amount_paid numeric, p_address jsonb
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  existing uuid;
  new_order uuid;
  line jsonb;
  short_stock boolean := false;
  coupon_ok boolean := true;
  line_sum numeric := 0;
  review boolean;
begin
  if btrim(coalesce(p_event_id, '')) = '' or btrim(coalesce(p_session_id, '')) = '' then
    raise exception 'Event and session are required.' using errcode = '22023';
  end if;
  if jsonb_typeof(p_lines) <> 'array' or jsonb_array_length(p_lines) = 0 then
    raise exception 'Order lines are required.' using errcode = '22023';
  end if;

  insert into public.webhook_events (provider_event_id, type, processed_at)
  values (p_event_id, p_event_type, statement_timestamp())
  on conflict (provider_event_id) do nothing;
  if not found then
    select o.id into existing from public.orders o where o.payment_session_id = p_session_id;
    return jsonb_build_object('orderId', existing, 'duplicate', true);
  end if;

  -- A different event for an already recorded session (e.g. a resend) is also a no-op.
  select o.id into existing from public.orders o where o.payment_session_id = p_session_id;
  if existing is not null then
    return jsonb_build_object('orderId', existing, 'duplicate', true);
  end if;

  for line in select value from jsonb_array_elements(p_lines) loop
    if (line->>'quantity')::integer <= 0 or (line->>'unitPrice')::numeric < 0 then
      raise exception 'Invalid order line.' using errcode = '22023';
    end if;
    line_sum := line_sum + (line->>'unitPrice')::numeric * (line->>'quantity')::integer;
  end loop;
  -- Totals come from our own signed session metadata and PayMongo's paid amount; they must reconcile.
  if line_sum <> p_subtotal or p_subtotal - p_discount_total <> p_amount_paid or p_discount_total < 0 then
    raise exception 'Paid amount does not reconcile.' using errcode = 'P7101';
  end if;

  -- Lock stock rows in a stable order before checking, so concurrent payments cannot both pass.
  perform 1 from public.inventory i
  where i.variant_id in (select (l->>'variantId')::uuid from jsonb_array_elements(p_lines) l)
  order by i.variant_id for update;
  select exists (
    select 1 from jsonb_array_elements(p_lines) l
    left join public.inventory i on i.variant_id = (l->>'variantId')::uuid
    where coalesce(i.quantity_on_hand, 0) < (l->>'quantity')::integer
  ) into short_stock;

  if nullif(btrim(p_coupon_code), '') is not null then
    update public.discounts d set redemption_count = d.redemption_count + 1
    where d.code = p_coupon_code
    returning d.usage_limit is null or d.redemption_count <= d.usage_limit into coupon_ok;
    coupon_ok := coalesce(coupon_ok, false);
  end if;
  review := short_stock or not coupon_ok;

  insert into public.orders (
    user_id, email, status, payment_status, subtotal, discount_total, shipping_total, tax_total,
    grand_total, currency, payment_session_id, payment_id, shipping_address
  ) values (
    p_customer_id, p_customer_email, case when review then 'needs_review' else 'unfulfilled' end, 'paid',
    p_subtotal, p_discount_total, 0, 0, p_amount_paid, 'PHP', p_session_id, nullif(p_payment_ref, ''), p_address
  ) returning id into new_order;

  -- Snapshot names and SKU as they are now; price and quantity are what was charged.
  insert into public.order_items (order_id, variant_id, sku, product_name, variant_name, unit_price, quantity, line_total)
  select new_order, v.id, v.sku, p.name, v.title, (l->>'unitPrice')::numeric, (l->>'quantity')::integer,
    (l->>'unitPrice')::numeric * (l->>'quantity')::integer
  from jsonb_array_elements(p_lines) l
  join public.product_variants v on v.id = (l->>'variantId')::uuid
  join public.products p on p.id = v.product_id;
  if (select count(*) from public.order_items oi where oi.order_id = new_order) <> jsonb_array_length(p_lines) then
    raise exception 'Unknown variant in order.' using errcode = 'P7102';
  end if;

  if not short_stock then
    update public.inventory i set quantity_on_hand = i.quantity_on_hand - (l->>'quantity')::integer
    from jsonb_array_elements(p_lines) l where i.variant_id = (l->>'variantId')::uuid;
  end if;

  -- Purchased lines leave the cart; anything added afterwards stays.
  delete from public.cart_items ci
  using jsonb_array_elements(p_lines) l
  where ci.cart_id = p_cart_ref and ci.variant_id = (l->>'variantId')::uuid;

  return jsonb_build_object('orderId', new_order, 'duplicate', false, 'needsReview', review);
end;
$$;

revoke all on function public.record_paid_checkout(text, text, text, text, text, uuid, uuid, text, jsonb, numeric, numeric, numeric, jsonb)
  from public, anon, authenticated;
grant execute on function public.record_paid_checkout(text, text, text, text, text, uuid, uuid, text, jsonb, numeric, numeric, numeric, jsonb)
  to service_role;
