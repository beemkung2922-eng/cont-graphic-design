-- 005_auto_enroll_and_roles.sql
-- Run in Supabase SQL Editor or via Management API

-- 1. Helper function: format display name from email (e.g. pongsathorn.pang@kkpfg.com -> Pongsathorn Pang)
create or replace function public.format_name_from_email(p_email text)
returns text language plpgsql immutable as $$
declare
  local_part text;
  part text;
  formatted text := '';
begin
  local_part := split_part(lower(p_email), '@', 1);
  local_part := replace(replace(local_part, '_', '.'), '-', '.');
  for part in select unnest(string_to_array(local_part, '.'))
  loop
    if length(part) > 0 then
      formatted := formatted || ' ' || initcap(part);
    end if;
  end loop;
  return trim(formatted);
end;
$$;

-- 2. Update existing pongsathorn.pang@kkpfg.com:
-- Name: 'Pongsathorn Pang' (gives initials PP)
-- Role: 'designer' (Visual & Design, NOT admin)
update public.team_members
set name = 'Pongsathorn Pang',
    role = 'designer',
    updated_at = now()
where lower(email) = 'pongsathorn.pang@kkpfg.com';

-- Ensure beemkung2922@gmail.com is supervisor (Team Head of Visual & Design)
update public.team_members
set role = 'supervisor',
    updated_at = now()
where lower(email) = 'beemkung2922@gmail.com';

-- 3. Update the auth trigger so any user logging in with corporate email (@kkpfg.com)
-- is automatically enrolled into team_members if not present yet!
create or replace function public.handle_user_auth_link()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_member_id uuid;
begin
  -- Check if member already exists by email
  select id into v_member_id
  from public.team_members
  where lower(email) = lower(new.email)
  limit 1;

  if v_member_id is not null then
    -- Link auth_user_id
    update public.team_members
    set auth_user_id = new.id, updated_at = now()
    where id = v_member_id;
  else
    -- If corporate email domain, auto-create as designer (Visual & Design)
    if lower(new.email) like '%@kkpfg.com' then
      insert into public.team_members (
        name,
        email,
        role,
        auth_user_id,
        capacity_points,
        is_active
      ) values (
        public.format_name_from_email(new.email),
        lower(new.email),
        'designer',
        new.id,
        10,
        true
      );
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute function public.handle_user_auth_link();

-- 4. Allow managers/supervisors (Team Head of Visual & Design) to manage team_members
drop policy if exists team_members_manage on public.team_members;
create policy team_members_manage on public.team_members
  for all to authenticated
  using (public.is_manager())
  with check (public.is_manager());
