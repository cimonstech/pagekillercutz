create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  recipient_email text,
  recipient_phone text,
  channel text not null,
  status text not null default 'pending',
  subject text,
  body text,
  error_message text,
  retry_count int default 0,
  booking_id text,
  order_id text,
  created_at timestamptz default now(),
  sent_at timestamptz,
  failed_at timestamptz
);

create index if not exists notifications_status_idx on notifications(status);
create index if not exists notifications_created_idx on notifications(created_at);

alter table notifications enable row level security;

drop policy if exists "service_role_all" on notifications;
create policy "service_role_all" on notifications
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
