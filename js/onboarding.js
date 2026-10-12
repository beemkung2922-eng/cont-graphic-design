/**
 * CONT Graphic Design Workflow — Interactive Product Tour & Onboarding Walkthrough
 * ─────────────────────────────────────────────────────────────────────────────
 * 4-Stage Experience:
 * 1. Welcome Modal: Quick friendly greeting with time estimate & skip option
 * 2. Interactive Spotlight Walkthrough: 4 key high-value areas with spotlight & dim backdrop
 * 3. Onboarding Checklist: First action / Aha! moment with progress percentage
 * 4. Completion & Celebration: Confetti celebration with quick support links
 */

import { escapeHtml } from "./formatters.js";
import { pixelIcons } from "./pixel-icons.js";

const STORAGE_KEY = "cont_product_tour_v2";

const TOUR_STEPS = [
  {
    id: "nav_hub",
    selector: ".pixel-nav-links, .topbar .nav, .topbar",
    title: "ศูนย์รวมเมนูการทำงานหลัก (Navigation Hub)",
    body: "สลับดูภาพรวมทั้งหมด (Dashboard), คลังงาน (Tasks), บอร์ดลากย้ายขั้นตอน (Board), ปฏิทินกำหนดส่ง (Calendar) และทีมงาน (Team) ได้ในคลิกเดียว",
    benefit: "⚡ เข้าถึงทุกฟังก์ชันสำคัญได้ทันใจบนทุกอุปกรณ์",
    preferredPosition: "bottom",
  },
  {
    id: "create_task",
    selector: "#hero-create-btn, #top-create-btn, #board-create, [data-open-create-task]",
    fallbackSelector: ".pixel-topbar-right, .brand",
    title: "เปิดบรีฟหรือส่งคำขอใหม่ใน 30 วินาที",
    body: "ส่งคำขอเริ่มงานใหม่ด้วย Smart Brief Presets (Facebook, Story, GDN, Print) ที่คำนวณขนาดและกำหนดส่งให้อัตโนมัติ",
    benefit: "🎯 บรีฟชัดเจน ลดรอบแก้งาน ดีไซเนอร์ลงมือทำได้ทันที",
    preferredPosition: "bottom",
  },
  {
    id: "smart_filters",
    selector: "#dash-filter-bar, .board-toolbar, .filter-bar",
    fallbackSelector: ".pixel-stats-bar, .charts-row",
    title: "ตัวกรองงานอัจฉริยะ (Smart Filter & Drilldown)",
    body: "คัดกรองดูเฉพาะงานของคุณ หรือเลือกดูตามเดือน สัปดาห์ และตรวจเช็กงานเร่งด่วนที่ใกล้ถึงเดดไลน์ SLA ได้แม่นยำ",
    benefit: "🔍 ค้นหางานที่ต้องการในเสี้ยววินาที ไม่ต้องเลื่อนหา",
    preferredPosition: "bottom",
  },
  {
    id: "workflow_track",
    selector: "#member-comparison-section, .kanban-wrap, .pixel-stats-bar, .charts-row",
    fallbackSelector: ".page",
    title: "ติดตามสถานะและภาระงานแบบเรียลไทม์",
    body: "อัปเดตขั้นตอนจากบรีฟสู่ส่งมอบ พร้อมสถิติภาระงานและรอบแก้ไขของแต่ละคนอย่างโปร่งใส",
    benefit: "📊 เห็นภาพรวมกำลังคน ป้องกันงานคั่งค้างในทีม",
    preferredPosition: "top",
  },
];

