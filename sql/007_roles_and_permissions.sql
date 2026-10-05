-- 007_roles_and_permissions.sql
-- Role-Based Access Control (RBAC):
-- 1. 'supervisor' / 'admin' - Team Head of Visual & Design
-- 2. 'designer' - Visual & Design Team Member
-- 3. 'requester' - ผู้ขอรับบริการ (Non-design team / General KKP Employee)
-- 4. 'viewer' - ผู้เข้าชม (Read-only)

-- 1. Update check constraint on team_members.role and capacity_points
alter table public.team_members drop constraint if exists team_members_role_check;
alter table public.team_members add constraint team_members_role_check
  check (role in ('designer', 'supervisor', 'admin', 'requester', 'viewer'));

alter table public.team_members drop constraint if exists team_members_capacity_points_check;
alter table public.team_members add constraint team_members_capacity_points_check
  check (capacity_points >= 0 and capacity_points <= 100);

-- 2. Update existing non-team members (such as dechathon.motn@kkpfg.com) to 'requester'
update public.team_members
set role = 'requester',
    capacity_points = 0,
    updated_at = now()
where lower(email) = 'dechathon.motn@kkpfg.com';

-- 3. Ensure the 6 core design team members have 'designer' role
update public.team_members
set role = 'designer',
    capacity_points = coalesce(nullif(capacity_points, 0), 10),
    updated_at = now()
where lower(email) in (
  'pisit.sin@kkpfg.com',
  'yutiporn.tho@kkpfg.com',
  'porntipa.jai@kkpfg.com',
  'naraporn.leu@kkpfg.com',
  'peerapisit.roja@kkpfg.com',
  'pongsathorn.pang@kkpfg.com'
);

-- Ensure supervisor role for team head
update public.team_members
set role = 'supervisor',
    updated_at = now()
where lower(email) = 'beemkung2922@gmail.com';

-- 4. Helper functions for role checks
create or replace function public.is_designer()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_member_role() in ('designer', 'supervisor', 'admin');
$$;

create or replace function public.is_requester()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_member_role() = 'requester';
$$;

create or replace function public.is_viewer()
returns boolean language sql stable security definer set search_path = public as $$
  select public.current_member_role() = 'viewer';
$$;

grant execute on function public.is_designer() to anon, authenticated;
grant execute on function public.is_requester() to anon, authenticated;
grant execute on function public.is_viewer() to anon, authenticated;

-- 5. Update auth trigger to classify new users automatically:
-- Core designers -> 'designer'
-- Anyone else -> 'requester'
create or replace function public.handle_user_auth_link()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_member_id uuid;
  v_is_core_designer boolean;
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
    -- Check if this email is one of the 6 core designers
    v_is_core_designer := lower(new.email) in (
      'pisit.sin@kkpfg.com',
      'yutiporn.tho@kkpfg.com',
      'porntipa.jai@kkpfg.com',
      'naraporn.leu@kkpfg.com',
      'peerapisit.roja@kkpfg.com',
      'pongsathorn.pang@kkpfg.com'
    );

    if v_is_core_designer then
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
    else
      -- Anyone else gets 'requester' role with 0 capacity points
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
        'requester',
        new.id,
        0,
        true
      );
    end if;
  end if;

  return new;
end;
$$;

-- 6. Update RLS policies to allow requesters to submit briefs & revisions
drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks
  for insert to authenticated
  with check (
    public.is_manager()
    or public.is_designer()
    or (public.is_requester() and created_by = public.current_member_id())
  );

drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks
  for update to authenticated
  using (
    public.is_manager()
    or (public.is_designer() and assignee_id = public.current_member_id())
    or (public.is_requester() and created_by = public.current_member_id() and status = 'brief')
  )
  with check (
    public.is_manager()
    or (public.is_designer() and assignee_id = public.current_member_id())
    or (public.is_requester() and created_by = public.current_member_id() and status = 'brief')
  );

drop policy if exists revisions_insert on public.revisions;
create policy revisions_insert on public.revisions
  for insert to authenticated
  with check (
    requested_by = public.current_member_id()
    and (public.is_manager() or public.is_designer() or public.is_requester())
  );
