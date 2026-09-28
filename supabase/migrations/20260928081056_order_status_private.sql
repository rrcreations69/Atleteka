-- M12-P01: follow the private-definer + public-invoker pattern (as checkout_quote) so no
-- SECURITY DEFINER function sits in the exposed API schema.
alter function public.admin_update_order_status(uuid, text, text, text) set schema private;
revoke all on function private.admin_update_order_status(uuid, text, text, text) from public, anon, authenticated;
grant execute on function private.admin_update_order_status(uuid, text, text, text) to authenticated;

-- SQL-standard bodies bind private references at creation time; the private schema stays unexposed.
create function public.admin_update_order_status(
  p_order_id uuid, p_status text, p_courier text default null, p_tracking_number text default null
)
returns jsonb language sql volatile security invoker set search_path = ''
begin atomic
  select private.admin_update_order_status(p_order_id, p_status, p_courier, p_tracking_number);
end;
revoke all on function public.admin_update_order_status(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.admin_update_order_status(uuid, text, text, text) to authenticated;
