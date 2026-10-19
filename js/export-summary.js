/**
 * CONT Graphic Design Workflow — Executive Summary & Data Export Module
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides comprehensive data export, professional printable executive report,
 * and instant clipboard summary generation.
 */

import { escapeHtml, projectFor, memberFor, formatDate, formatDateTime, taskTypeLabel, relativeDeadline } from "./formatters.js";
import { STATUS_LABELS, STATUS_ORDER } from "./constants.js";
import { qs, openModal, closeModal, toast } from "./app.js";
import { MONTH_NAMES_TH } from "./analytics.js";

const STATUS_TH = {
  brief: "รอรับบรีฟ",
  drafting: "กำลังดราฟต์",
  review: "รอตรวจ/คอมเมนต์",
  revision: "แก้ไขงาน",
  completed: "ส่งมอบสำเร็จ",
};

/**
 * Get human-readable label for current filter state
 */
export function getFilterPeriodLabel(filterState = {}) {
  const period = filterState.period || "all";
  if (period === "today") return "วันนี้";
  if (period === "7days") return "7 วันล่าสุด";
  if (period === "month") return "เดือนนี้";
  if (period === "year") return "ปีนี้";
  if (period === "custom" && (filterState.startDate || filterState.endDate)) {
    return `${filterState.startDate || "เริ่มต้น"} ถึง ${filterState.endDate || "ปัจจุบัน"}`;
  }
  if (filterState.month && filterState.month !== "all") {
    const mIdx = parseInt(filterState.month, 10) - 1;
    const mName = MONTH_NAMES_TH[mIdx] || "";
    return filterState.year && filterState.year !== "all" ? `${mName} ${filterState.year}` : mName;
  }
  if (filterState.year && filterState.year !== "all") {
    return `ปี ${filterState.year}`;
  }
  return "ข้อมูลทั้งหมด (All Time)";
}

/**
 * 1. Export Data to Excel (.CSV with UTF-8 BOM for Thai Support)
 */
