-- CONT Migration 006: Graphic Design Features
-- Adds preview_url, design_url, dimensions, and channel to tasks
-- Adds preview_url to revisions

alter table public.tasks add column if not exists preview_url text;
alter table public.tasks add column if not exists design_url text;
alter table public.tasks add column if not exists dimensions text;
alter table public.tasks add column if not exists channel text;

alter table public.revisions add column if not exists preview_url text;

-- Notify PostgREST to reload schema cache
notify pgrst, 'reload schema';
