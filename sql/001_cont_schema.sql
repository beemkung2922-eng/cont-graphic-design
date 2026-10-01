-- CONT production schema for Supabase/PostgreSQL
-- Run in Supabase SQL Editor as a database owner.
-- Never place service_role keys in the frontend.

create extension if not exists pgcrypto;

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  name text not null,
  email text not null unique,
  role text not null default 'designer' check (role in ('designer','supervisor','admin')),
  avatar_url text,
  capacity_points integer not null default 10 check (capacity_points > 0 and capacity_points <= 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  client text,
  status text not null default 'active' check (status in ('active','completed','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete restrict,
  title text not null check (length(trim(title)) > 0),
  description text,
  assignee_id uuid not null references public.team_members(id) on delete restrict,
  created_by uuid not null references public.team_members(id) on delete restrict,
  status text not null default 'brief' check (status in ('brief','drafting','review','revision','completed')),
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  deadline date not null,
  workload_points integer not null default 1 check (workload_points between 1 and 20),
  revision_count integer not null default 0 check (revision_count >= 0),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null check (length(trim(title)) > 0),
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.team_members(id) on delete restrict,
  content text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create table if not exists public.revisions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  revision_number integer not null check (revision_number > 0),
  requested_by uuid not null references public.team_members(id) on delete restrict,
  assigned_to uuid not null references public.team_members(id) on delete restrict,
  reason text not null check (length(trim(reason)) > 0),
  status_before text not null check (status_before in ('brief','drafting','review','revision','completed')),
  status_after text not null check (status_after in ('brief','drafting','review','revision','completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (task_id, revision_number)
);

create table if not exists public.task_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid references public.team_members(id) on delete set null,
  from_status text check (from_status is null or from_status in ('brief','drafting','review','revision','completed')),
  to_status text not null check (to_status in ('brief','drafting','review','revision','completed')),
  action text not null default 'status_changed',
  revision_number integer not null default 0,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_assignee on public.tasks(assignee_id);
create index if not exists idx_tasks_deadline on public.tasks(deadline);
create index if not exists idx_tasks_project on public.tasks(project_id);
create index if not exists idx_subtasks_task on public.subtasks(task_id);
create index if not exists idx_comments_task_time on public.comments(task_id, created_at desc);
create index if not exists idx_revisions_task on public.revisions(task_id, revision_number desc);
create index if not exists idx_history_task_time on public.task_history(task_id, created_at desc);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_team_members_updated_at on public.team_members;
create trigger trg_team_members_updated_at before update on public.team_members for each row execute function public.set_updated_at();
drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at before update on public.tasks for each row execute function public.set_updated_at();
drop trigger if exists trg_subtasks_updated_at on public.subtasks;
create trigger trg_subtasks_updated_at before update on public.subtasks for each row execute function public.set_updated_at();

create or replace function public.current_member_id() returns uuid language sql stable security definer set search_path = public as $$
  select id from public.team_members where auth_user_id = auth.uid() and is_active = true limit 1;
$$;

create or replace function public.current_member_role() returns text language sql stable security definer set search_path = public as $$
  select role from public.team_members where auth_user_id = auth.uid() and is_active = true limit 1;
$$;

create or replace function public.is_team_member() returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.team_members where auth_user_id = auth.uid() and is_active = true);
$$;

create or replace function public.is_manager() returns boolean language sql stable security definer set search_path = public as $$
  select public.current_member_role() in ('supervisor','admin');
$$;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select public.current_member_role() = 'admin';
$$;

grant execute on function public.current_member_id() to anon, authenticated;
grant execute on function public.current_member_role() to anon, authenticated;
grant execute on function public.is_team_member() to anon, authenticated;
grant execute on function public.is_manager() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.cont_allowed_transition(old_status text, new_status text) returns boolean language sql immutable as $$
  select (old_status = 'brief' and new_status = 'drafting')
      or (old_status = 'drafting' and new_status = 'review')
      or (old_status = 'review' and new_status in ('revision','completed'))
      or (old_status = 'revision' and new_status in ('review','completed'))
      or (old_status = 'completed' and new_status = 'revision');
$$;

create or replace function public.validate_task_workflow() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and old.status is distinct from new.status then
    if not public.cont_allowed_transition(old.status, new.status) then
      raise exception 'CONT workflow does not allow % -> %', old.status, new.status using errcode = 'check_violation';
    end if;
    if new.status = 'completed' then new.completed_at = coalesce(new.completed_at, now());
    else new.completed_at = null;
    end if;
  elsif tg_op = 'INSERT' and new.status = 'completed' then
    new.completed_at = coalesce(new.completed_at, now());
  end if;
  return new;
end; $$;

drop trigger if exists trg_validate_task_workflow on public.tasks;
create trigger trg_validate_task_workflow before insert or update on public.tasks for each row execute function public.validate_task_workflow();

create or replace function public.record_task_status_history() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.task_history(task_id, user_id, from_status, to_status, action, revision_number, note)
    values (new.id, public.current_member_id(), null, new.status, 'created', new.revision_count, 'สร้างงาน');
  elsif old.status is distinct from new.status then
    insert into public.task_history(task_id, user_id, from_status, to_status, action, revision_number, note)
    values (new.id, public.current_member_id(), old.status, new.status,
      case when new.status = 'completed' then 'completed' when old.status = 'completed' then 'reopened' else 'status_changed' end,
      new.revision_count, null);
  end if;
  return new;
end; $$;

drop trigger if exists trg_record_task_status_history on public.tasks;
create trigger trg_record_task_status_history after insert or update on public.tasks for each row execute function public.record_task_status_history();

create or replace view public.member_workload as
select m.id as member_id, m.name, m.role, m.capacity_points,
  coalesce(sum(case when t.status <> 'completed' then t.workload_points else 0 end), 0)::integer as current_workload,
  round((coalesce(sum(case when t.status <> 'completed' then t.workload_points else 0 end), 0)::numeric / nullif(m.capacity_points, 0)) * 100)::integer as workload_percent,
  count(t.id) filter (where t.status <> 'completed')::integer as active_tasks
from public.team_members m left join public.tasks t on t.assignee_id = m.id
where m.is_active = true group by m.id;

grant select on public.member_workload to authenticated;

alter table public.team_members enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.subtasks enable row level security;
alter table public.comments enable row level security;
alter table public.revisions enable row level security;
alter table public.task_history enable row level security;

-- Team members can see active teammates; Admin manages membership.
drop policy if exists team_members_select on public.team_members;
create policy team_members_select on public.team_members for select to authenticated using (public.is_team_member());
drop policy if exists team_members_manage on public.team_members;
create policy team_members_manage on public.team_members for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Projects are visible to members; Supervisor/Admin can manage them.
drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects for select to authenticated using (public.is_team_member());
drop policy if exists projects_manage on public.projects;
create policy projects_manage on public.projects for all to authenticated using (public.is_manager()) with check (public.is_manager());

-- Tasks are team-visible. Designer can update tasks assigned to them; managers can create/assign/manage.
drop policy if exists tasks_select on public.tasks;
create policy tasks_select on public.tasks for select to authenticated using (public.is_team_member());
drop policy if exists tasks_insert on public.tasks;
create policy tasks_insert on public.tasks for insert to authenticated with check (public.is_manager() and created_by = public.current_member_id());
drop policy if exists tasks_update on public.tasks;
create policy tasks_update on public.tasks for update to authenticated using (public.is_manager() or assignee_id = public.current_member_id()) with check (public.is_manager() or assignee_id = public.current_member_id());
drop policy if exists tasks_delete on public.tasks;
create policy tasks_delete on public.tasks for delete to authenticated using (public.is_manager());

-- Child rows follow task visibility; writes follow role/ownership.
drop policy if exists subtasks_select on public.subtasks;
create policy subtasks_select on public.subtasks for select to authenticated using (public.is_team_member());
drop policy if exists subtasks_write on public.subtasks;
create policy subtasks_write on public.subtasks for all to authenticated using (public.is_manager() or exists(select 1 from public.tasks t where t.id = task_id and t.assignee_id = public.current_member_id())) with check (public.is_manager() or exists(select 1 from public.tasks t where t.id = task_id and t.assignee_id = public.current_member_id()));

drop policy if exists comments_select on public.comments;
create policy comments_select on public.comments for select to authenticated using (public.is_team_member());
drop policy if exists comments_insert on public.comments;
create policy comments_insert on public.comments for insert to authenticated with check (public.is_team_member() and user_id = public.current_member_id());
drop policy if exists comments_delete on public.comments;
create policy comments_delete on public.comments for delete to authenticated using (user_id = public.current_member_id() or public.is_manager());

drop policy if exists revisions_select on public.revisions;
create policy revisions_select on public.revisions for select to authenticated using (public.is_team_member());
drop policy if exists revisions_insert on public.revisions;
create policy revisions_insert on public.revisions for insert to authenticated with check (public.is_manager() and requested_by = public.current_member_id());
drop policy if exists revisions_update on public.revisions;
create policy revisions_update on public.revisions for update to authenticated using (public.is_manager() or assigned_to = public.current_member_id()) with check (public.is_manager() or assigned_to = public.current_member_id());

drop policy if exists history_select on public.task_history;
create policy history_select on public.task_history for select to authenticated using (public.is_team_member());
drop policy if exists history_insert on public.task_history;
create policy history_insert on public.task_history for insert to authenticated with check (public.is_team_member() and (user_id = public.current_member_id() or user_id is null));

-- Realtime is optional; enable only when the team needs live subscriptions.
-- alter publication supabase_realtime add table public.tasks;
