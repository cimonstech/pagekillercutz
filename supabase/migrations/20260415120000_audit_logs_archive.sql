alter table audit_logs
  add column if not exists archived boolean not null default false;

alter table audit_logs
  add column if not exists archived_at timestamptz;

alter table audit_logs
  add column if not exists archived_by text;
