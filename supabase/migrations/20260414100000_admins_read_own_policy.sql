-- Admin portal login reads `admins` with the anon/browser client after sign-in.
-- This policy allows authenticated users to read only their own row (case-insensitive email match).
-- Safe alongside `admins_self_read_by_email` if both exist (Postgres ORs permissive policies).

drop policy if exists "admins_read_own" on admins;

create policy "admins_read_own"
  on admins
  for select
  to authenticated
  using (
    lower(trim(email)) = lower(trim(coalesce(auth.jwt() ->> 'email', '')))
  );

-- If no admin row exists yet, create the Auth user first, then:
-- INSERT INTO admins (email, role, status)
-- VALUES ('cimonstechnologies@gmail.com', 'super_admin', 'active')
-- ON CONFLICT (email) DO UPDATE SET role = excluded.role, status = excluded.status;
