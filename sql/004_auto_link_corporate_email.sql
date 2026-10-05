-- 004_auto_link_corporate_email.sql
-- Run in Supabase SQL Editor as postgres/service_role
-- Automatically links any user logging in with corporate email (@kkpfg.com) to team_members

-- 1. Update functions to check both auth_user_id AND email
create or replace function public.current_member_id() returns uuid language sql stable security definer set search_path = public as $$
  select id from public.team_members 
  where (auth_user_id = auth.uid() or lower(email) = lower(coalesce(auth.jwt()->>'email', '')))
    and is_active = true 
  limit 1;
$$;

create or replace function public.current_member_role() returns text language sql stable security definer set search_path = public as $$
  select role from public.team_members 
  where (auth_user_id = auth.uid() or lower(email) = lower(coalesce(auth.jwt()->>'email', '')))
    and is_active = true 
  limit 1;
$$;

create or replace function public.is_team_member() returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.team_members 
    where (auth_user_id = auth.uid() or lower(email) = lower(coalesce(auth.jwt()->>'email', '')))
      and is_active = true
  );
$$;

-- 2. Auto-link any existing users in auth.users right now
update public.team_members m
set auth_user_id = u.id, updated_at = now()
from auth.users u
where lower(m.email) = lower(u.email) and (m.auth_user_id is null or m.auth_user_id <> u.id);

-- 3. Create a trigger so future logins automatically link auth_user_id
create or replace function public.handle_user_auth_link()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.team_members
  set auth_user_id = new.id, updated_at = now()
  where lower(email) = lower(new.email) and (auth_user_id is null or auth_user_id <> new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute function public.handle_user_auth_link();
