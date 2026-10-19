/**
 * CONT Graphic Design Workflow — Interactive Product Tour
 * ─────────────────────────────────────────────────────────────────────────────
 * Spotlights all key sections of the website with concise 1-2 line explanations.
 * Direct, punchy, easy to read in one glance.
 */

import { escapeHtml } from "./formatters.js";

const STORAGE_KEY = "cont_product_tour_v4";
const VISITED_KEY = "cont_has_visited_system";

// All core sections to introduce (Filtered dynamically by what's present on the current page)
const ALL_SECTION_STEPS = [
  {
    id: "nav_menu",
    selector: ".pixel-nav-links",
    fallbackSelector: ".pixel-topbar, .topbar",
    title: "แถบเมนูหลัก & ปุ่ม GUIDE (Main Navigation)",
    body: "ใช้สลับหน้าระหว่าง แดชบอร์ด, งานของฉัน, บอร์ด Kanban, ปฏิทินกำหนดส่ง, ทีมงาน และสามารถคลิกปุ่ม GUIDE ตรงนี้เพื่อเปิดดูคำแนะนำการใช้งานระบบได้ตลอดเวลา",
  },
  {
    id: "create_btn",
    selector: "#quick-create, #btn-overview-new-task, .btn-pixel-red",
    title: "ปุ่มเปิดบรีฟงานใหม่ (+ สร้างงาน)",
    body: "กดเพื่อเปิดแบบฟอร์มส่งบรีฟงานใหม่ กรอกรายละเอียด เลือกขนาดไฟล์ และแนบ Reference เพื่อส่งงานเข้าสู่กระบวนการผลิตได้ทันทีใน 30 วินาที",
  },
  {
    id: "search_notif",
    selector: ".pixel-topbar-right",
    fallbackSelector: ".search-inline",
    title: "ค้นหา & การแจ้งเตือน (Search & Alerts)",
    body: "พิมพ์ค้นหาชื่องานหรือโปรเจกต์ได้รวดเร็ว พร้อมกระดิ่งแจ้งเตือนสถานะงานใหม่ คอมเมนต์ และงานที่ใกล้ถึงกำหนดส่ง",
  },
  {
    id: "filter_bar",
    selector: "#dash-filter-bar, .dash-filter-bar, .board-toolbar",
    title: "ตัวกรองช่วงเวลาอัจฉริยะ (Timeframe Filters)",
    body: "เลือกดูข้อมูลสถิติตาม วันนี้, 7 วัน, เดือนนี้, ปีนี้ หรือกดปุ่ม 'ตัวกรองละเอียด' เพื่อคัดกรองเฉพาะรายบุคคลและสถานะงาน",
  },
  {
    id: "hero_chart",
    selector: ".overview-hero-card, #overview-hero-chart",
    title: "ปริมาณงานทั้งหมด & แนวโน้ม (Throughput Trends)",
    body: "ดูกราฟแนวโน้มปริมาณงานดีไซน์ที่ผลิตและส่งมอบ เปรียบเทียบกับช่วงก่อนหน้า พร้อมสลับดู 7 วัน, 30 วัน, 90 วัน หรือทั้งหมด",
  },
  {
    id: "stats_bento",
    selector: ".overview-stat-cards-2x2, .stat-bento-card",
    title: "4 กล่องสรุปสถานะหลัก (Core Metrics)",
    body: "ตรวจเช็กยอดงานกำลังทำ, งานที่ส่งมอบสำเร็จ, งานด่วน/เลยกำหนดส่ง และอัตราการส่งมอบตรงเวลา (On-Time SLA) แบบเรียลไทม์",
  },
  {
    id: "pipeline_categories",
    selector: ".overview-bottom-grid, .overview-bottom-card",
    title: "สถานะงานใน Pipeline & ประเภทงาน",
    body: "ติดตามงานในแต่ละขั้นตอน (รอรับบรีฟ ➔ กำลังดราฟต์ ➔ รอตรวจ/คอมเมนต์ ➔ ส่งมอบ) และดูสัดส่วนงานแยกตามประเภทสื่อ",
  },
  {
    id: "workload_suite",
    selector: "#member-comparison-section, #chart-workload-bar",
    title: "วิเคราะห์ภาระงานรายคน (Workload Analytics)",
    body: "ตรวจเช็กกำลังการทำงานของดีไซเนอร์แต่ละคน ใครงานแน่น ใครพร้อมรับงานใหม่ เพื่อการกระจายงานที่สมดุลและรวดเร็ว",
  },
  {
    id: "activity_deadlines",
    selector: ".dash-two-col, .feed-list, .deadline-list",
    title: "กิจกรรมล่าสุด & กำหนดส่ง (Activity & Deadlines)",
    body: "ติดตามการอัปเดตสถานะงานล่าสุดในทีม และตรวจเช็กเดดไลน์ที่ต้องระวังเพื่อป้องกันงานล่าช้า",
  },
  {
    id: "kanban_board",
    selector: ".kanban-board-container, .kanban-wrap, .kanban",
    title: "กระดานงาน (Kanban Board)",
    body: "ลากและวางการ์ดเพื่อย้ายขั้นตอนงานจาก รอรับบรีฟ ➔ กำลังดราฟต์ ➔ รอคอมเมนต์ ➔ แก้ไขงาน ➔ ส่งมอบ พร้อมฟิลเตอร์งานรายบุคคล",
  },
  {
    id: "calendar_view",
    selector: "#calendar-mount, .calendar-view, .calendar-grid",
    title: "ปฏิทินงาน (Calendar Schedule)",
    body: "ดูภาพรวมกำหนดส่งรายวันและรายเดือน เพื่อวางแผนและติดตามงานของทีมได้อย่างแม่นยำ",
  },
  {
    id: "member_cards",
    selector: "#team-grid, .team-grid, #team-view-results",
    title: "การ์ดสมาชิกทีม (Team Management)",
    body: "เช็กสถานะการทำงานของดีไซเนอร์แต่ละคน พร้อมปุ่มด่วนสำหรับมอบหมายงานให้คนที่ว่างได้ทันที",
  },
];

