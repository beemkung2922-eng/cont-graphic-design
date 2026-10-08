import { qs } from "./app.js";
import { escapeHtml, projectFor, memberFor, formatDate, taskTypeLabel, relativeDeadline } from "./formatters.js";
import { filterTasksByTimeRange, renderTimeFilterBarHtml, bindTimeFilterBar } from "./analytics.js";

export async function render(ctx) {
  const filterState = {
    period: "all",
    year: "all",
    month: "all",
    specificDay: "",
    startDate: "",
    endDate: "",
    dateField: "created_at",
  };

  const draw = () => {
    const allTasks = ctx.tasks || [];
    const tasks = filterTasksByTimeRange(allTasks, filterState);
    const completed = tasks.filter((task) => task.status === "completed");
    const active = tasks.filter((task) => task.status !== "completed");
    const totalRevision = tasks.reduce((sum, task) => sum + Number(task.revision_count || 0), 0);
    const late = active.filter((task) => relativeDeadline(task.deadline_at || task.deadline).className === "is-overdue");
    const itemTotal = tasks.reduce((sum, task) => sum + Number(task.item_count || 1), 0);
    const typeMap = new Map();
    tasks.forEach((task) => typeMap.set(taskTypeLabel(task.task_type), (typeMap.get(taskTypeLabel(task.task_type)) || 0) + 1));
    const topTypes = [...typeMap.entries()].sort((a, b) => b[1] - a[1]);
    const longest = [...active].sort((a, b) => new Date(a.created_at) - new Date(b.created_at)).slice(0, 5);

    qs("#page-content").innerHTML = `
      <div class="page-header">
        <div>
          <h2>Performance Report</h2>
          <p class="page-desc">สรุปจำนวนงาน จำนวนชิ้นงาน ประเภทงาน และงานที่เลทตามช่วงเวลา</p>
        </div>
        <div class="row-wrap">
          <span class="chip">ข้อมูล ${tasks.length} งาน</span>
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
          <div class="report-number">${late.length}</div>
        </div>
        <div class="card report-card">
          <div class="text-xs text-muted">Average Revision</div>
          <div class="report-number">${tasks.length ? (totalRevision / tasks.length).toFixed(1) : "0.0"}</div>
        </div>
      </div>

      <div class="dashboard-grid">
        <section class="card">
          <div class="card-header">
            <div>
              <div class="card-title">ประเภทงาน (Task Types)</div>
              <div class="card-sub">จำนวนงานแยกตามประเภทตามช่วงเวลาที่เลือก</div>
            </div>
          </div>
          <div class="bar-chart">
            ${topTypes.map(([name, count], index) => `
              <div class="bar-row">
                <span>${escapeHtml(name)}</span>
                <div class="bar-track">
                  <div class="bar-fill ${index === 0 ? "" : index === 1 ? "is-info" : "is-warn"}" style="width:${Math.max(8, Math.round((count / Math.max(topTypes[0]?.[1] || 1, 1)) * 100))}%"></div>
                </div>
                <span class="bar-value">${count} งาน</span>
              </div>
            `).join("") || `<div class="state">ยังไม่มีข้อมูลประเภทงาน</div>`}
          </div>
        </section>

        <section class="card">
          <div class="card-header">
            <div>
              <div class="card-title">สัญญาณที่ควรติดตาม</div>
              <div class="card-sub">ข้อมูลเพื่อวางแผนการทำงาน</div>
            </div>
          </div>
          <div class="quick-stat">
            <span class="label">งานรอคอมเมนต์ (Review)</span>
            <span class="value">${tasks.filter((task) => task.status === "review").length}</span>
          </div>
          <div class="quick-stat">
            <span class="label">งานกำลังแก้ไข (Revision)</span>
            <span class="value">${tasks.filter((task) => task.status === "revision").length}</span>
          </div>
          <div class="quick-stat">
            <span class="label">งานเลท (Overdue)</span>
            <span class="value">${late.length}</span>
          </div>
        </section>
      </div>

      <section class="card" style="margin-top:16px">
        <div class="card-header">
          <div>
            <div class="card-title">งานที่ยังไม่เสร็จ (Active Tasks)</div>
            <div class="card-sub">แสดงประเภท จำนวนชิ้น และเวลาที่เหลือ/เลท</div>
          </div>
        </div>
        <div class="table-wrap">
          <table class="data">
            <thead>
              <tr>
                <th>งาน</th>
                <th>ประเภท</th>
                <th>Project</th>
                <th>ผู้รับผิดชอบ</th>
                <th>จำนวนชิ้น</th>
                <th>เวลา</th>
              </tr>
            </thead>
            <tbody>
              ${longest.map((task) => `
                <tr>
                  <td><a href="task.html?id=${encodeURIComponent(task.id)}"><strong>${escapeHtml(task.title)}</strong></a></td>
                  <td>${escapeHtml(taskTypeLabel(task.task_type))}</td>
                  <td>${escapeHtml(projectFor(task, ctx.projects)?.name || "—")}</td>
                  <td>${escapeHtml(memberFor(task, ctx.members)?.name || "—")}</td>
                  <td>${Number(task.item_count || 1)}</td>
                  <td>${escapeHtml(relativeDeadline(task.deadline_at || task.deadline).label)}</td>
                </tr>
              `).join("") || `<tr><td colspan="6">ยังไม่มีข้อมูล</td></tr>`}
            </tbody>
          </table>
        </div>
      </section>
    `;

    bindTimeFilterBar(qs("#page-content"), {
      state: filterState,
      onChange: () => draw()
    });
    qs("#print-report")?.addEventListener("click", () => window.print());
  };

  draw();
}
