create extension if not exists "pgcrypto";

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  event_id text unique not null,
  client_name text not null,
  client_email text not null,
  client_phone text not null,
  event_type text not null,
  event_date date not null,
  venue text not null,
  guest_count int,
  notes text,
  genres text[] default '{}',
  package_name text,
  status text not null default 'pending'
    check (status in ('pending','confirmed','cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','paid')),
  created_at timestamptz default now()
);

create table if not exists playlists (
  id uuid primary key default gen_random_uuid(),
  event_id text not null
    references bookings(event_id) on delete cascade,
  genres text[] default '{}',
  vibe text,
  must_play jsonb default '[]',
  do_not_play jsonb default '[]',
  timeline jsonb default '[]',
  extra_notes text,
  locked boolean default false,
  updated_at timestamptz default now()
);
create unique index playlists_event_id_idx
  on playlists(event_id);

create table if not exists packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null,
  inclusions text[] default '{}',
  display_order int default 0,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null,
  category text not null,
  badge text,
  sizes text[] default '{}',
  colours text[] default '{}',
  stock int not null default 0,
  image_url text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  delivery_address text not null,
  region text not null,
  items jsonb not null default '[]',
  total numeric(10,2) not null,
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid','paid')),
  fulfillment_status text not null default 'processing'
    check (fulfillment_status in
      ('processing','shipped','delivered')),
  created_at timestamptz default now()
);

create table if not exists music (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null
    check (type in ('album','single','mix')),
  cover_url text,
  audio_url text,
  duration int,
  tracks jsonb,
  release_date date,
  genre text,
  description text,
  featured boolean default false,
  created_at timestamptz default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_type text not null,
  event_date date not null,
  venue text not null,
  location text not null,
  description text,
  media_urls text[] default '{}',
  video_urls text[] default '{}',
  featured boolean default false,
  created_at timestamptz default now()
);

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null default 'admin'
    check (role in ('admin','super_admin')),
  status text not null default 'active'
    check (status in ('active','suspended')),
  last_login timestamptz,
  created_at timestamptz default now()
);

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text not null,
  actor_role text not null
    check (actor_role in ('admin','super_admin','system')),
  action_type text not null,
  description text not null,
  target_id text,
  ip_address text,
  created_at timestamptz default now()
);

create table if not exists password_resets (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  token text unique not null,
  expires_at timestamptz not null,
  used boolean default false,
  created_at timestamptz default now()
);

create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger playlists_updated_at
  before update on playlists
  for each row
  execute function update_updated_at();

alter table bookings enable row level security;
create policy "bookings_public_read"
  on bookings for select using (true);
create policy "bookings_service_write"
  on bookings for all
  using (auth.role() = 'service_role');

alter table playlists enable row level security;
create policy "playlists_public_read"
  on playlists for select using (true);
create policy "playlists_unlocked_update"
  on playlists for update using (locked = false);
create policy "playlists_service_all"
  on playlists for all
  using (auth.role() = 'service_role');

alter table packages enable row level security;
create policy "packages_public_read"
  on packages for select using (active = true);
create policy "packages_service_write"
  on packages for all
  using (auth.role() = 'service_role');

alter table products enable row level security;
create policy "products_public_read"
  on products for select using (active = true);
create policy "products_service_write"
  on products for all
  using (auth.role() = 'service_role');

alter table orders enable row level security;
create policy "orders_service_all"
  on orders for all
  using (auth.role() = 'service_role');

alter table music enable row level security;
create policy "music_public_read"
  on music for select using (true);
create policy "music_service_write"
  on music for all
  using (auth.role() = 'service_role');

alter table events enable row level security;
create policy "events_public_read"
  on events for select using (true);
create policy "events_service_write"
  on events for all
  using (auth.role() = 'service_role');

alter table admins enable row level security;
create policy "admins_service_all"
  on admins for all
  using (auth.role() = 'service_role');

alter table audit_logs enable row level security;
create policy "audit_logs_service_all"
  on audit_logs for all
  using (auth.role() = 'service_role');

alter table password_resets enable row level security;
create policy "password_resets_service_all"
  on password_resets for all
  using (auth.role() = 'service_role');
