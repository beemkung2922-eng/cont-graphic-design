import { escapeHtml, avatar, roleLabel, formatDateTime, formatDate, statusBadge, projectFor, memberFor } from "./formatters.js";
import { STATUS_LABELS, STATUS_ORDER } from "./constants.js";

let _analyticsContext = {
  tasks: [],
  allTasks: [],
  projects: [],
  members: [],
};

export const MONTH_NAMES_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
];

export const STATUS_COLORS = {
  brief: { color: "var(--status-brief, #bdb7d1)", label: "รอรับบรีฟ", hex: "#bdb7d1" },
  drafting: { color: "var(--status-drafting, #544c70)", label: "กำลังดราฟต์", hex: "#544c70" },
  review: { color: "var(--status-review, #F05A28)", label: "รอคอมเมนต์", hex: "#F05A28" },
  revision: { color: "var(--status-revision, #E6007E)", label: "แก้ไขงาน", hex: "#E6007E" },
  completed: { color: "var(--status-completed, #8DC63F)", label: "ส่งมอบสำเร็จ", hex: "#8DC63F" },
};

/* ─────────────────────────────────────────────────────────────────────────
   4 CORE ARTWORK CATEGORIES (หมวดหมู่ประเภทงาน 4 ประเภท)
───────────────────────────────────────────────────────────────────────── */
export const TASK_CATEGORIES = {
  social: {
    key: "social",
    label: "Social Media & Content",
    shortLabel: "Social Media",
    color: "#19C3EB",
    bg: "rgba(25, 195, 235, 0.2)",
    border: "#19C3EB",
    icon: "📱"
  },
  key_visual: {
    key: "key_visual",
    label: "Key Visual & Branding",
    shortLabel: "Key Visual",
    color: "#FFC61A",
    bg: "rgba(255, 198, 26, 0.2)",
    border: "#FFC61A",
    icon: "✨"
  },
  print: {
    key: "print",
    label: "Print & POSM",
    shortLabel: "Print & POSM",
    color: "#8B4DFF",
    bg: "rgba(139, 77, 255, 0.2)",
    border: "#8B4DFF",
    icon: "🖨️"
  },
  ads_resize: {
    key: "ads_resize",
    label: "Ads, Banner & Resizes",
    shortLabel: "Ads & Resizes",
    color: "#2BD14B",
    bg: "rgba(43, 209, 75, 0.2)",
    border: "#2BD14B",
    icon: "📐"
  },
};

/**
 * Classifies any task into one of the 4 core categories
 */
export function classifyTaskCategory(task) {
  const text = `${task.title || ""} ${task.channel || ""} ${task.description || ""} ${task.dimensions || ""}`.toLowerCase();
  if (
    text.includes("print") ||
    text.includes("posm") ||
    text.includes("brochure") ||
    text.includes("rollup") ||
    text.includes("branch") ||
    text.includes("สิ่งพิมพ์") ||
    text.includes("ป้าย") ||
    text.includes("แผ่นพับ") ||
    text.includes("standee") ||
    text.includes("dpi") ||
    text.includes("210x297") ||
    text.includes("a4") ||
    text.includes("a3")
  ) {
    return "print";
  }
  if (
    text.includes("key visual") ||
    text.includes("kv") ||
    text.includes("campaign") ||
    text.includes("branding") ||
    text.includes("brand") ||
    text.includes("master") ||
    text.includes("concept") ||
    text.includes("ci") ||
    text.includes("identity")
  ) {
    return "key_visual";
  }
  if (
    text.includes("gdn") ||
    text.includes("banner") ||
    text.includes("resize") ||
    text.includes("adaptation") ||
    text.includes("ads") ||
    task.task_type === "resize" ||
    task.task_type === "adaptation" ||
    text.includes("300x250") ||
    text.includes("728x90") ||
    text.includes("160x600")
  ) {
    return "ads_resize";
  }
  return "social";
}

/**
 * Enriches a task with est_hours, actual_hours, multitask_score, and category
 */
export function enrichTaskMetrics(task, allTasks = []) {
  const estHours = Number(task.est_hours) || Math.max(1, (Number(task.workload_points || 1) * 2.5));
  let actualHours = Number(task.actual_hours);
  if (!actualHours || isNaN(actualHours)) {
    const revPenalty = Number(task.revision_count || 0) * 1.5;
    const isDone = task.status === "completed";
    actualHours = Math.round((estHours * (isDone ? 1.05 : 0.65) + revPenalty) * 10) / 10;
  }
  const assigneeTasks = allTasks.filter(t => t.assignee_id === task.assignee_id && t.status !== "completed");
  const multitaskScore = Math.min(10, Math.max(1, (assigneeTasks.length * 1.4) + (Number(task.item_count || 1) * 0.4)));
  const categoryKey = classifyTaskCategory(task);

  return {
    ...task,
    categoryKey,
    category: TASK_CATEGORIES[categoryKey],
    estHours: Math.round(estHours * 10) / 10,
    actualHours: Math.round(actualHours * 10) / 10,
    multitaskScore: Math.round(multitaskScore * 10) / 10,
  };
}

/**
 * Extracts a comparable Date object from a task
 */
export function getTaskDate(task, dateField = "created_at") {
  if (dateField === "deadline") {
    if (task.deadline_at) return new Date(task.deadline_at);
    if (task.deadline) return new Date(`${task.deadline}T12:00:00`);
    if (task.created_at) return new Date(task.created_at);
    return null;
  }
  if (task.created_at) return new Date(task.created_at);
  if (task.deadline_at) return new Date(task.deadline_at);
  if (task.deadline) return new Date(`${task.deadline}T12:00:00`);
  return null;
}

/**
 * Filters tasks by Date, Month, Year, Custom Range, Member, and Status
 */
export function filterTasksByTimeRange(tasks, filter = {}) {
  const {
    period = "all",
    year = "all",
    month = "all",
    specificDay = "",
    startDate = "",
    endDate = "",
    dateField = "created_at",
    memberId = "all",
    status = "all",
  } = filter;

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  return tasks.filter((task) => {
    // 1. Member filter
    if (memberId && memberId !== "all" && task.assignee_id !== memberId) {
      return false;
    }

    // 2. Status filter
    if (status && status !== "all" && task.status !== status) {
      return false;
    }

    // 3. Date filter
    const taskDate = getTaskDate(task, dateField);
    if (!taskDate || isNaN(taskDate.getTime())) {
      return period === "all" && year === "all" && month === "all";
    }

    const taskDateStr = taskDate.toISOString().slice(0, 10);
    const taskYear = taskDate.getFullYear();
    const taskMonth = taskDate.getMonth() + 1;

    if (period === "today") {
      return taskDateStr === todayStr;
    }

    if (period === "7days") {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      return taskDate >= sevenDaysAgo && taskDate <= now;
    }

    if (period === "month") {
      const targetYear = year !== "all" ? Number(year) : now.getFullYear();
      const targetMonth = month !== "all" ? Number(month) : now.getMonth() + 1;
      return taskYear === targetYear && taskMonth === targetMonth;
    }

    if (period === "year") {
      const targetYear = year !== "all" ? Number(year) : now.getFullYear();
      return taskYear === targetYear;
    }

    if (period === "specific_day") {
      if (!specificDay) return true;
      return taskDateStr === specificDay;
    }

    if (period === "custom") {
      if (startDate && taskDateStr < startDate) return false;
      if (endDate && taskDateStr > endDate) return false;
      return true;
    }

    if (year !== "all" && taskYear !== Number(year)) return false;
    if (month !== "all" && taskMonth !== Number(month)) return false;

    return true;
  });
}

/**
 * Computes workload and status statistics per member and overall
 */
export function calculateTeamAnalytics(tasks, members, selectedMemberId = "all") {
  const designMembers = members.filter((m) =>
    ["designer", "supervisor", "admin"].includes(m.role)
  );

  const memberStats = designMembers.map((member) => {
    const memberTasks = tasks.filter((t) => t.assignee_id === member.id);
    const total = memberTasks.length;
    const items = memberTasks.reduce((acc, t) => acc + Number(t.item_count || 1), 0);
    const revisions = memberTasks.reduce((acc, t) => acc + Number(t.revision_count || 0), 0);

    const statusCounts = {
      brief: memberTasks.filter((t) => t.status === "brief").length,
      drafting: memberTasks.filter((t) => t.status === "drafting").length,
      review: memberTasks.filter((t) => t.status === "review").length,
      revision: memberTasks.filter((t) => t.status === "revision").length,
      completed: memberTasks.filter((t) => t.status === "completed").length,
    };

    const completed = statusCounts.completed;
    const active = total - completed;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      member,
      tasks: memberTasks,
      total,
      items,
      revisions,
      avgRevision: total > 0 ? (revisions / total).toFixed(1) : "0.0",
      statusCounts,
      completed,
      active,
      completionRate,
    };
  });

  const teamTotals = {
    totalTasks: tasks.length,
    totalItems: tasks.reduce((acc, t) => acc + Number(t.item_count || 1), 0),
    totalCompleted: tasks.filter((t) => t.status === "completed").length,
    totalActive: tasks.filter((t) => t.status !== "completed").length,
    totalReview: tasks.filter((t) => t.status === "review").length,
    totalRevision: tasks.filter((t) => t.status === "revision").length,
    statusCounts: {
      brief: tasks.filter((t) => t.status === "brief").length,
      drafting: tasks.filter((t) => t.status === "drafting").length,
      review: tasks.filter((t) => t.status === "review").length,
      revision: tasks.filter((t) => t.status === "revision").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    },
  };

  return { memberStats, teamTotals };
}

/**
 * 1. ใครแบกงานหนักกว่าใคร: Horizontal Bar Chart data (sorted descending, highlight > 100%)
 */
export function calculateWorkloadComparison(tasks, members) {
  const designMembers = members.filter((m) =>
    ["designer", "supervisor", "admin"].includes(m.role)
  );

  const results = designMembers.map((m) => {
    const mTasks = tasks.filter((t) => t.assignee_id === m.id);
    const activeTasks = mTasks.filter((t) => t.status !== "completed");
    const activePoints = activeTasks.reduce((sum, t) => sum + Number(t.workload_points || 1), 0);
    const capacity = Number(m.capacity_points || 10);
    const percent = capacity > 0 ? Math.round((activePoints / capacity) * 100) : 0;
    const isOverloaded = percent > 100;
    const raw = (m.name || "").trim();
    const shortName = raw.split(/\s+/)[0] || raw;

    return {
      member: m,
      name: m.name,
      shortName,
      activeTasks: activeTasks.length,
      activePoints,
      capacity,
      percent,
      isOverloaded,
      color: isOverloaded ? "#E8202A" : (percent >= 80 ? "#FFC61A" : "#19C3EB"),
      borderColor: isOverloaded ? "#9E1018" : (percent >= 80 ? "#B58300" : "#0B7FA0"),
    };
  }).sort((a, b) => b.percent - a.percent);

  return {
    labels: results.map((r) => r.shortName),
    fullNames: results.map((r) => r.name),
    percentages: results.map((r) => r.percent),
    colors: results.map((r) => r.color),
    borders: results.map((r) => r.borderColor),
    membersData: results,
  };
}

