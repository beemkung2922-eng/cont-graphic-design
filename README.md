# CONT — Graphic Design Workflow Management System

ระบบจัดการกระบวนการทำงานสำหรับทีมกราฟิก KKP — เห็น **งาน / คน / สถานะ / ภาระงาน** ในหน้าจอเดียว

## Current project

- Webdev project: `contkkp2610`
- Frontend: HTML + CSS + Vanilla JavaScript modules
- Data/Auth: Supabase REST API + Supabase Auth (Google OAuth)
- Runtime: Node static server on port `3000`
- Demo mode: separate local dataset for UI/workflow demonstrations only

## Run locally

```bash
npm start
# open http://localhost:3000
```

The managed Preview uses the same port. `manus-routes.json` declares all application pages.

## Supabase setup

1. Open your Supabase project.
2. Run `sql/001_cont_schema.sql` in **SQL Editor**.
3. Optional for presentation data: run `sql/002_demo_seed.sql`. It is clearly labeled demo data and must not be treated as production data.
4. Create approved rows in `team_members`; the `email` must match the Google account and `auth_user_id` must be mapped after the first sign-in.
5. Keep RLS enabled. Do not use a `service_role` key in the browser.
6. Copy `js/config.example.js` to `js/config.local.js` and fill the project URL and **publishable/anon** key. `config.local.js` is gitignored.

### Google Login

In Supabase → **Authentication → Providers → Google**:

- Enable Google provider.
- Add your Google OAuth Client ID and Client Secret.
- Add the Supabase callback URL shown by the provider settings to Google Cloud Console.
- Add the Preview/deployed origin URL to the Supabase Auth URL Configuration allow-list.

After the first login, map the authenticated user to the matching `team_members.auth_user_id` (run in SQL Editor as an admin):

```sql
update public.team_members
set auth_user_id = 'AUTH_USER_UUID_FROM_SUPABASE'
where lower(email) = lower('designer@your-company.com');
```

If the user is not mapped or inactive, CONT shows:

> ไม่พบสมาชิกในทีม กรุณาติดต่อผู้ดูแลระบบ

## Demo mode

The Login page provides Beem and P'Pham demo entries. Demo mode stores data in browser `localStorage` under a separate key, so you can test:

1. Supervisor creates and assigns a task.
2. Beem moves `brief → drafting → review`.
3. Supervisor requests a Revision, which increments the Revision number.
4. The task moves to `completed`; it disappears from Active Kanban but remains in Work History.
5. Reopen from completed and create another revision.
6. Team page recalculates workload from points divided by capacity.

To start directly: `/dashboard.html?demo=1`.

## Workflow rules

- `brief → drafting`
- `drafting → review`
- `review → revision`
- `review → completed` when no revision is needed
- `revision → review` or `revision → completed`
- `completed → revision` for Reopen

Every status change is recorded in `task_history`. Completed is not deleted.

## Workload

```text
Current Workload = SUM(workload_points of Active Tasks)
Workload % = Current Workload / capacity_points × 100
```

Completed tasks are excluded. The UI shows Low / Normal / High / Overloaded and never turns it into a people leaderboard.

## If Supabase returns 401

A `401 Unauthorized` from `/rest/v1` means the browser key was rejected. Confirm:

- the URL is the project API URL (`https://<project-ref>.supabase.co`), not the dashboard URL;
- the key is the publishable/anon key from the same project;
- the project is not paused;
- the key was copied without spaces or line breaks;
- you reloaded the page after editing `config.local.js`.

The app remains previewable in DEMO mode while the real project configuration is corrected.

## Security notes

- `js/config.local.js` is gitignored.
- Only public client values belong in browser code.
- Never put service-role keys, passwords, Google secrets, or private tokens in `config.local.js` or any tracked file.
- RLS is the authorization boundary; the frontend does not replace database policies.
