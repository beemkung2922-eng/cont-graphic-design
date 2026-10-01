const daysFromNow = (days) => {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

export const DEMO_MEMBERS = [
  { id: "u_beem", name: "Beem", email: "beem.demo@kkp.local", role: "designer", avatar_url: "", capacity_points: 10, is_active: true },
  { id: "u_pham", name: "P'Pham", email: "pham.demo@kkp.local", role: "supervisor", avatar_url: "", capacity_points: 10, is_active: true },
  { id: "u_ploy", name: "Ploy", email: "ploy.demo@kkp.local", role: "designer", avatar_url: "", capacity_points: 8, is_active: true },
  { id: "u_nok", name: "Nok", email: "nok.demo@kkp.local", role: "designer", avatar_url: "", capacity_points: 12, is_active: true },
];

export const DEMO_PROJECTS = [
  { id: "p_auto", name: "KKP AUTO", description: "แคมเปญสื่อสารสินเชื่อรถยนต์", client: "KKP", status: "active" },
  { id: "p_home", name: "สินเชื่อบ้าน", description: "ชุดสื่อ Home Loan", client: "KKP Bank", status: "active" },
  { id: "p_sme", name: "สินเชื่อธุรกิจ", description: "งานสื่อสารสำหรับ SME", client: "KKP", status: "active" },
  { id: "p_social", name: "Social Media", description: "Social content รายสัปดาห์", client: "KKP", status: "active" },
  { id: "p_campaign", name: "Campaign", description: "แคมเปญประจำไตรมาส", client: "KKP", status: "active" },
];

export const DEMO_TASKS = [
  { id: "t_auto", project_id: "p_auto", title: "KKP AUTO Banner", description: "ออกแบบ Social Media สำหรับ KKP AUTO ให้สอดคล้องกับ CI และ campaign message", assignee_id: "u_beem", created_by: "u_pham", status: "drafting", priority: "high", deadline: daysFromNow(2), workload_points: 3, revision_count: 1, completed_at: null, created_at: new Date(Date.now() - 86400000 * 4).toISOString(), updated_at: new Date().toISOString() },
  { id: "t_home", project_id: "p_home", title: "Home Loan Key Visual", description: "Key visual สำหรับสินเชื่อบ้าน ใช้บน landing page และ social", assignee_id: "u_beem", created_by: "u_pham", status: "review", priority: "urgent", deadline: daysFromNow(1), workload_points: 4, revision_count: 0, completed_at: null, created_at: new Date(Date.now() - 86400000 * 6).toISOString(), updated_at: new Date().toISOString() },
  { id: "t_social", project_id: "p_social", title: "Social Post — อัตราดอกเบี้ย", description: "ทำโพสต์ข้อมูลอัตราดอกเบี้ยประจำสัปดาห์", assignee_id: "u_beem", created_by: "u_pham", status: "brief", priority: "medium", deadline: daysFromNow(4), workload_points: 1, revision_count: 0, completed_at: null, created_at: new Date(Date.now() - 86400000 * 2).toISOString(), updated_at: new Date().toISOString() },
  { id: "t_campaign", project_id: "p_campaign", title: "Campaign KV — Q4", description: "วาง direction และ KV สำหรับแคมเปญ Q4", assignee_id: "u_beem", created_by: "u_pham", status: "revision", priority: "high", deadline: daysFromNow(3), workload_points: 2, revision_count: 2, completed_at: null, created_at: new Date(Date.now() - 86400000 * 10).toISOString(), updated_at: new Date().toISOString() },
  { id: "t_sme", project_id: "p_sme", title: "SME Infographic", description: "อินโฟกราฟิกอธิบายสินเชื่อธุรกิจ", assignee_id: "u_ploy", created_by: "u_pham", status: "drafting", priority: "medium", deadline: daysFromNow(6), workload_points: 3, revision_count: 0, completed_at: null, created_at: new Date(Date.now() - 86400000 * 3).toISOString(), updated_at: new Date().toISOString() },
  { id: "t_recap", project_id: "p_auto", title: "KKP AUTO Recap", description: "สรุป performance ของ campaign ที่ส่งมอบแล้ว", assignee_id: "u_ploy", created_by: "u_pham", status: "completed", priority: "low", deadline: daysFromNow(-3), workload_points: 2, revision_count: 1, completed_at: new Date(Date.now() - 86400000 * 3).toISOString(), created_at: new Date(Date.now() - 86400000 * 14).toISOString(), updated_at: new Date().toISOString() },
  { id: "t_brand", project_id: "p_campaign", title: "Brand Guideline Page", description: "จัดหน้า guideline สำหรับ internal use", assignee_id: "u_nok", created_by: "u_pham", status: "review", priority: "medium", deadline: daysFromNow(8), workload_points: 2, revision_count: 0, completed_at: null, created_at: new Date(Date.now() - 86400000 * 5).toISOString(), updated_at: new Date().toISOString() },
  { id: "t_urgent", project_id: "p_social", title: "Urgent Story Resize", description: "Resize artwork เป็น story format", assignee_id: "u_nok", created_by: "u_pham", status: "brief", priority: "urgent", deadline: daysFromNow(1), workload_points: 1, revision_count: 0, completed_at: null, created_at: new Date(Date.now() - 86400000).toISOString(), updated_at: new Date().toISOString() },
];

export const DEMO_SUBTASKS = [
  { id: "s1", task_id: "t_auto", title: "Research", is_completed: true },
  { id: "s2", task_id: "t_auto", title: "หา Reference", is_completed: true },
  { id: "s3", task_id: "t_auto", title: "Draft Layout", is_completed: false },
  { id: "s4", task_id: "t_auto", title: "ตรวจ CI", is_completed: false },
  { id: "s5", task_id: "t_auto", title: "ส่ง Review", is_completed: false },
  { id: "s6", task_id: "t_home", title: "รวบรวม Feedback", is_completed: true },
  { id: "s7", task_id: "t_home", title: "ปรับ Visual", is_completed: true },
  { id: "s8", task_id: "t_home", title: "ส่ง Review", is_completed: true },
  { id: "s9", task_id: "t_campaign", title: "ปรับ Layout", is_completed: true },
  { id: "s10", task_id: "t_campaign", title: "แก้ข้อความ", is_completed: false },
];

export const DEMO_COMMENTS = [
  { id: "c1", task_id: "t_auto", user_id: "u_pham", content: "ช่วยขยับ headline ให้เด่นขึ้น และเช็ก safe zone ก่อนส่ง review", created_at: new Date(Date.now() - 3600000 * 5).toISOString() },
  { id: "c2", task_id: "t_home", user_id: "u_pham", content: "ภาพรวมดีแล้ว ขอเช็กตัวเลขดอกเบี้ยกับทีม product อีกครั้ง", created_at: new Date(Date.now() - 3600000 * 12).toISOString() },
  { id: "c3", task_id: "t_campaign", user_id: "u_pham", content: "Revision #2: ปรับ hierarchy ให้ CTA อ่านง่ายขึ้น", created_at: new Date(Date.now() - 86400000).toISOString() },
];

export const DEMO_REVISIONS = [
  { id: "r1", task_id: "t_auto", revision_number: 1, requested_by: "u_pham", assigned_to: "u_beem", reason: "ปรับ headline และ safe zone", status_before: "review", status_after: "revision", created_at: new Date(Date.now() - 86400000).toISOString(), completed_at: null },
  { id: "r2", task_id: "t_campaign", revision_number: 1, requested_by: "u_pham", assigned_to: "u_beem", reason: "ขอปรับ visual direction", status_before: "review", status_after: "revision", created_at: new Date(Date.now() - 86400000 * 4).toISOString(), completed_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "r3", task_id: "t_campaign", revision_number: 2, requested_by: "u_pham", assigned_to: "u_beem", reason: "ปรับ hierarchy ให้ CTA ชัดขึ้น", status_before: "review", status_after: "revision", created_at: new Date(Date.now() - 86400000).toISOString(), completed_at: null },
];

export const DEMO_HISTORY = [
  { id: "h1", task_id: "t_auto", user_id: "u_pham", from_status: null, to_status: "brief", action: "created", revision_number: 0, note: "สร้างงาน", created_at: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: "h2", task_id: "t_auto", user_id: "u_beem", from_status: "brief", to_status: "drafting", action: "status_changed", revision_number: 0, note: "เริ่มดราฟต์", created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "h3", task_id: "t_auto", user_id: "u_pham", from_status: "drafting", to_status: "review", action: "status_changed", revision_number: 0, note: "ส่งให้ตรวจ", created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: "h4", task_id: "t_auto", user_id: "u_pham", from_status: "review", to_status: "revision", action: "revision_requested", revision_number: 1, note: "ปรับ headline และ safe zone", created_at: new Date(Date.now() - 3600000 * 5).toISOString() },
  { id: "h5", task_id: "t_home", user_id: "u_pham", from_status: null, to_status: "review", action: "created", revision_number: 0, note: "ส่งงานเข้าตรวจ", created_at: new Date(Date.now() - 86400000 * 6).toISOString() },
  { id: "h6", task_id: "t_recap", user_id: "u_ploy", from_status: "review", to_status: "completed", action: "completed", revision_number: 1, note: "ส่งมอบไฟล์สำเร็จ", created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: "h7", task_id: "t_campaign", user_id: "u_pham", from_status: "review", to_status: "revision", action: "revision_requested", revision_number: 2, note: "ปรับ hierarchy ให้ CTA ชัดขึ้น", created_at: new Date(Date.now() - 86400000).toISOString() },
];

export const DEMO_CURRENT_USER = "u_beem";

export function createDemoBundle() {
  return {
    members: structuredClone(DEMO_MEMBERS),
    projects: structuredClone(DEMO_PROJECTS),
    tasks: structuredClone(DEMO_TASKS),
    subtasks: structuredClone(DEMO_SUBTASKS),
    comments: structuredClone(DEMO_COMMENTS),
    revisions: structuredClone(DEMO_REVISIONS),
    history: structuredClone(DEMO_HISTORY),
  };
}
