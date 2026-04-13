-- Allow authenticated users to read their own admins row (needed for admin login UI).
-- Without this, only service_role can SELECT admins, so client-side post-login check always fails.
drop policy if exists "admins_self_read_by_email" on admins;
create policy "admins_self_read_by_email"
  on admins for select
  to authenticated
  using (
  lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
);