export function exportToExcel(tasks, members, projects, filterLabel = "ทั้งหมด") {
  if (!tasks || !tasks.length) {
    toast("ไม่มีข้อมูลสำหรับส่งออก Excel ในช่วงเวลานี้", "warn");
    return;
  }

  const headers = [
    "ID",
    "ชื่องาน (Task Title)",
    "โปรเจกต์ (Project)",
    "ผู้รับผิดชอบ (Designer)",
    "ผู้ขอเปิดงาน (Requester)",
    "ประเภทงาน (Type)",
    "สถานะ (Status)",
    "จำนวนชิ้น (Count)",
    "ขนาด (Dimensions)",
    "ช่องทาง (Channel)",
    "รอบแก้ไข (Revisions)",
    "วันที่สร้าง (Created At)",
    "กำหนดส่ง (Deadline)",
    "สถานะ SLA (SLA Status)"
  ];

  const rows = tasks.map((t) => {
    const proj = projectFor(t, projects)?.name || "-";
    const mem = memberFor(t, members)?.name || "ยังไม่มอบหมาย";
    const req = t.created_by_name || t.requester_name || "-";
    const sla = relativeDeadline(t.deadline_at || t.deadline).label;
    const statusText = STATUS_TH[t.status] || STATUS_LABELS[t.status] || t.status || "-";
    const typeText = taskTypeLabel(t.task_type || "") || t.task_type || "-";

    return [
      `"${(t.id || "").replace(/"/g, '""')}"`,
      `"${(t.title || "").replace(/"/g, '""')}"`,
      `"${proj.replace(/"/g, '""')}"`,
      `"${mem.replace(/"/g, '""')}"`,
      `"${req.replace(/"/g, '""')}"`,
      `"${typeText.replace(/"/g, '""')}"`,
      `"${statusText.replace(/"/g, '""')}"`,
      Number(t.item_count || 1),
      `"${(t.dimensions || "").replace(/"/g, '""')}"`,
      `"${(t.channel || "").replace(/"/g, '""')}"`,
      Number(t.revision_count || 0),
      `"${formatDate(t.created_at)}"`,
      `"${formatDate(t.deadline_at || t.deadline)}"`,
      `"${sla.replace(/"/g, '""')}"`
    ].join(",");
  });

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const nowStr = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url);
  link.setAttribute("download", `CONT_Performance_Report_${nowStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  toast(`ดาวน์โหลดรายงาน Excel (${tasks.length} งาน) สำเร็จแล้ว`, "success");
}

/**
 * 2. Copy Structured Markdown / Text Summary to Clipboard
 */
export function copySummaryToClipboard({ tasks, members, projects, filterState }) {
  if (!tasks || !tasks.length) {
    toast("ไม่มีข้อมูลสำหรับคัดลอกสรุป", "warn");
    return;
  }

  const periodLabel = getFilterPeriodLabel(filterState);
  const nowThaiStr = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const totalTasks = tasks.length;
  const totalItems = tasks.reduce((sum, t) => sum + Number(t.item_count || 1), 0);
  const completed = tasks.filter((t) => t.status === "completed");
  const active = tasks.filter((t) => t.status !== "completed");
  const overdue = tasks.filter((t) => t.status !== "completed" && relativeDeadline(t.deadline_at || t.deadline).className === "is-overdue");
  const review = tasks.filter((t) => ["review", "revision"].includes(t.status));
  const completionRate = Math.round((completed.length / (totalTasks || 1)) * 100);
  const onTimeRate = (100 - (overdue.length / (totalTasks || 1)) * 100).toFixed(1);

  // Top 5 Projects
  const projectCounts = projects.map((p) => {
    const pTasks = tasks.filter((t) => t.project_id === p.id);
    const pDone = pTasks.filter((t) => t.status === "completed").length;
    return { name: p.name, count: pTasks.length, completed: pDone };
  }).filter(p => p.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);

  // Designer workload
  const designers = members.filter(m => ["designer", "supervisor", "admin"].includes(m.role));
  const designerStats = designers.map(m => {
    const mTasks = tasks.filter(t => t.assignee_id === m.id);
    const mDone = mTasks.filter(t => t.status === "completed").length;
    const mActive = mTasks.filter(t => t.status !== "completed").length;
    return { name: m.name, total: mTasks.length, completed: mDone, active: mActive };
  }).filter(d => d.total > 0).sort((a, b) => b.total - a.total);

  const text = [
    `📊 สรุปรายงานผลงานและการผลิต — CONT Workflow`,
    `🗓️ ช่วงเวลา: ${periodLabel}`,
    `⏰ ข้อมูล ณ วันที่: ${nowThaiStr}`,
    ``,
    `📈 ตัวเลขสถิติสำคัญ:`,
    `• งานทั้งหมดในระบบ: ${totalTasks} งาน (${totalItems} ชิ้นงาน)`,
    `• ส่งมอบสำเร็จแล้ว: ${completed.length} งาน (${completionRate}%)`,
    `• กำลังดำเนินการในคิว: ${active.length} งาน`,
    `• รอตรวจ / รอแก้ไข: ${review.length} งาน`,
    `• งานที่เลยกำหนด (Overdue): ${overdue.length} งาน`,
    `• อัตราส่งมอบตรงเวลา (On-Time SLA): ${onTimeRate}%`,
    ``,
    `📁 5 โครงการที่มีปริมาณงานมากที่สุด:`,
    ...projectCounts.map((p, i) => `${i + 1}. ${p.name}: ${p.count} งาน (เสร็จแล้ว ${p.completed} งาน)`),
    ``,
    `👥 สรุปภาระงานทีมดีไซเนอร์:`,
    ...designerStats.map(d => `• ${d.name}: รับผิดชอบ ${d.total} งาน | กำลังทำ ${d.active} งาน | เสร็จแล้ว ${d.completed} งาน`),
    ``,
    `รายงานออกโดยระบบ CONT Graphic Design Workflow`
  ].join("\n");

  navigator.clipboard.writeText(text).then(() => {
    toast("คัดลอกข้อความสรุปภาพรวมเรียบร้อยแล้ว พร้อมส่งลง LINE หรือ Email", "success");
  }).catch(() => {
    toast("ไม่สามารถคัดลอกข้อความได้ กรุณาลองใหม่อีกครั้ง", "error");
  });
}

/**
 * 3. Generate Official Clean Printable Executive Dossier (PDF / Print-Ready)
 */
export function printExecutiveReport({ tasks, members, projects, filterState }) {
  if (!tasks || !tasks.length) {
    toast("ไม่มีข้อมูลสำหรับพิมพ์รายงาน", "warn");
    return;
  }

  const periodLabel = getFilterPeriodLabel(filterState);
  const nowThaiStr = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  const totalTasks = tasks.length;
  const totalItems = tasks.reduce((sum, t) => sum + Number(t.item_count || 1), 0);
  const completed = tasks.filter((t) => t.status === "completed");
  const active = tasks.filter((t) => t.status !== "completed");
  const briefCount = tasks.filter((t) => t.status === "brief").length;
  const draftingCount = tasks.filter((t) => t.status === "drafting").length;
  const reviewCount = tasks.filter((t) => t.status === "review").length;
  const revisionCount = tasks.filter((t) => t.status === "revision").length;
  const overdue = tasks.filter((t) => t.status !== "completed" && relativeDeadline(t.deadline_at || t.deadline).className === "is-overdue");
  const completionRate = Math.round((completed.length / (totalTasks || 1)) * 100);
  const onTimeRate = (100 - (overdue.length / (totalTasks || 1)) * 100).toFixed(1);

  // Project ranking
  const projectList = projects.map((p) => {
    const pTasks = tasks.filter((t) => t.project_id === p.id);
    const pDone = pTasks.filter((t) => t.status === "completed").length;
    const pActive = pTasks.filter((t) => t.status !== "completed").length;
    const pPct = pTasks.length ? Math.round((pDone / pTasks.length) * 100) : 0;
    return { name: p.name, total: pTasks.length, completed: pDone, active: pActive, pct: pPct };
  }).filter((p) => p.total > 0).sort((a, b) => b.total - a.total);

  // Designer Performance
  const designers = members.filter((m) => ["designer", "supervisor", "admin"].includes(m.role));
  const designerList = designers.map((m) => {
    const mTasks = tasks.filter((t) => t.assignee_id === m.id);
    const mDone = mTasks.filter((t) => t.status === "completed").length;
    const mActive = mTasks.filter((t) => t.status !== "completed").length;
    const mOverdue = mTasks.filter((t) => t.status !== "completed" && relativeDeadline(t.deadline_at || t.deadline).className === "is-overdue").length;
    const mPct = mTasks.length ? Math.round((mDone / mTasks.length) * 100) : 0;
    return { name: m.name, role: m.role, total: mTasks.length, completed: mDone, active: mActive, overdue: mOverdue, pct: mPct };
  }).filter((d) => d.total > 0).sort((a, b) => b.total - a.total);

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast("กรุณาอนุญาตป๊อปอัปในเบราว์เซอร์เพื่อเปิดรายงานสรุปสำหรับการพิมพ์", "warn");
    return;
  }

  printWindow.document.write(`
    <!doctype html>
    <html lang="th">
    <head>
      <meta charset="utf-8">
      <title>CONT — รายงานสรุปผลงานและการผลิต (${periodLabel})</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=Space+Mono:wght@700&display=swap" rel="stylesheet">
      <style>
        @page { size: A4; margin: 12mm 15mm; }
        * { box-sizing: border-box; }
        body {
          font-family: 'IBM Plex Sans Thai', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #0f172a;
          background: #ffffff;
          margin: 0;
          padding: 24px;
          font-size: 13px;
          line-height: 1.5;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #0f172a;
          padding-bottom: 14px;
          margin-bottom: 20px;
        }
        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .brand-badge {
          background: #e11d48;
          color: #ffffff;
          font-weight: 800;
          font-size: 14px;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: 'Space Mono', monospace;
        }
        .brand-name {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .doc-title {
          font-size: 18px;
          font-weight: 700;
          margin: 6px 0 2px;
          color: #0f172a;
        }
        .doc-sub {
          font-size: 12px;
          color: #64748b;
          margin: 0;
        }
        .meta-box {
          text-align: right;
          font-size: 11px;
          color: #475569;
          line-height: 1.6;
        }
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 10px;
          margin-bottom: 24px;
        }
        .kpi-card {
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 8px;
          padding: 10px 12px;
        }
        .kpi-card.ok {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }
        .kpi-card.warn {
          background: #fef2f2;
          border-color: #fecaca;
        }
        .kpi-label {
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .kpi-value {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
        }
        .kpi-sub {
          font-size: 10px;
          color: #10b981;
          font-weight: 600;
        }
        .kpi-sub.warn {
          color: #ef4444;
        }

        .section-head {
          font-size: 13px;
          font-weight: 700;
          color: #0f172a;
          margin: 20px 0 8px;
          padding-bottom: 4px;
          border-bottom: 1.5px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 18px;
          font-size: 11.5px;
        }
        th {
          background: #f1f5f9;
          color: #334155;
          text-align: left;
          padding: 7px 10px;
          font-weight: 700;
          border-bottom: 1px solid #cbd5e1;
        }
        td {
          padding: 7px 10px;
          border-bottom: 1px solid #f1f5f9;
          color: #1e293b;
        }
        tr:nth-child(even) td {
          background: #f8fafc;
        }
        .badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 9.5px;
          font-weight: 600;
        }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-blue { background: #e0f2fe; color: #0369a1; }
        .badge-yellow { background: #fef3c7; color: #92400e; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        .pipeline-overview-bar {
          display: flex;
          height: 18px;
          border-radius: 4px;
          overflow: hidden;
          margin: 8px 0 16px;
          font-size: 10px;
          font-weight: 700;
          color: #fff;
          text-align: center;
          line-height: 18px;
        }
        .p-brief { background: #f59e0b; }
        .p-drafting { background: #0ea5e9; }
        .p-review { background: #ef4444; }
        .p-completed { background: #10b981; }

        .footer {
          margin-top: 32px;
          padding-top: 14px;
          border-top: 1px solid #cbd5e1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10.5px;
          color: #64748b;
        }
        .action-bar {
          background: #0f172a;
          color: #fff;
          padding: 10px 16px;
          border-radius: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .btn-print {
          background: #e11d48;
          color: #fff;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          font-size: 12px;
        }
        @media print {
          .no-print { display: none !important; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="action-bar no-print">
        <span>📄 รายงานสรุปผู้บริหารพร้อมสั่งพิมพ์หรือบันทึกเป็น PDF</span>
        <button class="btn-print" onclick="window.print()">🖨️ พิมพ์ / บันทึก PDF ตอนนี้</button>
      </div>

      <div class="header">
        <div>
          <div class="brand">
            <span class="brand-badge">CONT</span>
            <span class="brand-name">Graphic Design Workflow</span>
          </div>
          <h1 class="doc-title">รายงานสรุปภาพรวมและการผลิต (Executive Performance Summary)</h1>
          <p class="doc-sub">ครอบคลุมสถานะงานใน Pipeline, ประสิทธิภาพการส่งมอบ และภาระงานทีม</p>
        </div>
        <div class="meta-box">
          <div><strong>ช่วงเวลารายงาน:</strong> ${periodLabel}</div>
          <div><strong>วันที่ออกรายงาน:</strong> ${nowThaiStr}</div>
          <div><strong>ปริมาณข้อมูล:</strong> ${totalTasks} งาน (${totalItems} ชิ้น)</div>
        </div>
      </div>

      <!-- KPI Summary Cards -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-label">งานทั้งหมด</div>
          <div class="kpi-value">${totalTasks}</div>
          <div class="kpi-sub" style="color:#64748b;">${totalItems} ชิ้นงาน</div>
        </div>
        <div class="kpi-card ok">
          <div class="kpi-label">ส่งมอบสำเร็จ</div>
          <div class="kpi-value">${completed.length}</div>
          <div class="kpi-sub">${completionRate}% สำเร็จ</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">กำลังทำในคิว</div>
          <div class="kpi-value">${active.length}</div>
          <div class="kpi-sub" style="color:#0284c7;">Active Queue</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">รอตรวจ/คอมเมนต์</div>
          <div class="kpi-value">${reviewCount + revisionCount}</div>
          <div class="kpi-sub" style="color:#d97706;">Review / Fix</div>
        </div>
        <div class="kpi-card ${overdue.length > 0 ? 'warn' : 'ok'}">
          <div class="kpi-label">เลยกำหนดส่ง</div>
          <div class="kpi-value">${overdue.length}</div>
          <div class="kpi-sub ${overdue.length > 0 ? 'warn' : ''}">${overdue.length > 0 ? 'ต้องติดตาม SLA' : 'ตามกำหนดทั้งหมด'}</div>
        </div>
        <div class="kpi-card ok">
          <div class="kpi-label">ตรงตาม SLA</div>
          <div class="kpi-value">${onTimeRate}%</div>
          <div class="kpi-sub">On-Time Target</div>
        </div>
      </div>

      <!-- Pipeline Segmented Bar -->
      <div class="section-head">
        <span>สถานะงานใน Pipeline (${active.length} งานที่กำลังดำเนินการ)</span>
        <span style="font-size:11px;color:#64748b;">บรีฟ: ${briefCount} | ดราฟต์: ${draftingCount} | ตรวจ: ${reviewCount} | แก้: ${revisionCount} | ส่งมอบ: ${completed.length}</span>
      </div>
      <div class="pipeline-overview-bar">
        <div class="p-brief" style="width:${Math.max(5, (briefCount / (totalTasks || 1)) * 100)}%">บรีฟ (${briefCount})</div>
        <div class="p-drafting" style="width:${Math.max(5, (draftingCount / (totalTasks || 1)) * 100)}%">ดราฟต์ (${draftingCount})</div>
        <div class="p-review" style="width:${Math.max(5, ((reviewCount + revisionCount) / (totalTasks || 1)) * 100)}%">ตรวจ/แก้ (${reviewCount + revisionCount})</div>
        <div class="p-completed" style="width:${Math.max(5, (completed.length / (totalTasks || 1)) * 100)}%">ส่งมอบแล้ว (${completed.length})</div>
      </div>

      <!-- Project Workload Breakdown Table -->
      <div class="section-head">
        <span>สัดส่วนและสถานะงานแยกตามโครงการ (Projects Breakdown)</span>
        <span style="font-size:11px;color:#64748b;">รวมทั้งหมด ${projectList.length} โครงการ</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:40px;">#</th>
            <th>ชื่อโครงการ (Project Name)</th>
            <th class="text-center" style="width:100px;">งานทั้งหมด</th>
            <th class="text-center" style="width:100px;">กำลังทำ</th>
            <th class="text-center" style="width:100px;">ส่งมอบแล้ว</th>
            <th class="text-right" style="width:110px;">ความคืบหน้า</th>
          </tr>
        </thead>
        <tbody>
          ${projectList.map((p, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><strong>${escapeHtml(p.name)}</strong></td>
              <td class="text-center">${p.total} งาน</td>
              <td class="text-center">${p.active} งาน</td>
              <td class="text-center">${p.completed} งาน</td>
              <td class="text-right">
                <span class="badge ${p.pct >= 90 ? 'badge-green' : p.pct >= 50 ? 'badge-blue' : 'badge-yellow'}">${p.pct}%</span>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <!-- Designer Performance Table -->
      <div class="section-head">
        <span>ประสิทธิภาพและภาระงานของทีมดีไซเนอร์ (Designer Workload & SLA)</span>
        <span style="font-size:11px;color:#64748b;">รวม ${designerList.length} สมาชิกทีม</span>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:40px;">#</th>
            <th>ชื่อดีไซเนอร์ (Designer Name)</th>
            <th class="text-center" style="width:100px;">งานที่รับผิดชอบ</th>
            <th class="text-center" style="width:90px;">กำลังทำ</th>
            <th class="text-center" style="width:90px;">ส่งมอบแล้ว</th>
            <th class="text-center" style="width:90px;">เลยกำหนด</th>
            <th class="text-right" style="width:110px;">อัตราสำเร็จ</th>
          </tr>
        </thead>
        <tbody>
          ${designerList.map((d, i) => `
            <tr>
              <td>${i + 1}</td>
              <td><strong>${escapeHtml(d.name)}</strong></td>
              <td class="text-center">${d.total} งาน</td>
              <td class="text-center">${d.active} งาน</td>
              <td class="text-center">${d.completed} งาน</td>
              <td class="text-center">${d.overdue > 0 ? `<span class="badge badge-red">${d.overdue} งาน</span>` : `<span style="color:#10b981;">0</span>`}</td>
              <td class="text-right">
                <span class="badge ${d.pct >= 90 ? 'badge-green' : d.pct >= 50 ? 'badge-blue' : 'badge-yellow'}">${d.pct}%</span>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>

      <div class="footer">
        <div>CONT Graphic Design Production & Workflow Management System</div>
        <div>หน้า 1 / 1 · เอกสารสรุปผู้บริหาร</div>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * 4. Open the Rich Executive Summary & Export Modal on Screen
 */
export function openExportSummaryModal({ tasks, allTasks, members, projects, filterState }) {
  const currentTasks = tasks && tasks.length ? tasks : (allTasks || []);
  if (!currentTasks.length) {
    toast("ไม่มีข้อมูลงานในระบบสำหรับส่งออกสรุป", "warn");
    return;
  }

  const periodLabel = getFilterPeriodLabel(filterState);
  const nowThaiStr = new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  const totalTasks = currentTasks.length;
  const totalItems = currentTasks.reduce((sum, t) => sum + Number(t.item_count || 1), 0);
  const completed = currentTasks.filter((t) => t.status === "completed");
  const active = currentTasks.filter((t) => t.status !== "completed");
  const briefCount = currentTasks.filter((t) => t.status === "brief").length;
  const draftingCount = currentTasks.filter((t) => t.status === "drafting").length;
  const reviewCount = currentTasks.filter((t) => t.status === "review").length;
  const revisionCount = currentTasks.filter((t) => t.status === "revision").length;
  const overdue = currentTasks.filter((t) => t.status !== "completed" && relativeDeadline(t.deadline_at || t.deadline).className === "is-overdue");
  const completionRate = Math.round((completed.length / (totalTasks || 1)) * 100);
  const onTimeRate = (100 - (overdue.length / (totalTasks || 1)) * 100).toFixed(1);

  // Top 5 Projects
  const topProjects = projects.map((p) => {
    const pTasks = currentTasks.filter((t) => t.project_id === p.id);
    const pDone = pTasks.filter((t) => t.status === "completed").length;
    const pActive = pTasks.filter((t) => t.status !== "completed").length;
    const pPct = pTasks.length ? Math.round((pDone / pTasks.length) * 100) : 0;
    return { name: p.name, total: pTasks.length, completed: pDone, active: pActive, pct: pPct };
  }).filter((p) => p.total > 0).sort((a, b) => b.total - a.total).slice(0, 6);

  // Top Designers
  const designers = members.filter((m) => ["designer", "supervisor", "admin"].includes(m.role));
  const designerStats = designers.map((m) => {
    const mTasks = currentTasks.filter((t) => t.assignee_id === m.id);
    const mDone = mTasks.filter((t) => t.status === "completed").length;
    const mActive = mTasks.filter((t) => t.status !== "completed").length;
    const mOverdue = mTasks.filter((t) => t.status !== "completed" && relativeDeadline(t.deadline_at || t.deadline).className === "is-overdue").length;
    return { name: m.name, total: mTasks.length, completed: mDone, active: mActive, overdue: mOverdue };
  }).filter((d) => d.total > 0).sort((a, b) => b.total - a.total).slice(0, 7);

  const modalBodyHtml = `
    <div class="export-summary-shell" style="padding: 4px 0 16px;">
      <!-- Header Meta Banner -->
      <div style="background:#1a1d30;border:1px solid #2a3150;border-radius:10px;padding:12px 16px;margin-bottom:18px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
        <div>
          <div style="font-size:0.82rem;color:#94a3b8;margin-bottom:2px;">ช่วงเวลาข้อมูลที่เลือก</div>
          <div style="font-size:1.05rem;font-weight:700;color:#ffffff;display:flex;align-items:center;gap:8px;">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#19c3eb;"></span>
            ${escapeHtml(periodLabel)}
          </div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.75rem;color:#94a3b8;">ข้อมูล ณ วันที่</div>
          <div style="font-size:0.85rem;color:#e2e8f0;font-weight:600;">${nowThaiStr}</div>
        </div>
      </div>

      <!-- 6 High-Level KPI Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:10px;margin-bottom:20px;">
        <div style="background:#16192b;border:1px solid #252b45;border-radius:8px;padding:12px;">
          <div style="font-size:0.75rem;color:#94a3b8;margin-bottom:4px;">งานทั้งหมด</div>
          <div style="font-size:1.4rem;font-weight:800;color:#ffffff;">${totalTasks} <span style="font-size:0.8rem;color:#94a3b8;font-weight:500;">งาน</span></div>
          <div style="font-size:0.72rem;color:#19c3eb;margin-top:2px;">${totalItems} ชิ้นงาน</div>
        </div>

        <div style="background:#16192b;border:1px solid #252b45;border-radius:8px;padding:12px;">
          <div style="font-size:0.75rem;color:#94a3b8;margin-bottom:4px;">ส่งมอบแล้ว</div>
          <div style="font-size:1.4rem;font-weight:800;color:#22c55e;">${completed.length} <span style="font-size:0.8rem;color:#94a3b8;font-weight:500;">งาน</span></div>
          <div style="font-size:0.72rem;color:#22c55e;margin-top:2px;">↑ ${completionRate}% สำเร็จ</div>
        </div>

        <div style="background:#16192b;border:1px solid #252b45;border-radius:8px;padding:12px;">
          <div style="font-size:0.75rem;color:#94a3b8;margin-bottom:4px;">กำลังทำในคิว</div>
          <div style="font-size:1.4rem;font-weight:800;color:#19c3eb;">${active.length} <span style="font-size:0.8rem;color:#94a3b8;font-weight:500;">งาน</span></div>
          <div style="font-size:0.72rem;color:#94a3b8;margin-top:2px;">Active Pipeline</div>
        </div>

        <div style="background:#16192b;border:1px solid #252b45;border-radius:8px;padding:12px;">
          <div style="font-size:0.75rem;color:#94a3b8;margin-bottom:4px;">รอตรวจ / แก้ไข</div>
          <div style="font-size:1.4rem;font-weight:800;color:#a855f7;">${reviewCount + revisionCount} <span style="font-size:0.8rem;color:#94a3b8;font-weight:500;">งาน</span></div>
          <div style="font-size:0.72rem;color:#a855f7;margin-top:2px;">ตรวจ ${reviewCount} | แก้ ${revisionCount}</div>
        </div>

        <div style="background:#16192b;border:1px solid ${overdue.length > 0 ? '#ef4444' : '#252b45'};border-radius:8px;padding:12px;">
          <div style="font-size:0.75rem;color:#94a3b8;margin-bottom:4px;">เลยกำหนด (Overdue)</div>
          <div style="font-size:1.4rem;font-weight:800;color:${overdue.length > 0 ? '#ef4444' : '#ffffff'};">${overdue.length} <span style="font-size:0.8rem;color:#94a3b8;font-weight:500;">งาน</span></div>
          <div style="font-size:0.72rem;color:${overdue.length > 0 ? '#ef4444' : '#22c55e'};margin-top:2px;">${overdue.length > 0 ? '⚠️ ต้องเร่งติดตาม' : '✓ ตามแผนทั้งหมด'}</div>
        </div>

        <div style="background:#16192b;border:1px solid #252b45;border-radius:8px;padding:12px;">
          <div style="font-size:0.75rem;color:#94a3b8;margin-bottom:4px;">ตรงเวลา (SLA)</div>
          <div style="font-size:1.4rem;font-weight:800;color:#ffc61a;">${onTimeRate}%</div>
          <div style="font-size:0.72rem;color:#ffc61a;margin-top:2px;">On-Time Target</div>
        </div>
      </div>

      <!-- Two-column Tables: Projects & Designers -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(320px, 1fr));gap:14px;margin-bottom:18px;">
        <!-- Top Projects Summary -->
        <div style="background:#16192b;border:1px solid #252b45;border-radius:10px;padding:14px;">
          <div style="font-size:0.9rem;font-weight:700;color:#ffffff;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
            <span>📁 โครงการยอดนิยม (Top Projects)</span>
            <span style="font-size:0.75rem;color:#94a3b8;">ปริมาณงาน</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${topProjects.map((p, idx) => `
              <div style="display:flex;align-items:center;justify-content:space-between;background:#1a1d30;padding:8px 10px;border-radius:6px;font-size:0.82rem;">
                <div style="display:flex;align-items:center;gap:8px;overflow:hidden;">
                  <span style="color:#ffc61a;font-weight:700;font-size:0.78rem;">#${idx + 1}</span>
                  <span style="color:#e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${escapeHtml(p.name)}">${escapeHtml(p.name)}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;font-size:0.78rem;">
                  <span style="color:#ffffff;font-weight:600;">${p.total} งาน</span>
                  <span style="color:#22c55e;font-size:0.72rem;background:rgba(34,197,94,0.12);padding:2px 6px;border-radius:4px;">${p.pct}%</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Designer Workload Summary -->
        <div style="background:#16192b;border:1px solid #252b45;border-radius:10px;padding:14px;">
          <div style="font-size:0.9rem;font-weight:700;color:#ffffff;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
            <span>👥 ภาระงานรายบุคคล (Designers)</span>
            <span style="font-size:0.75rem;color:#94a3b8;">กำลังทำ / เสร็จ</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${designerStats.map((d) => `
              <div style="display:flex;align-items:center;justify-content:space-between;background:#1a1d30;padding:8px 10px;border-radius:6px;font-size:0.82rem;">
                <span style="color:#e2e8f0;font-weight:600;">${escapeHtml(d.name)}</span>
                <div style="display:flex;align-items:center;gap:8px;font-size:0.78rem;">
                  <span style="color:#19c3eb;">ทำอยู่ ${d.active}</span>
                  <span style="color:#64748b;">·</span>
                  <span style="color:#22c55e;">เสร็จ ${d.completed}</span>
                  ${d.overdue > 0 ? `<span style="color:#ef4444;font-size:0.72rem;background:rgba(239,68,68,0.15);padding:1px 5px;border-radius:4px;">เลท ${d.overdue}</span>` : ""}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    </div>
  `;

  const modalFooterHtml = `
    <div style="display:flex;align-items:center;justify-content:space-between;width:100%;flex-wrap:wrap;gap:10px;">
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button type="button" class="btn btn-primary" id="btn-modal-dl-excel" style="background:#22c55e;border-color:#16a34a;display:inline-flex;align-items:center;gap:6px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>ดาวน์โหลด Excel (.CSV)</span>
        </button>

        <button type="button" class="btn btn-secondary" id="btn-modal-print-pdf" style="display:inline-flex;align-items:center;gap:6px;background:#1e2238;color:#fff;border-color:#333b5c;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          <span>พิมพ์ / บันทึก PDF ทางการ</span>
        </button>

        <button type="button" class="btn btn-secondary" id="btn-modal-copy-text" style="display:inline-flex;align-items:center;gap:6px;background:#1e2238;color:#fff;border-color:#333b5c;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span>คัดลอกข้อความสรุป</span>
        </button>
      </div>

      <button type="button" class="btn btn-secondary" data-close-modal style="background:transparent;color:#94a3b8;border-color:#333b5c;">
        ปิด
      </button>
    </div>
  `;

  openModal({
    title: `📊 สรุปข้อมูลภาพรวมระบบงาน (Executive Overview Report)`,
    body: modalBodyHtml,
    footer: modalFooterHtml,
    size: "lg"
  });

  // Bind modal buttons
  qs("#btn-modal-dl-excel")?.addEventListener("click", () => {
    exportToExcel(currentTasks, members, projects, periodLabel);
  });

  qs("#btn-modal-print-pdf")?.addEventListener("click", () => {
    printExecutiveReport({ tasks: currentTasks, members, projects, filterState });
  });

  qs("#btn-modal-copy-text")?.addEventListener("click", () => {
    copySummaryToClipboard({ tasks: currentTasks, members, projects, filterState });
  });
}