/**
 * 2. แต่ละคนมีงานประเภทไหนกี่ชิ้น: Stacked Bar Chart data (one bar per person, stacked by 4 categories)
 */
export function calculateStackedCategoryData(tasks, members) {
  const designMembers = members.filter((m) =>
    ["designer", "supervisor", "admin"].includes(m.role)
  );
  // Shorten names on mobile/stacked axis (e.g. "BEEM", "Naraporn", "Peerapisit")
  const labels = designMembers.map((m) => {
    const raw = (m.name || "").trim();
    const parts = raw.split(/\s+/);
    return parts[0] || raw;
  });
  const social = [];
  const keyVisual = [];
  const print = [];
  const adsResize = [];
  const totals = [];

  designMembers.forEach((m) => {
    const mTasks = tasks.filter((t) => t.assignee_id === m.id);
    let s = 0, kv = 0, pr = 0, ar = 0;
    mTasks.forEach((t) => {
      const cat = classifyTaskCategory(t);
      if (cat === "social") s += Number(t.item_count || 1);
      else if (cat === "key_visual") kv += Number(t.item_count || 1);
      else if (cat === "print") pr += Number(t.item_count || 1);
      else if (cat === "ads_resize") ar += Number(t.item_count || 1);
    });
    social.push(s);
    keyVisual.push(kv);
    print.push(pr);
    adsResize.push(ar);
    totals.push(s + kv + pr + ar);
  });

  return {
    labels,
    social,
    keyVisual,
    print,
    adsResize,
    totals,
    designMembers,
  };
}

/**
 * 3. งานทั้งหมดแยกตามประเภท: Bar Chart sorted descending (4 core categories)
 */
export function calculateCategoryTotals(tasks) {
  let s = 0, kv = 0, pr = 0, ar = 0;
  tasks.forEach((t) => {
    const cat = classifyTaskCategory(t);
    const count = Number(t.item_count || 1);
    if (cat === "social") s += count;
    else if (cat === "key_visual") kv += count;
    else if (cat === "print") pr += count;
    else if (cat === "ads_resize") ar += count;
  });

  const list = [
    { label: "Social", fullLabel: TASK_CATEGORIES.social.shortLabel, key: "social", count: s, color: TASK_CATEGORIES.social.color },
    { label: "Key Visual", fullLabel: TASK_CATEGORIES.key_visual.shortLabel, key: "key_visual", count: kv, color: TASK_CATEGORIES.key_visual.color },
    { label: "Print", fullLabel: TASK_CATEGORIES.print.shortLabel, key: "print", count: pr, color: TASK_CATEGORIES.print.color },
    { label: "Ads/Resize", fullLabel: TASK_CATEGORIES.ads_resize.shortLabel, key: "ads_resize", count: ar, color: TASK_CATEGORIES.ads_resize.color },
  ].sort((a, b) => b.count - a.count);

  return {
    labels: list.map((x) => x.label),
    counts: list.map((x) => x.count),
    colors: list.map((x) => x.color),
    list,
  };
}

/**
 * 4. Throughput Line Chart: Delivered pieces per week + Dominant Style
 */
export function calculateWeeklyThroughput(tasks, selectedMemberId = "all") {
  const filtered = selectedMemberId !== "all" ? tasks.filter((t) => t.assignee_id === selectedMemberId) : tasks;
  const completed = filtered.filter((t) => t.status === "completed");

  const now = new Date();
  const weeks = [];
  for (let i = 7; i >= 0; i--) {
    const end = new Date(now.getTime() - i * 7 * 24 * 3600 * 1000);
    const start = new Date(end.getTime() - 7 * 24 * 3600 * 1000);
    const count = completed.filter((t) => {
      const cd = t.completed_at ? new Date(t.completed_at) : (t.updated_at ? new Date(t.updated_at) : null);
      return cd && cd >= start && cd <= end;
    }).reduce((sum, t) => sum + Number(t.item_count || 1), 0);

    const label = `W${8 - i} (${start.getDate()}/${start.getMonth() + 1})`;
    weeks.push({ label, count });
  }

  // Dominant Style (Category with most pieces)
  const catCounts = { social: 0, key_visual: 0, print: 0, ads_resize: 0 };
  filtered.forEach((t) => {
    catCounts[classifyTaskCategory(t)] += Number(t.item_count || 1);
  });
  const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
  const primaryStyleLabel = topCat && topCat[1] > 0
    ? `${TASK_CATEGORIES[topCat[0]].label} (${topCat[1]} ชิ้น)`
    : "กระจายเท่ากันทุกสไตล์";

  return {
    labels: weeks.map((w) => w.label),
    counts: weeks.map((w) => w.count),
    primaryStyleLabel,
  };
}

/**
 * 5. Designer × Day Heatmap: Calculates load per designer for 7 days (This Week / Next Week)
 */
export function calculateDesignerDayHeatmap(tasks, members, weekOffset = 0) {
  const designMembers = members.filter((m) =>
    ["designer", "supervisor", "admin"].includes(m.role)
  );

  const now = new Date();
  const currentDay = now.getDay();
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diffToMonday + (weekOffset * 7));
  monday.setHours(0, 0, 0, 0);

  const THAI_DAYS = ["จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา."];
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dStr = d.toISOString().slice(0, 10);
    const isToday = dStr === now.toISOString().slice(0, 10);
    days.push({
      date: d,
      dateStr: dStr,
      label: `${THAI_DAYS[i]} ${d.getDate()}`,
      dayName: THAI_DAYS[i],
      dayNum: d.getDate(),
      isToday,
    });
  }

  const rows = designMembers.map((m) => {
    const mTasks = tasks.filter((t) => t.assignee_id === m.id && t.status !== "completed");
    const dayCells = days.map((day) => {
      const dueTasks = mTasks.filter((t) => {
        const dl = getTaskDate(t, "deadline");
        return dl && dl.toISOString().slice(0, 10) === day.dateStr;
      });

      const count = dueTasks.length;
      const points = dueTasks.reduce((acc, t) => acc + Number(t.workload_points || 1), 0);
      let level = 0;
      if (count >= 4 || points >= 7) level = 4;
      else if (count >= 3 || points >= 5) level = 3;
      else if (count === 2 || points >= 3) level = 2;
      else if (count === 1 || points >= 1) level = 1;

      return {
        day,
        count,
        points,
        tasks: dueTasks,
        level,
      };
    });

    const weekTotalPoints = dayCells.reduce((sum, c) => sum + c.points, 0);
    const weekTotalTasks = dayCells.reduce((sum, c) => sum + c.count, 0);

    return {
      member: m,
      cells: dayCells,
      weekTotalTasks,
      weekTotalPoints,
      isHeavyWeek: weekTotalPoints >= (Number(m.capacity_points || 10) * 0.8),
    };
  });

  return { days, rows, weekOffset };
}

/**
 * 6. Bubble Chart Data: Est_Hours vs Actual_Hours with bubble radius by item_count / multitask_score
 */
export function calculateBubbleChartData(tasks, allTasks, selectedMemberId = "all") {
  const filtered = selectedMemberId !== "all" ? tasks.filter((t) => t.assignee_id === selectedMemberId) : tasks;
  const enriched = filtered.map((t) => enrichTaskMetrics(t, allTasks));

  const underTrack = [];
  const overTrack = [];

  enriched.forEach((t) => {
    const radius = Math.min(22, Math.max(6, (Number(t.item_count || 1) * 2.8) + (t.multitaskScore * 1.1)));
    const pt = {
      x: t.estHours,
      y: t.actualHours,
      r: Math.round(radius),
      title: t.title,
      assigneeName: t.assignee_id ? (allTasks.find((m) => m.id === t.assignee_id)?.name || "ดีไซเนอร์") : "ไม่ระบุ",
      items: t.item_count || 1,
      multitaskScore: t.multitaskScore,
      categoryLabel: t.category.label,
      task: t,
    };

    if (t.actualHours > t.estHours) {
      overTrack.push(pt);
    } else {
      underTrack.push(pt);
    }
  });

  return { underTrack, overTrack, total: enriched.length };
}

/* ─────────────────────────────────────────────────────────────────────────
   7. PROJECT WORKLOAD BREAKDOWN (PIE CHART) & PROJECT EXPLORER
───────────────────────────────────────────────────────────────────────── */
export const PROJECT_PALETTE = [
  "#19C3EB", // Cyan
  "#FFC61A", // Yellow
  "#FF7A00", // Orange
  "#E8202A", // Red
  "#8B4DFF", // Purple
  "#2BD14B", // Green
  "#FF007F", // Neon Pink
  "#00D2D3", // Bright Teal
  "#5F27CD", // Deep Iris
  "#FFA801", // Gold
  "#48DBFB", // Sky Blue
  "#1DD1A1", // Mint
];

/**
 * Calculates task distribution and workload breakdown per Project
 */