class CompactTour {
  constructor() {
    this.steps = [];
    this.currentIndex = 0;
    this.spotlightEl = null;
    this.tooltipEl = null;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleResize = this.handleResize.bind(this);
  }

  start() {
    this.cleanup();

    // Find all steps whose elements exist on this page
    this.steps = ALL_SECTION_STEPS.filter((step) => {
      const el = document.querySelector(step.selector) || (step.fallbackSelector && document.querySelector(step.fallbackSelector));
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return (rect.width > 0 || rect.height > 0) && style.display !== "none" && style.visibility !== "hidden";
    });

    if (!this.steps.length) return;

    this.currentIndex = 0;

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

    this.renderStep(this.currentIndex);
  }

  renderStep(index) {
    if (index < 0 || index >= this.steps.length) {
      this.finish();
      return;
    }

    const step = this.steps[index];
    const target = document.querySelector(step.selector) || (step.fallbackSelector && document.querySelector(step.fallbackSelector));
    if (!target) {
      this.currentIndex++;
      this.renderStep(this.currentIndex);
      return;
    }

    // Smooth scroll to target
    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

    window.setTimeout(() => {
      this.position(target, step, index);
    }, 220);
  }

  position(target, step, index) {
    if (!this.spotlightEl || !this.tooltipEl) return;

    const rect = target.getBoundingClientRect();
    const padding = 8;
    const sTop = Math.max(0, rect.top - padding);
    const sLeft = Math.max(0, rect.left - padding);
    const sWidth = Math.min(window.innerWidth - sLeft, rect.width + padding * 2);
    const sHeight = Math.min(window.innerHeight - sTop, rect.height + padding * 2);

    this.spotlightEl.style.top = `${sTop}px`;
    this.spotlightEl.style.left = `${sLeft}px`;
    this.spotlightEl.style.width = `${sWidth}px`;
    this.spotlightEl.style.height = `${sHeight}px`;

    const isLast = index === this.steps.length - 1;

    this.tooltipEl.innerHTML = `
      <div class="tour-tooltip-header">
        <div class="tour-step-pill">
          <span class="step-dot"></span>
          <span>จุดสำคัญที่ ${index + 1} จาก ${this.steps.length}</span>
        </div>
        <button class="tour-tooltip-close" id="tour-close-btn" title="ปิด (Esc)">×</button>
      </div>

      <div class="tour-tooltip-main">
        <h3 class="tour-tooltip-title">${escapeHtml(step.title)}</h3>
        <p class="tour-tooltip-body">${escapeHtml(step.body)}</p>
      </div>

      <div class="tour-tooltip-footer">
        <button class="tour-btn-link" id="tour-skip-btn">
          ข้ามคำแนะนำ (Skip)
        </button>
        <div class="tour-tooltip-nav">
          ${index > 0 ? `
            <button class="btn-pixel btn-pixel-dark" id="tour-prev-btn">
              ← ย้อนกลับ
            </button>
          ` : ""}
          <button class="btn-pixel btn-pixel-cyan" id="tour-next-btn">
            ${isLast ? "เข้าใจแล้ว เริ่มใช้งาน ✓" : "ถัดไป →"}
          </button>
        </div>
      </div>
    `;

    // Calculate position
    const ttWidth = Math.min(380, window.innerWidth - 32);
    this.tooltipEl.style.width = `${ttWidth}px`;

    const ttHeight = this.tooltipEl.offsetHeight || 190;
    let ttTop = sTop + sHeight + 12;
    let ttLeft = Math.max(16, Math.min(window.innerWidth - ttWidth - 16, sLeft + (sWidth / 2) - (ttWidth / 2)));

    // If bottom runs off screen, position above the target or anchor safely
    if (ttTop + ttHeight > window.innerHeight - 16) {
      if (sTop - ttHeight - 12 >= 16) {
        ttTop = sTop - ttHeight - 12;
      } else {
        ttTop = Math.max(16, window.innerHeight - ttHeight - 20);
      }
    }

    this.tooltipEl.style.top = `${ttTop}px`;
    this.tooltipEl.style.left = `${ttLeft}px`;

    // Event handlers
    this.tooltipEl.querySelector("#tour-prev-btn")?.addEventListener("click", () => {
      this.currentIndex--;
      this.renderStep(this.currentIndex);
    });

    this.tooltipEl.querySelector("#tour-next-btn")?.addEventListener("click", () => {
      this.currentIndex++;
      if (this.currentIndex >= this.steps.length) {
        this.finish();
      } else {
        this.renderStep(this.currentIndex);
      }
    });

    this.tooltipEl.querySelector("#tour-close-btn")?.addEventListener("click", () => {
      this.finish();
    });

    this.tooltipEl.querySelector("#tour-skip-btn")?.addEventListener("click", () => {
      this.finish();
    });
  }

