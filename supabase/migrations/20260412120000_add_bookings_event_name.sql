-- Run on existing databases (idempotent)
alter table bookings add column if not exists event_name text;
