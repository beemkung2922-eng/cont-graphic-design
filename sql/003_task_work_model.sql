-- CONT task work model migration
-- Run in Supabase SQL Editor after 001_cont_schema.sql.
alter table public.tasks add column if not exists task_type text not null default 'new_work';
alter table public.tasks add column if not exists item_count integer not null default 1;
alter table public.tasks add column if not exists deadline_at timestamptz;
alter table public.tasks drop constraint if exists tasks_task_type_check;
alter table public.tasks add constraint tasks_task_type_check check (task_type in ('new_work','resize','revision','adaptation','other'));
alter table public.tasks drop constraint if exists tasks_item_count_check;
alter table public.tasks add constraint tasks_item_count_check check (item_count > 0 and item_count <= 10000);
update public.tasks set deadline_at = (deadline::timestamp at time zone 'Asia/Bangkok') where deadline_at is null and deadline is not null;
create index if not exists idx_tasks_deadline_at on public.tasks(deadline_at);