export function calculateProjectBreakdown(tasks = [], projects = [], members = []) {
  const totalTasks = tasks.length;
  const projectMap = new Map();

  // Initialize registered projects
  projects.forEach((proj, idx) => {
    projectMap.set(proj.id, {
      id: proj.id,
      name: proj.name || "โปรเจกต์",
      color: proj.color || PROJECT_PALETTE[idx % PROJECT_PALETTE.length],
      tasks: [],
    });
  });

  // Collect tasks under project
  tasks.forEach((task) => {
    const proj = projectFor(task, projects);
    const pId = proj ? proj.id : (task.project_id || "unassigned");
    if (!projectMap.has(pId)) {
      const pName = proj ? proj.name : (task.project_id ? `โปรเจกต์ (${task.project_id.slice(0, 8)})` : "งานทั่วไป (ไม่ระบุโปรเจกต์)");
      projectMap.set(pId, {
        id: pId,
        name: pName,
        color: PROJECT_PALETTE[projectMap.size % PROJECT_PALETTE.length],
        tasks: [],
      });
    }
    projectMap.get(pId).tasks.push(task);
  });

  let list = Array.from(projectMap.values()).map((p) => {
    const pTasks = p.tasks;
    const count = pTasks.length;
    const percentage = totalTasks > 0 ? ((count / totalTasks) * 100).toFixed(1) : "0.0";
    const active = pTasks.filter((t) => t.status !== "completed").length;
    const completed = pTasks.filter((t) => t.status === "completed").length;
    const review = pTasks.filter((t) => t.status === "review").length;
    const revision = pTasks.filter((t) => t.status === "revision").length;
    const brief = pTasks.filter((t) => t.status === "brief").length;
    const drafting = pTasks.filter((t) => t.status === "drafting").length;

    // Member distribution in this project
    const memberMap = new Map();
    pTasks.forEach((t) => {
      const m = memberFor(t, members);
      const mId = m ? m.id : (t.assignee_id || "unassigned");
      if (!memberMap.has(mId)) {
        memberMap.set(mId, {
          member: m || { id: mId, name: "ยังไม่ระบุดีไซเนอร์" },
          count: 0,
          tasks: [],
        });
      }
      const entry = memberMap.get(mId);
      entry.count++;
      entry.tasks.push(t);
    });

    const projectMembers = Array.from(memberMap.values()).sort((a, b) => b.count - a.count);

    return {
      ...p,
      count,
      percentage: Number(percentage),
      percentageStr: `${percentage}%`,
      active,
      completed,
      review,
      revision,
      brief,
      drafting,
      members: projectMembers,
    };
  });

  if (totalTasks > 0) {
    list = list.filter((p) => p.count > 0);
  }
  list.sort((a, b) => b.count - a.count);

  list.forEach((p, idx) => {
    p.color = PROJECT_PALETTE[idx % PROJECT_PALETTE.length];
  });

  return {
    projects: list,
    totalTasks,
    chartLabels: list.map((p) => p.name),
    chartData: list.map((p) => p.count),
    chartColors: list.map((p) => p.color),
  };
}

/**
 * Renders the HTML for the Project Breakdown Pie Chart & Project Explorer
 */
export function renderProjectBreakdownHtml({ breakdown, projects = [], members = [] }) {
  const allCount = breakdown.totalTasks;

  return `
    <div class="analytics-chart-card project-breakdown-card" id="project-breakdown-card">
      <div class="analytics-chart-header">
        <div>
          <div class="analytics-chart-title">
            <span>สัดส่วนงานแยกตามโปรเจกต์ (Project Workload & Explorer)</span>
            <span class="analytics-chart-tag tag-comparison">Horizontal Bar</span>
          </div>
          <div class="analytics-chart-sub">
            กราฟแท่งแนวนอนแสดงสัดส่วนงานแยกตามโปรเจกต์ · คลิกแท่งกราฟหรือเลือกแท็บเพื่อดูงาน · กรองตามดีไซเนอร์ · คลิกดูรายละเอียดงานได้ทันที
          </div>
        </div>
      </div>

      <!-- แถบเลือกโปรเจกต์ (Project Selection Tabs Bar) เต็มตา เลื่อนแนวนอนง่าย -->
      <div class="project-tabs-scroll" id="project-tabs-bar" style="margin-bottom:18px;">
        <button type="button" class="btn-proj-tab is-active" data-proj-tab="all">
          <span>📁 ทุกโปรเจกต์ (${allCount} งาน)</span>
        </button>
        ${breakdown.projects.map((p) => `
          <button type="button" class="btn-proj-tab" data-proj-tab="${escapeHtml(p.id)}">
            <span class="proj-tab-dot" style="background:${p.color};"></span>
            <span class="proj-tab-name">${escapeHtml(p.name)}</span>
            <span class="proj-tab-count">${p.count} งาน (${p.percentageStr})</span>
          </button>
        `).join("")}
      </div>

      <!-- 2 คอลัมน์สมดุลกัน พอดีขอบ ไม่โบ๋ -->
      <div class="project-breakdown-grid">
        <!-- ซ้าย: กราฟแท่งแนวนอน (Horizontal Bar Chart) -->
        <div class="project-pie-column">
          <div style="font-size:0.82rem;font-weight:700;color:var(--cyan);margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
            <span>📊 10 โปรเจกต์ที่มีงานมากที่สุด (Top 10 Projects)</span>
            <span style="font-size:0.72rem;color:#8a90a4;">คลิกที่แท่งเพื่อเลือกดู</span>
          </div>
          <div class="project-pie-chart-wrap" style="height:330px;">
            <canvas id="chart-project-visual"></canvas>
          </div>
        </div>

        <!-- ขวา: Active Project Focus Card สมดุลกับฝั่งซ้าย ไร้ช่องว่างโบ๋ -->
        <div class="project-explorer-column">
          <div class="project-active-box" id="project-active-box">
            <!-- Populated dynamically by bindProjectExplorer -->
          </div>
        </div>
      </div>

      <!-- Task Deep-Dive & Designer Filter Container -->
      <div class="project-tasks-explorer" id="project-tasks-explorer">
        <div class="proj-filter-head">
          <div class="proj-filter-label">
            <span>👤</span>
            <span>เลือกคนในโปรเจกต์ (Filter by Designer):</span>
          </div>
          <div class="proj-filter-member-chips" id="proj-filter-member-chips">
            <!-- Populated dynamically by bindProjectExplorer -->
          </div>
        </div>

        <div class="proj-tasks-meta-bar">
          <div id="proj-tasks-count-label" style="font-size:0.88rem;font-weight:700;color:#ffffff;">
            รายการงานใน: ทุกโปรเจกต์ (${allCount} งาน)
          </div>
          <span style="font-size:0.75rem;color:#8f95ae;">
            คลิกที่ชื่องานหรือกดปุ่ม "ดูรายละเอียดงาน" เพื่อเปิดดูเนื้อหาบรีฟและไฟล์
          </span>
        </div>

        <div id="proj-tasks-list-container">
          <!-- Populated dynamically by bindProjectExplorer -->
        </div>
      </div>
    </div>
  `;
}

/**
 * Binds interactivity for Project Explorer, Designer Filter, and Task Drilldown
 */
