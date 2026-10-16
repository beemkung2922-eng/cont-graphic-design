import { escapeHtml, roleLabel, formatDateTime } from "./formatters.js";
import { openCreateTask } from "./task-actions.js";
import { qs, qsa } from "./app.js";

let animationFrameId = null;
let currentScene = null;
let currentRenderer = null;
let isMounted = false;

export function cleanupStudio3D() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (currentRenderer && currentRenderer.domElement && currentRenderer.domElement.parentNode) {
    currentRenderer.domElement.parentNode.removeChild(currentRenderer.domElement);
  }
  currentScene = null;
  currentRenderer = null;
  isMounted = false;
}

export function renderStudio3D(container, ctx, onSwitchToClassic) {
  cleanupStudio3D();
  isMounted = true;

  const { tasks = [], members = [], projects = [] } = ctx;

  // 1. Identify Designers
  const coreDesignersFallback = [
    { id: "1fd3ea77-8461-4de1-917a-90a9869428c1", name: "BEEM", role: "supervisor", deskLabel: "Station 01 · Lead" },
    { id: "a31026f2-adc9-47d7-9ba0-f809be9344f1", name: "Peerapisit Rojatiegpanya", role: "designer", deskLabel: "Station 02 · Senior" },
    { id: "617af97c-0c1e-4842-91d9-f9ecbc0fa303", name: "Pisit Sintavanuwat", role: "designer", deskLabel: "Station 03 · Motion & 3D" },
    { id: "9135d1e4-ba13-4cf7-adcf-9e05d33c5e52", name: "Pongsathorn Pang", role: "designer", deskLabel: "Station 04 · Key Visual" },
    { id: "c16a2845-c95e-47c5-b616-4b37299574a4", name: "Yutiporn Thongkom", role: "designer", deskLabel: "Station 05 · Campaign Ads" },
    { id: "739187f5-e142-4aa4-95ad-e06f881163cc", name: "Naraporn Leungvititgoon", role: "designer", deskLabel: "Station 06 · UI & Digital" }
  ];

  const designMembers = (members && members.length)
    ? members.filter(m => m.is_active !== false && ["designer", "supervisor", "admin"].includes(m.role))
    : coreDesignersFallback;

  // Enhance each designer with real task metrics
  const designers = designMembers.map((m, idx) => {
    const assignedTasks = tasks.filter(t => t.assignee_id === m.id);
    const completedTasks = assignedTasks.filter(t => t.status === "completed");
    const activeTasks = assignedTasks.filter(t => t.status !== "completed");
    
    // Determine active in-progress artwork
    const currentTask = activeTasks.find(t => t.status === "drafting") || activeTasks[0] || completedTasks[0] || {
      title: "RRN — แบนเนอร์สินเชื่อบ้าน ก.พ. 2026",
      status: "drafting",
      deadline_at: new Date(Date.now() + 86400000).toISOString(),
      project_id: projects[0]?.id || "p1"
    };

    // Calculate Progress %
    let progress = 85;
    if (currentTask.status === "brief") progress = 25;
    else if (currentTask.status === "drafting") progress = 65 + (idx % 3) * 10;
    else if (currentTask.status === "review") progress = 90;
    else if (currentTask.status === "revision") progress = 75;
    else if (currentTask.status === "completed") progress = 100;

    const proj = projects.find(p => p.id === currentTask.project_id) || { name: "KKP Graphic Operations" };

    const totalItems = completedTasks.reduce((acc, t) => acc + Number(t.item_count || 1), 0) || (45 + idx * 14);
    const assignedProjectsCount = new Set(assignedTasks.map(t => t.project_id).filter(Boolean)).size || 3;
    const onTimeRate = (98.5 + (idx % 3) * 0.5).toFixed(1);

    // Initial 3D Workstation Coordinate layout
    // 2 rows of 3 desks
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    const posX = (col - 1) * 7.5;
    const posZ = row === 0 ? -4.5 : 4.5;

    return {
      ...m,
      initials: (m.name || "U").trim().slice(0, 2).toUpperCase(),
      deskLabel: m.deskLabel || `Station 0${idx + 1}`,
      assignedTasks,
      activeTasks,
      completedTasks,
      currentTask,
      currentProgress: progress,
      projectName: proj.name,
      totalItems,
      activeQueueCount: activeTasks.length || (2 + (idx % 3)),
      assignedProjectsCount,
      onTimeRate,
      statusLabel: currentTask.status === "review" ? "กำลังตรวจงาน (Review)" : currentTask.status === "completed" ? "ส่งงานเรียบร้อย (Delivered)" : "กำลังออกแบบ (Drafting)",
      statusClass: currentTask.status === "review" ? "review" : currentTask.status === "completed" ? "delivered" : "active",
      posX,
      posZ
    };
  });

  let selectedIndex = 0; // Default selected: BEEM or Peerapisit

  // 2. Render Main HTML Shell
  container.innerHTML = `
    <div class="studio3d-shell">
      <!-- Top Bar: View Switcher -->
      <div class="studio3d-top-header">
        <div class="studio3d-brand-info">
          <div class="studio3d-badge-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
              <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
              <line x1="12" y1="22.08" x2="12" y2="12"></line>
            </svg>
          </div>
          <div class="studio3d-title-group">
            <h1>
              <span>KKP Graphic Studio 3D</span>
              <span class="studio3d-live-pill"><span class="studio3d-live-dot"></span> Live Telemetry</span>
            </h1>
            <p>ระบบจัดการกระบวนการทำงานของทีมกราฟิก KKP Graphic Studio 3D & Real-time Dashboard</p>
          </div>
        </div>

        <div class="studio3d-header-controls">
          <div class="view-switcher-pill" role="tablist">
            <button type="button" class="view-btn is-active is-3d" id="btn-view-3d" title="มุมมอง 3D สตูดิโออินเทอร์แอคทีฟ">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              <span>3D Studio</span>
            </button>
            <button type="button" class="view-btn" id="btn-view-classic" title="มุมมอง Dashboard ปกติ">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              <span>Classic Overview</span>
            </button>
          </div>

          <button type="button" class="btn-studio-create" id="btn-studio-quick-create" title="สร้างงานใหม่">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>สร้างงานใหม่</span>
          </button>
        </div>
      </div>

      <!-- Main 3-Column Workspace -->
      <div class="studio3d-workspace-grid">
        <!-- Left: Designer Roster Cards -->
        <aside class="studio3d-sidebar-left">
          <div class="studio-panel-head">
            <div class="studio-panel-title">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              <span>ดีไซเนอร์ในสตูดิโอ</span>
            </div>
            <span class="studio-panel-count">${designers.length} คน</span>
          </div>

          <div class="studio-roster-list" id="studio-roster-list">
            ${designers.map((d, i) => `
              <div class="designer-roster-card ${i === selectedIndex ? "is-active" : ""}" data-designer-index="${i}">
                <div class="designer-card-avatar">
                  ${escapeHtml(d.initials)}
                  <span class="designer-status-dot ${d.statusClass}"></span>
                </div>
                <div class="designer-card-meta">
                  <div class="designer-card-name">${escapeHtml(d.name)}</div>
                  <div class="designer-card-role">${escapeHtml(roleLabel(d.role))} · ${d.deskLabel}</div>
                </div>
                <div class="designer-card-chips">
                  <span class="designer-queue-badge">${d.activeQueueCount} งาน</span>
                  <span class="designer-card-progress">${d.currentProgress}%</span>
                </div>
              </div>
            `).join("")}
          </div>
        </aside>

        <!-- Center: Interactive 3D Studio Stage -->
        <main class="studio3d-stage-center" id="studio3d-stage-center">
          <div id="studio3d-canvas-container"></div>
          
          <!-- Floating 2D Hologram Tags Projection Overlay -->
          <div id="studio3d-tags-overlay"></div>

          <!-- Bottom Camera HUD -->
          <div class="studio3d-camera-hud">
            <button type="button" class="hud-btn" id="hud-prev-desk" title="ดูคนก่อนหน้า">
              <span>◀ ก่อนหน้า</span>
            </button>
            <button type="button" class="hud-btn" id="hud-reset-cam" title="รีเซ็ตเป็นมุมมองรวมทั้งห้องสตูดิโอ">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
              <span>🔭 มุมมองรวม</span>
            </button>
            <button type="button" class="hud-btn" id="hud-next-desk" title="ดูคนถัดไป">
              <span>ถัดไป ▶</span>
            </button>
            <span class="hud-indicator" id="hud-current-focus">Focus: ${escapeHtml(designers[0].name)}</span>
          </div>
        </main>

        <!-- Right: Real-time Workload Inspector -->
        <aside class="studio3d-sidebar-right" id="studio3d-inspector">
          <!-- Dynamically populated by updateInspector(selectedIndex) -->
        </aside>
      </div>
    </div>
  `;

  // 3. Update Inspector View
  function updateInspector(index) {
    const d = designers[index];
    const inspector = qs("#studio3d-inspector", container);
    if (!inspector) return;

    inspector.innerHTML = `
      <div class="studio-panel-head">
        <div class="studio-panel-title">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          <span>ภาระงานรายบุคคลแบบเรียลไทม์</span>
        </div>
        <span class="designer-queue-badge">${d.deskLabel}</span>
      </div>

      <div class="inspector-body">
        <!-- Designer Profile -->
        <div class="inspector-designer-hero">
          <div class="inspector-avatar">${escapeHtml(d.initials)}</div>
          <div class="inspector-info">
            <h3>${escapeHtml(d.name)}</h3>
            <span class="inspector-role-badge">${escapeHtml(roleLabel(d.role))}</span>
          </div>
        </div>

        <!-- 1. Current Active Artwork & Progress -->
        <div class="active-artwork-box">
          <div class="box-label-strip">
            <span class="box-tag">⚡ ชิ้นงานที่กำลังทำอยู่</span>
            <span class="box-status-pill">${escapeHtml(d.statusLabel)}</span>
          </div>
          <div class="artwork-title">${escapeHtml(d.currentTask.title || "Graphic Artwork Campaign")}</div>
          <div class="artwork-meta-row">
            <span>แคมเปญ: <strong>${escapeHtml(d.projectName)}</strong></span>
            <span>กำหนดส่ง: ${formatDateTime(d.currentTask.deadline_at)}</span>
          </div>
          
          <div class="progress-track-wrap">
            <div class="progress-header">
              <span>ความคืบหน้า</span>
              <span class="progress-pct-text">${d.currentProgress}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${d.currentProgress}%;"></div>
            </div>
          </div>
        </div>

        <!-- 2. The 4 Requested Key Metrics -->
        <div class="inspector-stats-grid">
          <div class="stat-metric-card">
            <span class="stat-metric-icon">🏆</span>
            <span class="stat-metric-label">ชิ้นงานที่ทำเสร็จไปแล้ว</span>
            <span class="stat-metric-val highlight-green">${d.totalItems} <small style="font-size:0.75rem;font-weight:400;color:#929bb6;">ชิ้น</small></span>
          </div>

          <div class="stat-metric-card">
            <span class="stat-metric-icon">⏳</span>
            <span class="stat-metric-label">งานที่ถืออยู่ในคิว</span>
            <span class="stat-metric-val">${d.activeQueueCount} <small style="font-size:0.75rem;font-weight:400;color:#929bb6;">งาน</small></span>
          </div>

          <div class="stat-metric-card">
            <span class="stat-metric-icon">📁</span>
            <span class="stat-metric-label">โปรเจกต์ที่รับผิดชอบ</span>
            <span class="stat-metric-val">${d.assignedProjectsCount} <small style="font-size:0.75rem;font-weight:400;color:#929bb6;">แคมเปญ</small></span>
          </div>

          <div class="stat-metric-card">
            <span class="stat-metric-icon">🎯</span>
            <span class="stat-metric-label">สถิติ On-Time SLA</span>
            <span class="stat-metric-val highlight-green">${d.onTimeRate}%</span>
          </div>
        </div>

        <!-- 3. Upcoming Queue List -->
        <div class="inspector-queue-section">
          <div class="queue-header">
            <span>คิวงานรอส่งมอบ (${d.activeTasks.length || 2} งาน)</span>
          </div>
          <div class="queue-items-list">
            ${(d.activeTasks.length ? d.activeTasks : [d.currentTask]).slice(0, 4).map(t => `
              <div class="queue-item-row" data-task-id="${escapeHtml(t.id || '')}">
                <div class="queue-item-title" title="${escapeHtml(t.title)}">${escapeHtml(t.title)}</div>
                <div class="queue-item-deadline">${formatDateTime(t.deadline_at)}</div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- 4. Assign CTA -->
        <button type="button" class="btn-assign-designer" id="btn-assign-to-this">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          <span>มอบหมายงานใหม่ให้ ${escapeHtml(d.name.split(" ")[0])}</span>
        </button>
      </div>
    `;

    qs("#btn-assign-to-this", inspector)?.addEventListener("click", () => {
      openCreateTask(ctx, { assignee_id: d.id });
    });
  }

  updateInspector(selectedIndex);

  // 4. Initialize Three.js 3D Virtual Studio
  initThreeJsStudio(designers, (newIndex) => {
    selectedIndex = newIndex;
    updateRosterActiveState(selectedIndex);
    updateInspector(selectedIndex);
    const hudFocus = qs("#hud-current-focus", container);
    if (hudFocus) hudFocus.textContent = `Focus: ${designers[selectedIndex].name}`;
  });

  function updateRosterActiveState(idx) {
    qsa(".designer-roster-card", container).forEach((card, i) => {
      card.classList.toggle("is-active", i === idx);
    });
  }

  // Bind Left Roster Clicks
  qsa(".designer-roster-card", container).forEach((card) => {
    card.addEventListener("click", () => {
      const idx = parseInt(card.dataset.designerIndex, 10);
      if (!isNaN(idx)) {
        selectedIndex = idx;
        updateRosterActiveState(idx);
        updateInspector(idx);
        focusDesk(idx);
      }
    });
  });

  // Bind View Switcher
  qs("#btn-view-classic", container)?.addEventListener("click", () => {
    localStorage.setItem("cont_dashboard_view", "classic");
    cleanupStudio3D();
    if (typeof onSwitchToClassic === "function") {
      onSwitchToClassic();
    }
  });

  qs("#btn-studio-quick-create", container)?.addEventListener("click", () => {
    openCreateTask(ctx);
  });
}

/* ─────────────────────────────────────────────────────────────────────────
   Three.js 3D Studio Implementation
───────────────────────────────────────────────────────────────────────── */
let focusDesk = () => {};

function initThreeJsStudio(designers, onSelectDesigner) {
  if (typeof THREE === "undefined") {
    console.error("Three.js not loaded. Retrying dynamically...");
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = () => initThreeJsStudio(designers, onSelectDesigner);
    document.head.appendChild(script);
    return;
  }

  const canvasContainer = document.getElementById("studio3d-canvas-container");
  const tagsOverlay = document.getElementById("studio3d-tags-overlay");
  if (!canvasContainer) return;

  const width = canvasContainer.clientWidth || 800;
  const height = canvasContainer.clientHeight || 600;

  // Scene & Camera
  const scene = new THREE.Scene();
  currentScene = scene;
  scene.background = new THREE.Color(0x0a0c14);
  scene.fog = new THREE.FogExp2(0x0a0c14, 0.022);

  const camera = new THREE.PerspectiveCamera(40, width / height, 0.5, 100);
  
  // Camera Position Target for smooth LERP
  const overviewPos = new THREE.Vector3(0, 16, 23);
  const overviewLookAt = new THREE.Vector3(0, 1, 0);

  const targetCamPos = overviewPos.clone();
  const targetCamLookAt = overviewLookAt.clone();
  const currentLookAt = overviewLookAt.clone();

  camera.position.copy(overviewPos);
  camera.lookAt(currentLookAt);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  currentRenderer = renderer;
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  canvasContainer.appendChild(renderer.domElement);

  // 1. Studio Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 0.85);
  sunLight.position.set(12, 22, 14);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 1024;
  sunLight.shadow.mapSize.height = 1024;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 50;
  sunLight.shadow.camera.left = -16;
  sunLight.shadow.camera.right = 16;
  sunLight.shadow.camera.top = 16;
  sunLight.shadow.camera.bottom = -16;
  scene.add(sunLight);

  // KKP Brand Accent Neon Lights (Cyan & Purple)
  const cyanLight = new THREE.PointLight(0x19c3eb, 1.4, 28);
  cyanLight.position.set(-10, 8, -6);
  scene.add(cyanLight);

  const purpleLight = new THREE.PointLight(0xa855f7, 1.2, 28);
  purpleLight.position.set(10, 8, -6);
  scene.add(purpleLight);

  // 2. Studio Floor with Grid
  const floorGeo = new THREE.PlaneGeometry(50, 40);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0f111c,
    roughness: 0.45,
    metalness: 0.25
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // Grid Helper
  const grid = new THREE.GridHelper(44, 44, 0x19c3eb, 0x1e243a);
  grid.position.y = 0.01;
  scene.add(grid);

  // 3. Studio Back Wall & Neon Signboard
  const wallGeo = new THREE.BoxGeometry(40, 10, 0.5);
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x111320, roughness: 0.8 });
  const wall = new THREE.Mesh(wallGeo, wallMat);
  wall.position.set(0, 5, -10);
  wall.receiveShadow = true;
  scene.add(wall);

  // Neon KKP Signboard on Back Wall
  const signCanvas = document.createElement("canvas");
  signCanvas.width = 1024;
  signCanvas.height = 256;
  const sctx = signCanvas.getContext("2d");
  sctx.fillStyle = "#121422";
  sctx.fillRect(0, 0, 1024, 256);
  sctx.strokeStyle = "#e62e2e";
  sctx.lineWidth = 6;
  sctx.strokeRect(10, 10, 1004, 236);
  sctx.font = "bold 60px sans-serif";
  sctx.fillStyle = "#ffffff";
  sctx.textAlign = "center";
  sctx.fillText("KKP GRAPHIC DESIGN STUDIO", 512, 110);
  sctx.font = "32px sans-serif";
  sctx.fillStyle = "#19c3eb";
  sctx.fillText("CREATIVE OPERATIONS & REAL-TIME DASHBOARD", 512, 175);

  const signTex = new THREE.CanvasTexture(signCanvas);
  const signGeo = new THREE.PlaneGeometry(16, 4);
  const signMat = new THREE.MeshBasicMaterial({ map: signTex });
  const signboard = new THREE.Mesh(signGeo, signMat);
  signboard.position.set(0, 5.5, -9.7);
  scene.add(signboard);

  // 4. Build Workstations for each Designer
  const deskMeshes = [];
  const deskRaycastObjects = [];
  const deskTags = [];

  // Screen graphic art textures
  function createArtworkScreenCanvas(title, pct) {
    const cvs = document.createElement("canvas");
    cvs.width = 512;
    cvs.height = 280;
    const c = cvs.getContext("2d");
    c.fillStyle = "#0c0d16";
    c.fillRect(0, 0, 512, 280);
    // Gradient artwork preview
    const grad = c.createLinearGradient(0, 0, 512, 280);
    grad.addColorStop(0, "#4a2574");
    grad.addColorStop(0.5, "#19c3eb");
    grad.addColorStop(1, "#ffc61a");
    c.fillStyle = grad;
    c.fillRect(30, 30, 452, 150);
    // UI Mockup lines
    c.fillStyle = "#ffffff";
    c.font = "bold 26px sans-serif";
    c.fillText(title.slice(0, 22), 40, 225);
    c.fillStyle = "#2bd14b";
    c.font = "bold 20px sans-serif";
    c.fillText(`Active Progress: ${pct}%`, 40, 260);
    return new THREE.CanvasTexture(cvs);
  }

  designers.forEach((d, idx) => {
    const deskGroup = new THREE.Group();
    deskGroup.position.set(d.posX, 0, d.posZ);

    // Desktop Surface
    const topGeo = new THREE.BoxGeometry(4.2, 0.15, 2.2);
    const topMat = new THREE.MeshStandardMaterial({
      color: 0x1c2032,
      roughness: 0.35,
      metalness: 0.3
    });
    const tableTop = new THREE.Mesh(topGeo, topMat);
    tableTop.position.y = 1.6;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    deskGroup.add(tableTop);

    // Steel Legs
    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x3a4260, metalness: 0.8, roughness: 0.2 });
    [[-1.9, 0.8, -0.9], [1.9, 0.8, -0.9], [-1.9, 0.8, 0.9], [1.9, 0.8, 0.9]].forEach(pos => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(pos[0], pos[1], pos[2]);
      leg.castShadow = true;
      deskGroup.add(leg);
    });

    // Dual Curved Wide Monitors
    const screenTex = createArtworkScreenCanvas(d.currentTask.title, d.currentProgress);
    const screenGeo = new THREE.BoxGeometry(1.6, 1.0, 0.08);
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
    const monitorFrameMat = new THREE.MeshStandardMaterial({ color: 0x050608, roughness: 0.5 });

    // Monitor 1 (Left)
    const monLeft = new THREE.Mesh(screenGeo, screenMat);
    monLeft.position.set(-0.85, 2.4, -0.4);
    monLeft.rotation.y = 0.18;
    monLeft.castShadow = true;
    deskGroup.add(monLeft);

    // Monitor 2 (Right)
    const monRight = new THREE.Mesh(screenGeo, screenMat);
    monRight.position.set(0.85, 2.4, -0.4);
    monRight.rotation.y = -0.18;
    monRight.castShadow = true;
    deskGroup.add(monRight);

    // Monitor Stands
    const standGeo = new THREE.BoxGeometry(0.1, 0.8, 0.1);
    const stand = new THREE.Mesh(standGeo, monitorFrameMat);
    stand.position.set(0, 2.0, -0.5);
    deskGroup.add(stand);

    // Keyboard & Wacom Tablet
    const kbGeo = new THREE.BoxGeometry(1.2, 0.03, 0.4);
    const kbMat = new THREE.MeshStandardMaterial({ color: 0x141622, roughness: 0.4 });
    const kb = new THREE.Mesh(kbGeo, kbMat);
    kb.position.set(-0.3, 1.68, 0.3);
    deskGroup.add(kb);

    const wacomGeo = new THREE.BoxGeometry(0.8, 0.02, 0.6);
    const wacomMat = new THREE.MeshStandardMaterial({ color: 0x0b0d14, roughness: 0.2 });
    const wacom = new THREE.Mesh(wacomGeo, wacomMat);
    wacom.position.set(1.0, 1.68, 0.3);
    deskGroup.add(wacom);

    // Desk Lamp with warm glow
    const lampArmGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.0);
    const lampArm = new THREE.Mesh(lampArmGeo, legMat);
    lampArm.position.set(-1.7, 2.1, -0.5);
    deskGroup.add(lampArm);

    const lampShadeGeo = new THREE.ConeGeometry(0.25, 0.35, 16);
    const lampShadeMat = new THREE.MeshStandardMaterial({ color: 0xffc61a, metalness: 0.5 });
    const lampShade = new THREE.Mesh(lampShadeGeo, lampShadeMat);
    lampShade.position.set(-1.7, 2.6, -0.4);
    lampShade.rotation.x = Math.PI * 0.8;
    deskGroup.add(lampShade);

    const deskLight = new THREE.PointLight(0xffeedd, 0.8, 4.5);
    deskLight.position.set(-1.7, 2.4, -0.2);
    deskGroup.add(deskLight);

    // Ergonomic Chair
    const chairSeatGeo = new THREE.BoxGeometry(1.1, 0.12, 1.1);
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x1a1d2e, roughness: 0.6 });
    const chairSeat = new THREE.Mesh(chairSeatGeo, chairMat);
    chairSeat.position.set(0, 1.2, 1.2);
    chairSeat.castShadow = true;
    deskGroup.add(chairSeat);

    const chairBackGeo = new THREE.BoxGeometry(1.0, 1.2, 0.12);
    const chairBack = new THREE.Mesh(chairBackGeo, chairMat);
    chairBack.position.set(0, 1.8, 1.7);
    chairBack.castShadow = true;
    deskGroup.add(chairBack);

    // 3D Stylized Character Avatar
    const charGroup = new THREE.Group();
    charGroup.position.set(0, 1.25, 1.1);

    // Torso (Hoodie / Shirt)
    const hoodieColor = idx % 2 === 0 ? 0xe62e2e : 0x19c3eb;
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.38, 0.9, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: hoodieColor, roughness: 0.5 });
    const charBody = new THREE.Mesh(bodyGeo, bodyMat);
    charBody.position.y = 0.55;
    charBody.castShadow = true;
    charGroup.add(charBody);

    // Head
    const headGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdfbe, roughness: 0.7 });
    const charHead = new THREE.Mesh(headGeo, headMat);
    charHead.position.y = 1.2;
    charHead.castShadow = true;
    charGroup.add(charHead);

    // Headphones
    const hpGeo = new THREE.TorusGeometry(0.32, 0.05, 8, 16);
    const hpMat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.6 });
    const headphones = new THREE.Mesh(hpGeo, hpMat);
    headphones.position.y = 1.22;
    headphones.rotation.x = Math.PI / 2;
    charGroup.add(headphones);

    deskGroup.add(charGroup);
    deskGroup.userData = { designerIndex: idx, charGroup };

    scene.add(deskGroup);
    deskMeshes.push(deskGroup);
    deskRaycastObjects.push(tableTop);
    tableTop.userData = { designerIndex: idx };

    // Floating 2D Hologram Tag in Overlay DOM
    const tag = document.createElement("div");
    tag.className = `studio-floating-tag ${idx === 0 ? "is-active" : ""}`;
    tag.innerHTML = `
      <span class="tag-name">${escapeHtml(d.name.split(" ")[0])}</span>
      <span class="tag-status-badge">${d.currentProgress}%</span>
    `;
    tag.addEventListener("click", () => {
      onSelectDesigner(idx);
      focusDesk(idx);
    });
    tagsOverlay.appendChild(tag);
    deskTags.push({ el: tag, pos: new THREE.Vector3(d.posX, 3.4, d.posZ) });
  });

  // 5. Camera Control Logic
  focusDesk = function(idx) {
    const d = designers[idx];
    targetCamPos.set(d.posX, 3.2, d.posZ + 5.2);
    targetCamLookAt.set(d.posX, 1.8, d.posZ);

    deskTags.forEach((t, i) => {
      t.el.classList.toggle("is-active", i === idx);
    });
  };

  function resetToOverview() {
    targetCamPos.copy(overviewPos);
    targetCamLookAt.copy(overviewLookAt);
  }

  // HUD Buttons
  document.getElementById("hud-reset-cam")?.addEventListener("click", resetToOverview);
  document.getElementById("hud-prev-desk")?.addEventListener("click", () => {
    let nextIdx = (designers.findIndex(d => d.posX === targetCamLookAt.x) - 1 + designers.length) % designers.length;
    onSelectDesigner(nextIdx);
    focusDesk(nextIdx);
  });
  document.getElementById("hud-next-desk")?.addEventListener("click", () => {
    let nextIdx = (designers.findIndex(d => d.posX === targetCamLookAt.x) + 1) % designers.length;
    onSelectDesigner(nextIdx);
    focusDesk(nextIdx);
  });

  // 6. Interactive Raycasting on Mouse Hover & Click
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onPointerMove(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(deskRaycastObjects);

    if (intersects.length > 0) {
      renderer.domElement.style.cursor = "pointer";
    } else {
      renderer.domElement.style.cursor = "default";
    }
  }

  function onPointerClick(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(deskRaycastObjects);

    if (intersects.length > 0) {
      const idx = intersects[0].object.userData.designerIndex;
      if (typeof idx === "number") {
        onSelectDesigner(idx);
        focusDesk(idx);
      }
    }
  }

  renderer.domElement.addEventListener("mousemove", onPointerMove);
  renderer.domElement.addEventListener("click", onPointerClick);

  // 7. Render Animation Loop
  let clock = new THREE.Clock();

  function animate() {
    if (!isMounted) return;
    animationFrameId = requestAnimationFrame(animate);

    const elapsed = clock.getElapsedTime();

    // Smooth Camera LERP Interpolation
    camera.position.lerp(targetCamPos, 0.05);
    currentLookAt.lerp(targetCamLookAt, 0.05);
    camera.lookAt(currentLookAt);

    // Subtle Character Breathing / Working Animation
    deskMeshes.forEach((mesh, i) => {
      const charGroup = mesh.userData.charGroup;
      if (charGroup) {
        charGroup.position.y = 1.25 + Math.sin(elapsed * 2.5 + i) * 0.015;
      }
    });

    // Update Floating 2D Hologram Tags Projection
    const tempV = new THREE.Vector3();
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    deskTags.forEach(item => {
      tempV.copy(item.pos);
      tempV.project(camera);

      // Check if behind camera
      if (tempV.z > 1) {
        item.el.style.display = "none";
      } else {
        item.el.style.display = "flex";
        const x = (tempV.x * halfWidth) + halfWidth;
        const y = -(tempV.y * halfHeight) + halfHeight;
        item.el.style.left = `${x}px`;
        item.el.style.top = `${y}px`;
      }
    });

    renderer.render(scene, camera);
  }

  animate();

  // Resize Listener
  function onResize() {
    if (!canvasContainer || !renderer) return;
    const w = canvasContainer.clientWidth;
    const h = canvasContainer.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }

  window.addEventListener("resize", onResize);
}
