-- CONT DEMO SEED DATA (optional; not production data)
-- Run after 001_cont_schema.sql. Replace email/auth_user_id with real approved team members before real use.

insert into public.team_members (id, name, email, role, capacity_points, is_active)
values
  ('10000000-0000-4000-8000-000000000001','Beem','beem.demo@kkp.local','designer',10,true),
  ('10000000-0000-4000-8000-000000000002','P''Pham','pham.demo@kkp.local','supervisor',10,true),
  ('10000000-0000-4000-8000-000000000003','Ploy','ploy.demo@kkp.local','designer',8,true),
  ('10000000-0000-4000-8000-000000000004','Nok','nok.demo@kkp.local','designer',12,true)
on conflict (id) do update set name=excluded.name, role=excluded.role, capacity_points=excluded.capacity_points;

insert into public.projects (id,name,description,client,status)
values
  ('20000000-0000-4000-8000-000000000001','KKP AUTO','แคมเปญสื่อสารสินเชื่อรถยนต์','KKP','active'),
  ('20000000-0000-4000-8000-000000000002','สินเชื่อบ้าน','ชุดสื่อ Home Loan','KKP Bank','active'),
  ('20000000-0000-4000-8000-000000000003','สินเชื่อธุรกิจ','งานสื่อสารสำหรับ SME','KKP','active'),
  ('20000000-0000-4000-8000-000000000004','Social Media','Social content รายสัปดาห์','KKP','active'),
  ('20000000-0000-4000-8000-000000000005','Campaign','แคมเปญประจำไตรมาส','KKP','active')
on conflict (id) do update set name=excluded.name, description=excluded.description, client=excluded.client;

insert into public.tasks (id,project_id,title,description,assignee_id,created_by,status,priority,deadline,workload_points,revision_count)
values
  ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','KKP AUTO Banner','ออกแบบ Social Media สำหรับ KKP AUTO','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','drafting','high',current_date+2,3,1),
  ('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','Home Loan Key Visual','Key visual สำหรับสินเชื่อบ้าน','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','review','urgent',current_date+1,4,0),
  ('30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000004','Social Post — อัตราดอกเบี้ย','โพสต์ข้อมูลอัตราดอกเบี้ย','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','brief','medium',current_date+4,1,0),
  ('30000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000005','Campaign KV — Q4','วาง direction และ KV สำหรับแคมเปญ Q4','10000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000002','revision','high',current_date+3,2,2)
on conflict (id) do update set title=excluded.title, status=excluded.status, deadline=excluded.deadline, workload_points=excluded.workload_points, revision_count=excluded.revision_count;

insert into public.subtasks (task_id,title,is_completed)
values
  ('30000000-0000-4000-8000-000000000001','Research',true),
  ('30000000-0000-4000-8000-000000000001','หา Reference',true),
  ('30000000-0000-4000-8000-000000000001','Draft Layout',false),
  ('30000000-0000-4000-8000-000000000001','ตรวจ CI',false),
  ('30000000-0000-4000-8000-000000000001','ส่ง Review',false);