class OnboardingTour {
  constructor() {
    this.currentStep = 0;
    this.checklistState = {
      explore: false,
      create: false,
      filter: false,
    };
    this.spotlightEl = null;
    this.tooltipEl = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STAGE 1: WELCOME MODAL
  // ──────────────────────────────────────────────────────────────────────────
  showWelcomeModal() {
    this.cleanup();

    const overlay = document.createElement("div");
    overlay.className = "tour-modal-backdrop";
    overlay.id = "tour-welcome-modal";

    overlay.innerHTML = `
      <div class="tour-modal-card crt-scanlines">
        <div class="tour-modal-badge">
          ${pixelIcons.rocket}
          <span>PRODUCT TOUR · ใช้เวลาเพียง 1-2 นาที</span>
        </div>

        <div class="tour-modal-media">
          <img src="assets/hero-city.png" alt="CONT Workflow 2.0" class="tour-modal-img pixel-bob-animation" />
          <div class="tour-modal-media-overlay">
            <span class="pixel-tag is-cyan">CONT 2.0 ENGINE</span>
          </div>
        </div>

        <div class="tour-modal-body">
          <h2 class="tour-modal-title">
            ยินดีต้อนรับสู่ <span>CONT WORKFLOW</span>
          </h2>
          <p class="tour-modal-desc">
            ระบบบริหารจัดการกระบวนการออกแบบกราฟิก KKP แบบเรียลไทม์<br />
            ติดตามบรีฟงาน การตรวจแบบ และขีดความสามารถของทีมอย่างแม่นยำในสไตล์ 8-Bit
          </p>

          <div class="tour-benefits-grid">
            <div class="tour-benefit-pill">
              <span class="tb-icon">🚀</span>
              <div class="tb-text"><strong>สร้างงานใน 30 วิ</strong><br/>พรีเซ็ตบรีฟด่วนอัตโนมัติ</div>
            </div>
            <div class="tour-benefit-pill">
              <span class="tb-icon">⏱️</span>
              <div class="tb-text"><strong>ติดตาม SLA แม่นยำ</strong><br/>แจ้งเตือนก่อนเลยกำหนด</div>
            </div>
            <div class="tour-benefit-pill">
              <span class="tb-icon">📊</span>
              <div class="tb-text"><strong>วิเคราะห์ภาระงาน</strong><br/>จัดสรรโหลดงานรายคนชัดเจน</div>
            </div>
          </div>
        </div>

        <div class="tour-modal-footer">
          <label class="tour-remember-label">
            <input type="checkbox" id="tour-dont-show-again" />
            <span>ไม่ต้องแสดงหน้านี้อัตโนมัติอีก</span>
          </label>
          <div class="tour-modal-btns">
            <button class="btn-pixel btn-pixel-dark" id="tour-skip-welcome">
              ข้ามไปก่อน (Skip)
            </button>
            <button class="btn-pixel btn-pixel-red" id="tour-start-walkthrough">
              ${pixelIcons.arrowRight}
              <span>เริ่มทัวร์แนะนำเว็บ (Start Tour)</span>
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector("#tour-start-walkthrough")?.addEventListener("click", () => {
      this.saveDontShowPreference(overlay);
      overlay.remove();
      this.startSpotlightWalkthrough();
    });

    overlay.querySelector("#tour-skip-welcome")?.addEventListener("click", () => {
      this.saveDontShowPreference(overlay);
      overlay.remove();
      this.showChecklistDrawer();
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        this.saveDontShowPreference(overlay);
        overlay.remove();
      }
    });
  }

  saveDontShowPreference(overlay) {
    const chk = overlay?.querySelector("#tour-dont-show-again");
    if (chk?.checked) {
      localStorage.setItem(STORAGE_KEY, "completed");
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STAGE 2: INTERACTIVE SPOTLIGHT WALKTHROUGH
  // ──────────────────────────────────────────────────────────────────────────
  startSpotlightWalkthrough() {
    this.cleanup();
    this.currentStep = 0;

    // Create Spotlight Hole
    this.spotlightEl = document.createElement("div");
    this.spotlightEl.className = "tour-spotlight-hole";
    this.spotlightEl.id = "tour-spotlight-hole";
    document.body.appendChild(this.spotlightEl);

    // Create Tooltip
    this.tooltipEl = document.createElement("div");
    this.tooltipEl.className = "tour-tooltip-card crt-scanlines";
    this.tooltipEl.id = "tour-tooltip-card";
    document.body.appendChild(this.tooltipEl);

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("scroll", this.handleResize, { passive: true });

    this.renderStep(this.currentStep);
  }

  renderStep(index) {
    if (index < 0) {
      this.cleanup();
      this.showWelcomeModal();
      return;
    }

    if (index >= TOUR_STEPS.length) {
      this.cleanup();
      this.showChecklistDrawer();
      return;
    }

    const step = TOUR_STEPS[index];
    let target = document.querySelector(step.selector);
    if (!target && step.fallbackSelector) {
      target = document.querySelector(step.fallbackSelector);
    }
    if (!target) {
      target = document.body;
    }

    // Scroll to target smoothly
    if (target !== document.body) {
      target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }

    // Give a brief moment for smooth scroll to finish
    window.setTimeout(() => {
      this.positionSpotlightAndTooltip(target, step, index);
    }, 180);
  }

  positionSpotlightAndTooltip(target, step, index) {
    if (!this.spotlightEl || !this.tooltipEl) return;

    const isBody = target === document.body;
    const rect = isBody
      ? { top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 200, width: 400, height: 200, bottom: window.innerHeight / 2 + 100, right: window.innerWidth / 2 + 200 }
      : target.getBoundingClientRect();

    const padding = 10;
    const sTop = Math.max(0, rect.top - padding);
    const sLeft = Math.max(0, rect.left - padding);
    const sWidth = Math.min(window.innerWidth - sLeft, rect.width + padding * 2);
    const sHeight = Math.min(window.innerHeight - sTop, rect.height + padding * 2);

    this.spotlightEl.style.top = `${sTop}px`;
    this.spotlightEl.style.left = `${sLeft}px`;
    this.spotlightEl.style.width = `${sWidth}px`;
    this.spotlightEl.style.height = `${sHeight}px`;

    const progressPercent = Math.round(((index + 1) / TOUR_STEPS.length) * 100);

    this.tooltipEl.innerHTML = `
      <div class="tour-tooltip-progress-bar">
        <div class="tour-tooltip-progress-fill" style="width: ${progressPercent}%;"></div>
      </div>

      <div class="tour-tooltip-header">
        <div class="tour-step-pill">
          <span class="step-dot"></span>
          <span>ขั้นตอนที่ ${index + 1} จาก ${TOUR_STEPS.length}</span>
        </div>
        <button class="tour-tooltip-close" id="tour-step-close" title="ข้ามการแนะนำ (Skip)">×</button>
      </div>

      <div class="tour-tooltip-main">
        <h3 class="tour-tooltip-title">${escapeHtml(step.title)}</h3>
        <p class="tour-tooltip-body">${escapeHtml(step.body)}</p>
        <div class="tour-tooltip-benefit">
          <span>${escapeHtml(step.benefit)}</span>
        </div>
      </div>

      <div class="tour-tooltip-footer">
        <button class="tour-btn-link" id="tour-btn-skip">
          ข้ามทัวร์ (Skip)
        </button>
        <div class="tour-tooltip-nav">
          ${index > 0 ? `
            <button class="btn-pixel btn-pixel-dark" id="tour-btn-prev">
              ← ก่อนหน้า
            </button>
          ` : ""}
          <button class="btn-pixel btn-pixel-cyan" id="tour-btn-next">
            ${index === TOUR_STEPS.length - 1 ? "ไปต่อที่ภารกิจแรก 🎯" : "ถัดไป →"}
          </button>
        </div>
      </div>
    `;

    // Position tooltip
    const ttWidth = Math.min(380, window.innerWidth - 32);
    this.tooltipEl.style.width = `${ttWidth}px`;

    let ttTop = sTop + sHeight + 14;
    let ttLeft = Math.max(16, Math.min(window.innerWidth - ttWidth - 16, sLeft + (sWidth / 2) - (ttWidth / 2)));

    // If bottom runs off screen, position on top
    if (ttTop + 240 > window.innerHeight && sTop > 240) {
      ttTop = Math.max(16, sTop - 240);
    }

    this.tooltipEl.style.top = `${ttTop}px`;
    this.tooltipEl.style.left = `${ttLeft}px`;

    // Attach step buttons
    this.tooltipEl.querySelector("#tour-btn-prev")?.addEventListener("click", () => {
      this.currentStep--;
      this.renderStep(this.currentStep);
    });

    this.tooltipEl.querySelector("#tour-btn-next")?.addEventListener("click", () => {
      this.currentStep++;
      this.renderStep(this.currentStep);
    });

    this.tooltipEl.querySelector("#tour-step-close")?.addEventListener("click", () => {
      this.cleanup();
      this.showChecklistDrawer();
    });

    this.tooltipEl.querySelector("#tour-btn-skip")?.addEventListener("click", () => {
      this.cleanup();
      this.showChecklistDrawer();
    });
  }

  handleKeyDown(e) {
    if (e.key === "Escape") {
      this.cleanup();
    } else if (e.key === "ArrowRight") {
      if (this.spotlightEl && this.currentStep < TOUR_STEPS.length) {
        this.currentStep++;
        this.renderStep(this.currentStep);
      }
    } else if (e.key === "ArrowLeft") {
      if (this.spotlightEl && this.currentStep > 0) {
        this.currentStep--;
        this.renderStep(this.currentStep);
      }
    }
  }

  handleResize() {
    if (this.spotlightEl && this.currentStep < TOUR_STEPS.length) {
      this.renderStep(this.currentStep);
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STAGE 3: ONBOARDING CHECKLIST (FIRST ACTION / AHA! MOMENT)
  // ──────────────────────────────────────────────────────────────────────────
  showChecklistDrawer() {
    this.cleanup();

    const drawer = document.createElement("div");
    drawer.className = "tour-checklist-drawer crt-scanlines";
    drawer.id = "tour-checklist-drawer";

    const updateChecklist = () => {
      const completedCount = Object.values(this.checklistState).filter(Boolean).length;
      const total = 3;
      const pct = Math.round((completedCount / total) * 100);

      drawer.innerHTML = `
        <div class="tour-cl-header">
          <div class="tour-cl-title-wrap">
            <span class="tour-cl-badge">ภารกิจเริ่มต้น (FIRST ACTIONS)</span>
            <h4 class="tour-cl-title">ลองใช้งานจริงเพื่อรับประสบการณ์ที่ดีที่สุด</h4>
          </div>
          <button class="tour-cl-close" id="tour-cl-close" title="ปิด">×</button>
        </div>

        <div class="tour-cl-progress-box">
          <div class="tour-cl-progress-info">
            <span>ความสำเร็จ: <strong>${completedCount} จาก ${total} ภารกิจ</strong></span>
            <span class="tour-cl-pct" style="color:var(--cyan);font-family:var(--font-mono);">${pct}%</span>
          </div>
          <div class="tour-cl-bar">
            <div class="tour-cl-bar-fill" style="width: ${pct}%;"></div>
          </div>
        </div>

        <div class="tour-cl-items">
          <!-- Action 1 -->
          <div class="tour-cl-item ${this.checklistState.explore ? "is-done" : ""}">
            <div class="tour-cl-check">${this.checklistState.explore ? "✓" : "1"}</div>
            <div class="tour-cl-content">
              <div class="tour-cl-item-title">🔍 สำรวจรายละเอียดงานแรก</div>
              <div class="tour-cl-item-sub">คลิกเปิดดูการ์ดงานเพื่อตรวจสอบสเปก บรีฟ และไทม์ไลน์</div>
            </div>
            <button class="btn-pixel btn-pixel-dark btn-cl-action" id="cl-act-explore">
              ${this.checklistState.explore ? "เสร็จแล้ว" : "ลองเลย →"}
            </button>
          </div>

          <!-- Action 2 -->
          <div class="tour-cl-item ${this.checklistState.create ? "is-done" : ""}">
            <div class="tour-cl-check">${this.checklistState.create ? "✓" : "2"}</div>
            <div class="tour-cl-content">
              <div class="tour-cl-item-title">🚀 ทดลองเปิดฟอร์มสร้างงานใหม่</div>
              <div class="tour-cl-item-sub">ดูเทมเพลตบรีฟด่วน (Smart Brief Presets) ที่ตั้งค่าสเปกไว้พร้อมใช้</div>
            </div>
            <button class="btn-pixel btn-pixel-red btn-cl-action" id="cl-act-create">
              ${this.checklistState.create ? "เสร็จแล้ว" : "เปิดดู →"}
            </button>
          </div>

          <!-- Action 3 -->
          <div class="tour-cl-item ${this.checklistState.filter ? "is-done" : ""}">
            <div class="tour-cl-check">${this.checklistState.filter ? "✓" : "3"}</div>
            <div class="tour-cl-content">
              <div class="tour-cl-item-title">🎯 ทดลองใช้ตัวกรองงาน</div>
              <div class="tour-cl-item-sub">คลิกสลับช่วงเวลา 7 วัน / เดือนนี้ หรือกรองดูงานเร่งด่วน</div>
            </div>
            <button class="btn-pixel btn-pixel-cyan btn-cl-action" id="cl-act-filter">
              ${this.checklistState.filter ? "เสร็จแล้ว" : "ทดลอง →"}
            </button>
          </div>
        </div>

        <div class="tour-cl-footer">
          <button class="btn-pixel btn-pixel-dark" id="tour-cl-skip-finish" style="font-size:0.78rem;">
            ข้ามไปยังหน้าสรุป →
          </button>
          ${completedCount === total ? `
            <button class="btn-pixel btn-pixel-yellow" id="tour-cl-celebrate">
              🎉 รับรางวัลความสำเร็จ →
            </button>
          ` : ""}
        </div>
      `;

      // Bind actions
      drawer.querySelector("#cl-act-explore")?.addEventListener("click", () => {
        this.checklistState.explore = true;
        updateChecklist();
        const firstCard = document.querySelector("[data-task-id], .activity-item, .pixel-featured-card");
        if (firstCard) {
          firstCard.scrollIntoView({ behavior: "smooth", block: "center" });
          firstCard.style.outline = "3px solid var(--yellow)";
          setTimeout(() => { firstCard.style.outline = ""; }, 2500);
        }
      });

      drawer.querySelector("#cl-act-create")?.addEventListener("click", () => {
        this.checklistState.create = true;
        updateChecklist();
        window.openCreateTask?.();
      });

      drawer.querySelector("#cl-act-filter")?.addEventListener("click", () => {
        this.checklistState.filter = true;
        updateChecklist();
        const chip = document.querySelector(".dfb-chip, .filter-pill");
        if (chip) {
          chip.scrollIntoView({ behavior: "smooth", block: "center" });
          chip.click();
        }
      });

      drawer.querySelector("#tour-cl-close")?.addEventListener("click", () => {
        drawer.remove();
        localStorage.setItem(STORAGE_KEY, "completed");
      });

      drawer.querySelector("#tour-cl-skip-finish")?.addEventListener("click", () => {
        drawer.remove();
        this.showCelebrationModal();
      });

      drawer.querySelector("#tour-cl-celebrate")?.addEventListener("click", () => {
        drawer.remove();
        this.showCelebrationModal();
      });
    };

    document.body.appendChild(drawer);
    updateChecklist();
  }

  // ──────────────────────────────────────────────────────────────────────────
  // STAGE 4: COMPLETION / CELEBRATION
  // ──────────────────────────────────────────────────────────────────────────
  showCelebrationModal() {
    this.cleanup();
    localStorage.setItem(STORAGE_KEY, "completed");

    const overlay = document.createElement("div");
    overlay.className = "tour-modal-backdrop";
    overlay.id = "tour-celebration-modal";

    overlay.innerHTML = `
      <div class="tour-modal-card crt-scanlines" style="max-width:480px;text-align:center;">
        <div class="tour-celebration-badge">
          🎉 ALL CLEAR · ONBOARDING COMPLETE
        </div>

        <div class="tour-celebration-icon">
          ${pixelIcons.trophy}
        </div>

        <h2 class="tour-modal-title" style="margin-top:12px;">
          ยอดเยี่ยมมาก! คุณพร้อมลุยงานแล้ว 🚀
        </h2>

        <p class="tour-modal-desc" style="margin-bottom:20px;">
          คุณได้สำรวจกระบวนการทำงานหลักของ CONT 2.0 เรียบร้อยแล้ว<br />
          ตอนนี้คุณสามารถส่งบรีฟ ตรวจสอบงาน และติดตามสถานะได้ทันที
        </p>

        <!-- Quick Help Channels -->
        <div class="tour-help-channels">
          <div class="tour-help-box">
            <span class="th-icon">📖</span>
            <div class="th-content">
              <strong>เปิดทัวร์นี้ซ้ำได้ตลอดเวลา</strong>
              <span>คลิกที่ปุ่ม <strong>GUIDE</strong> บนแถบเมนูด้านบน</span>
            </div>
          </div>
          <div class="tour-help-box">
            <span class="th-icon">💬</span>
            <div class="th-content">
              <strong>ทีมงาน Visual & Design พร้อมสนับสนุน</strong>
              <span>แจ้งปัญหาการใช้งานหรือแนะนำติชมได้ผ่านช่องทางภายใน KKP</span>
            </div>
          </div>
        </div>

        <div style="margin-top:24px;display:flex;gap:10px;justify-content:center;">
          <button class="btn-pixel btn-pixel-cyan" id="tour-finish-btn" style="padding:10px 24px;font-size:0.9rem;">
            ${pixelIcons.rocket}
            <span>เข้าสู่การทำงานจริง (Let's Create)</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector("#tour-finish-btn")?.addEventListener("click", () => {
      overlay.remove();
    });

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.remove();
    });
  }

  cleanup() {
    document.querySelector("#tour-welcome-modal")?.remove();
    document.querySelector("#tour-spotlight-hole")?.remove();
    document.querySelector("#tour-tooltip-card")?.remove();
    document.querySelector("#tour-checklist-drawer")?.remove();
    document.querySelector("#tour-celebration-modal")?.remove();

    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("scroll", this.handleResize);
    this.spotlightEl = null;
    this.tooltipEl = null;
  }
}

// Singleton Instance
let tourInstance = null;

export function startProductTour(force = true) {
  if (!force) {
    const status = localStorage.getItem(STORAGE_KEY);
    if (status === "completed") return;
  }

  if (!tourInstance) {
    tourInstance = new OnboardingTour();
  }
  tourInstance.showWelcomeModal();
}
