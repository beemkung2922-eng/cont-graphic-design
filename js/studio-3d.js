import { escapeHtml, roleLabel, formatDateTime } from "./formatters.js";
import { openCreateTask } from "./task-actions.js";
import { qs, qsa, toast } from "./app.js";

let animationFrameId = null;
let tickIntervalId = null;
let tourIntervalId = null;
let isMounted = false;

export function cleanupStudio3D() {
  isMounted = false;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (tickIntervalId) {
    clearInterval(tickIntervalId);
    tickIntervalId = null;
  }
  if (tourIntervalId) {
    clearInterval(tourIntervalId);
    tourIntervalId = null;
  }
}

export function renderStudio3D(container, ctx, onSwitchToClassic) {
  cleanupStudio3D();
  isMounted = true;

  const { tasks = [], members = [], projects = [] } = ctx;

  // 1. Identify real team members & build data structures
  const coreTemplates = [
    {
      id: "1fd3ea77-8461-4de1-917a-90a9869428c1",
      name: "BEEM",
      nickname: "บีม",
      gender: "ชาย",
      role: "Supervisor / Lead Art Director",
      desk: "Desk A1",
      color: "#e8202a",
      skin: "#f5cba7",
      hair: "#1f2937",
      software: "Illustrator / Figma",
      sla: "99.8%"
    },
    {
      id: "a31026f2-adc9-47d7-9ba0-f809be9344f1",
      name: "Peerapisit Rojatiegpanya",
      nickname: "พีท",
      gender: "ชาย",
      role: "Senior Designer / Motion & 3D",
      desk: "Desk A2",
      color: "#19c3eb",
      skin: "#f5cba7",
      hair: "#2a324b",
      software: "After Effects / Ps",
      sla: "99.5%"
    },
    {
      id: "617af97c-0c1e-4842-91d9-f9ecbc0fa303",
      name: "Pisit Sintavanuwat",
      nickname: "บิ๊ก",
      gender: "ชาย",
      role: "Senior Designer / Campaign Ads",
      desk: "Desk A3",
      color: "#3aa0ff",
      skin: "#f5cba7",
      hair: "#1a1a24",
      software: "Cinema 4D / Blender",
      sla: "99.0%"
    },
    {
      id: "9135d1e4-ba13-4cf7-adcf-9e05d33c5e52",
      name: "Pongsathorn Pang",
      nickname: "ปอนด์",
      gender: "หญิง",
      role: "Designer / Infographic & Branding",
      desk: "Desk B1",
      color: "#a855f7",
      skin: "#f5cba7",
      hair: "#382046",
      software: "Illustrator (Ai)",
      sla: "98.8%"
    },
    {
      id: "c16a2845-c95e-47c5-b616-4b37299574a4",
      name: "Yutiporn Thongkom",
      nickname: "โบว์",
      gender: "หญิง",
      role: "Designer / Digital & Social Media",
      desk: "Desk B2",
      color: "#ec4899",
      skin: "#f5cba7",
      hair: "#4a1e35",
      software: "Photoshop / Ai",
      sla: "99.2%"
    },
    {
      id: "739187f5-e142-4aa4-95ad-e06f881163cc",
      name: "Naraporn Leungvititgoon",
      nickname: "นัท",
      gender: "หญิง",
      role: "Designer / UI & In-App Banners",
      desk: "Desk B3",
      color: "#10b981",
      skin: "#f5cba7",
      hair: "#1e3a2f",
      software: "Figma / UI Design",
      sla: "99.4%"
    }
  ];

  // Map real members from context
  const TM = coreTemplates.map((tmpl, idx) => {
    const matched = members.find(m => m.id === tmpl.id || (m.name && m.name.toLowerCase().includes(tmpl.name.toLowerCase().split(" ")[0])));
    const memberId = matched ? matched.id : tmpl.id;
    const memberName = matched ? matched.name : tmpl.name;

    const assignedTasks = tasks.filter(t => t.assignee_id === memberId);
    const completedTasks = assignedTasks.filter(t => t.status === "completed");
    const activeTasks = assignedTasks.filter(t => t.status !== "completed");

    // Build categories tally
    const cat = {};
    completedTasks.forEach(t => {
      const c = t.category || "Social Banner";
      cat[c] = (cat[c] || 0) + 1;
    });
    if (!Object.keys(cat).length) {
      cat["Key Visual"] = 14 + idx * 3;
      cat["Social Banner"] = 28 + idx * 5;
      cat["Infographic"] = 12 + idx * 2;
    }

    // Convert real active tasks to studio tasks
    const tk = activeTasks.map(t => {
      const pr = t.status === "review" ? 92 : t.status === "drafting" ? 70 : 35;
      const u = t.priority === "urgent" || t.priority === "high";
      const p = projects.find(proj => proj.id === t.project_id)?.name || "KKP Creative Pipeline";
      return {
        id: t.id,
        t: t.title,
        p,
        c: t.category || "Key Visual",
        pr,
        d: formatDateTime(t.deadline_at),
        u: u ? 1 : 0
      };
    });

    // Provide default fallback tasks if empty
    if (!tk.length) {
      const fallbackList = [
        { t: "KKP Auto Loan — Key Visual & Billboard Q1", p: "Auto Loan Campaign", c: "Key Visual", pr: 82, d: "วันนี้ 18:00", u: 1 },
        { t: "KKP Dime! — Social Media Ad Banner Set", p: "Dime! Growth", c: "Social Banner", pr: 75, d: "พรุ่งนี้ 12:00", u: 0 },
        { t: "KKP Bank — Mobile Banking App Icon 3D", p: "App Design System", c: "Motion / Video", pr: 92, d: "พรุ่งนี้ 16:00", u: 0 },
        { t: "KKP Wealth — Infographic การลงทุนหุ้นกู้", p: "Wealth Management", c: "Infographic", pr: 65, d: "2 วันข้างหน้า", u: 0 },
        { t: "KKP StartDee — Promo Banner Facebook/IG", p: "StartDee Promo", c: "Social Banner", pr: 78, d: "พรุ่งนี้ 14:00", u: 0 },
        { t: "KKP Credit Card — Promotion Landing Page UI", p: "Credit Card Q1", c: "UI / Web Banner", pr: 88, d: "วันนี้ 19:00", u: 1 }
      ];
      tk.push(fallbackList[idx % fallbackList.length]);
      tk.push({ t: `ชิ้นงานรองแคมเปญ 0${idx + 1}`, p: "General Design", c: "Social Banner", pr: 45, d: "สัปดาห์นี้", u: 0 });
    }

    const dn = completedTasks.length ? completedTasks.length + 80 + idx * 12 : (95 + idx * 18);
    const pj = new Set(assignedTasks.map(t => t.project_id).filter(Boolean)).size || (3 + (idx % 2));
    const ld = Math.min(95, Math.max(45, 65 + tk.length * 6 + (idx % 3) * 5));

    return {
      id: memberId,
      n: memberName.split(" ")[0],
      fullName: memberName,
      nickname: tmpl.nickname,
      g: tmpl.gender,
      r: tmpl.role,
      desk: tmpl.desk,
      c: tmpl.color,
      sk: tmpl.skin,
      h: tmpl.hair,
      sw: tmpl.software,
      sla: tmpl.sla,
      ld,
      dn,
      pj,
      cat,
      tk
    };
  });

  // 2. Render Main Studio Shell HTML
  container.innerHTML = `
    <div class="studio-wrapper">
      <!-- Top Bar: Title & View Switcher -->
      <nav class="studio-top-nav">
        <div class="studio-brand">
          <i class="studio-brand-icon"></i>
          <span>KKP Pixel Studio 3D</span>
          <span class="studio-live-badge">Live Pipeline</span>
        </div>

        <!-- Center: Dual View Switcher -->
        <div class="studio-view-switcher" role="tablist">
          <button type="button" class="switcher-btn is-active" id="btn-studio-3d-active" title="มุมมอง Isometric 3D Studio">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
            <span>3D Studio</span>
          </button>
          <button type="button" class="switcher-btn" id="btn-switch-classic" title="สลับไปมุมมอง Classic Dashboard">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            <span>Classic Overview</span>
          </button>
        </div>

        <!-- Actions -->
        <div class="studio-actions-group">
          <span id="studio-clk" style="font-family:var(--studio-mono);font-size:11px;color:var(--studio-mu)"></span>
          <button class="studio-btn" id="studio-rs" title="มุมมองรวมทั้งสตูดิโอ">⌂ ภาพรวม</button>
          <button class="studio-btn" id="studio-tour" title="วนดูโต๊ะทำงานแต่ละคนอัตโนมัติ">⟳ ทัวร์ทีม</button>
          <button class="studio-btn is-main" id="studio-nb">＋ สั่งงานใหม่</button>
        </div>
      </nav>

      <!-- Main Studio Grid -->
      <div id="studio-app">
        <!-- Isometric Canvas Viewport -->
        <div id="studio-map">
          <canvas id="studio-cv"></canvas>
          <div id="studio-cards"></div>
          
          <div id="studio-hud">
            <div id="studio-kpis"></div>
          </div>

          <!-- Average Workload Ring Gauge -->
          <div id="studio-ring">
            <div class="studio-rg" id="studio-rg"><b style="font-family:var(--studio-px);font-size:7px;">LOAD</b></div>
            <span>ภาระงานทีมเฉลี่ย<br><b id="studio-lv" style="color:var(--studio-tx);font-size:12px"></b></span>
          </div>
        </div>

        <!-- Right Sidebar Panels -->
        <aside id="studio-side">
          <div class="studio-pn">
            <h3>ภาระงานรายคน <small>Team Workload</small></h3>
            <div id="studio-rank"></div>
          </div>
          <div class="studio-pn" style="flex:1">
            <h3>ผู้ถือครองงาน <small>Inspector</small></h3>
            <div id="studio-insp"></div>
          </div>
          <div class="studio-pn">
            <h3>ประเภทงานที่ส่งมอบ <small>Category</small></h3>
            <div id="studio-cats"></div>
          </div>
        </aside>

        <!-- Bottom Row: Analytics & Charts -->
        <div id="studio-bot">
          <div class="studio-pn">
            <h3>ข้อมูลโต๊ะทำงาน <small>Workstation Info</small></h3>
            <div id="studio-pi"></div>
          </div>
          <div class="studio-pn">
            <h3>แนวโน้มงาน <small>Demand trend</small>
              <span class="studio-lg">
                <span><i style="background:#19c3eb"></i>ส่งมอบ</span>
                <span><i style="background:#ffc61a"></i>เข้าคิว</span>
              </span>
            </h3>
            <canvas class="studio-ch" id="studio-c1"></canvas>
          </div>
          <div class="studio-pn">
            <h3>เส้นสถานะงาน <small>Operating curve</small>
              <span class="studio-lg">
                <span><i style="background:#e8202a"></i>ด่วน</span>
                <span><i style="background:#ffc61a"></i>รอตรวจ</span>
                <span><i style="background:#3aa0ff"></i>ทำอยู่</span>
              </span>
            </h3>
            <canvas class="studio-ch" id="studio-c2"></canvas>
          </div>
          <div class="studio-pn">
            <h3>ส่งมอบรายเดือน <small>Monthly delivery</small></h3>
            <canvas class="studio-ch" id="studio-c3"></canvas>
          </div>
        </div>
      </div>

      <!-- Quick Brief Modal -->
      <div id="studio-md">
        <form class="studio-pn" id="studio-brief-form">
          <h3 style="font-size:13px;">สร้างงานใหม่เข้า Pipeline</h3>
          <input id="studio-f1" required placeholder="ชื่อชิ้นงาน (Artwork Title)">
          <input id="studio-f2" required placeholder="ชื่อแคมเปญ / โครงการ">
          <select id="studio-f3"></select>
          <select id="studio-f4">
            <option>Key Visual</option>
            <option>Social Banner</option>
            <option>Infographic</option>
            <option>Motion / Video</option>
            <option>UI / Web Banner</option>
            <option>Presentation</option>
          </select>
          <label style="font-size:11px;display:flex;align-items:center;gap:6px;color:var(--studio-mu)">
            <input type="checkbox" id="studio-f5"> งานด่วนพิเศษ (Urgent SLA)
          </label>
          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:6px;">
            <button type="button" class="studio-btn" id="studio-cancel-brief">ยกเลิก</button>
            <button type="submit" class="studio-btn is-main">มอบหมายทันที</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // 3. Pixel Isometric Engine Implementation
  const $ = s => qs(s, container);
  const R = (a, b) => a + Math.random() * (b - a);
  const E = s => escapeHtml(s);
  const TL = "#19c3eb";
  const PXF = "'Press Start 2P', monospace";

  // Workstation Grid Placement (2 rows of 3)
  const PO = [[1.2, 1.2], [5.4, 1.2], [9.6, 1.2], [1.2, 6.0], [5.4, 6.0], [9.6, 6.0]];
  const PL = [[0.3, 0.3], [13.4, 0.3], [0.3, 9.4], [13.4, 9.4]];

  let sel = 0;
  let hv = -1;
  let PS = 3;
  let W = 0;
  let H = 0;
  let lt = 0;
  let pk = [];
  let hist = { d: [], i: [], u: [], r: [], a: [] };
  const cam = { x: 32, y: 66, tx: 32, ty: 66 };
  const MON = [48, 55, 62, 58, 67, 72, 85, 78, 88, 92, 95, 104];
  let live = 92;

  for (let i = 0; i < 24; i++) {
    for (const k in hist) hist[k].push(0);
  }

  const cv = $("#studio-cv");
  if (!cv) return;
  const g = cv.getContext("2d");

  function size() {
    const mapEl = $("#studio-map");
    if (!mapEl) return;
    const r = mapEl.getBoundingClientRect();
    W = Math.ceil(r.width / PS);
    H = Math.ceil(r.height / PS);
    cv.width = W;
    cv.height = H;
    cv.style.width = W * PS + "px";
    cv.style.height = H * PS + "px";
    g.imageSmoothingEnabled = false;
  }

  const P = (x, y, z = 0) => [
    Math.round(W / 2 - cam.x + (x - y) * 16),
    Math.round(H / 2 - cam.y + (x + y) * 8 - z)
  ];
  const P0 = (x, y) => [(x - y) * 16, (x + y) * 8];

  function poly(a, f, s) {
    g.beginPath();
    a.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
    g.closePath();
    if (f) { g.fillStyle = f; g.fill(); }
    if (s) { g.strokeStyle = s; g.lineWidth = 1; g.stroke(); }
  }

  function box(x, y, w, h, ht, z, c, s) {
    const A = P(x, y, z + ht);
    const B = P(x + w, y, z + ht);
    const C = P(x + w, y + h, z + ht);
    const D = P(x, y + h, z + ht);
    poly([D, C, P(x + w, y + h, z), P(x, y + h, z)], c[1], s);
    poly([C, B, P(x + w, y, z), P(x + w, y + h, z)], c[2], s);
    poly([A, B, C, D], c[0], s);
  }

  const DESK = ["#354050", "#242c38", "#1a212b"];
  const SLAB = ["#19222c", "#121921", "#0c1117"];
  const MN = ["#171c24", "#0f131a", "#0a0d12"];
  const CR = ["#8ab4c4", "#5d8494", "#426270"];

  function floor() {
    for (let x = 0; x < 14; x++) {
      for (let y = 0; y < 10; y++) {
        const a = P(x, y);
        const b = P(x + 1, y);
        const c = P(x + 1, y + 1);
        const d = P(x, y + 1);
        const cor = y === 4 || y === 5;
        poly([a, b, c, d], (x + y) % 2 ? "#161b24" : "#1a212b", "#10151c");
        if (cor) poly([a, b, c, d], "rgba(25, 195, 235, 0.06)");
        if (y === 9) poly([P(x, 10), P(x + 1, 10), P(x + 1, 10, -6), P(x, 10, -6)], "#0f131a");
        if (x === 13) poly([P(14, y), P(14, y + 1), P(14, y + 1, -6), P(14, y, -6)], "#0a0d12");
        if ((x * 7 + y * 13) % 11 === 0) {
          g.fillStyle = "#252e3b";
          g.fillRect(a[0] - 1, a[1] + 7, 2, 1);
        }
      }
    }
  }

  const rt = i => {
    const cx = PO[i][0] + 1.4;
    const ey = i < 3 ? 4 : 6.1;
    return [[1.7, 5], [cx, 5], [cx, ey]];
  };

  const PATHS = [[[1.7, 5], [12.3, 5]], ...PO.map((_, i) => rt(i).slice(1))];

  function paths(t) {
    const a = 0.6 + 0.4 * Math.sin(t * 3);
    PATHS.forEach(pl => {
      const q = pl.map(p => P(p[0], p[1], 1));
      [[5, 0.1], [3, 0.24], [1, 0.95]].forEach(([w, al]) => {
        g.beginPath();
        q.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
        g.lineWidth = w;
        g.strokeStyle = `rgba(25, 195, 235, ${al * (w === 1 ? 1 : a)})`;
        g.stroke();
      });
    });
  }

  function pkt(pts, c, sp = 2.4) {
    let L = 0;
    for (let i = 1; i < pts.length; i++) {
      L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    }
    pk.push({ pts, L, t: 0, sp, c });
  }

  function packets(dt) {
    pk = pk.filter(k => (k.t += dt * k.sp / k.L) < 1);
    pk.forEach(k => {
      let d = k.t * k.L;
      let i = 1;
      while (i < k.pts.length - 1 && d > Math.hypot(k.pts[i][0] - k.pts[i - 1][0], k.pts[i][1] - k.pts[i - 1][1])) {
        d -= Math.hypot(k.pts[i][0] - k.pts[i - 1][0], k.pts[i][1] - k.pts[i - 1][1]);
        i++;
      }
      const a = k.pts[i - 1];
      const b = k.pts[i];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const p = P(a[0] + (b[0] - a[0]) * d / l, a[1] + (b[1] - a[1]) * d / l, 4);

      g.fillStyle = k.c + "44";
      g.fillRect(p[0] - 3, p[1] - 3, 6, 6);
      g.fillStyle = k.c;
      g.fillRect(p[0] - 1, p[1] - 1, 3, 3);
      g.fillStyle = "#ffffff";
      g.fillRect(p[0] - 1, p[1] - 1, 1, 1);
    });
  }

  function screen(x, y, w, z0, z1, col, t) {
    const a = P(x, y, z1);
    const b = P(x + w, y, z1);
    const c = P(x + w, y, z0);
    const d = P(x, y, z0);
    g.save();
    g.beginPath();
    [a, b, c, d].forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
    g.closePath();
    g.clip();
    g.fillStyle = col;
    g.fillRect(a[0] - 2, a[1] - 2, 30, 30);
    g.fillStyle = "rgba(255, 255, 255, 0.65)";
    for (let r = 0; r < 4; r++) {
      g.fillRect(a[0] + 1, a[1] + 1 + r * 2, 3 + ((r * 7 + Math.floor(t * 2)) % 5), 1);
    }
    g.restore();
  }

  const stOf = m => !m.tk.length ? "i" : m.tk.some(k => k.u) ? "u" : m.tk.some(k => k.pr >= 90) ? "r" : "a";
  const SCL = { i: "#5b6675", u: "#e8202a", r: "#ffc61a", a: "#19c3eb" };

  function station(i, t) {
    const [x, y] = PO[i];
    const m = TM[i];
    const s = sel === i;
    const h = hv === i;
    const pu = (Math.sin(t * 4) + 1) / 2;

    if (s || h) {
      poly([P(x - 0.5, y - 0.5), P(x + 3.3, y - 0.5), P(x + 3.3, y + 3.3), P(x - 0.5, y + 3.3)], `rgba(25, 195, 235, ${s ? 0.16 + pu * 0.18 : 0.1})`);
    }

    box(x - 0.1, y - 0.1, 2.8, 2.8, 3, 0, SLAB, s ? TL : "#080b10");
    box(x + 0.1, y + 0.5, 1.7, 1.0, 9, 3, DESK);

    [0, 1].forEach(k => {
      const mx = x + 0.25 + k * 0.8;
      box(mx, y + 0.6, 0.6, 0.12, 8, 12, MN);
      screen(mx, y + 0.72, 0.6, 12, 20, k ? "#2f6bff" : m.c, t + k);
    });

    const p = P(x + 2.1, y + 2.0, 3);
    const w = stOf(m) === "a" ? (Math.sin(t * 10 + i) > 0 ? 1 : 0) : 0;

    g.fillStyle = "#262f3d";
    g.fillRect(p[0] - 4, p[1] - 5, 8, 5);

    if (m.g === "หญิง") {
      g.fillStyle = m.h;
      g.fillRect(p[0] - 4, p[1] - 19, 8, 10);
    }

    g.fillStyle = m.c;
    g.fillRect(p[0] - 3, p[1] - 12, 6, 7);
    g.fillRect(p[0] - 5, p[1] - 10 + w, 2, 4);
    g.fillRect(p[0] + 3, p[1] - 10 + (1 - w), 2, 4);

    g.fillStyle = m.sk;
    g.fillRect(p[0] - 3, p[1] - 18, 6, 6);
    g.fillStyle = m.h;
    g.fillRect(p[0] - 3, p[1] - 19, 6, 2);
    g.fillStyle = "#111111";
    g.fillRect(p[0] - 2, p[1] - 16, 1, 1);
    g.fillRect(p[0] + 1, p[1] - 16, 1, 1);

    if (i === 2) {
      g.fillStyle = "#38bdf8";
      g.fillRect(p[0] - 3, p[1] - 17, 6, 1);
    }
    if (i === 4) {
      g.fillStyle = m.h;
      g.fillRect(p[0] - 1, p[1] - 22, 2, 3);
    }

    const sc = SCL[stOf(m)];
    const bob = Math.sin(t * 3 + i) > 0 ? 1 : 0;
    g.fillStyle = Math.sin(t * 6 + i) > -0.3 ? sc : sc + "66";
    poly([[p[0], p[1] - 30 - bob], [p[0] + 3, p[1] - 27 - bob], [p[0], p[1] - 24 - bob], [p[0] - 3, p[1] - 27 - bob]], g.fillStyle);
  }

  function hubIn(t) {
    const pu = (Math.sin(t * 3) + 1) / 2;
    box(0.1, 4.2, 1.6, 1.6, 3, 0, SLAB, TL);
    const c = P(0.9, 5, 3);
    g.strokeStyle = `rgba(25, 195, 235, ${0.4 + pu * 0.5})`;
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(c[0], c[1], 15 + pu * 3, 7.5 + pu * 1.5, 0, 0, 7);
    g.stroke();

    g.fillStyle = "#0c806e";
    g.beginPath();
    g.arc(c[0], c[1] - 16, 9, 0, 7);
    g.fill();
    g.fillStyle = TL;
    g.beginPath();
    g.arc(c[0], c[1] - 16, 7, 0, 7);
    g.fill();
    g.fillStyle = "#ffffff";
    poly([[c[0] + 1, c[1] - 22], [c[0] - 3, c[1] - 15], [c[0], c[1] - 15], [c[0] - 1, c[1] - 9], [c[0] + 3, c[1] - 17], [c[0], c[1] - 17]], "#ffffff");
    g.fillStyle = TL;
    g.font = `6px ${PXF}`;
    g.fillText("BRIEF", c[0] - 14, c[1] + 13);
  }

  function hubOut(t) {
    const pu = (Math.sin(t * 3) + 1) / 2;
    poly([P(11.8, 3.7), P(13.9, 3.7), P(13.9, 6.3), P(11.8, 6.3)], `rgba(25, 195, 235, ${0.12 + pu * 0.15})`);
    box(12.2, 4.2, 1.6, 1.6, 3, 0, SLAB, TL);

    [[12.4, 4.4, 8], [12.95, 4.4, 11], [12.7, 5.0, 7]].forEach(([x, y, h]) => {
      box(x, y, 0.5, 0.5, h, 3, CR, "#172328");
    });
    const c = P(13, 5, 3);
    g.fillStyle = TL;
    g.font = `6px ${PXF}`;
    g.fillText("DELIVERY", c[0] - 22, c[1] + 13);
  }

  function plant(x, y) {
    const p = P(x, y);
    g.fillStyle = "#2d3748";
    g.fillRect(p[0] - 2, p[1] - 4, 5, 4);
    g.fillStyle = "#10b981";
    g.fillRect(p[0] - 3, p[1] - 9, 7, 5);
    g.fillStyle = "#34d399";
    g.fillRect(p[0] - 1, p[1] - 12, 3, 3);
  }

  let amb = 0;

  function frame(ms) {
    if (!isMounted) return;
    animationFrameId = requestAnimationFrame(frame);

    const t = ms / 1000;
    const dt = Math.min(0.05, t - lt);
    lt = t;

    cam.x += (cam.tx - cam.x) * 0.12;
    cam.y += (cam.ty - cam.y) * 0.12;

    g.fillStyle = "#080a10";
    g.fillRect(0, 0, W, H);
    floor();
    paths(t);

    if ((amb += dt) > 1.3) {
      amb = 0;
      pkt([[1.7, 5], [12.3, 5]], "#19c3eb", 3.4);
    }
    packets(dt);

    const L = [];
    PO.forEach((p, i) => L.push([p[0] + p[1] + 2.8, () => station(i, t)]));
    L.push([5, () => hubIn(t)], [17, () => hubOut(t)]);
    PL.forEach(p => L.push([p[0] + p[1], () => plant(p[0], p[1])]));

    L.sort((a, b) => a[0] - b[0]).forEach(o => o[1]());

    PO.forEach((p, i) => {
      const e = $(`#studio-cd-${i}`);
      if (e) {
        const q = P(p[0] + 1.5, p[1] + 1.2, 34);
        e.style.left = q[0] * PS + "px";
        e.style.top = q[1] * PS + "px";
      }
    });

    const clkEl = $("#studio-clk");
    if (clkEl) {
      const now = new Date();
      clkEl.textContent = now.toISOString().slice(0, 10).replace(/-/g, ".") + " " + now.toTimeString().slice(0, 8);
    }
  }

  function add(i, t, p, c, u, d) {
    const m = TM[i];
    m.tk.push({ t, p, c, pr: 10, d: d || (u ? "ด่วน 3 ชม." : "พรุ่งนี้ 12:00"), u: u ? 1 : 0 });
    m.ld = Math.min(100, m.ld + 6);
    pkt(rt(i), u ? "#e8202a" : "#ffc61a");
  }

  function fin(i, k) {
    const m = TM[i];
    m.tk = m.tk.filter(x => x !== k);
    m.dn++;
    live++;
    m.cat[k.c] = (m.cat[k.c] || 0) + 1;
    m.ld = Math.max(35, m.ld - 7);
    pkt(rt(i).slice().reverse().concat([[12.3, 5]]), "#19c3eb");
  }

  function tick() {
    if (!isMounted) return;
    let d = 0;
    let n = 0;
    TM.forEach((m, i) => {
      m.tk.slice().forEach((k, j) => {
        k.pr += (j ? 0.5 : 1.5) * R(0.4, 1.8) * (k.u ? 1.6 : 1);
        if (k.pr >= 100) {
          fin(i, k);
          d++;
        }
      });
    });

    const A = TM.flatMap(m => m.tk);
    hist.d.push(d);
    hist.i.push(n);
    hist.u.push(A.filter(k => k.u).length);
    hist.r.push(A.filter(k => k.pr >= 90).length);
    hist.a.push(A.length);
    Object.values(hist).forEach(a => a.shift());
    paint();
  }

  function paint() {
    if (!isMounted) return;
    const A = TM.flatMap(m => m.tk);
    const dn = TM.reduce((s, m) => s + m.dn, 0);
    const ld = Math.round(TM.reduce((s, m) => s + m.ld, 0) / 6);
    const ur = A.filter(k => k.u).length;

    // Top KPI strip
    const kpisEl = $("#studio-kpis");
    if (kpisEl) {
      kpisEl.innerHTML = [
        ["▣", "ปริมาณงานทั้งหมด", dn + A.length],
        ["◔", "กำลังทำ (Active)", A.length],
        ["✔", "ส่งมอบแล้ว (Delivered)", dn],
        ["⚠", "งานด่วน (Urgent)", ur],
        ["★", "On-Time SLA", "99.6%"]
      ].map(k => `
        <div class="studio-kp">
          <i>${k[0]}</i>
          <div>
            <small>${k[1]}</small>
            <b>${k[2]}</b>
          </div>
        </div>
      `).join("");
    }

    // Workload Ring
    const rgEl = $("#studio-rg");
    const lvEl = $("#studio-lv");
    if (rgEl && lvEl) {
      rgEl.style.setProperty("--p", ld);
      lvEl.textContent = ld + "%";
    }

    // Floating Hologram Cards
    const cardsEl = $("#studio-cards");
    if (cardsEl) {
      cardsEl.innerHTML = TM.map((m, i) => `
        <div class="studio-cd ${sel === i ? "is-selected" : ""}" id="studio-cd-${i}" data-designer-idx="${i}" style="--c:${m.c}">
          <div class="cd-name-row">
            <span>${m.n} (${m.nickname})</span>
            <span class="cd-dot" style="background:${SCL[stOf(m)]}"></span>
          </div>
          ${PS > 2 ? `
            <div class="cd-row">ทำแล้ว <b>${m.dn} ชิ้น</b></div>
            <div class="cd-row">ถือ <b>${m.tk.length} งาน</b></div>
          ` : ""}
        </div>
      `).join("");
    }

    // Right Sidebar: Workload Ranking
    const rankEl = $("#studio-rank");
    if (rankEl) {
      const bc = ["#19c3eb", "#3aa0ff", "#ffc61a", "#7f8e9e", "#7f8e9e", "#7f8e9e"];
      rankEl.innerHTML = TM.map((m, i) => ({ m, i })).sort((a, b) => b.m.ld - a.m.ld).map((o, k) => `
        <div class="studio-rk" data-designer-idx="${o.i}">
          <span class="studio-bd" style="background:${bc[k]}">${k + 1}</span>
          <span style="font-weight:600;font-size:11px;">${o.m.n}</span>
          <div class="studio-sg">
            <i style="width:${o.m.ld}%;--c:${o.m.ld > 85 ? '#e8202a' : o.m.ld > 75 ? '#ffc61a' : '#19c3eb'}"></i>
          </div>
          <b style="font-family:var(--studio-mono);font-size:9px;text-align:right;">${o.m.ld}%</b>
        </div>
      `).join("");
    }

    // Right Sidebar: Inspector
    const inspEl = $("#studio-insp");
    if (inspEl) {
      const m = TM[sel];
      const s = stOf(m);
      inspEl.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <div>
            <b style="font-size:13px;color:#fff;">${m.fullName} (${m.nickname})</b>
            <div style="color:var(--studio-mu);font-size:11px;">${m.r} • ${m.desk}</div>
          </div>
          <span class="studio-tg ${s}">${s === "u" ? "เร่งงานด่วน" : s === "r" ? "รอตรวจ" : s === "i" ? "ว่าง" : "กำลังโฟกัส"}</span>
        </div>
        ${m.tk.map((k, j) => `
          <div class="studio-tk ${j ? "" : "is-focus"}">
            <div style="display:flex;justify-content:space-between;gap:6px">
              <b>${E(k.t)}</b>
              <span class="studio-tg ${k.u ? "u" : k.pr >= 90 ? "r" : "a"}">${k.u ? "Urgent" : k.pr >= 90 ? "Review" : "In Progress"}</span>
            </div>
            <div style="color:var(--studio-mu);font-size:10px;margin-top:2px;">${E(k.c)} • ${E(k.p)} • ${E(k.d)}</div>
            <div class="studio-sg" style="margin-top:5px">
              <i style="width:${Math.min(100, k.pr)}%;--c:${k.u ? '#e8202a' : '#19c3eb'}"></i>
            </div>
          </div>
        `).join("")}
        ${!m.tk.length ? '<div class="studio-tk" style="color:var(--studio-mu);text-align:center;">— ยังไม่มีงานในคิว —</div>' : ""}
        <button class="studio-btn is-main" style="margin-top:8px;width:100%;justify-content:center;" id="btn-studio-done">
          ✔ ส่งงานที่โฟกัสเสร็จ 1 ชิ้น
        </button>
      `;

      $("#btn-studio-done")?.addEventListener("click", () => {
        if (m.tk[0]) {
          const finishedTitle = m.tk[0].t;
          fin(sel, m.tk[0]);
          paint();
          toast(`ส่งมอบงาน "${finishedTitle}" เรียบร้อยแล้ว!`, "success", "บันทึกสำเร็จ");
        }
      });
    }

    // Right Sidebar: Category breakdown
    const catsEl = $("#studio-cats");
    if (catsEl) {
      const cs = {};
      TM.forEach(m => Object.entries(m.cat).forEach(([k, v]) => cs[k] = (cs[k] || 0) + v));
      const ce = Object.entries(cs).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const mx = ce.length ? ce[0][1] : 1;

      catsEl.innerHTML = !ce.length ? '<div style="color:var(--studio-mu);font-size:11px">— ยังไม่มีข้อมูล —</div>' : ce.map(([k, v]) => `
        <div class="studio-ct">
          <span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${E(k)}</span>
          <div class="studio-sg"><i style="width:${v / mx * 100}%"></i></div>
          <b style="font-family:var(--studio-mono);font-size:9px;text-align:right;">${v}</b>
        </div>
      `).join("");
    }

    // Bottom Row: Project & Workstation Info
    const piEl = $("#studio-pi");
    if (piEl) {
      const m = TM[sel];
      piEl.innerHTML = `
        <div style="padding:4px 8px;margin-bottom:6px;background:#0d1118;border:1px solid var(--studio-ln);border-radius:4px;font-size:11px">
          <b>${m.n}</b> • ${m.r} • ${m.desk}
        </div>
        <div class="studio-gr">
          <div>ส่งมอบแล้ว<b>${m.dn} ชิ้น</b></div>
          <div>กำลังทำ<b>${m.tk.length} งาน</b></div>
          <div>โปรเจกต์<b>${m.pj}</b></div>
          <div>On-Time SLA<b>${m.sla}</b></div>
          <div>ภาระงาน<b>${m.ld}%</b></div>
          <div>ซอฟต์แวร์<b style="font-size:10px">${m.sw}</b></div>
        </div>
      `;
    }

    charts();
  }

  // 4. Canvas Sparkline and Line Charts
  const fit = c => {
    if (!c) return [null, 0, 0];
    const r = c.getBoundingClientRect();
    const d = window.devicePixelRatio || 1;
    c.width = r.width * d;
    c.height = r.height * d;
    const x = c.getContext("2d");
    x.setTransform(d, 0, 0, d, 0, 0);
    x.font = "9px 'IBM Plex Sans Thai', sans-serif";
    return [x, r.width, r.height];
  };

  function gd(x, w, h, mx) {
    x.strokeStyle = "#242e3d";
    x.fillStyle = "#6e7e91";
    x.lineWidth = 1;
    for (let k = 0; k < 4; k++) {
      const y = 6 + k * (h - 22) / 3;
      x.beginPath();
      x.moveTo(26, y);
      x.lineTo(w - 4, y);
      x.stroke();
      x.fillText(Math.round(mx * (1 - k / 3)), 2, y + 3);
    }
  }

  function sl(x, d, mx, w, h, c, fill) {
    const dx = (w - 30) / (d.length - 1);
    let py;
    x.beginPath();
    d.forEach((v, i) => {
      const X = 26 + i * dx;
      const Y = 6 + (h - 22) * (1 - v / mx);
      if (i) x.lineTo(X, py);
      else x.moveTo(X, Y);
      x.lineTo(X, Y);
      py = Y;
    });
    if (fill) {
      x.save();
      x.lineTo(w - 4, h - 16);
      x.lineTo(26, h - 16);
      x.fillStyle = c + "33";
      x.fill();
      x.restore();
    }
    x.strokeStyle = c;
    x.lineWidth = 2;
    x.stroke();
  }

  function charts() {
    const c1 = $("#studio-c1");
    if (c1) {
      let [x, w, h] = fit(c1);
      if (x) {
        let mx = Math.max(4, ...hist.d, ...hist.i);
        gd(x, w, h, mx);
        sl(x, hist.d, mx, w, h, "#19c3eb", 1);
        sl(x, hist.i, mx, w, h, "#ffc61a");
      }
    }

    const c2 = $("#studio-c2");
    if (c2) {
      let [x, w, h] = fit(c2);
      if (x) {
        let mx = Math.max(8, ...hist.a);
        gd(x, w, h, mx);
        sl(x, hist.a, mx, w, h, "#3aa0ff");
        sl(x, hist.r, mx, w, h, "#ffc61a");
        sl(x, hist.u, mx, w, h, "#e8202a");
      }
    }

    const c3 = $("#studio-c3");
    if (c3) {
      let [x, w, h] = fit(c3);
      if (x) {
        const D = MON.slice();
        D[new Date().getMonth()] = live;
        let mx = Math.max(4, ...D) * 1.1;
        gd(x, w, h, mx);
        const bw = (w - 34) / 12;
        D.forEach((v, i) => {
          const bh = (h - 22) * v / mx;
          const fc = i > new Date().getMonth();
          for (let y = 0; y < bh; y += 6) {
            x.fillStyle = fc ? "#19c3eb33" : `rgba(25, 195, 235, ${0.4 + 0.6 * y / bh})`;
            x.fillRect(30 + i * bw, h - 16 - y - 4, bw - 5, 4);
          }
          x.fillStyle = "#6e7e91";
          x.fillText(i + 1, 32 + i * bw, h - 4);
        });
      }
    }
  }

  function pick(i) {
    sel = i;
    const p = P0(PO[i][0] + 1.5, PO[i][1] + 1.3);
    cam.tx = p[0];
    cam.ty = p[1] - 6;
    PS = 4;
    size();
    paint();
  }

  function reset() {
    cam.tx = 32;
    cam.ty = 66;
    PS = 3;
    size();
    paint();
  }

  function hit(e) {
    const r = cv.getBoundingClientRect();
    const a = ((e.clientX - r.left) / PS - (W / 2 - cam.x)) / 16;
    const b = ((e.clientY - r.top) / PS + 9 - (H / 2 - cam.y)) / 8;
    const gx = (a + b) / 2;
    const gy = (b - a) / 2;
    return PO.findIndex(([x, y]) => gx > x - 0.4 && gx < x + 3.2 && gy > y - 0.4 && gy < y + 3.2);
  }

  // Mouse pan & zoom listeners
  let dr = null;
  let mv = 0;
  const mp = $("#studio-map");

  if (mp) {
    mp.onpointerdown = e => {
      if (e.target.closest(".studio-cd, .studio-btn, .studio-kp, #studio-ring")) return;
      dr = [e.clientX, e.clientY];
      mv = 0;
      mp.setPointerCapture(e.pointerId);
      mp.style.cursor = "grabbing";
    };

    mp.onpointermove = e => {
      if (dr) {
        const dx = e.clientX - dr[0];
        const dy = e.clientY - dr[1];
        mv += Math.abs(dx) + Math.abs(dy);
        dr = [e.clientX, e.clientY];
        cam.x -= dx / PS;
        cam.y -= dy / PS;
        cam.tx = cam.x;
        cam.ty = cam.y;
      } else {
        hv = hit(e);
      }
    };

    mp.onpointerup = e => {
      if (!dr) return;
      dr = null;
      mp.style.cursor = "grab";
      if (mv < 6) {
        const i = hit(e);
        if (i >= 0) pick(i);
      }
    };

    mp.onwheel = e => {
      e.preventDefault();
      PS = Math.max(2, Math.min(5, PS + (e.deltaY < 0 ? 1 : -1)));
      size();
    };
  }

  // Click delegation for cards and rankings
  container.addEventListener("click", e => {
    const targetCard = e.target.closest("[data-designer-idx]");
    if (targetCard) {
      const idx = parseInt(targetCard.dataset.designerIdx, 10);
      if (!isNaN(idx)) pick(idx);
    }
  });

  // Top action buttons
  $("#studio-rs")?.addEventListener("click", reset);

  $("#studio-tour")?.addEventListener("click", e => {
    if (tourIntervalId) {
      clearInterval(tourIntervalId);
      tourIntervalId = null;
      e.target.classList.remove("is-on");
    } else {
      e.target.classList.add("is-on");
      tourIntervalId = setInterval(() => {
        if (!isMounted) return;
        pick((sel + 1) % 6);
      }, 3500);
    }
  });

  // New Brief dialog
  $("#studio-nb")?.addEventListener("click", () => {
    const select = $("#studio-f3");
    if (select) {
      select.innerHTML = TM.map((m, i) => `
        <option value="${i}" ${i === sel ? "selected" : ""}>${m.fullName} (ภาระ ${m.ld}%)</option>
      `).join("");
    }
    $("#studio-md")?.classList.add("is-open");
  });

  $("#studio-cancel-brief")?.addEventListener("click", () => {
    $("#studio-md")?.classList.remove("is-open");
  });

  $("#studio-brief-form")?.addEventListener("submit", e => {
    e.preventDefault();
    const designerIdx = parseInt($("#studio-f3").value, 10);
    const title = $("#studio-f1").value.trim();
    const projName = $("#studio-f2").value.trim();
    const catName = $("#studio-f4").value;
    const isUrgent = $("#studio-f5").checked;

    add(designerIdx, title, projName, catName, isUrgent);
    TM[designerIdx].pj++;
    $("#studio-md")?.classList.remove("is-open");
    $("#studio-f1").value = "";
    $("#studio-f2").value = "";
    pick(designerIdx);
    toast(`มอบหมายงาน "${title}" ให้ ${TM[designerIdx].n} เรียบร้อย!`, "success", "สร้างงานสำเร็จ");
  });

  // Dual View Switcher Event
  $("#btn-switch-classic")?.addEventListener("click", () => {
    localStorage.setItem("cont_dashboard_view", "classic");
    cleanupStudio3D();
    if (typeof onSwitchToClassic === "function") {
      onSwitchToClassic();
    }
  });

  // Window resize
  const onResize = () => {
    size();
    paint();
  };
  window.addEventListener("resize", onResize);

  // Initialize
  size();
  paint();
  animationFrameId = requestAnimationFrame(frame);
  tickIntervalId = setInterval(tick, 2200);
}
