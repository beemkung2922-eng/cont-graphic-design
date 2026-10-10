import { qs } from "./app.js";
import { escapeHtml, projectFor, memberFor, formatDate, taskTypeLabel, relativeDeadline } from "./formatters.js";
import {
  filterTasksByTimeRange,
  renderTimeFilterBarHtml,
  bindTimeFilterBar,
  calculateTeamAnalytics,
  renderMemberComparisonHtml,
  bindMemberComparison,
  initAdvancedCharts,
} from "./analytics.js";

export async function render(ctx) {
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

  let heatmapWeekOffset = 0;

  const draw = () => {
    const allTasks = ctx.tasks || [];
    const members = ctx.members || [];
    const projects = ctx.projects || [];
    const tasks = filterTasksByTimeRange(allTasks, filterState);
    const analytics = calculateTeamAnalytics(tasks, members, filterState.memberId);
    const completed = tasks.filter((task) => task.status === "completed");
    const active = tasks.filter((task) => task.status !== "completed");
    const totalRevision = tasks.reduce((sum, task) => sum + Number(task.revision_count || 0), 0);
    const late = active.filter((task) => relativeDeadline(task.deadline_at || task.deadline).className === "is-overdue");
    const itemTotal = tasks.reduce((sum, task) => sum + Number(task.item_count || 1), 0);

    qs("#page-content").innerHTML = `
      <div class="page-header">
        <div>
          <h2>Performance & Workload Reports</h2>
          <p class="page-desc">วิเคราะห์ภาระงานรายคน, สัดส่วนประเภทงาน, Throughput การส่งมอบ, Heatmap รายวัน และเปรียบเทียบ Est vs Actual Hours</p>
        </div>
        <div class="row-wrap">
          <span class="chip">ข้อมูล ${tasks.length} งาน (${itemTotal} ชิ้น)</span>
          <button class="btn" id="print-report">พิมพ์ / Export PDF</button>
        </div>
      </div>

      ${renderTimeFilterBarHtml({ ...filterState, matchCount: tasks.length })}

      <div class="grid grid-4" style="margin-bottom:16px">
        <div class="card report-card">
          <div class="text-xs text-muted">งานที่เสร็จแล้ว</div>
          <div class="report-number">${completed.length}</div>
        </div>
        <div class="card report-card">
          <div class="text-xs text-muted">จำนวนชิ้นงานทั้งหมด</div>
          <div class="report-number">${itemTotal}</div>
        </div>
        <div class="card report-card">
          <div class="text-xs text-muted">งานเลท (Overdue)</div>
          <div class="report-number" style="color:${late.length ? "var(--red)" : "inherit"};">${late.length}</div>
        </div>
        <div class="card report-card">
          <div class="text-xs text-muted">Average Revision</div>
          <div class="report-number">${tasks.length ? (totalRevision / tasks.length).toFixed(1) : "0.0"}</div>
        </div>
      </div>

      <!-- Advanced Workload & 6 Charts Suite -->
      ${renderMemberComparisonHtml({
        memberStats: analytics.memberStats,
        teamTotals: analytics.teamTotals,
        selectedMemberId: filterState.memberId,
        selectedStatus: filterState.status,
        projects,
        filteredTasks: tasks,
        allTasks,
        members,
        weekOffset: heatmapWeekOffset,
      })}
    `;

    bindTimeFilterBar(qs("#page-content"), {
      state: filterState,
      onChange: () => draw(),
    });

    bindMemberComparison(qs("#page-content"), {
      onSelectMember: (newMemberId) => {
        filterState.memberId = newMemberId;
        draw();
      },
      onSelectStatus: (newStatus) => {
        filterState.status = newStatus;
        draw();
      },
      onToggleWeek: (newOffset) => {
        heatmapWeekOffset = newOffset;
        draw();
      },
    });

    qs("#print-report")?.addEventListener("click", () => window.print());

    window.setTimeout(() => {
      initAdvancedCharts({
        container: qs("#page-content"),
        tasks,
        allTasks,
        members,
        selectedMemberId: filterState.memberId,
      });
    }, 0);
  };

  draw();
}
