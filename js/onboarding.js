/**
 * CONT Graphic Design Workflow — Interactive Product Tour
 * ─────────────────────────────────────────────────────────────────────────────
 * Spotlights all key sections of the website with concise 1-2 line explanations.
 * Direct, punchy, easy to read in one glance.
 */

import { escapeHtml } from "./formatters.js";

const STORAGE_KEY = "cont_product_tour_v3";

// All core sections to introduce (Filtered dynamically by what's present on the current page)
const ALL_SECTION_STEPS = [
  {
    id: "nav_menu",
    selector: ".pixel-nav-links",
    fallbackSelector: ".topbar",
    title: "แถบเมนูหลัก (Main Navigation)",
    body: "ใช้สลับหน้าระหว่าง แดชบอร์ด, คลังงานทั้งหมด, บอร์ดคันบัง, ปฏิทินกำหนดส่ง และทีมงาน",
  },
  {
    id: "search_notif",
    selector: ".pixel-topbar-right",
    fallbackSelector: ".search-inline",
    title: "ค้นหา & แจ้งเตือน (Search & Alerts)",
    body: "พิมพ์ค้นหาชื่องานหรือโปรเจกต์ได้ทันที พร้อมตรวจเช็กการแจ้งเตือนคอมเมนต์และเดดไลน์",
  },
  {
    id: "create_btn",
    selector: "#hero-create-btn, #top-create-btn, #board-create, .btn-pixel-red",
    title: "ปุ่มเปิดบรีฟงานใหม่ (+ NEW TASK)",
    body: "กดเพื่อส่งคำขอเปิดงานใหม่ พร้อมเลือกขนาดและเทมเพลตมาตรฐาน KKP ได้ใน 30 วินาที",
  },
  {
    id: "hero_actions",
    selector: ".pixel-hero-actions",
    title: "ปุ่มลัดเริ่มงาน (Quick Actions)",
    body: "ทางลัดสำหรับเปิดงานใหม่ทันที หรือคลิกเพื่อสลับไปยังหน้ากระดาน Kanban Board",
  },
  {
    id: "stats_bar",
    selector: ".pixel-stats-bar, .grid-4, .report-card",
    title: "แถบสรุปสถิติงาน (Live Stats)",
    body: "แสดงยอดงานทั้งหมด, งานที่กำลังทำ, งานที่ส่งมอบสำเร็จ และงานไฮไลต์เด่นของทีมแบบเรียลไทม์",
  },
  {
    id: "filter_bar",
    selector: "#dash-filter-bar, .board-toolbar, .filter-bar",
    title: "ตัวกรองงาน (Smart Filters)",
    body: "คัดกรองดูงานตามช่วงเวลา วันนี้, 7 วัน, เดือนนี้, รายปี หรือเลือกดูเจาะจงเฉพาะคน",
  },
  {
    id: "charts_row",
    selector: ".charts-row, #chart-trend",
    title: "กราฟแนวโน้ม & สเตตัส (Charts)",
    body: "ดูกำลังการส่งมอบงานย้อนหลัง และสัดส่วนงานที่ค้างในแต่ละขั้นตอน (บรีฟ, กำลังดราฟต์, รอตรวจ, ส่งมอบ)",
  },
  {
    id: "workload_suite",
    selector: "#member-comparison-section, #chart-workload-bar",
    title: "วิเคราะห์ภาระงานรายคน (Workload Analytics)",
    body: "ดูว่าใครงานแน่น ใครพร้อมรับงาน, เช็ก Throughput รายสัปดาห์, และคลิกดูตารางงานของแต่ละคน",
  },
  {
    id: "activity_deadlines",
    selector: ".dash-two-col, .feed-list, .deadline-list",
    title: "อัปเดตล่าสุด & กำหนดส่ง (Activity & Deadlines)",
    body: "ติดตามการขยับสถานะงานล่าสุดของทีม และเช็กงานที่ใกล้ถึงกำหนดส่งเพื่อป้องกันงานล่าช้า",
  },
  {
    id: "kanban_board",
    selector: ".kanban-wrap, .kanban",
    title: "กระดานงาน (Kanban Board)",
    body: "ลากและวางการ์ดเพื่อย้ายขั้นตอนงานจาก รอรับบรีฟ ➔ กำลังดราฟต์ ➔ รอคอมเมนต์ ➔ แก้ไขงาน ➔ ส่งมอบ",
  },
  {
    id: "member_cards",
    selector: "#team-view-results, .grid-2",
    title: "การ์ดสมาชิกทีม (Team Members)",
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
      return el && el.offsetParent !== null; // element is visible
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
    }, 160);
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
          <span>จุดที่ ${index + 1} จาก ${this.steps.length}</span>
        </div>
        <button class="tour-tooltip-close" id="tour-close-btn" title="ปิด (Esc)">×</button>
      </div>

      <div class="tour-tooltip-main">
        <h3 class="tour-tooltip-title">${escapeHtml(step.title)}</h3>
        <p class="tour-tooltip-body">${escapeHtml(step.body)}</p>
      </div>

      <div class="tour-tooltip-footer">
        <button class="tour-btn-link" id="tour-skip-btn">
          ข้าม (Skip)
        </button>
        <div class="tour-tooltip-nav">
          ${index > 0 ? `
            <button class="btn-pixel btn-pixel-dark" id="tour-prev-btn">
              ← ก่อนหน้า
            </button>
          ` : ""}
          <button class="btn-pixel btn-pixel-cyan" id="tour-next-btn">
            ${isLast ? "เข้าใจแล้ว ✓" : "ถัดไป →"}
          </button>
        </div>
      </div>
    `;

    // Calculate position
    const ttWidth = Math.min(360, window.innerWidth - 32);
    this.tooltipEl.style.width = `${ttWidth}px`;

    let ttTop = sTop + sHeight + 12;
    let ttLeft = Math.max(16, Math.min(window.innerWidth - ttWidth - 16, sLeft + (sWidth / 2) - (ttWidth / 2)));

    // If bottom runs off screen, position above the target
    if (ttTop + 180 > window.innerHeight && sTop > 180) {
      ttTop = Math.max(16, sTop - 180);
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
  if (!force) {
    const status = localStorage.getItem(STORAGE_KEY);
    if (status === "completed") return;
  }

  if (!tourInstance) {
    tourInstance = new CompactTour();
  }
  tourInstance.start();
}
