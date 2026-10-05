import { openModal, closeModal, toast, qs, qsa } from "./app.js";
import { api } from "./supabase.js";
import { escapeHtml, roleLabel } from "./formatters.js";
import { canManage } from "./auth.js";

export function bindTaskCards(root = document) {
  qsa("[data-task-id]", root).forEach((card) => {
    const open = () => { window.location.href = `task.html?id=${encodeURIComponent(card.dataset.taskId)}`; };
    card.addEventListener("click", open);
    card.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } });
  });
}

export function openCreateTask(ctx) {
  if (!canManage(ctx.member)) { toast("เฉพาะ Team Head of Visual & Design ที่สร้างงานได้", "warn"); return; }
  const body = `<form id="create-task-form" class="stack"><div class="form-grid"><div class="field field-full"><label for="task-title">ชื่องาน *</label><input id="task-title" name="title" required placeholder="เช่น RRN ปรับ Size Banner"></div><div class="field"><label for="task-project">Project *</label><select id="task-project" name="project_id" required><option value="">เลือก Project</option>${ctx.projects.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}</option>`).join("")}</select></div><div class="field"><label for="task-type">ประเภทงาน *</label><select id="task-type" name="task_type" required><option value="new_work">เริ่มงานใหม่</option><option value="resize">ปรับ Size</option><option value="revision">แก้ไขงาน</option><option value="adaptation">ดัดแปลงจากชิ้นเดิม</option><option value="other">อื่น ๆ</option></select></div><div class="field"><label for="task-assignee">ผู้รับผิดชอบ *</label><select id="task-assignee" name="assignee_id" required><option value="">เลือกสมาชิก</option>${ctx.members.filter((m) => m.is_active !== false).map((m) => `<option value="${escapeHtml(m.id)}">${escapeHtml(m.name)} · ${escapeHtml(roleLabel(m.role))}</option>`).join("")}</select></div><div class="field"><label for="task-item-count">จำนวนชิ้นงาน *</label><input id="task-item-count" type="number" name="item_count" min="1" max="10000" value="1" required><span class="hint">เช่น 1 งานประกอบด้วย 5 ชิ้นงาน ให้ใส่ 5</span></div><div class="field"><label for="task-deadline">กำหนดส่ง *</label><input id="task-deadline" type="datetime-local" name="deadline_at" required><span class="hint">ใช้ดูเวลาที่เลทเป็นชั่วโมงและนาที</span></div><div class="field field-full"><label for="task-brief">Brief</label><textarea id="task-brief" name="description" placeholder="รายละเอียดโจทย์ ขอบเขต และสิ่งที่ต้องส่งมอบ"></textarea></div></div><div id="create-task-error" class="error-text"></div></form>`;
  const modal = openModal({ title: "สร้างงานใหม่", body, footer: `<button class="btn" data-close-modal>ยกเลิก</button><button class="btn btn-primary" id="submit-create-task">สร้างงาน</button>` });
  qs("#submit-create-task", modal).addEventListener("click", async () => {
    const form = qs("#create-task-form", modal);
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const errorNode = qs("#create-task-error", modal);
    try {
      const created = await api.createTask({ ...data, item_count: Number(data.item_count), created_by: ctx.member.id });
      closeModal(); toast("สร้างงานเรียบร้อยแล้ว", "success");
      window.setTimeout(() => { window.location.href = `task.html?id=${encodeURIComponent(created.id)}`; }, 350);
    } catch (error) { errorNode.textContent = error.message || "ไม่สามารถสร้างงานได้"; }
  });
}
