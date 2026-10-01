import { openModal, closeModal, toast, qs, qsa } from "./app.js";
import { api } from "./supabase.js";
import { escapeHtml } from "./formatters.js";
import { canManage } from "./auth.js";

export function bindTaskCards(root = document) {
  qsa("[data-task-id]", root).forEach((card) => {
    const open = () => { window.location.href = `task.html?id=${encodeURIComponent(card.dataset.taskId)}`; };
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } });
  });
}

export function openCreateTask(ctx) {
  if (!canManage(ctx.member)) { toast("เฉพาะ Supervisor หรือ Admin ที่สร้างงานได้", "warn"); return; }
  const body = `<form id="create-task-form" class="stack"><div class="form-grid"><div class="field field-full"><label for="task-title">ชื่องาน *</label><input id="task-title" name="title" required placeholder="เช่น KKP AUTO Banner"></div><div class="field"><label for="task-project">Project *</label><select id="task-project" name="project_id" required><option value="">เลือก Project</option>${ctx.projects.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join("")}</select></div><div class="field"><label for="task-assignee">Assignee *</label><select id="task-assignee" name="assignee_id" required><option value="">เลือกสมาชิก</option>${ctx.members.filter((m) => m.is_active !== false).map((m) => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.name)} · ${escapeHtml(m.role)}</option>`).join("")}</select></div><div class="field"><label for="task-deadline">Deadline *</label><input id="task-deadline" type="date" name="deadline" required></div><div class="field"><label for="task-priority">Priority</label><select id="task-priority" name="priority"><option value="low">ต่ำ</option><option value="medium" selected>ปกติ</option><option value="high">สูง</option><option value="urgent">เร่งด่วน</option></select></div><div class="field"><label for="task-workload">Workload Points *</label><input id="task-workload" type="number" name="workload_points" min="1" max="20" value="2" required><span class="hint">ใช้ 1–5 ตามความซับซ้อนของงาน</span></div><div class="field field-full"><label for="task-brief">Brief</label><textarea id="task-brief" name="description" placeholder="รายละเอียดโจทย์ ขอบเขต และสิ่งที่ต้องส่งมอบ"></textarea></div></div><div id="create-task-error" class="error-text"></div></form>`;
  const modal = openModal({ title: "สร้างงานใหม่", body, footer: `<button class="btn" data-close-modal>ยกเลิก</button><button class="btn btn-primary" id="submit-create-task">สร้างงาน</button>` });
  qs("#submit-create-task", modal).addEventListener("click", async () => {
    const form = qs("#create-task-form", modal);
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const errorNode = qs("#create-task-error", modal);
    try {
      const created = await api.createTask({ ...data, workload_points: Number(data.workload_points), created_by: ctx.member.id });
      closeModal(); toast("สร้างงานเรียบร้อยแล้ว", "success");
      window.setTimeout(() => { window.location.href = `task.html?id=${encodeURIComponent(created.id)}`; }, 350);
    } catch (error) { errorNode.textContent = error.message || "ไม่สามารถสร้างงานได้"; }
  });
}
