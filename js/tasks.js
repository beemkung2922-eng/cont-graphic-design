import { taskCard, escapeHtml, projectFor, memberFor, interactiveEmptyState } from "./formatters.js";
import { STATUS_LABELS, STATUS_ORDER } from "./constants.js";
import { qs, toast } from "./app.js";
import { openCreateTask, bindTaskCards } from "./task-actions.js";
import { isRequester, isViewer, canCreateTask } from "./auth.js";
import { filterTasksByTimeRange, MONTH_NAMES_TH } from "./analytics.js";

export async function render(ctx) {
  window.openCreateTask = () => openCreateTask(ctx);
  const params = new URLSearchParams(window.location.search);
  const initialQuery = params.get("q") || "";
  const isReq = isRequester(ctx.member);
  const isView = isViewer(ctx.member);
  const canCreate = canCreateTask(ctx.member);

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  const createBtnHtml = canCreate
    ? `<button class="btn btn-primary" id="tasks-create">${isReq ? "＋ ส่งคำของาน / บรีฟงานใหม่" : "＋ สร้างงานใหม่"}</button>`
    : "";

  qs("#page-content").innerHTML = `
    <div class="page-header">
      <div>
        <div class="row-wrap" style="gap:8px; align-items:center; margin-bottom:4px">
          <h2 style="margin:0">${isReq ? "งานที่ส่งคำขอ & ติดตามสถานะ" : "งานที่อยู่ในความรับผิดชอบ"}</h2>
          ${isReq ? `<span class="badge badge-info" style="font-weight:600">Requester</span>` : isView ? `<span class="badge badge-neutral" style="font-weight:600">Viewer</span>` : ""}
        </div>
        <p class="page-desc">${isReq ? "ติดตามสถานะงานที่คุณบรีฟให้ทีม Visual & Design ดำเนินการ" : "ดูงานของตัวเองหรือสลับเป็นมุมมองงานทั้งทีมตามสิทธิ์"}</p>
      </div>
      ${createBtnHtml}
    </div>

    <div class="filter-bar" style="flex-wrap:wrap; gap:10px;">
      <div class="field grow" style="min-width:220px;">
        <label>ค้นหา Task / Project / Member</label>
        <div class="search-inline" style="min-width:0">
          <span>⌕</span>
          <input id="task-search" value="${escapeHtml(initialQuery)}" placeholder="พิมพ์เพื่อค้นหา…">
        </div>
      </div>

      <div class="field">
        <label>Status</label>
        <select id="task-status">
          <option value="all">ทุกสถานะ</option>
          ${STATUS_ORDER.map((status) => `<option value="${status}">${STATUS_LABELS[status]}</option>`).join("")}
        </select>
      </div>

      <div class="field">
        <label>มุมมอง</label>
        <select id="task-scope">
          <option value="mine">${isReq ? "งานที่ฉันส่งบรีฟ" : "งานของฉัน"}</option>
          <option value="team">งานทั้งทีม</option>
          <option value="history">Work History</option>
        </select>
      </div>

      <div class="field">
        <label>ช่วงเวลา</label>
        <select id="task-period">
          <option value="all">ทุกช่วงเวลา</option>
          <option value="today">วันนี้</option>
          <option value="7days">7 วันล่าสุด</option>
          <option value="month">เดือนนี้</option>
          <option value="year">ปีนี้ (${currentYear})</option>
        </select>
      </div>

      <div class="field">
        <label>ปี</label>
        <select id="task-year">
          <option value="all">ทุกปี</option>
          ${years.map((y) => `<option value="${y}">${y}</option>`).join("")}
        </select>
      </div>

      <div class="field">
        <label>เดือน</label>
        <select id="task-month">
          <option value="all">ทุกเดือน</option>
          ${MONTH_NAMES_TH.map((name, idx) => `<option value="${idx + 1}">${name}</option>`).join("")}
        </select>
      </div>

      <div class="field">
        <label>เลือกวันเจาะจง</label>
        <input type="date" id="task-day">
      </div>

      <div class="field" style="align-self:flex-end;">
        <button class="btn" id="task-reset" style="height:38px;">ล้างตัวกรอง</button>
      </div>
    </div>

    <div id="task-results"></div>
  `;

  const renderResults = () => {
    const query = qs("#task-search").value.trim().toLowerCase();
    const status = qs("#task-status").value;
    const scope = qs("#task-scope").value;
    const period = qs("#task-period").value;
    const year = qs("#task-year").value;
    const month = qs("#task-month").value;
    const specificDay = qs("#task-day").value;

    let filtered = [...ctx.tasks];

    // Scope
    if (scope === "mine") {
      filtered = filtered.filter((task) => task.assignee_id === ctx.member?.id || (isReq && task.created_by === ctx.member?.id));
    }
    if (scope === "history") {
      filtered = filtered.filter((task) => task.status === "completed");
    }

    // Status
    if (status !== "all") {
      filtered = filtered.filter((task) => task.status === status);
    }

    // Time & Date filter
    filtered = filterTasksByTimeRange(filtered, {
      period: specificDay ? "specific_day" : period,
      year,
      month,
      specificDay,
      dateField: "created_at"
    });

    // Query search
    if (query) {
      filtered = filtered.filter((task) =>
        [task.title, task.description, projectFor(task, ctx.projects)?.name, memberFor(task, ctx.members)?.name]
          .some((value) => String(value || "").toLowerCase().includes(query))
      );
    }

    const groups = scope === "history" ? ["completed"] : STATUS_ORDER.filter((value) => filtered.some((task) => task.status === value));

    qs("#task-results").innerHTML = groups.length
      ? groups.map((group) => {
          const rows = filtered.filter((task) => task.status === group);
          return `
            <section class="section">
              <div class="section-title">
                ${STATUS_LABELS[group]} <span class="kcol-head-count">${rows.length}</span>
              </div>
              <div class="task-grid">
                ${rows.map((task) => taskCard(task, { projects: ctx.projects, members: ctx.members, subtasks: ctx.subtasks })).join("")}
              </div>
            </section>
          `;
        }).join("")
      : `
        <div class="card">
          ${interactiveEmptyState({ title: "ไม่มีงานตามตัวกรองที่เลือก", subtitle: "ลองปรับคำค้นหา วันที่ หรือมุมมองด้านบนเพื่อดูงานอื่น" })}
        </div>
      `;

    bindTaskCards(qs("#task-results"));
  };

  [
    "#task-search",
    "#task-status",
    "#task-scope",
    "#task-period",
    "#task-year",
    "#task-month",
    "#task-day"
  ].forEach((selector) => {
    qs(selector)?.addEventListener(selector === "#task-search" ? "input" : "change", renderResults);
  });

  qs("#task-reset").addEventListener("click", () => {
    qs("#task-search").value = "";
    qs("#task-status").value = "all";
    qs("#task-scope").value = "mine";
    qs("#task-period").value = "all";
    qs("#task-year").value = "all";
    qs("#task-month").value = "all";
    qs("#task-day").value = "";
    renderResults();
  });

  qs("#tasks-create")?.addEventListener("click", () => openCreateTask(ctx));
  renderResults();
}
