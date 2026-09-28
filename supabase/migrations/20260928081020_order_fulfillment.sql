-- M12-P01: admin order fulfillment with an audit trail. Payment state is never changed here.

alter table public.orders drop constraint orders_status_known;
alter table public.orders add constraint orders_status_known
  check (status in ('needs_review', 'unfulfilled', 'shipped', 'delivered', 'cancelled'));

alter table public.orders
  add column courier text check (courier is null or (btrim(courier) <> '' and length(courier) <= 80)),
  add column tracking_number text check (tracking_number is null or (btrim(tracking_number) <> '' and length(tracking_number) <= 100)),
  add column status_updated_at timestamptz,
  add column status_updated_by uuid references auth.users(id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  from_status text not null,
  to_status text not null,
  courier text,
  tracking_number text,
  changed_by uuid not null references auth.users(id),
  changed_at timestamptz not null default now()
);
create index order_status_history_order_id_idx on public.order_status_history(order_id);
create index order_status_history_changed_by_idx on public.order_status_history(changed_by);
create index orders_status_updated_by_idx on public.orders(status_updated_by);

alter table public.order_status_history enable row level security;
revoke all on public.order_status_history from public, anon, authenticated;
grant select on public.order_status_history to authenticated;
grant select, insert on public.order_status_history to service_role;
create policy order_status_history_admin_read on public.order_status_history for select to authenticated
  using ((select role = 'admin' from public.profiles where id = (select auth.uid())));

/*
  The only write path for fulfillment. Re-checks the admin role and the allowed step here, not in the app.
  Touches status, courier, tracking and the audit fields only; payment_status and amounts are out of reach.
*/
create function public.admin_update_order_status(
  p_order_id uuid, p_status text, p_courier text default null, p_tracking_number text default null
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  actor uuid := auth.uid();
  current_status text;
  courier_value text := nullif(btrim(coalesce(p_courier, '')), '');
  tracking_value text := nullif(btrim(coalesce(p_tracking_number, '')), '');
begin
  if actor is null or not coalesce((select p.role = 'admin' from public.profiles p where p.id = actor), false) then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;
  select o.status into current_status from public.orders o where o.id = p_order_id for update;
  if not found then
    raise exception 'Order not found.' using errcode = 'P7201';
  end if;
  if not (
    (current_status = 'needs_review' and p_status in ('unfulfilled', 'cancelled'))
    or (current_status = 'unfulfilled' and p_status in ('shipped', 'cancelled'))
    or (current_status = 'shipped' and p_status = 'delivered')
  ) then
    raise exception 'That status change is not allowed.' using errcode = 'P7202';
  end if;
  if p_status <> 'shipped' and (courier_value is not null or tracking_value is not null) then
    raise exception 'Courier and tracking apply only when shipping.' using errcode = 'P7203';
  end if;

  update public.orders o set
    status = p_status,
    courier = case when p_status = 'shipped' then courier_value else o.courier end,
    tracking_number = case when p_status = 'shipped' then tracking_value else o.tracking_number end,
    status_updated_at = statement_timestamp(),
    status_updated_by = actor
  where o.id = p_order_id;

  insert into public.order_status_history (order_id, from_status, to_status, courier, tracking_number, changed_by)
  values (p_order_id, current_status, p_status,
    case when p_status = 'shipped' then courier_value end, case when p_status = 'shipped' then tracking_value end, actor);

  return jsonb_build_object('orderId', p_order_id, 'from', current_status, 'to', p_status);
end;
$$;

revoke all on function public.admin_update_order_status(uuid, text, text, text) from public, anon;
grant execute on function public.admin_update_order_status(uuid, text, text, text) to authenticated;
