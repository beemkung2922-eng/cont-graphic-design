import { taskCard, interactiveEmptyState, formatDate, formatDateLong, relativeDeadline, avatar, escapeHtml, roleLabel, memberFor, projectFor, taskTypeLabel } from "./formatters.js";
import { STATUS_LABELS, STATUS_ORDER } from "./constants.js";
import { qs, toast } from "./app.js";
import { openCreateTask, bindTaskCards } from "./task-actions.js";
import { isRequester, isViewer, canCreateTask } from "./auth.js";
import { filterTasksByTimeRange, calculateTeamAnalytics, renderTimeFilterBarHtml, renderMemberComparisonHtml, bindTimeFilterBar, bindMemberComparison } from "./analytics.js";

export async function render(ctx) {
  const { tasks, members, projects, subtasks } = ctx;
  window.openCreateTask = () => openCreateTask(ctx);
  const isReq = isRequester(ctx.member);
  const isView = isViewer(ctx.member);
  const canCreate = canCreateTask(ctx.member);

  // Filter state for Date, Member, and Status
  const filterState = {
    period: "all",
    year: "all",
    month: "all",
    specificDay: "",
    startDate: "",
    endDate: "",
    dateField: "created_at",
    memberId: "all",
    status: "all",
  };

  const draw = () => {
    // 1. Filter tasks according to Time/Date & Member & Status
    const filteredTasks = filterTasksByTimeRange(tasks, filterState);
    const analytics = calculateTeamAnalytics(filteredTasks, members, filterState.memberId);

    const active = filteredTasks.filter((t) => t.status !== "completed");
    const dueSoon = filteredTasks.filter((t) => t.status !== "completed" && relativeDeadline(t.deadline_at || t.deadline).className);
    const review = filteredTasks.filter((t) => t.status === "review");
    const revision = filteredTasks.filter((t) => t.status === "revision");
    const completed = filteredTasks.filter((t) => t.status === "completed");
    const myTasks = filteredTasks.filter((t) => (t.assignee_id === ctx.member?.id || (isReq && t.created_by === ctx.member?.id)) && t.status !== "completed");
    const lateCount = active.filter((t) => relativeDeadline(t.deadline_at || t.deadline).className === "is-overdue").length;

    // Header create button
    const createBtnHtml = canCreate
      ? `<button class="btn btn-primary" id="dashboard-create">${isReq ? "＋ ส่งคำของาน / บรีฟงานใหม่" : "＋ สร้างงานใหม่"}</button>`
      : "";

    // Answer cards
    const answerCards = `
      <div class="answer-grid">
        <div class="answer"><div class="q">${isReq ? "งานที่คุณส่งบรีฟ" : "งานที่คุณรับผิดชอบ"}</div><div class="a">${myTasks.length} งานอยู่ในกระบวนการ</div></div>
        <div class="answer"><div class="q">งานไหนใกล้ Deadline?</div><div class="a">${dueSoon.length} งานต้องติดตาม</div></div>
        <div class="answer"><div class="q">งานอยู่ขั้นตอนรีวิว?</div><div class="a">${review.length} งานรอคอมเมนต์</div></div>
        <div class="answer"><div class="q">งานกำลังแก้ไข?</div><div class="a">${revision.length} งานส่งกลับมาแก้</div></div>
      </div>
    `;

    // Overview Stats
    const statsHtml = `
      <section class="section" style="margin-top:16px">
        <div class="stat-grid">
          <div class="stat is-primary">
            <div class="stat-label">งานทั้งหมดในช่วงนี้</div>
            <div class="stat-value">${filteredTasks.length}</div>
            <div class="stat-hint">ทั้ง Active และ Completed</div>
          </div>
          <div class="stat is-info">
            <div class="stat-label">กำลังทำ (Active)</div>
            <div class="stat-value">${active.length}</div>
            <div class="stat-hint">อยู่ในขั้นตอนการออกแบบ</div>
          </div>
          <div class="stat is-warn">
            <div class="stat-label">รอตรวจ (Review)</div>
            <div class="stat-value">${review.length}</div>
            <div class="stat-hint">ส่งดราฟต์ให้ตรวจแล้ว</div>
          </div>
          <div class="stat is-danger">
            <div class="stat-label">แก้ไขงาน (Revision)</div>
            <div class="stat-value">${revision.length}</div>
            <div class="stat-hint">มีคอมเมนต์สั่งปรับแก้</div>
          </div>
          <div class="stat is-ok">
            <div class="stat-label">ส่งมอบแล้ว (Completed)</div>
            <div class="stat-value">${completed.length}</div>
            <div class="stat-hint">อนุมัติและปิดงานแล้ว</div>
          </div>
        </div>
      </section>
    `;

    // Activity list
    const activityList = active.slice(0, 5).map((task) => {
      const member = memberFor(task, members);
      const dotColor = task.status === "review" ? "var(--status-review)" : task.status === "revision" ? "var(--status-revision)" : "var(--status-drafting)";
      return `
        <div class="activity-item">
          <div class="activity-dot" style="background:${dotColor};"></div>
          <div class="activity-main">
            <div class="activity-name">${escapeHtml(member?.name || "ไม่ระบุผู้รับผิดชอบ")} <span class="text-muted" style="font-weight:400">· ${escapeHtml(roleLabel(member?.role))}</span></div>
            <div class="activity-task"><a href="task.html?id=${encodeURIComponent(task.id)}" style="color:inherit;font-weight:600;">${escapeHtml(task.title)}</a> · ${escapeHtml(STATUS_LABELS[task.status])}</div>
          </div>
          <div class="activity-right">
            <div class="text-xs text-muted">${Number(task.item_count || 1)} ชิ้น</div>
            <div class="text-xs text-muted">${formatDate(task.deadline_at || task.deadline)}</div>
          </div>
        </div>
      `;
    }).join("");

    // Deadlines list
    const deadlinesList = [...filteredTasks].filter((t) => t.status !== "completed")
      .sort((a, b) => String(a.deadline_at || a.deadline).localeCompare(String(b.deadline_at || b.deadline)))
      .slice(0, 5).map((task) => {
        const project = projectFor(task, projects);
        const member = memberFor(task, members);
        const date = task.deadline_at ? new Date(task.deadline_at) : task.deadline ? new Date(`${task.deadline}T12:00:00`) : null;
        const urgency = relativeDeadline(task.deadline_at || task.deadline);
        return `
          <div class="deadline-item">
            <div class="deadline-date">
              <span class="day">${date ? date.getDate() : "—"}</span>
              <span class="month">${date ? date.toLocaleDateString("th-TH", { month: "short" }) : "—"}</span>
            </div>
            <div class="deadline-main">
              <div class="deadline-title"><a href="task.html?id=${encodeURIComponent(task.id)}" style="color:inherit;">${escapeHtml(task.title)}</a></div>
              <div class="deadline-sub">${escapeHtml(project?.name || "—")} · ${escapeHtml(member?.name || "—")}</div>
            </div>
            <span class="badge ${urgency.className === "is-overdue" ? "badge-danger" : urgency.className ? "badge-warn" : "badge-neutral"}">${escapeHtml(urgency.label)}</span>
          </div>
        `;
      }).join("");

    // Urgent cards
    const urgentCards = dueSoon.slice(0, 3).map((task) => taskCard(task, { projects, members, subtasks })).join("");
    const emptyUrgentHtml = interactiveEmptyState({
      title: "ไม่มีงานเร่งด่วนในช่วงเวลานี้",
      subtitle: "งานทั้งหมดอยู่ในกำหนดส่งตามแผน หรือไม่มีงานค้างตามตัวกรองที่เลือก",
      small: true
    });

    // Putting everything together into #page-content
    qs("#page-content").innerHTML = `
      <div class="page-header">
        <div>
          <h2>ภาพรวมคิวงาน & สถิติทีมออกแบบ</h2>
          <p class="page-desc">วิเคราะห์ Workflow, กำหนดส่ง และเปรียบเทียบภาระงานของทีมในจุดเดียว</p>
        </div>
        <div class="row-wrap" style="gap:10px;">
          <span class="chip">อัปเดตล่าสุด ${new Intl.DateTimeFormat("th-TH", { hour: "2-digit", minute: "2-digit" }).format(new Date())}</span>
          ${createBtnHtml}
        </div>
      </div>

      <!-- Time & Date Filter Card -->
      ${renderTimeFilterBarHtml({ ...filterState, matchCount: filteredTasks.length })}

      <!-- Answer Grid & Stats -->
      ${answerCards}
      ${statsHtml}

      <!-- Member Comparison & Status Breakdown Chart -->
      ${renderMemberComparisonHtml({
        memberStats: analytics.memberStats,
        teamTotals: analytics.teamTotals,
        selectedMemberId: filterState.memberId,
        selectedStatus: filterState.status,
        projects,
        filteredTasks
      })}

      <!-- Current Activity & Upcoming Deadlines -->
      <div class="dashboard-grid">
        <section class="card">
          <div class="card-header">
            <div>
              <div class="card-title">ความเคลื่อนไหวในทีม (Current Activity)</div>
              <div class="card-sub">งานที่กำลังเคลื่อนไหวตามช่วงเวลาที่เลือก</div>
            </div>
            <a class="btn btn-ghost btn-sm" href="team.html">ดูทีมทั้งหมด →</a>
          </div>
          ${activityList || `<div class="state" style="padding:24px;">ไม่มีความเคลื่อนไหวในช่วงเวลานี้</div>`}
        </section>

        <section class="card">
          <div class="card-header">
            <div>
              <div class="card-title">กำหนดส่งเร็วๆ นี้ (Upcoming Deadlines)</div>
              <div class="card-sub">งานที่ต้องติดตามส่งมอบ</div>
            </div>
            <a class="btn btn-ghost btn-sm" href="calendar.html">เปิดปฏิทิน →</a>
          </div>
          ${deadlinesList || `<div class="state" style="padding:24px;">ไม่มีกำหนดส่งในช่วงเวลานี้</div>`}
        </section>
      </div>

      <!-- Urgent Tasks Grid -->
      <div class="card" style="margin-top:16px;">
        <div class="card-header">
          <div>
            <div class="card-title">งานที่ต้องจับตาเป็นพิเศษ</div>
            <div class="card-sub">งานใกล้กำหนดส่งและงานที่กำลังรอความเห็น</div>
          </div>
          <a class="btn btn-ghost btn-sm" href="board.html">เปิดบอร์ด Kanban →</a>
        </div>
        <div class="task-grid" style="grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));">
          ${urgentCards || emptyUrgentHtml}
        </div>
      </div>
    `;

    // Bind event listeners
    qs("#dashboard-create")?.addEventListener("click", () => openCreateTask(ctx));
    bindTimeFilterBar(qs("#page-content"), {
      state: filterState,
      onChange: () => draw()
    });
    bindMemberComparison(qs("#page-content"), {
      onSelectMember: (memberId) => {
        filterState.memberId = memberId;
        draw();
      },
      onSelectStatus: (statusKey) => {
        filterState.status = filterState.status === statusKey ? "all" : statusKey;
        draw();
      }
    });
    bindTaskCards(qs("#page-content"));
  };

  draw();
}
