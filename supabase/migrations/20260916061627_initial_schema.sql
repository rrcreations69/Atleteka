-- M02: PRD 05_DATA_MODEL rows 4-17. Application access remains closed until M03.
-- Monetary values are exact decimal amounts; currency/rounding/business states
-- are not chosen here. No payment, stock adjustment or Auth workflow is implemented.

create table public.profiles (
  id uuid primary key references auth.users(id),
  display_name text not null default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (btrim(slug) <> ''),
  name text not null check (btrim(name) <> ''),
  description text not null default '',
  status text not null check (btrim(status) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  sku text not null unique check (btrim(sku) <> ''),
  title text not null check (btrim(title) <> ''),
  price numeric not null check (price >= 0 and price < 'Infinity'::numeric),
  active boolean not null default false
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id),
  storage_path text not null check (btrim(storage_path) <> ''),
  alt_text text not null,
  sort_order integer not null default 0 check (sort_order >= 0)
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (btrim(slug) <> ''),
  name text not null check (btrim(name) <> ''),
  active boolean not null default false
);

create table public.product_categories (
  product_id uuid not null references public.products(id),
  category_id uuid not null references public.categories(id),
  primary key (product_id, category_id)
);

create table public.inventory (
  variant_id uuid primary key references public.product_variants(id),
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0)
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  guest_token text unique check (btrim(guest_token) <> ''),
  status text not null check (btrim(status) <> ''),
  updated_at timestamptz not null default now(),
  constraint carts_one_owner check (num_nonnulls(user_id, guest_token) = 1)
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id),
  variant_id uuid not null references public.product_variants(id),
  quantity integer not null check (quantity > 0),
  unique (cart_id, variant_id)
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  name text not null check (btrim(name) <> ''),
  line1 text not null check (btrim(line1) <> ''),
  line2 text,
  city text not null check (btrim(city) <> ''),
  region text not null,
  postal_code text not null,
  country text not null check (btrim(country) <> '')
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  email text not null check (btrim(email) <> ''),
  status text not null check (btrim(status) <> ''),
  payment_status text not null check (btrim(payment_status) <> ''),
  subtotal numeric not null check (subtotal >= 0 and subtotal < 'Infinity'::numeric),
  discount_total numeric not null check (discount_total >= 0 and discount_total < 'Infinity'::numeric),
  shipping_total numeric not null check (shipping_total >= 0 and shipping_total < 'Infinity'::numeric),
  tax_total numeric not null check (tax_total >= 0 and tax_total < 'Infinity'::numeric),
  grand_total numeric not null check (grand_total >= 0 and grand_total < 'Infinity'::numeric),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  created_at timestamptz not null default now(),
  constraint orders_total_matches_parts check (
    grand_total = subtotal - discount_total + shipping_total + tax_total
  )
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id),
  variant_id uuid references public.product_variants(id),
  sku text not null check (btrim(sku) <> ''),
  product_name text not null check (btrim(product_name) <> ''),
  variant_name text not null check (btrim(variant_name) <> ''),
  unit_price numeric not null check (unit_price >= 0 and unit_price < 'Infinity'::numeric),
  quantity integer not null check (quantity > 0),
  line_total numeric not null check (line_total >= 0 and line_total < 'Infinity'::numeric),
  constraint order_items_total_matches_quantity check (line_total = unit_price * quantity)
);

create table public.discounts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (btrim(code) <> ''),
  type text not null check (btrim(type) <> ''),
  value numeric not null check (value >= 0 and value < 'Infinity'::numeric),
  active boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer check (usage_limit > 0),
  constraint discounts_dates_ordered check (
    starts_at is null or ends_at is null or starts_at <= ends_at
  )
);

create table public.webhook_events (
  provider_event_id text primary key check (btrim(provider_event_id) <> ''),
  type text not null check (btrim(type) <> ''),
  processed_at timestamptz not null
);

-- Index foreign keys not already covered by a primary/unique index.
create index product_variants_product_id_idx on public.product_variants(product_id);
create index product_images_product_id_idx on public.product_images(product_id);
create index product_categories_category_id_idx on public.product_categories(category_id);
create index carts_user_id_idx on public.carts(user_id);
create index cart_items_variant_id_idx on public.cart_items(variant_id);
create index addresses_user_id_idx on public.addresses(user_id);
create index orders_user_id_idx on public.orders(user_id);
create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_variant_id_idx on public.order_items(variant_id);

-- Preserve the PRD's immutable order line snapshots at the database boundary.
create function public.prevent_order_item_changes()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Order item snapshots are immutable' using errcode = '23514';
end;
$$;

revoke all on function public.prevent_order_item_changes() from public, anon, authenticated;
create trigger order_items_immutable
before update or delete on public.order_items
for each row execute function public.prevent_order_item_changes();

-- RLS is enabled immediately; M03 will add deliberate access policies/grants.
-- Do not add public catalog policies, Auth triggers, guest token access or admin
-- helpers here. The trusted database/service path can operate on the schema.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'products', 'product_variants', 'product_images', 'categories',
    'product_categories', 'inventory', 'carts', 'cart_items', 'addresses',
    'orders', 'order_items', 'discounts', 'webhook_events'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from public, anon, authenticated, service_role', table_name);
    execute format('grant select, insert, update, delete on table public.%I to service_role', table_name);
  end loop;
end;
$$;
