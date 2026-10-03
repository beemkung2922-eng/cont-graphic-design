import { taskCard, escapeHtml, projectFor, memberFor } from "./formatters.js";
import { STATUS_LABELS, STATUS_ORDER } from "./constants.js";
import { qs, toast } from "./app.js";
import { openCreateTask, bindTaskCards } from "./task-actions.js";

export async function render(ctx) {
  window.openCreateTask = () => openCreateTask(ctx);
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q") || "";
  qs("#page-content").innerHTML = `<div class="page-header"><div><h2>งานที่อยู่ในความรับผิดชอบ</h2><p class="page-desc">ดูงานของตัวเองหรือสลับเป็นมุมมองงานทั้งทีมตามสิทธิ์</p></div><button class="btn btn-primary" id="tasks-create">＋ สร้างงานใหม่</button></div><div class="filter-bar"><div class="field grow"><label>ค้นหา Task / Project / Member</label><div class="search-inline" style="min-width:0"><span>⌕</span><input id="task-search" value="${escapeHtml(initialQuery)}" placeholder="พิมพ์เพื่อค้นหา…"></div></div><div class="field"><label>Status</label><select id="task-status"><option value="all">ทุกสถานะ</option>${STATUS_ORDER.map((status) => `<option value="${status}">${STATUS_LABELS[status]}</option>`).join("")}</select></div><div class="field"><label>มุมมอง</label><select id="task-scope"><option value="mine">งานของฉัน</option><option value="team">งานทั้งทีม</option><option value="history">Work History</option></select></div><button class="btn" id="task-reset">ล้างตัวกรอง</button></div><div id="task-results"></div>`;
  const renderResults = () => {
    const query = qs("#task-search").value.trim().toLowerCase();
    const status = qs("#task-status").value;
    const scope = qs("#task-scope").value;
    let filtered = [...ctx.tasks];
    if (scope === "mine") filtered = filtered.filter((task) => task.assignee_id === ctx.member.id);
    if (scope === "history") filtered = filtered.filter((task) => task.status === "completed");
    if (query) filtered = filtered.filter((task) => [task.title, task.description, projectFor(task, ctx.projects)?.name, memberFor(task, ctx.members)?.name].some((value) => String(value || "").toLowerCase().includes(query)));
    if (status !== "all") filtered = filtered.filter((task) => task.status === status);
    const groups = scope === "history" ? ["completed"] : STATUS_ORDER.filter((value) => filtered.some((task) => task.status === value));
    qs("#task-results").innerHTML = groups.length ? groups.map((group) => { const rows = filtered.filter((task) => task.status === group); return `<section class="section"><div class="section-title">${STATUS_LABELS[group]} <span class="kcol-head-count">${rows.length}</span></div><div class="task-grid">${rows.map((task) => taskCard(task, { projects: ctx.projects, members: ctx.members, subtasks: ctx.subtasks })).join("")}</div></section>`; }).join("") : `<div class="card">${`<div class="state"><div class="state-icon">○</div><div class="state-title">ยังไม่มีงานตามตัวกรองนี้</div><div class="state-text">ลองเปลี่ยน scope หรือค้นหาด้วยคำอื่น</div></div>`}</div>`;
    bindTaskCards(qs("#task-results"));
  };
  ["#task-search", "#task-status", "#task-scope"].forEach((selector) => qs(selector).addEventListener(selector === "#task-search" ? "input" : "change", renderResults));
  qs("#task-reset").addEventListener("click", () => { qs("#task-search").value = ""; qs("#task-status").value = "all"; qs("#task-scope").value = "mine"; renderResults(); });
  qs("#tasks-create").addEventListener("click", () => openCreateTask(ctx));
  renderResults();
}