  finish() {
    this.cleanup();
    localStorage.setItem(VISITED_KEY, "true");
    localStorage.setItem(STORAGE_KEY, "completed");
  }

  cleanup() {
    this.spotlightEl?.remove();
    this.tooltipEl?.remove();
    this.spotlightEl = null;
    this.tooltipEl = null;

    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("scroll", this.handleResize);
  }

  handleKeyDown(e) {
    if (e.key === "Escape") {
      this.finish();
    } else if (e.key === "ArrowRight") {
      this.currentIndex++;
      if (this.currentIndex >= this.steps.length) {
        this.finish();
      } else {
        this.renderStep(this.currentIndex);
      }
    } else if (e.key === "ArrowLeft") {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.renderStep(this.currentIndex);
      }
    }
  }

  handleResize() {
    if (this.spotlightEl && this.currentIndex < this.steps.length) {
      this.renderStep(this.currentIndex);
    }
  }
}

let tourInstance = null;

export function startProductTour(force = true) {
  const hasVisited =
    localStorage.getItem(VISITED_KEY) === "true" ||
    localStorage.getItem(STORAGE_KEY) === "completed" ||
    localStorage.getItem("cont_product_tour_v3") === "completed" ||
    localStorage.getItem("cont_product_tour_v2") === "completed" ||
    localStorage.getItem("cont_dashboard_view") !== null ||
    localStorage.getItem("cont_user_profile") !== null;

  if (!force) {
    // If returning user who has already visited or used the system, do not auto-trigger
    if (hasVisited) return;

    // Immediately mark as visited on first-time arrival so it will NEVER auto-trigger again on refresh or page navigation
    localStorage.setItem(VISITED_KEY, "true");
    localStorage.setItem(STORAGE_KEY, "completed");
  }

  if (!tourInstance) {
    tourInstance = new CompactTour();
  }
  tourInstance.start();
}