export function bindProjectExplorer(container, { tasks = [], projects = [], members = [] } = {}) {
  const root = (container && typeof container.querySelector === "function")
    ? (container.querySelector("#project-breakdown-card") || container)
    : document.querySelector("#project-breakdown-card");
  if (!root || !root.querySelector("#project-tabs-bar")) return;

  const breakdown = calculateProjectBreakdown(tasks, projects, members);
  let currentProjectId = "all";
  let currentMemberId = "all";

  const renderActiveBox = (projId) => {
    const box = root.querySelector("#project-active-box");
    if (!box) return;

    if (projId === "all") {
      const activeCount = tasks.filter((t) => t.status !== "completed").length;
      const completedCount = tasks.filter((t) => t.status === "completed").length;
      const reviewRevCount = tasks.filter((t) => t.status === "review" || t.status === "revision").length;
      box.innerHTML = `
        <div class="proj-box-head">
          <div>
            <div class="proj-box-title" style="color:var(--cyan);">ภาพรวมทุกโปรเจกต์ (All Projects Overview)</div>
            <div class="proj-box-sub">รวบรวมงานกราฟิกดีไซน์และแคมเปญทั้งหมดของทีม KKP (${breakdown.projects.length} โปรเจกต์)</div>
          </div>
          <span class="badge badge-info">${tasks.length} งานทั้งหมด</span>
        </div>
        <div class="proj-box-kpis">
          <div class="proj-kpi-item">
            <span class="kpi-val">${tasks.length}</span>
            <span class="kpi-lbl">งานทั้งหมด</span>
          </div>
          <div class="proj-kpi-item">
            <span class="kpi-val" style="color:var(--cyan);">${activeCount}</span>
            <span class="kpi-lbl">กำลังทำ (Active)</span>
          </div>
          <div class="proj-kpi-item">
            <span class="kpi-val" style="color:var(--yellow);">${reviewRevCount}</span>
            <span class="kpi-lbl">รอตรวจ / แก้ไข</span>
          </div>
          <div class="proj-kpi-item">
            <span class="kpi-val" style="color:var(--green);">${completedCount}</span>
            <span class="kpi-lbl">ส่งมอบสำเร็จ</span>
          </div>
        </div>
        <div class="proj-box-summary-list" style="margin-top:16px;padding-top:14px;border-top:1px solid #1f2130;">
          <div style="font-size:0.75rem;font-weight:700;color:#9ca2bb;margin-bottom:8px;">โปรเจกต์ที่มีสัดส่วนงานมากที่สุด (Top Projects):</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${breakdown.projects.slice(0, 5).map((p) => `
              <span class="badge" style="background:${p.color}22;color:${p.color};border:1px solid ${p.color}55;font-size:0.72rem;padding:3px 8px;">
                ${escapeHtml(p.name)}: <strong>${p.count} งาน</strong> (${p.percentageStr})
              </span>
            `).join("")}
          </div>
        </div>
      `;
    } else {
      const p = breakdown.projects.find((x) => x.id === projId) || { name: "โปรเจกต์", count: 0, active: 0, completed: 0, review: 0, revision: 0, color: "#19C3EB", percentageStr: "0%" };
      box.innerHTML = `
        <div class="proj-box-head">
          <div>
            <div class="proj-box-title" style="color:${p.color};">
              <span class="proj-dot-inline" style="background:${p.color};"></span>
              <span>${escapeHtml(p.name)}</span>
            </div>
            <div class="proj-box-sub">สัดส่วนในทีม: ${p.percentageStr} · สมาชิกที่รับผิดชอบ ${p.members?.length || 0} คน</div>
          </div>
          <span class="badge" style="background:${p.color}26;color:${p.color};border:1px solid ${p.color}66;">
            ${p.count} งาน (${p.percentageStr})
          </span>
        </div>
        <div class="proj-box-kpis">
          <div class="proj-kpi-item">
            <span class="kpi-val">${p.count}</span>
            <span class="kpi-lbl">งานในโปรเจกต์นี้</span>
          </div>
          <div class="proj-kpi-item">
            <span class="kpi-val" style="color:var(--cyan);">${p.active}</span>
            <span class="kpi-lbl">กำลังทำ (Active)</span>
          </div>
          <div class="proj-kpi-item">
            <span class="kpi-val" style="color:var(--yellow);">${p.review + p.revision}</span>
            <span class="kpi-lbl">รอตรวจ / แก้ไข</span>
          </div>
          <div class="proj-kpi-item">
            <span class="kpi-val" style="color:var(--green);">${p.completed}</span>
            <span class="kpi-lbl">ส่งมอบสำเร็จ</span>
          </div>
        </div>
        <div class="proj-box-summary-list" style="margin-top:16px;padding-top:14px;border-top:1px solid #1f2130;">
          <div style="font-size:0.75rem;font-weight:700;color:#9ca2bb;margin-bottom:8px;">ทีมดีไซเนอร์ที่ดูแลโปรเจกต์นี้:</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${(p.members || []).map((m) => `
              <span class="badge badge-neutral" style="font-size:0.72rem;padding:3px 8px;display:inline-flex;align-items:center;gap:4px;">
                ${escapeHtml(m.member.name)}: <strong>${m.count} งาน</strong>
              </span>
            `).join("") || '<span style="font-size:0.72rem;color:#777;">ไม่ระบุสมาชิก</span>'}
          </div>
        </div>
      `;
    }
  };

  const renderMemberChips = (projId) => {
    const chipsWrap = root.querySelector("#proj-filter-member-chips");
    if (!chipsWrap) return;

    let availableMembers = [];
    if (projId === "all") {
      const mMap = new Map();
      tasks.forEach((t) => {
        const m = memberFor(t, members);
        const mId = m ? m.id : (t.assignee_id || "unassigned");
        if (!mMap.has(mId)) {
          mMap.set(mId, { member: m || { id: mId, name: "ยังไม่ระบุ" }, count: 0 });
        }
        mMap.get(mId).count++;
      });
      availableMembers = Array.from(mMap.values()).sort((a, b) => b.count - a.count);
    } else {
      const p = breakdown.projects.find((x) => x.id === projId);
      availableMembers = p ? p.members : [];
    }

    const totalInScope = projId === "all" ? tasks.length : (breakdown.projects.find((x) => x.id === projId)?.count || 0);

    chipsWrap.innerHTML = `
      <button type="button" class="proj-member-pill ${currentMemberId === "all" ? "is-active" : ""}" data-proj-member="all">
        <span>👥 ทุกคน (${totalInScope})</span>
      </button>
      ${availableMembers.map((item) => `
        <button type="button" class="proj-member-pill ${currentMemberId === item.member.id ? "is-active" : ""}" data-proj-member="${escapeHtml(item.member.id)}">
          <span>${item.member.avatar_url ? avatar(item.member, "avatar-xs") : "👤"}</span>
          <span>${escapeHtml(item.member.name)}</span>
          <span class="member-pill-count">${item.count}</span>
        </button>
      `).join("")}
    `;

    chipsWrap.querySelectorAll("[data-proj-member]").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentMemberId = btn.dataset.projMember;
        chipsWrap.querySelectorAll(".proj-member-pill").forEach((b) => b.classList.toggle("is-active", b.dataset.projMember === currentMemberId));
        renderTaskList();
      });
    });
  };

  const renderTaskList = () => {
    const listWrap = root.querySelector("#proj-tasks-list-container");
    const countLabel = root.querySelector("#proj-tasks-count-label");
    if (!listWrap) return;

    let scopedTasks = tasks;
    if (currentProjectId !== "all") {
      scopedTasks = tasks.filter((t) => {
        const proj = projectFor(t, projects);
        const pId = proj ? proj.id : (t.project_id || "unassigned");
        return pId === currentProjectId;
      });
    }

    if (currentMemberId !== "all") {
      scopedTasks = scopedTasks.filter((t) => (t.assignee_id || "unassigned") === currentMemberId);
    }

    const enriched = scopedTasks.map((t) => enrichTaskMetrics(t, tasks));

    if (countLabel) {
      const projName = currentProjectId === "all" ? "ทุกโปรเจกต์" : (breakdown.projects.find((x) => x.id === currentProjectId)?.name || "โปรเจกต์");
      countLabel.textContent = `รายการงานใน: ${projName} (${enriched.length} งาน)`;
    }

    if (enriched.length === 0) {
      listWrap.innerHTML = `
        <div style="text-align:center;padding:36px 16px;background:#151622;border:1px dashed #2e3247;border-radius:6px;color:#8f95ae;">
          <div style="font-size:1.8rem;margin-bottom:8px;">📁</div>
          <div style="font-weight:600;color:#ffffff;font-size:0.95rem;">ไม่พบงานตามเงื่อนไขที่เลือก</div>
          <div style="font-size:0.8rem;margin-top:4px;">ลองเลือกดูสมาชิกคนอื่น หรือเลือกดูงานทั้งหมดในโปรเจกต์นี้</div>
        </div>
      `;
      return;
    }

    listWrap.innerHTML = `
      <div class="deepdive-table-wrap">
        <table class="deepdive-table">
          <thead>
            <tr>
              <th>ชื่องาน / อาร์ตเวิร์ก</th>
              <th>ผู้รับผิดชอบ</th>
              <th>หมวดหมู่</th>
              <th>โปรเจกต์</th>
              <th>สถานะ</th>
              <th>กำหนดส่ง (Deadline)</th>
              <th style="text-align:center;">Est.</th>
              <th style="text-align:center;">จริง</th>
              <th style="text-align:center;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${enriched.map((t) => {
              const m = memberFor(t, members);
              const proj = projectFor(t, projects);
              const isLate = t.status !== "completed" && getTaskDate(t, "deadline") < new Date();
              const cat = t.category;

              return `
                <tr>
                  <td>
                    <div class="deepdive-task-title-cell">
                      ${t.preview_url ? `
                        <img class="deepdive-task-img" src="${escapeHtml(t.preview_url)}" alt="preview" />
                      ` : `
                        <div class="deepdive-task-img" style="display:grid;place-items:center;font-size:0.68rem;color:#999;">ART</div>
                      `}
                      <div>
                        <a href="task.html?id=${encodeURIComponent(t.id)}" style="color:#FFFFFF;font-weight:600;text-decoration:none;" class="hover-underline">
                          ${escapeHtml(t.title)}
                        </a>
                        <div style="font-size:0.72rem;color:#8a8f9f;margin-top:2px;">
                          ${escapeHtml(t.dimensions || "ไม่ระบุขนาด")} · ${escapeHtml(t.channel || "ทั่วไป")}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style="display:flex;align-items:center;gap:7px;">
                      ${avatar(m, "avatar-xs")}
                      <span style="font-size:0.8rem;color:#e1e4ef;">${escapeHtml(m?.name || "ยังไม่ระบุ")}</span>
                    </div>
                  </td>
                  <td>
                    <span class="cat-badge" style="background:${cat.bg};color:${cat.color};border:1px solid ${cat.border};">
                      ${cat.icon} ${escapeHtml(cat.shortLabel)}
                    </span>
                  </td>
                  <td>
                    <span style="color:#c5cadc;font-size:0.78rem;">${escapeHtml(proj?.name || "ทั่วไป")}</span>
                  </td>
                  <td>
                    ${statusBadge(t.status)}
                  </td>
                  <td>
                    <span style="color:${isLate ? "var(--red)" : "#c5cadc"};font-weight:${isLate ? "700" : "500"};font-size:0.8rem;">
                      ${formatDate(t.deadline_at || t.deadline)} ${isLate ? "⚠️" : ""}
                    </span>
                  </td>
                  <td style="color:#a6acc3;text-align:center;font-size:0.8rem;">${t.estHours}h</td>
                  <td style="font-weight:600;color:${t.actualHours > t.estHours ? "var(--red)" : "var(--green)"};text-align:center;font-size:0.8rem;">${t.actualHours}h</td>
                  <td style="text-align:center;">
                    <a class="btn btn-ghost btn-sm" href="task.html?id=${encodeURIComponent(t.id)}" style="padding:4px 10px;font-size:0.75rem;white-space:nowrap;">
                      ดูรายละเอียดงาน →
                    </a>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>

      <!-- Mobile / Tablet Cards -->
      <div class="deepdive-mobile-cards">
        ${enriched.map((t) => {
          const m = memberFor(t, members);
          const proj = projectFor(t, projects);
          const isLate = t.status !== "completed" && getTaskDate(t, "deadline") < new Date();
          const cat = t.category;

          return `
            <div class="m-task-card">
              <div class="m-task-card-top">
                <div class="m-task-card-thumb">
                  ${t.preview_url ? `
                    <img src="${escapeHtml(t.preview_url)}" alt="preview" />
                  ` : `
                    <div class="m-task-card-placeholder">ART</div>
                  `}
                </div>
                <div class="m-task-card-main">
                  <a href="task.html?id=${encodeURIComponent(t.id)}" class="m-task-card-title">
                    ${escapeHtml(t.title)}
                  </a>
                  <div class="m-task-card-sub">
                    <span class="m-task-card-proj">${escapeHtml(proj?.name || "ทั่วไป")}</span>
                    ${t.dimensions ? `<span class="m-task-card-dim">· ${escapeHtml(t.dimensions)}</span>` : ""}
                  </div>
                </div>
              </div>

              <div style="display:flex;align-items:center;gap:8px;margin:8px 0;">
                ${avatar(m, "avatar-xs")}
                <span style="font-size:0.78rem;color:#e1e4ef;font-weight:500;">${escapeHtml(m?.name || "ยังไม่ระบุ")}</span>
              </div>

              <div class="m-task-card-badges">
                <span class="cat-badge" style="background:${cat.bg};color:${cat.color};border:1px solid ${cat.border};">
                  ${cat.icon} ${escapeHtml(cat.shortLabel)}
                </span>
                ${statusBadge(t.status)}
                <span class="m-task-deadline-pill" style="color:${isLate ? "var(--red)" : "#c5cadc"};font-weight:${isLate ? "700" : "500"};">
                  📅 ${formatDate(t.deadline_at || t.deadline)} ${isLate ? "⚠️" : ""}
                </span>
              </div>

              <div class="m-task-card-metrics">
                <div class="m-metric-chip">
                  <span class="m-metric-label">จำนวน:</span>
                  <span class="m-metric-val">${Number(t.item_count || 1)} ชิ้น</span>
                </div>
                <div class="m-metric-chip">
                  <span class="m-metric-label">Est:</span>
                  <span class="m-metric-val">${t.estHours}h</span>
                </div>
                <div class="m-metric-chip">
                  <span class="m-metric-label">จริง:</span>
                  <span class="m-metric-val" style="color:${t.actualHours > t.estHours ? "var(--red)" : "var(--green)"};">${t.actualHours}h</span>
                </div>
              </div>

              <div class="m-task-card-action">
                <a class="btn-pixel btn-pixel-cyan" href="task.html?id=${encodeURIComponent(t.id)}" style="display:flex;width:100%;text-align:center;box-sizing:border-box;padding:9px 12px;font-size:0.82rem;text-decoration:none;justify-content:center;">
                  ดูรายละเอียดงาน →
                </a>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  };

  const tabsWrap = root.querySelector("#project-tabs-bar");
  if (tabsWrap) {
    tabsWrap.querySelectorAll("[data-proj-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        currentProjectId = btn.dataset.projTab;
        currentMemberId = "all";
        tabsWrap.querySelectorAll(".btn-proj-tab").forEach((b) => b.classList.toggle("is-active", b.dataset.projTab === currentProjectId));
        renderActiveBox(currentProjectId);
        renderMemberChips(currentProjectId);
        renderTaskList();
      });
    });
  }

  root.querySelectorAll("[data-pick-project]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pId = btn.dataset.pickProject;
      const tabBtn = tabsWrap?.querySelector(`[data-proj-tab="${pId}"]`);
      if (tabBtn) tabBtn.click();
    });
  });

  renderActiveBox(currentProjectId);
  renderMemberChips(currentProjectId);
  renderTaskList();
}

/**
 * Renders the HTML table for the Heatmap Matrix
 */
export function renderHeatmapTableHtml(heatmapData) {

  const { days, rows, weekOffset } = heatmapData;

  return `
    <div class="heatmap-wrap">
      <table class="heatmap-table">
        <thead>
          <tr>
            <th class="heatmap-th" style="text-align:left;min-width:180px;">ดีไซเนอร์ (Designer)</th>
            ${days.map((d) => `
              <th class="heatmap-th ${d.isToday ? "is-today" : ""}">
                <div>${escapeHtml(d.dayName)}</div>
                <div style="font-size:0.7rem;font-weight:700;">${d.dayNum}</div>
              </th>
            `).join("")}
            <th class="heatmap-th" style="width:100px;">รวมวีคนี้</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              <td>
                <div class="heatmap-member-cell">
                  ${avatar(row.member, "avatar-xs")}
                  <div>
                    <div class="heatmap-member-name">${escapeHtml(row.member.name)}</div>
                    <div class="heatmap-member-cap">${row.weekTotalPoints}/${row.member.capacity_points || 10} pts</div>
                  </div>
                </div>
              </td>
              ${row.cells.map((cell) => {
                const titleStr = cell.tasks.length > 0
                  ? cell.tasks.map((t) => `• ${t.title} (${t.status})`).join("\n")
                  : "ไม่มีงานส่งวันนี้";
                return `
                  <td class="heatmap-day-cell level-${cell.level}" title="${escapeHtml(titleStr)}" data-heatmap-day="${cell.day.dateStr}" data-heatmap-member="${row.member.id}">
                    <span class="heatmap-badge-text">${cell.count > 0 ? cell.count : "—"}</span>
                    ${cell.points > 0 ? `<span class="heatmap-sub-text">${cell.points}p</span>` : ""}
                  </td>
                `;
              }).join("")}
              <td style="text-align:center;">
                <span class="badge ${row.isHeavyWeek ? "badge-danger" : "badge-neutral"}" style="font-size:0.75rem;">
                  ${row.weekTotalTasks} งาน
                </span>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/**
 * Renders the Full Advanced Analytics & Workload Suite HTML
 */
export function renderMemberComparisonHtml({
  memberStats = [],
  teamTotals = {},
  selectedMemberId = "all",
  selectedStatus = "all",
  projects = [],
  filteredTasks = [],
  allTasks = [],
  members = [],
  weekOffset = 0,
} = {}) {
  const isIndividual = selectedMemberId !== "all";
  const activeMember = isIndividual ? memberStats.find((s) => s.member.id === selectedMemberId) : null;
  const enrichedTasks = (isIndividual && activeMember ? activeMember.tasks : filteredTasks).map((t) =>
    enrichTaskMetrics(t, allTasks.length ? allTasks : filteredTasks)
  );

  const heatmapData = calculateDesignerDayHeatmap(
    filteredTasks.length ? filteredTasks : allTasks,
    members.length ? members : memberStats.map((s) => s.member),
    weekOffset
  );

  const throughputData = calculateWeeklyThroughput(
    allTasks.length ? allTasks : filteredTasks,
    selectedMemberId
  );

  const projectBreakdown = calculateProjectBreakdown(
    filteredTasks.length ? filteredTasks : allTasks,
    projects,
    members.length ? members : memberStats.map((s) => s.member)
  );

  _analyticsContext = {
    tasks: filteredTasks.length ? filteredTasks : allTasks,
    allTasks,
    projects,
    members: members.length ? members : memberStats.map((s) => s.member),
  };

  // Member Quick-Select Pills
  const memberPillsHtml = `
    <div class="member-select-pills">
      <button type="button" class="member-pill-btn ${selectedMemberId === "all" ? "is-active" : ""}" data-select-member="all">
        <span>👥</span> <span>ทุกคนในทีม (${memberStats.length})</span>
      </button>
      ${memberStats.map((stat) => {
        const activeCount = stat.tasks.filter((t) => t.status !== "completed").length;
        const capacity = Number(stat.member.capacity_points || 10);
        const activePts = stat.tasks.filter((t) => t.status !== "completed").reduce((sum, t) => sum + Number(t.workload_points || 1), 0);
        const isOver = capacity > 0 && activePts > capacity;

        return `
          <button type="button" class="member-pill-btn ${selectedMemberId === stat.member.id ? "is-active" : ""}" data-select-member="${stat.member.id}">
            <span>${stat.member.avatar_url ? avatar(stat.member, "avatar-xs") : "👤"}</span>
            <span>${escapeHtml(stat.member.name)}</span>
            <span class="chart-count-pill ${isOver ? "badge-danger" : ""}" style="${isOver ? "background:var(--red);color:#fff;" : ""}">${activeCount}</span>
          </button>
        `;
      }).join("")}
    </div>
  `;

  // Deep-Dive Panel for Individual Person
  let deepDivePanelHtml = "";
  if (isIndividual && activeMember) {
    const m = activeMember.member;
    const mTasks = activeMember.tasks;
    const activeTasks = mTasks.filter((t) => t.status !== "completed");
    const activePoints = activeTasks.reduce((sum, t) => sum + Number(t.workload_points || 1), 0);
    const capacity = Number(m.capacity_points || 10);
    const loadPercent = capacity > 0 ? Math.round((activePoints / capacity) * 100) : 0;
    const isOver = loadPercent > 100;
    const overdueCount = activeTasks.filter((t) => {
      const dl = getTaskDate(t, "deadline");
      return dl && dl < new Date();
    }).length;

    // Category distribution for this person
    const mCatCounts = { social: 0, key_visual: 0, print: 0, ads_resize: 0 };
    mTasks.forEach((t) => {
      mCatCounts[classifyTaskCategory(t)] += Number(t.item_count || 1);
    });

    deepDivePanelHtml = `
      <section class="member-deepdive-panel">
        <div class="member-deepdive-head">
          <div class="member-deepdive-user">
            ${avatar(m, "avatar-md")}
            <div>
              <div style="font-size:1.2rem;font-weight:700;color:#FFFFFF;display:flex;align-items:center;gap:10px;">
                <span>${escapeHtml(m.name)}</span>
                <span class="badge ${isOver ? "badge-danger" : (loadPercent >= 80 ? "badge-warn" : "badge-ok")}">
                  ${isOver ? `⚠️ OVERLOADED (${loadPercent}%)` : `ภาระงาน ${loadPercent}%`}
                </span>
              </div>
              <div style="font-size:0.8rem;color:#9ca2bb;margin-top:2px;">
                ${escapeHtml(roleLabel(m.role))} · ขีดความสามารถ: ${capacity} แต้ม · งานที่กำลังทำ: ${activePoints} แต้ม
              </div>
            </div>
          </div>
          <button type="button" class="btn btn-sm" data-select-member="all">
            ← กลับไปดูภาพรวมทุกคน (All Members)
          </button>
        </div>

        <!-- 6 Executive KPI Stat Boxes -->
        <div class="member-deepdive-stats">
          <div class="m-stat-box">
            <div class="m-stat-val">${mTasks.length}</div>
            <div class="m-stat-lbl">งานทั้งหมดในงวด</div>
          </div>
          <div class="m-stat-box">
            <div class="m-stat-val" style="color:var(--cyan);">${activeTasks.length}</div>
            <div class="m-stat-lbl">งานที่กำลังทำ (Active)</div>
          </div>
          <div class="m-stat-box">
            <div class="m-stat-val" style="color:var(--yellow);">${activeMember.statusCounts.review}</div>
            <div class="m-stat-lbl">รอตรวจแบบ (Review)</div>
          </div>
          <div class="m-stat-box">
            <div class="m-stat-val" style="color:var(--red);">${activeMember.statusCounts.revision}</div>
            <div class="m-stat-lbl">แก้ไขงาน (Revision)</div>
          </div>
          <div class="m-stat-box">
            <div class="m-stat-val" style="color:var(--green);">${activeMember.statusCounts.completed}</div>
            <div class="m-stat-lbl">ส่งมอบสำเร็จ (${activeMember.completionRate}%)</div>
          </div>
          <div class="m-stat-box">
            <div class="m-stat-val" style="color:${overdueCount > 0 ? "var(--red)" : "var(--green)"};">${overdueCount}</div>
            <div class="m-stat-lbl">${overdueCount > 0 ? "งานเลยกำหนด (Overdue)" : "ไม่มีงานเลท (On-Time)"}</div>
          </div>
        </div>

        <!-- Category Breakdown Chips -->
        <div class="cat-legend-bar" style="margin-bottom:18px;">
          <span style="font-weight:700;color:#fff;">สัดส่วนประเภทงาน:</span>
          <span class="cat-legend-chip"><span class="cat-legend-dot" style="background:${TASK_CATEGORIES.social.color}"></span> Social Media: ${mCatCounts.social} ชิ้น</span>
          <span class="cat-legend-chip"><span class="cat-legend-dot" style="background:${TASK_CATEGORIES.key_visual.color}"></span> Key Visual: ${mCatCounts.key_visual} ชิ้น</span>
          <span class="cat-legend-chip"><span class="cat-legend-dot" style="background:${TASK_CATEGORIES.print.color}"></span> Print & POSM: ${mCatCounts.print} ชิ้น</span>
          <span class="cat-legend-chip"><span class="cat-legend-dot" style="background:${TASK_CATEGORIES.ads_resize.color}"></span> Ads & Resizes: ${mCatCounts.ads_resize} ชิ้น</span>
        </div>

        <!-- Detailed Task Table for this Person -->
        <div style="margin-top:16px;">
          <div style="font-weight:700;font-size:0.95rem;color:#FFFFFF;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">
            <span>รายการงานทั้งหมดของ ${escapeHtml(m.name)} (${enrichedTasks.length} รายการ)</span>
            <span style="font-size:0.78rem;color:#8f95ae;">คลิกที่ชื่องานเพื่อดูรายละเอียด</span>
          </div>

          <div class="deepdive-table-wrap">
            <table class="deepdive-table">
              <thead>
                <tr>
                  <th>ชื่องาน / อาร์ตเวิร์ก</th>
                  <th>หมวดหมู่งาน</th>
                  <th>โปรเจกต์</th>
                  <th>สถานะ</th>
                  <th>กำหนดส่ง (Deadline)</th>
                  <th>จำนวนชิ้น</th>
                  <th>Est. ชม.</th>
                  <th>ใช้จริง (ชม.)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${enrichedTasks.length === 0 ? `
                  <tr><td colspan="9" style="text-align:center;padding:24px;color:#8f95ae;">ไม่มีรายการงานในช่วงเวลานี้</td></tr>
                ` : enrichedTasks.map((t) => {
                  const proj = projectFor(t, projects);
                  const isLate = t.status !== "completed" && getTaskDate(t, "deadline") < new Date();
                  const cat = t.category;

                  return `
                    <tr>
                      <td>
                        <div class="deepdive-task-title-cell">
                          ${t.preview_url ? `
                            <img class="deepdive-task-img" src="${escapeHtml(t.preview_url)}" alt="preview" />
                          ` : `
                            <div class="deepdive-task-img" style="display:grid;place-items:center;font-size:0.68rem;color:#999;">ART</div>
                          `}
                          <div>
                            <a href="task.html?id=${encodeURIComponent(t.id)}" style="color:#FFFFFF;font-weight:600;text-decoration:none;">
                              ${escapeHtml(t.title)}
                            </a>
                            <div style="font-size:0.72rem;color:#8a8f9f;margin-top:2px;">
                              ${escapeHtml(t.dimensions || "ไม่ระบุขนาด")} · ${escapeHtml(t.channel || "ทั่วไป")}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span class="cat-badge" style="background:${cat.bg};color:${cat.color};border:1px solid ${cat.border};">
                          ${cat.icon} ${escapeHtml(cat.shortLabel)}
                        </span>
                      </td>
                      <td>
                        <span style="color:#c5cadc;">${escapeHtml(proj?.name || "ทั่วไป")}</span>
                      </td>
                      <td>
                        ${statusBadge(t.status)}
                      </td>
                      <td>
                        <span style="color:${isLate ? "var(--red)" : "#c5cadc"};font-weight:${isLate ? "700" : "500"};">
                          ${formatDate(t.deadline_at || t.deadline)} ${isLate ? "⚠️" : ""}
                        </span>
                      </td>
                      <td style="font-weight:600;text-align:center;">
                        ${Number(t.item_count || 1)}
                      </td>
                      <td style="color:#a6acc3;text-align:center;">
                        ${t.estHours}h
                      </td>
                      <td style="font-weight:600;color:${t.actualHours > t.estHours ? "var(--red)" : "var(--green)"};text-align:center;">
                        ${t.actualHours}h
                      </td>
                      <td>
                        <a class="btn btn-ghost btn-sm" href="task.html?id=${encodeURIComponent(t.id)}" style="padding:4px 8px;font-size:0.75rem;">
                          ดูงาน →
                        </a>
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>

          <!-- Responsive Mobile Card List for Smartphones & Tablets (<= 768px) -->
          <div class="deepdive-mobile-cards">
            ${enrichedTasks.length === 0 ? `
              <div class="m-task-card-empty">ไม่มีรายการงานในช่วงเวลานี้</div>
            ` : enrichedTasks.map((t) => {
              const proj = projectFor(t, projects);
              const isLate = t.status !== "completed" && getTaskDate(t, "deadline") < new Date();
              const cat = t.category;

              return `
                <div class="m-task-card">
                  <div class="m-task-card-top">
                    <div class="m-task-card-thumb">
                      ${t.preview_url ? `
                        <img src="${escapeHtml(t.preview_url)}" alt="preview" />
                      ` : `
                        <div class="m-task-card-placeholder">ART</div>
                      `}
                    </div>
                    <div class="m-task-card-main">
                      <a href="task.html?id=${encodeURIComponent(t.id)}" class="m-task-card-title">
                        ${escapeHtml(t.title)}
                      </a>
                      <div class="m-task-card-sub">
                        <span class="m-task-card-proj">${escapeHtml(proj?.name || "ทั่วไป")}</span>
                        ${t.dimensions ? `<span class="m-task-card-dim">· ${escapeHtml(t.dimensions)}</span>` : ""}
                      </div>
                    </div>
                  </div>

                  <div class="m-task-card-badges">
                    <span class="cat-badge" style="background:${cat.bg};color:${cat.color};border:1px solid ${cat.border};">
                      ${cat.icon} ${escapeHtml(cat.shortLabel)}
                    </span>
                    ${statusBadge(t.status)}
                    <span class="m-task-deadline-pill" style="color:${isLate ? "var(--red)" : "#c5cadc"};font-weight:${isLate ? "700" : "500"};">
                      📅 ${formatDate(t.deadline_at || t.deadline)} ${isLate ? "⚠️" : ""}
                    </span>
                  </div>

                  <div class="m-task-card-metrics">
                    <div class="m-metric-chip">
                      <span class="m-metric-label">จำนวน:</span>
                      <span class="m-metric-val">${Number(t.item_count || 1)} ชิ้น</span>
                    </div>
                    <div class="m-metric-chip">
                      <span class="m-metric-label">Est:</span>
                      <span class="m-metric-val">${t.estHours}h</span>
                    </div>
                    <div class="m-metric-chip">
                      <span class="m-metric-label">จริง:</span>
                      <span class="m-metric-val" style="color:${t.actualHours > t.estHours ? "var(--red)" : "var(--green)"};">${t.actualHours}h</span>
                    </div>
                  </div>

                  <div class="m-task-card-action">
                    <a class="btn-pixel btn-pixel-cyan" href="task.html?id=${encodeURIComponent(t.id)}" style="display:flex;width:100%;text-align:center;box-sizing:border-box;padding:9px 12px;font-size:0.82rem;text-decoration:none;justify-content:center;">
                      ดูรายละเอียดงาน →
                    </a>
                  </div>
                </div>
              `;
            }).join("")}
          </div>
        </div>
      </section>
    `;
  }

  return `
    <section class="analytics-suite-wrap" id="member-comparison-section">
      <!-- 1. Header Banner & Quick Filter Pills -->
      <div class="analytics-header-banner">
        <div class="analytics-title-group">
          <h3>
            <span>📊</span>
            <span>KKP Creative Operations & Workload Deep-Dive (วิเคราะห์ภาระงานและเจาะลึกรายคน)</span>
          </h3>
          <p>
            วิเคราะห์ภาระงานรายคน, สัดส่วนประเภทงาน 4 หมวด, Throughput การส่งมอบรายสัปดาห์ และสัดส่วนงานรายโปรเจกต์
          </p>
        </div>
        <div class="comparison-toolbar">
          ${memberPillsHtml}
        </div>
      </div>

      <!-- 2. The 4 Core Comparison & Trend Charts (Grid 2x2) -->
      <div class="analytics-grid-2">
        <!-- Chart 1: ใครแบกงานหนักกว่าใคร (ภาระงานรายคน) -->
        <div class="analytics-chart-card">
          <div class="analytics-chart-header">
            <div>
              <div class="analytics-chart-title">
                <span>ใครแบกงานหนักกว่าใคร (ภาระงานรายคน)</span>
                <span class="analytics-chart-tag tag-comparison">Comparison</span>
              </div>
              <div class="analytics-chart-sub">
                Bar Chart แนวนอน เรียงมากไปน้อย · ไฮไลต์สีแดงเฉพาะคนที่ภาระงานเกิน 100% Capacity
              </div>
            </div>
          </div>
          <div class="analytics-canvas-wrap">
            <canvas id="chart-workload-bar"></canvas>
          </div>
        </div>

        <!-- Chart 2: แต่ละคนมีงานประเภทไหนกี่ชิ้น -->
        <div class="analytics-chart-card">
          <div class="analytics-chart-header">
            <div>
              <div class="analytics-chart-title">
                <span>แต่ละคนมีงานประเภทไหนกี่ชิ้น</span>
                <span class="analytics-chart-tag tag-comparison">Comparison</span>
              </div>
              <div class="analytics-chart-sub">
                Stacked Bar Chart หนึ่งแท่งต่อหนึ่งคน แบ่งสีตามประเภทงาน เห็นทั้งยอดรวมและสัดส่วน
              </div>
            </div>
          </div>
          <div class="cat-legend-bar">
            <span class="cat-legend-chip"><span class="cat-legend-dot" style="background:${TASK_CATEGORIES.social.color}"></span> Social Media</span>
            <span class="cat-legend-chip"><span class="cat-legend-dot" style="background:${TASK_CATEGORIES.key_visual.color}"></span> Key Visual</span>
            <span class="cat-legend-chip"><span class="cat-legend-dot" style="background:${TASK_CATEGORIES.print.color}"></span> Print & POSM</span>
            <span class="cat-legend-chip"><span class="cat-legend-dot" style="background:${TASK_CATEGORIES.ads_resize.color}"></span> Ads & Resizes</span>
          </div>
          <div class="analytics-canvas-wrap" style="height:250px;">
            <canvas id="chart-stacked-categories"></canvas>
          </div>
        </div>

        <!-- Chart 3: งานทั้งหมดแยกตามประเภท -->
        <div class="analytics-chart-card">
          <div class="analytics-chart-header">
            <div>
              <div class="analytics-chart-title">
                <span>งานทั้งหมดแยกตามประเภท (4 ประเภทหลัก)</span>
                <span class="analytics-chart-tag tag-comparison">Comparison</span>
              </div>
              <div class="analytics-chart-sub">
                Bar Chart เรียงตามจำนวนชิ้นงานจากมากไปน้อย
              </div>
            </div>
          </div>
          <div class="analytics-canvas-wrap">
            <canvas id="chart-category-totals"></canvas>
          </div>
        </div>

        <!-- Chart 4: ปริมาณงานที่ส่งมอบต่อสัปดาห์ (Throughput) -->
        <div class="analytics-chart-card">
          <div class="analytics-chart-header">
            <div>
              <div class="analytics-chart-title">
                <span>ปริมาณงานที่ส่งมอบต่อสัปดาห์ (Throughput)</span>
                <span class="analytics-chart-tag tag-trend">Trend</span>
              </div>
              <div class="analytics-chart-sub">
                Line Chart แสดง Throughput การส่งมอบงานเสร็จต่อสัปดาห์ · สไตล์หลัก: <strong>${escapeHtml(throughputData.primaryStyleLabel)}</strong>
              </div>
            </div>
          </div>
          <div class="analytics-canvas-wrap">
            <canvas id="chart-throughput-line"></canvas>
          </div>
        </div>
      </div>

      <!-- 3. สัดส่วนงานแยกตามโปรเจกต์ (Pie Chart) & สำรวจงานรายโปรเจกต์ (Project Explorer) -->
      ${renderProjectBreakdownHtml({
        breakdown: projectBreakdown,
        projects,
        members: members.length ? members : memberStats.map((s) => s.member),
      })}

      <!-- 5. Individual Deep-Dive Panel (เมื่อเลือกดูรายคน) -->
      ${deepDivePanelHtml}
    </section>
  `;
}

/* ─────────────────────────────────────────────────────────────────────────
   CHART.JS RENDERER ENGINE FOR THE 5 VISUALIZATIONS
───────────────────────────────────────────────────────────────────────── */
const _advancedChartInstances = {};

export function destroyAdvancedChart(id) {
  if (_advancedChartInstances[id]) {
    try {
      _advancedChartInstances[id].destroy();
    } catch (e) {
      console.warn("Chart destroy error", e);
    }
    delete _advancedChartInstances[id];
  }
}

export function initAdvancedCharts({
  container = document,
  tasks = [],
  allTasks = [],
  members = [],
  projects = [],
  selectedMemberId = "all",
} = {}) {
  if (typeof Chart === "undefined") {
    console.warn("Chart.js not loaded on page.");
    return;
  }

  const effectiveTasks = tasks.length ? tasks : allTasks;
  const taskScope = selectedMemberId !== "all" ? effectiveTasks.filter((t) => t.assignee_id === selectedMemberId) : effectiveTasks;

  // 1. Horizontal Bar Chart: Workload Comparison (ภาระงานรายคน)
  destroyAdvancedChart("workloadBar");
  const barCanvas = container.querySelector("#chart-workload-bar");
  if (barCanvas) {
    const workload = calculateWorkloadComparison(effectiveTasks, members);
    _advancedChartInstances["workloadBar"] = new Chart(barCanvas, {
      type: "bar",
      indexAxis: "y",
      data: {
        labels: workload.labels,
        datasets: [{
          label: "% ภาระงานเทียบกับขีดความสามารถ (Capacity)",
          data: workload.percentages,
          backgroundColor: workload.colors,
          borderColor: workload.borders,
          borderWidth: 2,
          borderRadius: 4,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#141520",
            titleColor: "#FFFFFF",
            bodyColor: "#CBD1E5",
            borderColor: "#32354c",
            borderWidth: 1,
            padding: 10,
            callbacks: {
              title: (items) => workload.fullNames?.[items[0].dataIndex] || items[0].label,
              label: (ctx) => {
                const item = workload.membersData[ctx.dataIndex];
                return `${item.percent}% (${item.activeTasks} งาน, ${item.activePoints}/${item.capacity} แต้ม) ${item.isOverloaded ? "🚨 OVERLOADED!" : "✓ กำลังงานปกติ"}`;
              },
            },
          },
        },
        scales: {
          x: {
            suggestedMax: 120,
            grid: { color: "#232536" },
            ticks: {
              color: "#888d9f",
              font: { family: "IBM Plex Sans Thai", size: 11 },
              callback: (val) => `${val}%`,
            },
          },
          y: {
            grid: { display: false },
            ticks: {
              color: "#FFFFFF",
              font: { family: "IBM Plex Sans Thai", size: 12, weight: "600" },
            },
          },
        },
      },
    });
  }

  // 2. Stacked Bar Chart: Categories per Member (แต่ละคนมีงานประเภทไหนกี่ชิ้น)
  destroyAdvancedChart("stackedCat");
  const stackedCanvas = container.querySelector("#chart-stacked-categories");
  if (stackedCanvas) {
    const stacked = calculateStackedCategoryData(taskScope, members);
    _advancedChartInstances["stackedCat"] = new Chart(stackedCanvas, {
      type: "bar",
      data: {
        labels: stacked.labels,
        datasets: [
          { label: "Social Media", data: stacked.social, backgroundColor: TASK_CATEGORIES.social.color, stack: "cat", borderRadius: 2 },
          { label: "Key Visual", data: stacked.keyVisual, backgroundColor: TASK_CATEGORIES.key_visual.color, stack: "cat", borderRadius: 2 },
          { label: "Print & POSM", data: stacked.print, backgroundColor: TASK_CATEGORIES.print.color, stack: "cat", borderRadius: 2 },
          { label: "Ads & Resizes", data: stacked.adsResize, backgroundColor: TASK_CATEGORIES.ads_resize.color, stack: "cat", borderRadius: 2 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#141520",
            borderColor: "#32354c",
            borderWidth: 1,
            padding: 10,
            callbacks: {
              title: (items) => stacked.designMembers?.[items[0].dataIndex]?.name || items[0].label,
            },
          },
        },
        scales: {
          x: {
            stacked: true,
            grid: { display: false },
            ticks: {
              color: "#FFFFFF",
              font: { family: "IBM Plex Sans Thai", size: 10, weight: "600" },
              maxRotation: 0,
              minRotation: 0,
              autoSkip: false,
            },
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: { color: "#232536" },
            ticks: { color: "#888d9f", font: { family: "Space Mono", size: 10 }, stepSize: 1 },
          },
        },
      },
    });
  }

  // 3. Category Totals: Bar Chart (งานทั้งหมดแยกตามประเภท เรียงจากมากไปน้อย)
  destroyAdvancedChart("catTotals");
  const catCanvas = container.querySelector("#chart-category-totals");
  if (catCanvas) {
    const catData = calculateCategoryTotals(taskScope);
    _advancedChartInstances["catTotals"] = new Chart(catCanvas, {
      type: "bar",
      data: {
        labels: catData.labels,
        datasets: [{
          label: "จำนวนชิ้นงาน (Pieces)",
          data: catData.counts,
          backgroundColor: catData.colors,
          borderRadius: 6,
          borderWidth: 1,
          borderColor: "#FFFFFF",
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#141520",
            borderColor: "#32354c",
            borderWidth: 1,
            padding: 10,
            callbacks: {
              title: (items) => catData.list[items[0].dataIndex]?.fullLabel || items[0].label,
              label: (ctx) => `${ctx.parsed.y} ชิ้นงาน (${Math.round((ctx.parsed.y / Math.max(1, catData.counts.reduce((a, b) => a + b, 0))) * 100)}%)`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: "#FFFFFF",
              font: { family: "IBM Plex Sans Thai", size: 11, weight: "600" },
              maxRotation: 0,
              minRotation: 0,
              autoSkip: false,
            },
          },
          y: {
            beginAtZero: true,
            grid: { color: "#232536" },
            ticks: { color: "#888d9f", font: { family: "Space Mono", size: 10 }, stepSize: 1 },
          },
        },
      },
    });
  }

  // 4. Weekly Throughput Line Chart
  destroyAdvancedChart("throughputLine");
  const throughputCanvas = container.querySelector("#chart-throughput-line");
  if (throughputCanvas) {
    const throughput = calculateWeeklyThroughput(allTasks.length ? allTasks : effectiveTasks, selectedMemberId);
    _advancedChartInstances["throughputLine"] = new Chart(throughputCanvas, {
      type: "line",
      data: {
        labels: throughput.labels,
        datasets: [{
          label: "ชิ้นงานที่ส่งมอบสำเร็จ (Throughput)",
          data: throughput.counts,
          borderColor: "#2BD14B",
          backgroundColor: "rgba(43, 209, 75, 0.15)",
          fill: true,
          tension: 0.35,
          borderWidth: 3,
          pointRadius: 5,
          pointBackgroundColor: "#2BD14B",
          pointBorderColor: "#FFFFFF",
          pointHoverRadius: 7,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#141520",
            borderColor: "#32354c",
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: (ctx) => `ส่งมอบสำเร็จ: ${ctx.parsed.y} ชิ้นงาน`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: "#232536" },
            ticks: { color: "#888d9f", font: { family: "Space Mono", size: 10 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: "#232536" },
            ticks: { color: "#888d9f", font: { family: "Space Mono", size: 10 }, stepSize: 1 },
          },
        },
      },
    });
  }

  // 5. Project Workload & Distribution Chart (Horizontal Bar Chart)
  renderProjectDistributionChart(container);
}

/**
 * Renders Horizontal Bar Chart for Top 10 Projects
 */
export function renderProjectDistributionChart(container = document) {
  destroyAdvancedChart("projectVisual");

  const canvas = container.querySelector("#chart-project-visual") || document.querySelector("#chart-project-visual");
  if (!canvas) return;

  const pieTasks = _analyticsContext.tasks.length ? _analyticsContext.tasks : [];
  const pieProjects = _analyticsContext.projects || [];
  const pieMembers = _analyticsContext.members || [];
  const breakdown = calculateProjectBreakdown(pieTasks, pieProjects, pieMembers);

  // 📊 HORIZONTAL BAR CHART (Top 10 Projects)
  const topProjects = breakdown.projects.slice(0, 10);
  _advancedChartInstances["projectVisual"] = new Chart(canvas, {
      type: "bar",
      data: {
        labels: topProjects.map((p) => (p.name.length > 24 ? p.name.slice(0, 23) + "…" : p.name)),
        datasets: [{
          label: "จำนวนงาน (ชิ้นงาน)",
          data: topProjects.map((p) => p.count),
          backgroundColor: topProjects.map((p) => p.color),
          borderColor: topProjects.map((p) => p.color),
          borderWidth: 1,
          borderRadius: 4,
          borderSkipped: false,
        }],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "#12131d",
            borderColor: "#30344d",
            borderWidth: 1,
            padding: 10,
            callbacks: {
              title: (items) => topProjects[items[0].dataIndex]?.name || items[0].label,
              label: (ctx) => {
                const val = ctx.parsed.x || 0;
                const total = breakdown.totalTasks;
                const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
                return ` จำนวน: ${val} งาน (${pct}%)`;
              },
            },
          },
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: { color: "#232536" },
            ticks: { color: "#888d9f", font: { family: "Space Mono", size: 10 } },
          },
          y: {
            grid: { display: false },
            ticks: {
              color: "#ffffff",
              font: { family: "IBM Plex Sans Thai", size: 11, weight: "500" },
            },
          },
        },
        onClick: (evt, elements) => {
          if (elements && elements.length > 0) {
            const idx = elements[0].index;
            const picked = topProjects[idx];
            if (picked) {
              const rootEl = container.querySelector("#project-breakdown-card") || document.querySelector("#project-breakdown-card");
              const tabBtn = rootEl?.querySelector(`[data-proj-tab="${picked.id}"]`);
              if (tabBtn) tabBtn.click();
            }
          }
        },
      },
    });
}

/**
 * Binds event listeners for Member Comparison and Heatmap Toggles
 */
export function bindMemberComparison(container, options = {}) {
  const root = (container && typeof container.querySelector === "function")
    ? container.querySelector("#member-comparison-section")
    : document.querySelector("#member-comparison-section");
  if (!root) return;

  const onSelectMember = typeof options === "function" ? options : (options.onSelectMember || (() => {}));
  const onSelectStatus = typeof options === "object" && typeof options.onSelectStatus === "function" ? options.onSelectStatus : (() => {});
  const onToggleWeek = typeof options === "object" && typeof options.onToggleWeek === "function" ? options.onToggleWeek : (() => {});

  // Member select pills
  root.querySelectorAll("[data-select-member]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const memberId = btn.dataset.selectMember;
      onSelectMember(memberId);
    });
  });

  // Drilldown buttons in member rows
  root.querySelectorAll("[data-drilldown-member]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const memberId = btn.dataset.drilldownMember;
      onSelectMember(memberId);
    });
  });

  // Status legend click
  root.querySelectorAll("[data-legend-status]").forEach((el) => {
    el.addEventListener("click", () => {
      const statusKey = el.dataset.legendStatus;
      onSelectStatus(statusKey);
    });
  });

  // Heatmap week toggle
  root.querySelector("#btn-heatmap-this-week")?.addEventListener("click", () => onToggleWeek(0));
  root.querySelector("#btn-heatmap-next-week")?.addEventListener("click", () => onToggleWeek(1));

  // Project Explorer & Drilldown binding
  bindProjectExplorer(root, _analyticsContext);
}

/**
 * Generates human-friendly summary text for active date filter
 */
export function getFilterSummaryLabel(filter, matchCount = 0) {
  const { period = "all", year = "all", month = "all", specificDay = "", startDate = "", endDate = "" } = filter;

  let label = "งานทั้งหมด";
  if (period === "today") label = "งานของวันนี้";
  else if (period === "7days") label = "งาน 7 วันล่าสุด";
  else if (period === "month") {
    const mName = month !== "all" ? MONTH_NAMES_TH[Number(month) - 1] : "เดือนนี้";
    const yName = year !== "all" ? year : "ปีนี้";
    label = `${mName} ${yName}`;
  } else if (period === "year") {
    label = `ปี ${year !== "all" ? year : new Date().getFullYear()}`;
  } else if (period === "specific_day" && specificDay) {
    label = `วันที่ ${formatDate(specificDay)}`;
  } else if (period === "custom" && (startDate || endDate)) {
    label = `${startDate ? formatDate(startDate) : "เริ่ม"} — ${endDate ? formatDate(endDate) : "ปัจจุบัน"}`;
  } else if (year !== "all" || month !== "all") {
    const mStr = month !== "all" ? MONTH_NAMES_TH[Number(month) - 1] : "";
    const yStr = year !== "all" ? `ปี ${year}` : "";
    label = [mStr, yStr].filter(Boolean).join(" ");
  }

  return `${label} (${matchCount} งาน)`;
}

/**
 * Generates the HTML for the Time & Date Filter Card
 */
export function renderTimeFilterBarHtml(state = {}) {
  const {
    period = "all",
    year = "all",
    month = "all",
    specificDay = "",
    startDate = "",
    endDate = "",
    dateField = "created_at",
    matchCount = 0,
  } = state;

  const summary = getFilterSummaryLabel(state, matchCount);
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return `
    <div class="time-filter-card" id="time-filter-widget">
      <div class="time-filter-header">
        <div class="time-filter-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          <span>เลือกวัน เดือน ปี หรือช่วงเวลาที่ต้องการดูงาน</span>
        </div>
        <div class="time-filter-badge" id="filter-summary-badge">
          <span>📅</span> <span>${escapeHtml(summary)}</span>
        </div>
      </div>

      <div class="time-pills" style="margin-bottom:12px;">
        <button type="button" class="time-pill ${period === "all" ? "is-active" : ""}" data-period="all">ทั้งหมด (All)</button>
        <button type="button" class="time-pill ${period === "today" ? "is-active" : ""}" data-period="today">วันนี้</button>
        <button type="button" class="time-pill ${period === "7days" ? "is-active" : ""}" data-period="7days">7 วันล่าสุด</button>
        <button type="button" class="time-pill ${period === "month" ? "is-active" : ""}" data-period="month">เดือนนี้</button>
        <button type="button" class="time-pill ${period === "year" ? "is-active" : ""}" data-period="year">ปีนี้ (${currentYear})</button>
        <button type="button" class="time-pill ${period === "specific_day" ? "is-active" : ""}" data-period="specific_day">เลือกเฉพาะวัน</button>
        <button type="button" class="time-pill ${period === "custom" ? "is-active" : ""}" data-period="custom">ระบุช่วงวัน ▾</button>
      </div>

      <div class="time-controls-grid">
        <div class="time-control-group">
          <label for="tf-year">เลือกปี (Year)</label>
          <select id="tf-year">
            <option value="all" ${year === "all" ? "selected" : ""}>ทุกปี</option>
            ${years.map((y) => `<option value="${y}" ${String(year) === String(y) ? "selected" : ""}>${y}</option>`).join("")}
          </select>
        </div>

        <div class="time-control-group">
          <label for="tf-month">เลือกเดือน (Month)</label>
          <select id="tf-month">
            <option value="all" ${month === "all" ? "selected" : ""}>ทุกเดือน</option>
            ${MONTH_NAMES_TH.map((name, idx) => `<option value="${idx + 1}" ${String(month) === String(idx + 1) ? "selected" : ""}>${name}</option>`).join("")}
          </select>
        </div>

        <div class="time-control-group" id="tf-specific-day-wrap" style="${period === "specific_day" ? "" : "display:none;"}">
          <label for="tf-day">เลือกวันที่เจาะจง (Day)</label>
          <input type="date" id="tf-day" value="${escapeHtml(specificDay || "")}">
        </div>

        <div class="time-control-group" id="tf-custom-start-wrap" style="${period === "custom" ? "" : "display:none;"}">
          <label for="tf-start-date">ตั้งแต่วันที่</label>
          <input type="date" id="tf-start-date" value="${escapeHtml(startDate || "")}">
        </div>

        <div class="time-control-group" id="tf-custom-end-wrap" style="${period === "custom" ? "" : "display:none;"}">
          <label for="tf-end-date">ถึงวันที่</label>
          <input type="date" id="tf-end-date" value="${escapeHtml(endDate || "")}">
        </div>

        <div class="time-control-group">
          <label for="tf-date-field">อิงจากวันที่</label>
          <select id="tf-date-field">
            <option value="created_at" ${dateField === "created_at" ? "selected" : ""}>วันที่สร้าง/ส่งบรีฟ (Created)</option>
            <option value="deadline" ${dateField === "deadline" ? "selected" : ""}>กำหนดส่ง (Deadline)</option>
          </select>
        </div>

        <div class="time-control-group" style="align-self:flex-end;">
          <button type="button" class="btn btn-sm" id="tf-reset-btn" style="width:100%;height:38px;">ล้างตัวกรองวันที่</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initializes and binds event listeners for the Time Filter widget
 */
export function bindTimeFilterBar(container, { state, onChange }) {
  const root = (container && typeof container.querySelector === "function")
    ? container.querySelector("#time-filter-widget")
    : document.querySelector("#time-filter-widget");
  if (!root) return;

  const pills = root.querySelectorAll(".time-pill");
  const yearSelect = root.querySelector("#tf-year");
  const monthSelect = root.querySelector("#tf-month");
  const dayInput = root.querySelector("#tf-day");
  const startDateInput = root.querySelector("#tf-start-date");
  const endDateInput = root.querySelector("#tf-end-date");
  const dateFieldSelect = root.querySelector("#tf-date-field");
  const resetBtn = root.querySelector("#tf-reset-btn");

  const specificDayWrap = root.querySelector("#tf-specific-day-wrap");
  const customStartWrap = root.querySelector("#tf-custom-start-wrap");
  const customEndWrap = root.querySelector("#tf-custom-end-wrap");

  pills.forEach((pill) => {
    pill.addEventListener("click", () => {
      const p = pill.dataset.period;
      state.period = p;

      if (specificDayWrap) specificDayWrap.style.display = p === "specific_day" ? "" : "none";
      if (customStartWrap) customStartWrap.style.display = p === "custom" ? "" : "none";
      if (customEndWrap) customEndWrap.style.display = p === "custom" ? "" : "none";

      if (p === "today") {
        state.year = "all";
        state.month = "all";
      } else if (p === "month") {
        const now = new Date();
        state.year = String(now.getFullYear());
        state.month = String(now.getMonth() + 1);
        if (yearSelect) yearSelect.value = state.year;
        if (monthSelect) monthSelect.value = state.month;
      } else if (p === "year") {
        state.year = String(new Date().getFullYear());
        state.month = "all";
        if (yearSelect) yearSelect.value = state.year;
        if (monthSelect) monthSelect.value = "all";
      } else if (p === "all") {
        state.year = "all";
        state.month = "all";
        state.specificDay = "";
        state.startDate = "";
        state.endDate = "";
        if (yearSelect) yearSelect.value = "all";
        if (monthSelect) monthSelect.value = "all";
        if (dayInput) dayInput.value = "";
      }

      onChange(state);
    });
  });

  yearSelect?.addEventListener("change", () => {
    state.year = yearSelect.value;
    onChange(state);
  });

  monthSelect?.addEventListener("change", () => {
    state.month = monthSelect.value;
    onChange(state);
  });

  dayInput?.addEventListener("change", () => {
    state.specificDay = dayInput.value;
    state.period = "specific_day";
    onChange(state);
  });

  startDateInput?.addEventListener("change", () => {
    state.startDate = startDateInput.value;
    state.period = "custom";
    onChange(state);
  });

  endDateInput?.addEventListener("change", () => {
    state.endDate = endDateInput.value;
    state.period = "custom";
    onChange(state);
  });

  dateFieldSelect?.addEventListener("change", () => {
    state.dateField = dateFieldSelect.value;
    onChange(state);
  });

  resetBtn?.addEventListener("click", () => {
    state.period = "all";
    state.year = "all";
    state.month = "all";
    state.specificDay = "";
    state.startDate = "";
    state.endDate = "";
    state.memberId = "all";
    state.status = "all";
    onChange(state);
  });
}
