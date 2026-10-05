import { ACTIVE_STATUSES, STATUS_ORDER, STATUS_LABELS, canTransition } from "./constants.js";
import { taskCard, escapeHtml, projectFor, memberFor, relativeDeadline } from "./formatters.js";
import { qs, toast, openModal, closeModal } from "./app.js";
import { api } from "./supabase.js";
import { openCreateTask, bindTaskCards } from "./task-actions.js";
import { canMoveTask, canManage, isRequester, isViewer, canCreateTask } from "./auth.js";

export async function render(ctx) {
  window.openCreateTask = () => openCreateTask(ctx);

  // Filter state
  let currentScope = "all"; // "all" | "mine"
  let searchQuery = "";
  let filterMemberId = "";
  let filterProjectId = "";
  let filterUrgency = "all"; // "all" | "overdue" | "due_soon" | "normal"
  let showCompleted = false;

  const rerender = async () => {
    const fresh = await api.loadBundle();
    Object.assign(ctx, fresh);
    draw();
  };

  const draw = () => {
    // 1. Base tasks
    let visibleTasks = [...ctx.tasks];

    const isReq = isRequester(ctx.member);
    const isView = isViewer(ctx.member);
    const canMove = canMoveTask(ctx.member);
    const canCreate = canCreateTask(ctx.member);

    // Filter by Scope
    if (currentScope === "mine") {
      visibleTasks = visibleTasks.filter((t) => t.assignee_id === ctx.member?.id || (isReq && t.created_by === ctx.member?.id));
    }

    // Filter by Search Query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      visibleTasks = visibleTasks.filter((t) => {
        const p = projectFor(t, ctx.projects);
        const m = memberFor(t, ctx.members);
        return [
          t.title,
          t.description,
          t.dimensions,
          t.channel,
          p?.name,
          m?.name
        ].some((val) => String(val || "").toLowerCase().includes(q));
      });
    }

    // Filter by Member
    if (filterMemberId) {
      visibleTasks = visibleTasks.filter((t) => t.assignee_id === filterMemberId);
    }

    // Filter by Project
    if (filterProjectId) {
      visibleTasks = visibleTasks.filter((t) => t.project_id === filterProjectId);
    }

    // Filter by Urgency
    if (filterUrgency !== "all") {
      visibleTasks = visibleTasks.filter((t) => {
        const urgency = relativeDeadline(t.deadline_at || t.deadline);
        if (filterUrgency === "overdue") return urgency.className === "is-overdue";
        if (filterUrgency === "due_soon") return urgency.className === "is-due-soon";
        if (filterUrgency === "normal") return urgency.className === "";
        return true;
      });
    }

    // Columns to display
    const columnsToDisplay = showCompleted ? STATUS_ORDER : ACTIVE_STATUSES;
    const activeTasksCount = ctx.tasks.filter((t) => t.status !== "completed").length;
    const myTasksCount = ctx.tasks.filter((t) => t.status !== "completed" && (t.assignee_id === ctx.member?.id || (isReq && t.created_by === ctx.member?.id))).length;

    const createBtnHtml = canCreate
      ? `<button class="btn btn-primary" id="board-create">${isReq ? "＋ ส่งคำของาน / บรีฟงานใหม่" : "＋ สร้างงานใหม่"}</button>`
      : "";
    const roleBadgeHtml = isReq
      ? `<span class="badge badge-info" style="font-weight:600">โหมดผู้ขอรับบริการ (Requester)</span>`
      : isView
      ? `<span class="badge badge-neutral" style="font-weight:600">โหมดผู้เข้าชม (View-Only)</span>`
      : "";
    const pageDesc = canManage(ctx.member)
      ? "ลากการ์ดเพื่อขยับงานตามขั้นตอน Workflow · ฟิลเตอร์ดูงานเฉพาะส่วนตัวหรือทั้งทีม"
      : canMove
      ? "ลากการ์ดเพื่อขยับสถานะงานที่คุณรับผิดชอบ · คลิกดูรายละเอียดงานคนอื่นได้ตามปกติ"
      : "ติดตามสถานะงานตามขั้นตอน Workflow · การเปลี่ยนสถานะงานดำเนินการโดยทีม Visual & Design";

    // Render HTML Shell
    qs("#page-content").innerHTML = `
      <div class="page-header">
        <div>
          <div class="row-wrap" style="gap:8px; align-items:center; margin-bottom:4px">
            <h2 style="margin:0">Workflow Board</h2>
            ${roleBadgeHtml}
          </div>
          <p class="page-desc">${pageDesc}</p>
        </div>
        <div class="row-wrap" style="gap:8px">
          <span class="chip">Active ${activeTasksCount} งาน</span>
          ${createBtnHtml}
        </div>
      </div>

      <!-- Filter Toolbar -->
      <div class="board-toolbar">
        <div class="board-toolbar-row">
          <!-- Scope Toggle -->
          <div class="filter-pills">
            <button class="filter-pill ${currentScope === "all" ? "is-active" : ""}" id="scope-all">
              งานทั้งหมด <span class="pill-count">(${activeTasksCount})</span>
            </button>
            <button class="filter-pill ${currentScope === "mine" ? "is-active" : ""}" id="scope-mine">
              งานของฉัน <span class="pill-count">(${myTasksCount})</span>
            </button>
          </div>

          <!-- Realtime Search -->
          <div class="board-search-box">
            <span class="search-icon">⌕</span>
            <input id="board-search" type="search" placeholder="ค้นหางาน, โปรเจกต์, ดีไซเนอร์, ขนาด..." value="${escapeHtml(searchQuery)}" />
          </div>
        </div>

        <div class="board-toolbar-row" style="border-top: 1px dashed var(--line); padding-top: 10px;">
          <div class="board-filters">
            <!-- Member Filter -->
            <select class="board-filter-select" id="filter-member">
              <option value="">สมาชิกทุกคน</option>
              ${ctx.members.map((m) => `<option value="${escapeHtml(m.id)}" ${filterMemberId === m.id ? "selected" : ""}>${escapeHtml(m.name)}</option>`).join("")}
            </select>

            <!-- Project Filter -->
            <select class="board-filter-select" id="filter-project">
              <option value="">ทุกโปรเจกต์</option>
              ${ctx.projects.map((p) => `<option value="${escapeHtml(p.id)}" ${filterProjectId === p.id ? "selected" : ""}>${escapeHtml(p.name)}</option>`).join("")}
            </select>

            <!-- Urgency Filter -->
            <select class="board-filter-select" id="filter-urgency">
              <option value="all" ${filterUrgency === "all" ? "selected" : ""}>ทุกระดับกำหนดส่ง</option>
              <option value="overdue" ${filterUrgency === "overdue" ? "selected" : ""}>เลยกำหนด (Overdue)</option>
              <option value="due_soon" ${filterUrgency === "due_soon" ? "selected" : ""}>ใกล้กำหนดส่ง (< 2 ชม.)</option>
              <option value="normal" ${filterUrgency === "normal" ? "selected" : ""}>ปกติ</option>
            </select>

            <!-- Toggle Completed Column -->
            <label class="board-completed-toggle">
              <input type="checkbox" id="toggle-completed" ${showCompleted ? "checked" : ""}>
              <span>แสดงคอลัมน์ส่งมอบแล้ว</span>
            </label>
          </div>

          <button class="btn btn-sm" id="board-reset-filters">ล้างตัวกรอง</button>
        </div>
      </div>

      <!-- Kanban Grid -->
      <div class="kanban-wrap">
        <div class="kanban" style="grid-template-columns: repeat(${columnsToDisplay.length}, minmax(260px, 1fr))">
          ${columnsToDisplay.map((status) => {
            const rows = visibleTasks.filter((t) => t.status === status);
            const statusDotColor = status === "review" ? "var(--warn)" : status === "revision" ? "var(--danger)" : status === "drafting" ? "var(--info)" : status === "completed" ? "var(--ok)" : "var(--ink-300)";
            return `
              <section class="kcol" data-status="${status}">
                <div class="kcol-head">
                  <div class="kcol-title">
                    <span style="width:8px;height:8px;border-radius:50%;background:${statusDotColor}"></span>
                    ${STATUS_LABELS[status]}
                  </div>
                  <span class="kcol-head-count">${rows.length}</span>
                </div>
                <div class="kcol-body">
                  ${rows.map((task) => taskCard(task, { projects: ctx.projects, members: ctx.members, subtasks: ctx.subtasks })).join("") || `<div class="kcol-empty">ยังไม่มีงานในขั้นตอนนี้</div>`}
                </div>
              </section>
            `;
          }).join("")}
        </div>
      </div>
    `;

    // Bind Event Listeners
    qs("#board-create")?.addEventListener("click", () => openCreateTask(ctx));

    // Scope toggle
    qs("#scope-all")?.addEventListener("click", () => { currentScope = "all"; draw(); });
    qs("#scope-mine")?.addEventListener("click", () => { currentScope = "mine"; draw(); });

    // Search input
    const searchInput = qs("#board-search");
    searchInput?.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim();
      draw();
      // Keep focus on input after draw
      const el = qs("#board-search");
      if (el) {
        el.focus();
        el.selectionStart = el.selectionEnd = el.value.length;
      }
    });

    // Dropdown filters
    qs("#filter-member")?.addEventListener("change", (e) => { filterMemberId = e.target.value; draw(); });
    qs("#filter-project")?.addEventListener("change", (e) => { filterProjectId = e.target.value; draw(); });
    qs("#filter-urgency")?.addEventListener("change", (e) => { filterUrgency = e.target.value; draw(); });
    qs("#toggle-completed")?.addEventListener("change", (e) => { showCompleted = e.target.checked; draw(); });

    // Reset filters
    qs("#board-reset-filters")?.addEventListener("click", () => {
      currentScope = "all";
      searchQuery = "";
      filterMemberId = "";
      filterProjectId = "";
      filterUrgency = "all";
      showCompleted = false;
      draw();
    });

    // Task Card Clicks
    bindTaskCards(qs("#page-content"));

    // --- Drag and Drop Logic ---
    const cards = document.querySelectorAll(".kanban .task-card");
    const columns = document.querySelectorAll(".kcol");

    cards.forEach((card) => {
      const taskId = card.dataset.taskId;
      const task = ctx.tasks.find((t) => t.id === taskId);
      const isMyTask = task && task.assignee_id === ctx.member?.id;
      const canDragThisCard = canManage(ctx.member) || (canMove && isMyTask);

      if (!canDragThisCard) {
        card.draggable = false;
        card.style.cursor = "pointer";
        const assignee = task ? memberFor(task, ctx.members) : null;
        if (task && !isMyTask && !canManage(ctx.member)) {
          card.title = `งานของ ${assignee?.name || "ดีไซเนอร์ท่านอื่น"} (คลิกดูรายละเอียดได้ · เฉพาะผู้รับผิดชอบที่เลื่อนย้ายสถานะได้)`;
        }
        return;
      }
      card.draggable = true;
      card.addEventListener("dragstart", (e) => {
        card.classList.add("is-dragging");
        window.__dragTaskId = card.dataset.taskId;
        const task = ctx.tasks.find((t) => t.id === window.__dragTaskId);
        if (task) {
          // Highlight valid transition targets
          columns.forEach((col) => {
            const nextStatus = col.dataset.status;
            if (canTransition(task.status, nextStatus)) {
              col.classList.add("is-valid-target");
            } else if (task.status !== nextStatus) {
              col.classList.add("is-invalid-target");
            }
          });
        }
      });

      card.addEventListener("dragend", () => {
        card.classList.remove("is-dragging");
        columns.forEach((col) => {
          col.classList.remove("is-valid-target", "is-invalid-target", "is-dragover");
        });
      });
    });

    columns.forEach((col) => {
      col.addEventListener("dragover", (e) => {
        e.preventDefault();
        col.classList.add("is-dragover");
      });

      col.addEventListener("dragleave", (e) => {
        // Prevent flickering when moving over child elements
        if (!col.contains(e.relatedTarget)) {
          col.classList.remove("is-dragover");
        }
      });

      col.addEventListener("drop", async (e) => {
        e.preventDefault();
        col.classList.remove("is-dragover", "is-valid-target", "is-invalid-target");
        const taskId = window.__dragTaskId;
        const task = ctx.tasks.find((t) => t.id === taskId);
        const nextStatus = col.dataset.status;

        if (!task || task.status === nextStatus) return;

        const isMyTask = task.assignee_id === ctx.member?.id;
        const canDragThisCard = canManage(ctx.member) || (canMove && isMyTask);
        if (!canDragThisCard) {
          toast("คุณสามารถเปลี่ยนสถานะได้เฉพาะงานที่ได้รับมอบหมายเท่านั้น", "warn");
          return;
        }

        if (!canTransition(task.status, nextStatus)) {
          toast(`ขยับจาก "${STATUS_LABELS[task.status]}" ไป "${STATUS_LABELS[nextStatus]}" ไม่ได้ตามกติกา Workflow`, "warn");
          return;
        }

        // Special handling if moving to Revision
        if (nextStatus === "revision") {
          const modal = openModal({
            title: "ระบุข้อความที่ต้องแก้ไข (Revision)",
            body: `
              <form id="drag-revision-form">
                <div class="field">
                  <label>สิ่งที่ต้องแก้ไข / Feedback *</label>
                  <textarea name="reason" required placeholder="ระบุสิ่งที่ต้องปรับแก้ให้ละเอียด..."></textarea>
                </div>
              </form>
            `,
            footer: `
              <button class="btn" data-close-modal>ยกเลิก</button>
              <button class="btn btn-danger" id="submit-drag-rev">ยืนยันส่งแก้งาน</button>
            `
          });
          qs("#submit-drag-rev", modal).addEventListener("click", async () => {
            const form = qs("#drag-revision-form", modal);
            if (!form.reportValidity()) return;
            const reason = new FormData(form).get("reason");
            closeModal();
            try {
              await api.requestRevision(task.id, reason);
              toast(`ส่งแก้งาน "${task.title}" เรียบร้อยแล้ว`, "success");
              await rerender();
            } catch (err) {
              toast(err.message, "error");
            }
          });
          return;
        }

        // Standard status transition
        try {
          // Optimistic local update
          const prevStatus = task.status;
          task.status = nextStatus;
          draw();

          await api.changeStatus(task.id, nextStatus, "ลากวางบน Workflow Board");
          toast(`อัปเดต "${task.title}" เป็น "${STATUS_LABELS[nextStatus]}" แล้ว`, "success");
          await rerender();
        } catch (error) {
          toast(error.message, "error");
          await rerender();
        }
      });
    });
  };

  draw();
}
