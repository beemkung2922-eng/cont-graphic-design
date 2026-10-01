import { ACTIVE_STATUSES, STATUS_LABELS, canTransition } from "./constants.js";
import { taskCard, escapeHtml, projectFor, memberFor } from "./formatters.js";
import { qs, toast } from "./app.js";
import { api } from "./supabase.js";
import { openCreateTask, bindTaskCards } from "./task-actions.js";

export async function render(ctx) {
  window.openCreateTask = () => openCreateTask(ctx);
  const rerender = () => { render(ctx); };
  const draw = () => {
    const active = ctx.tasks.filter((task) => task.status !== "completed");
    qs("#page-content").innerHTML = `<div class="page-header"><div><h2>Workflow Board</h2><p class="page-desc">ลากการ์ดเพื่อขยับงานได้เฉพาะ Transition ที่ระบบอนุญาต</p></div><div class="row-wrap"><span class="chip">Active ${active.length} งาน</span><button class="btn btn-primary" id="board-create">＋ สร้างงานใหม่</button></div></div><div class="banner banner-info"><strong>กติกา Workflow</strong><span>รอรับบรีฟ → กำลังดราฟต์ → รอคอมเมนต์ → แก้ไขงาน → ส่งมอบไฟล์สำเร็จ · จากรอคอมเมนต์สามารถส่งมอบได้ทันทีหากไม่มี Revision</span></div><div class="kanban-wrap"><div class="kanban">${ACTIVE_STATUSES.map((status) => { const rows = active.filter((task) => task.status === status); return `<section class="kcol" data-status="${status}"><div class="kcol-head"><div class="kcol-title"><span style="width:8px;height:8px;border-radius:50%;background:${status === "review" ? "var(--warn)" : status === "revision" ? "var(--danger)" : status === "drafting" ? "var(--info)" : "var(--ink-300)"}"></span>${STATUS_LABELS[status]}</div><span class="kcol-head-count">${rows.length}</span></div><div class="kcol-body">${rows.map((task) => taskCard(task, { projects: ctx.projects, members: ctx.members, subtasks: ctx.subtasks })).join("") || `<div class="kcol-empty">ยังไม่มีงานในขั้นตอนนี้</div>`}</div></section>`; }).join("")}</div></div>`;
    qs("#board-create")?.addEventListener("click", () => openCreateTask(ctx));
    bindTaskCards(qs("#page-content"));
    document.querySelectorAll(".kanban .task-card").forEach((card) => { card.draggable = true; card.addEventListener("dragstart", () => { card.classList.add("is-dragging"); window.__dragTask = card.dataset.taskId; }); card.addEventListener("dragend", () => card.classList.remove("is-dragging")); });
    document.querySelectorAll(".kcol").forEach((column) => { column.addEventListener("dragover", (event) => { event.preventDefault(); column.classList.add("is-dragover"); }); column.addEventListener("dragleave", () => column.classList.remove("is-dragover")); column.addEventListener("drop", async (event) => { event.preventDefault(); column.classList.remove("is-dragover"); const task = ctx.tasks.find((item) => item.id === window.__dragTask); const next = column.dataset.status; if (!task || task.status === next) return; if (!canTransition(task.status, next)) { toast(`ขยับจาก ${STATUS_LABELS[task.status]} ไป ${STATUS_LABELS[next]} ไม่ได้ตาม Workflow`, "warn"); return; } try { await api.changeStatus(task.id, next, "เปลี่ยนจาก Kanban"); toast(`อัปเดตเป็น ${STATUS_LABELS[next]} แล้ว`, "success"); const fresh = await api.loadBundle(); Object.assign(ctx, fresh); rerender(); } catch (error) { toast(error.message, "error"); } }); });
  };
  draw();
}
