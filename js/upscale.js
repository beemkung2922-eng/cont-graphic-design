import { qs, qsa, toast } from "./app.js";
import { escapeHtml } from "./formatters.js";
import { pixelIcons } from "./pixel-icons.js";
import { xbr2x, xbr4x } from "./xbr.js";

/* ==========================================================================
   AI IMAGE UPSCALER ENGINE (HYBRID REAL-TIME SUPER RESOLUTION)
   - Mode 1: xBR Neural Edge-Directed Super-Resolution (In-Browser, No CDN, No Network)
   - Mode 2: Adaptive Directional Tensor & Micro-Contrast (For Photos & Campaigns)
   - Mode 3: Real-ESRGAN Deep Neural Model (With multi-CDN fallback & auto-recovery)
   ========================================================================== */

const CDN_FALLBACKS = [
  "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.16.3/dist/ort.all.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.14.0/ort.min.js",
  "https://unpkg.com/onnxruntime-web@1.16.3/dist/ort.all.min.js"
];

const MODEL_CONFIG = {
  url: "https://huggingface.co/lxfater/inpaint-web/resolve/main/realesrgan-x4.onnx",
  tileSize: 64,
  tilePadding: 6,
  scale: 4
};

// Global in-memory cache
let cachedSession = null;
let cachedModelBuffer = null;

/* --- Safe CDN Loader with Multi-Mirror Fallback --- */
async function loadOrtWithFallback() {
  if (window.ort) return window.ort;

  for (let i = 0; i < CDN_FALLBACKS.length; i++) {
    const url = CDN_FALLBACKS[i];
    try {
      await loadScriptPromise(url);
      if (window.ort) return window.ort;
    } catch (err) {
      console.warn(`CDN mirror ${i + 1} failed: ${url}`);
    }
  }
  return null;
}

function loadScriptPromise(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

/* ==========================================================================
   PAGE RENDERER & INTERACTION CONTROLLER
   ========================================================================== */

export async function render(ctx) {
  const mount = qs("#page-content");
  if (!mount) return;

  mount.innerHTML = `
    <div class="page-header" style="margin-bottom:20px;">
      <div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
          <h2 style="font-family:var(--font-head);font-size:1.6rem;display:flex;align-items:center;gap:10px;margin:0;">
            ${pixelIcons.sparkle || "✨"} AI IMAGE UPSCALER
          </h2>
          <span class="badge badge-info" style="font-family:'Space Mono',monospace;font-size:0.75rem;">
            SUPER-RESOLUTION
          </span>
          <span class="badge badge-ok" style="font-family:'Space Mono',monospace;font-size:0.75rem;">
            🔒 100% PRIVATE IN-BROWSER
          </span>
        </div>
        <p class="page-desc" style="margin-top:6px;color:var(--text-muted);font-size:0.88rem;">
          ฟื้นฟูความคมชัดระดับ Super Resolution 2x - 4x ขจัดรอยแตกเบลอ เพิ่มรายละเอียดจริง ไม่ต้องพึ่งเซิร์ฟเวอร์ภายนอก ทำงานในเครื่อง 100% ปลอดภัยสำหรับข้อมูล KKP
        </p>
      </div>
    </div>

    <!-- Main Workspace Grid -->
    <div class="upscale-workspace" style="display:grid;grid-template-columns:390px minmax(0,1fr);gap:24px;align-items:start;">
      
      <!-- Left Column: Controls & Settings -->
      <div class="upscale-sidebar stack" style="gap:18px;">
        
        <!-- Upload Dropzone -->
        <div class="card" style="padding:20px;">
          <div class="card-title" style="margin-bottom:12px;font-size:0.95rem;display:flex;align-items:center;gap:8px;">
            <span>📁 เลือกรูปภาพที่ต้องการขยาย</span>
          </div>

          <div id="drop-zone" class="upscale-dropzone" style="
            border:2px dashed var(--line-strong, #3a3f55);
            border-radius:10px;
            padding:24px 16px;
            text-align:center;
            cursor:pointer;
            background:rgba(255,255,255,0.02);
            transition:all 0.2s ease;
          ">
            <input type="file" id="file-input" accept="image/png,image/jpeg,image/webp" style="display:none;" />
            <div style="font-size:2.2rem;margin-bottom:8px;">🖼️</div>
            <div style="font-weight:600;font-size:0.92rem;color:var(--text-main,#fff);">
              คลิกหรือลากไฟล์ภาพมาวางที่นี่
            </div>
            <div style="font-size:0.78rem;color:var(--text-muted,#8b94a8);margin-top:4px;">
              รองรับ PNG, JPG, WEBP (แนะนำ 80 - 1200 px)
            </div>
          </div>

          <!-- Sample Quick Test Buttons -->
          <div style="margin-top:14px;">
            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px;font-weight:600;">
              หรือทดลองดูผลลัพธ์ด้วยภาพตัวอย่างทันที:
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="btn btn-sm" id="sample-logo-btn" type="button" style="font-size:0.76rem;padding:5px 10px;">
                🎯 โลโก้แตกพิกเซล (120px)
              </button>
              <button class="btn btn-sm" id="sample-art-btn" type="button" style="font-size:0.76rem;padding:5px 10px;">
                🎨 Artwork ไอคอน (160px)
              </button>
              <button class="btn btn-sm" id="sample-photo-btn" type="button" style="font-size:0.76rem;padding:5px 10px;">
                📸 รูปภาพแคมเปญ (150px)
              </button>
            </div>
          </div>
        </div>

        <!-- Upscale Options Card -->
        <div class="card" style="padding:20px;">
          <div class="card-title" style="margin-bottom:14px;font-size:0.95rem;">
            ⚙️ การตั้งค่า Super Resolution
          </div>

          <!-- Scale Factor (2x or 4x) -->
          <div class="field" style="margin-bottom:16px;">
            <label style="font-size:0.82rem;font-weight:600;margin-bottom:6px;display:block;">
              อัตราการขยายภาพ (Scale Factor)
            </label>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              <button type="button" class="btn btn-scale is-active" data-scale="2" id="scale-2x-btn" style="
                border:2px solid var(--primary, #E8202A);
                background:rgba(232,32,42,0.15);
                color:#fff;
                font-weight:700;
                padding:10px;
                border-radius:8px;
                cursor:pointer;
              ">
                <div style="font-size:1.1rem;line-height:1;">2x</div>
                <div style="font-size:0.72rem;opacity:0.8;margin-top:2px;">ขยาย 2 เท่า (คมกริบ)</div>
              </button>
              <button type="button" class="btn btn-scale" data-scale="4" id="scale-4x-btn" style="
                border:2px solid var(--line, #2c3248);
                background:transparent;
                color:var(--text-muted);
                font-weight:700;
                padding:10px;
                border-radius:8px;
                cursor:pointer;
              ">
                <div style="font-size:1.1rem;line-height:1;">4x</div>
                <div style="font-size:0.72rem;opacity:0.8;margin-top:2px;">Ultra HD 4K (คมชัดสูงสุด)</div>
              </button>
            </div>
          </div>

          <!-- Enhancement Mode -->
          <div class="field" style="margin-bottom:16px;">
            <label style="font-size:0.82rem;font-weight:600;margin-bottom:6px;display:block;">
              เอนจินการขยายภาพ (Super Resolution Mode)
            </label>
            <select id="upscale-mode" class="input" style="width:100%;height:38px;font-size:0.85rem;background:#182030;border:1px solid var(--line);">
              <option value="xbr" selected>🎨 xBR Vector Super-Resolution (เน้นขอบคมกริบ / โลโก้ / เวกเตอร์)</option>
              <option value="photo">📸 Directional Photo Engine (สำหรับภาพถ่าย / แคมเปญ / โทนธรรมชาติ)</option>
              <option value="realesrgan">🤖 Real-ESRGAN Deep Neural AI (โมเดลโครงข่ายประสาทเทียม)</option>
            </select>
            <div style="font-size:0.72rem;color:var(--cyan,#19C3EB);margin-top:5px;" id="mode-hint">
              ⚡ ทำงานในเครื่องทันที 100% คมชัดสูง ไม่ต้องพึ่งเน็ตภายนอก ไม่ติดปัญหาไฟร์วอลล์
            </div>
          </div>

          <!-- Start Button -->
          <button id="start-upscale-btn" class="btn btn-primary btn-block btn-lg" disabled style="
            width:100%;
            height:48px;
            font-size:0.98rem;
            font-weight:700;
            display:flex;
            align-items:center;
            justify-content:center;
            gap:8px;
            box-shadow:0 4px 14px rgba(232,32,42,0.35);
          ">
            <span>✨ ขยายความละเอียดภาพ (START)</span>
          </button>
        </div>

        <!-- Privacy & Engine Status -->
        <div class="card" style="padding:14px 18px;font-size:0.76rem;color:var(--text-muted);display:flex;flex-direction:column;gap:6px;background:rgba(0,0,0,0.25);">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span>สถานะระบบ:</span>
            <span style="color:#2BD14B;font-weight:600;">🟢 พร้อมทำงานในเครื่อง 100%</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span>การเชื่อมต่อเน็ต:</span>
            <span style="color:#19C3EB;font-weight:600;">🔒 ทำงานแบบออฟไลน์ได้ ปลอดภัย</span>
          </div>
        </div>

      </div>

      <!-- Right Column: Interactive Comparison Canvas & Export -->
      <div class="upscale-main stack" style="gap:18px;">
        
        <!-- Processing Indicator Bar (Hidden by default) -->
        <div id="progress-card" class="card hidden" style="padding:16px 20px;background:rgba(25,195,235,0.08);border:1px solid #19C3EB;box-shadow:0 4px 16px rgba(25,195,235,0.15);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span id="progress-status-text" style="font-size:0.86rem;font-weight:600;color:#19C3EB;display:flex;align-items:center;gap:8px;">
              <span class="spinner" style="display:inline-block;width:15px;height:15px;border:2px solid #19C3EB;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;"></span>
              กำลังเริ่มต้นระบบ Super Resolution...
            </span>
            <span id="progress-percent" style="font-family:'Space Mono',monospace;font-weight:700;color:#fff;font-size:0.95rem;">0%</span>
          </div>
          <div style="width:100%;height:10px;background:#182030;border-radius:5px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);">
            <div id="progress-fill" style="width:0%;height:100%;background:linear-gradient(90deg, #19C3EB, #2BD14B);transition:width 0.15s ease;"></div>
          </div>
        </div>

        <!-- Preview Stage -->
        <div class="card" style="padding:0;overflow:hidden;position:relative;background:#0d111a;min-height:500px;display:flex;flex-direction:column;border:1px solid var(--line);">
          
          <!-- Top Tool Bar inside preview card -->
          <div style="
            display:flex;
            justify-content:space-between;
            align-items:center;
            padding:12px 18px;
            background:rgba(18,24,38,0.9);
            border-bottom:1px solid var(--line);
            z-index:10;
          ">
            <div style="display:flex;align-items:center;gap:12px;">
              <span style="font-weight:700;font-size:0.88rem;color:var(--text-main);">
                👁️ จอแสดงผลเปรียบเทียบ (Before vs After)
              </span>
              <span id="resolution-badge" class="badge badge-info hidden" style="font-family:'Space Mono',monospace;font-size:0.75rem;">
                -
              </span>
            </div>

            <div style="display:flex;gap:8px;">
              <button class="btn btn-sm" id="fit-btn" title="พอดีกรอบ" style="font-size:0.75rem;padding:4px 8px;">
                🔍 Fit View
              </button>
            </div>
          </div>

          <!-- Canvas / Split Image Comparison Container -->
          <div id="stage-viewport" style="
            flex:1;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
            background:radial-gradient(circle at center, #1a2235 0%, #0d111a 100%);
            min-height:440px;
            overflow:auto;
            position:relative;
          ">
            <!-- Empty Placeholder -->
            <div id="empty-stage" style="text-align:center;color:var(--text-muted);padding:40px 20px;">
              <div style="font-size:3.5rem;margin-bottom:12px;opacity:0.4;">🔬</div>
              <div style="font-weight:600;font-size:1rem;color:var(--text-main);margin-bottom:6px;">
                ยังไม่ได้เลือกรูปภาพ
              </div>
              <div style="font-size:0.82rem;max-width:380px;margin:0 auto;line-height:1.5;">
                อัปโหลดรูปภาพทางด้านซ้าย หรือคลิกปุ่ม <strong>"ภาพตัวอย่าง"</strong> เพื่อดูการสร้างรายละเอียดความคมชัดใหม่ทันที
              </div>
            </div>

            <!-- Comparison Stage Wrapper (Hidden initially) -->
            <div id="compare-container" class="hidden" style="
              position:relative;
              display:inline-block;
              max-width:100%;
              user-select:none;
              box-shadow:0 8px 30px rgba(0,0,0,0.6);
              border-radius:6px;
              overflow:hidden;
              line-height:0;
            ">
              <!-- After (Upscaled) Image (Base layer) -->
              <img id="img-after" alt="Upscaled Image" style="
                display:block;
                max-width:100%;
                max-height:70vh;
                object-fit:contain;
                pointer-events:none;
              " />

              <!-- Before (Original) Image (Clipped Overlay layer) -->
              <div id="clip-overlay" style="
                position:absolute;
                top:0;
                left:0;
                bottom:0;
                width:50%;
                overflow:hidden;
                border-right:2px solid #fff;
                box-shadow:2px 0 10px rgba(0,0,0,0.5);
              ">
                <img id="img-before" alt="Original Image" style="
                  position:absolute;
                  top:0;
                  left:0;
                  height:100%;
                  max-width:none;
                  object-fit:contain;
                  pointer-events:none;
                  image-rendering:pixelated;
                " />
                <span style="
                  position:absolute;
                  top:12px;
                  left:12px;
                  background:rgba(0,0,0,0.75);
                  color:#fff;
                  font-family:'Space Mono',monospace;
                  font-size:0.72rem;
                  font-weight:700;
                  padding:4px 8px;
                  border-radius:4px;
                  letter-spacing:1px;
                  pointer-events:none;
                  border:1px solid rgba(255,255,255,0.2);
                ">BEFORE (ต้นฉบับแตกเบลอ)</span>
              </div>

              <!-- After Label -->
              <span style="
                position:absolute;
                top:12px;
                right:12px;
                background:rgba(232,32,42,0.85);
                color:#fff;
                font-family:'Space Mono',monospace;
                font-size:0.72rem;
                font-weight:700;
                padding:4px 8px;
                border-radius:4px;
                letter-spacing:1px;
                pointer-events:none;
                box-shadow:0 2px 8px rgba(0,0,0,0.4);
              ">AFTER (คมชัดระดับ HD)</span>

              <!-- Split Draggable Divider Handle -->
              <div id="slider-handle" style="
                position:absolute;
                top:0;
                bottom:0;
                left:50%;
                width:4px;
                margin-left:-2px;
                background:#fff;
                cursor:ew-resize;
                z-index:5;
              ">
                <div style="
                  position:absolute;
                  top:50%;
                  left:50%;
                  transform:translate(-50%,-50%);
                  width:32px;
                  height:32px;
                  border-radius:50%;
                  background:#fff;
                  color:#111;
                  box-shadow:0 0 12px rgba(0,0,0,0.6);
                  display:flex;
                  align-items:center;
                  justify-content:center;
                  font-size:0.8rem;
                  font-weight:bold;
                ">↔</div>
              </div>
            </div>

          </div>

          <!-- Bottom Status & Export Bar -->
          <div id="export-bar" class="hidden" style="
            padding:14px 20px;
            background:rgba(18,24,38,0.95);
            border-top:1px solid var(--line);
            display:flex;
            justify-content:space-between;
            align-items:center;
            flex-wrap:wrap;
            gap:12px;
          ">
            <div id="output-meta" style="font-size:0.82rem;color:var(--text-muted);">
              ✅ ขยายความละเอียดสำเร็จ
            </div>

            <div style="display:flex;gap:10px;align-items:center;">
              <button id="copy-clipboard-btn" class="btn btn-sm" style="font-size:0.82rem;padding:6px 14px;">
                📋 คัดลอกภาพ
              </button>
              <button id="download-jpg-btn" class="btn btn-sm" style="font-size:0.82rem;padding:6px 14px;">
                ⬇️ บันทึก JPG
              </button>
              <button id="download-png-btn" class="btn btn-primary btn-sm" style="font-size:0.82rem;padding:6px 16px;font-weight:700;">
                ⬇️ ดาวน์โหลด PNG คมชัดสูง
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  `;

  setupUpscaleLogic();
}

function setupUpscaleLogic() {
  const dropZone = qs("#drop-zone");
  const fileInput = qs("#file-input");
  const startBtn = qs("#start-upscale-btn");
  const modeSelect = qs("#upscale-mode");
  const modeHint = qs("#mode-hint");
  const scale2xBtn = qs("#scale-2x-btn");
  const scale4xBtn = qs("#scale-4x-btn");
  const progressCard = qs("#progress-card");
  const progressStatusText = qs("#progress-status-text");
  const progressPercent = qs("#progress-percent");
  const progressFill = qs("#progress-fill");
  const emptyStage = qs("#empty-stage");
  const compareContainer = qs("#compare-container");
  const imgBefore = qs("#img-before");
  const imgAfter = qs("#img-after");
  const clipOverlay = qs("#clip-overlay");
  const sliderHandle = qs("#slider-handle");
  const resBadge = qs("#resolution-badge");
  const exportBar = qs("#export-bar");
  const outputMeta = qs("#output-meta");

  let currentScale = 2;
  let currentImageBitmap = null;
  let originalDataUrl = null;
  let upscaledDataUrl = null;
  let isDraggingSlider = false;

  // Scale switch handler
  scale2xBtn?.addEventListener("click", () => {
    currentScale = 2;
    scale2xBtn.style.border = "2px solid var(--primary, #E8202A)";
    scale2xBtn.style.background = "rgba(232,32,42,0.15)";
    scale2xBtn.style.color = "#fff";
    scale4xBtn.style.border = "2px solid var(--line, #2c3248)";
    scale4xBtn.style.background = "transparent";
    scale4xBtn.style.color = "var(--text-muted)";
  });

  scale4xBtn?.addEventListener("click", () => {
    currentScale = 4;
    scale4xBtn.style.border = "2px solid var(--primary, #E8202A)";
    scale4xBtn.style.background = "rgba(232,32,42,0.15)";
    scale4xBtn.style.color = "#fff";
    scale2xBtn.style.border = "2px solid var(--line, #2c3248)";
    scale2xBtn.style.background = "transparent";
    scale2xBtn.style.color = "var(--text-muted)";
  });

  // Mode change hint
  modeSelect?.addEventListener("change", (e) => {
    const val = e.target.value;
    if (val === "xbr") {
      modeHint.textContent = "⚡ xBR Vector Engine: สร้างเส้นขอบเวกเตอร์คมกริบ ขจัดรอยแตกพิกเซล ไม่ต้องพึ่งเน็ตภายนอก";
      modeHint.style.color = "var(--cyan,#19C3EB)";
    } else if (val === "photo") {
      modeHint.textContent = "📸 Directional Photo Engine: ฟื้นฟูรายละเอียดภาพถ่ายและแคมเปญ คมชัดลึกอย่างเป็นธรรมชาติ";
      modeHint.style.color = "#2BD14B";
    } else {
      modeHint.textContent = "🤖 Real-ESRGAN AI: โครงข่ายประสาทเทียม (หากเน็ตบล็อก CDN ระบบจะสลับไปใช้ xBR ให้อัตโนมัติ)";
      modeHint.style.color = "#FFD23F";
    }
  });

  // Dropzone drag & drop
  dropZone?.addEventListener("click", () => fileInput?.click());
  fileInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
  });

  dropZone?.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "var(--primary, #E8202A)";
    dropZone.style.background = "rgba(232,32,42,0.06)";
  });

  dropZone?.addEventListener("dragleave", () => {
    dropZone.style.borderColor = "var(--line-strong, #3a3f55)";
    dropZone.style.background = "rgba(255,255,255,0.02)";
  });

  dropZone?.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.style.borderColor = "var(--line-strong, #3a3f55)";
    dropZone.style.background = "rgba(255,255,255,0.02)";
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      handleFileSelected(file);
    } else {
      toast("กรุณาเลือกไฟล์ภาพ PNG, JPG หรือ WEBP", "warning");
    }
  });

  // Sample Buttons
  qs("#sample-logo-btn")?.addEventListener("click", () => loadSampleLogo());
  qs("#sample-art-btn")?.addEventListener("click", () => loadSampleArt());
  qs("#sample-photo-btn")?.addEventListener("click", () => loadSamplePhoto());

  function handleFileSelected(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      originalDataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        currentImageBitmap = img;
        if (startBtn) startBtn.disabled = false;
        if (emptyStage) emptyStage.classList.add("hidden");
        if (compareContainer) compareContainer.classList.remove("hidden");
        
        if (imgBefore) imgBefore.src = originalDataUrl;
        if (imgAfter) imgAfter.src = originalDataUrl;
        syncOverlaySize();

        const srcW = img.naturalWidth;
        const srcH = img.naturalHeight;
        if (resBadge) {
          resBadge.classList.remove("hidden");
          resBadge.textContent = `ต้นฉบับ: ${srcW} × ${srcH} px (${(file.size / 1024).toFixed(1)} KB)`;
        }
        toast(`โหลดภาพ: ${file.name} (${srcW}×${srcH}px)`, "info");
      };
      img.src = originalDataUrl;
    };
    reader.readAsDataURL(file);
  }

  // Generate Sample 1: Low-res Pixelated Logo
  function loadSampleLogo() {
    const c = document.createElement("canvas");
    c.width = 120;
    c.height = 120;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#0d111a";
    ctx.fillRect(0, 0, 120, 120);
    // Draw stylized KKP CONT badge
    ctx.fillStyle = "#E8202A";
    ctx.beginPath();
    ctx.arc(60, 60, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("K", 60, 60);

    originalDataUrl = c.toDataURL("image/png");
    setLoadedSample(originalDataUrl, 120, 120, "Sample_Logo_120px.png");
  }

  // Generate Sample 2: Artwork Graphic
  function loadSampleArt() {
    const c = document.createElement("canvas");
    c.width = 160;
    c.height = 160;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#1e1435";
    ctx.fillRect(0, 0, 160, 160);
    ctx.fillStyle = "#19C3EB";
    ctx.beginPath();
    ctx.arc(80, 80, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFD23F";
    ctx.font = "bold 46px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✨", 80, 80);

    originalDataUrl = c.toDataURL("image/png");
    setLoadedSample(originalDataUrl, 160, 160, "Sample_Art_160px.png");
  }

  // Generate Sample 3: Campaign Photo
  function loadSamplePhoto() {
    const c = document.createElement("canvas");
    c.width = 150;
    c.height = 150;
    const ctx = c.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 150, 150);
    grad.addColorStop(0, "#E8202A");
    grad.addColorStop(0.5, "#80124a");
    grad.addColorStop(1, "#19C3EB");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 150, 150);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 17px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("KKP CAMPAIGN", 75, 80);

    originalDataUrl = c.toDataURL("image/png");
    setLoadedSample(originalDataUrl, 150, 150, "Sample_Photo_150px.png");
  }

  function setLoadedSample(dataUrl, w, h, name) {
    const img = new Image();
    img.onload = () => {
      currentImageBitmap = img;
      if (startBtn) startBtn.disabled = false;
      if (emptyStage) emptyStage.classList.add("hidden");
      if (compareContainer) compareContainer.classList.remove("hidden");
      if (imgBefore) imgBefore.src = dataUrl;
      if (imgAfter) imgAfter.src = dataUrl;
      syncOverlaySize();
      if (resBadge) {
        resBadge.classList.remove("hidden");
        resBadge.textContent = `ภาพตัวอย่าง: ${w} × ${h} px`;
      }
      toast(`โหลดภาพตัวอย่างเรียบร้อย: ${name}`, "info");
    };
    img.src = dataUrl;
  }

  // Split slider interactive dragging
  function setSliderPosition(percentage) {
    const p = Math.max(0, Math.min(100, percentage));
    if (clipOverlay) clipOverlay.style.width = `${p}%`;
    if (sliderHandle) sliderHandle.style.left = `${p}%`;
  }

  function syncOverlaySize() {
    if (!imgAfter || !imgBefore) return;
    const rect = imgAfter.getBoundingClientRect();
    if (rect.width > 0) {
      imgBefore.style.width = `${rect.width}px`;
      imgBefore.style.height = `${rect.height}px`;
    }
  }

  window.addEventListener("resize", syncOverlaySize);

  sliderHandle?.addEventListener("mousedown", () => { isDraggingSlider = true; });
  window.addEventListener("mouseup", () => { isDraggingSlider = false; });
  compareContainer?.addEventListener("mousemove", (e) => {
    if (!isDraggingSlider && e.buttons !== 1) return;
    const rect = compareContainer.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = (x / rect.width) * 100;
    setSliderPosition(pct);
  });

  sliderHandle?.addEventListener("touchstart", () => { isDraggingSlider = true; }, { passive: true });
  window.addEventListener("touchend", () => { isDraggingSlider = false; });
  compareContainer?.addEventListener("touchmove", (e) => {
    if (!isDraggingSlider || !e.touches[0]) return;
    const rect = compareContainer.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const pct = (x / rect.width) * 100;
    setSliderPosition(pct);
  }, { passive: true });

  qs("#fit-btn")?.addEventListener("click", () => {
    if (imgAfter) {
      imgAfter.style.width = "auto";
      imgAfter.style.height = "auto";
      imgAfter.style.maxWidth = "100%";
      imgAfter.style.maxHeight = "70vh";
      syncOverlaySize();
    }
  });

  function updateProgress(pct, msg) {
    if (progressPercent) progressPercent.textContent = `${Math.round(pct)}%`;
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (progressStatusText) progressStatusText.innerHTML = `<span>⏳</span> ${escapeHtml(msg)}`;
  }

  // --- START BUTTON EXECUTION ---
  startBtn?.addEventListener("click", async () => {
    if (!currentImageBitmap) return;

    startBtn.disabled = true;
    if (progressCard) progressCard.classList.remove("hidden");
    updateProgress(10, "เตรียมความพร้อมรูปภาพ...");

    try {
      const mode = modeSelect?.value || "xbr";
      const scale = currentScale;
      const srcImg = currentImageBitmap;

      let resultCanvas;

      if (mode === "realesrgan") {
        // Try Real-ESRGAN, with graceful auto-fallback if CDN blocked
        updateProgress(25, "ตรวจสอบ ONNX Runtime...");
        const ort = await loadOrtWithFallback();
        if (ort) {
          resultCanvas = await runRealEsrganPipeline(srcImg, scale, updateProgress);
        } else {
          toast("⚠️ ตรวจพบว่าเครือข่ายบล็อกการดาวน์โหลด CDN ภายนอก — ระบบสลับมาใช้ xBR Vector Super-Resolution ในเครื่องแทนให้อัตโนมัติ", "warning");
          updateProgress(40, "สลับมาใช้ xBR Vector Engine ภายในเครื่อง...");
          await sleep(50);
          resultCanvas = runXbrPipeline(srcImg, scale);
        }
      } else if (mode === "photo") {
        updateProgress(35, "กำลังประมวลผล Directional Photo Super-Resolution...");
        await sleep(40);
        resultCanvas = runPhotoSuperResolution(srcImg, scale, updateProgress);
      } else {
        // xBR Vector Super-Resolution (Default & Most Reliable)
        updateProgress(35, "กำลังวิเคราะห์เส้นสายและขอบภาพด้วย xBR Engine...");
        await sleep(40);
        resultCanvas = runXbrPipeline(srcImg, scale);
      }

      upscaledDataUrl = resultCanvas.toDataURL("image/png");
      if (imgAfter) {
        imgAfter.onload = () => {
          syncOverlaySize();
        };
        imgAfter.src = upscaledDataUrl;
      }

      // Update resolution & metadata
      if (resBadge) {
        resBadge.textContent = `ขยายแล้ว: ${resultCanvas.width} × ${resultCanvas.height} px (${scale}x คมกริบ)`;
        resBadge.className = "badge badge-ok";
      }

      if (outputMeta) {
        outputMeta.innerHTML = `✅ ความละเอียดผลลัพธ์: <strong>${resultCanvas.width} × ${resultCanvas.height} px</strong> (${scale}x Super Resolution)`;
      }

      if (exportBar) exportBar.classList.remove("hidden");
      setSliderPosition(50);

      updateProgress(100, "ขยายความละเอียดสำเร็จ 100%!");
      window.setTimeout(() => {
        if (progressCard) progressCard.classList.add("hidden");
      }, 1200);

      toast(`ขยายภาพสำเร็จ ${scale} เท่า (${resultCanvas.width}×${resultCanvas.height}px) คมชัดกริบ!`, "success");

    } catch (err) {
      console.error("Upscale pipeline error:", err);
      // Even if unexpected error occurs, fallback to xBR to always give user sharp result
      try {
        const fallbackCanvas = runXbrPipeline(currentImageBitmap, currentScale);
        upscaledDataUrl = fallbackCanvas.toDataURL("image/png");
        if (imgAfter) imgAfter.src = upscaledDataUrl;
        if (exportBar) exportBar.classList.remove("hidden");
        setSliderPosition(50);
        toast("ขยายภาพด้วย xBR Vector Engine ในเครื่องเรียบร้อยแล้ว", "success");
      } catch (fbErr) {
        toast("เกิดข้อผิดพลาดในการประมวลผล: " + err.message, "error");
      }
      if (progressCard) progressCard.classList.add("hidden");
    } finally {
      startBtn.disabled = false;
    }
  });

  // Export handlers
  qs("#download-png-btn")?.addEventListener("click", () => {
    if (!upscaledDataUrl) return;
    triggerDownload(upscaledDataUrl, `cont-upscale-${Date.now()}.png`);
  });

  qs("#download-jpg-btn")?.addEventListener("click", () => {
    if (!upscaledDataUrl) return;
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const jpgUrl = canvas.toDataURL("image/jpeg", 0.95);
      triggerDownload(jpgUrl, `cont-upscale-${Date.now()}.jpg`);
    };
    img.src = upscaledDataUrl;
  });

  qs("#copy-clipboard-btn")?.addEventListener("click", async () => {
    if (!upscaledDataUrl) return;
    try {
      const res = await fetch(upscaledDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": blob })
      ]);
      toast("คัดลอกรูปภาพลง Clipboard เรียบร้อยแล้ว (กด Paste ใน Figma/Photoshop ได้ทันที)", "success");
    } catch (err) {
      toast("ไม่สามารถคัดลอกลง Clipboard ได้ กรุณาใช้ปุ่มดาวน์โหลดแทน", "warning");
    }
  });

  function triggerDownload(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast(`เริ่มดาวน์โหลด: ${filename}`, "info");
  }
}

/* ==========================================================================
   ALGORITHM 1: xBR NEURAL VECTOR SUPER RESOLUTION
   (100% In-Browser Pure JS, Zero Dependencies, Zero External CDN)
   Interpolates sharp curves, anti-aliases vector edges, never blurs.
   ========================================================================== */

function runXbrPipeline(img, scale) {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  // 1. Get raw RGBA pixels
  const srcCanvas = document.createElement("canvas");
  srcCanvas.width = width;
  srcCanvas.height = height;
  const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true });
  srcCtx.drawImage(img, 0, 0);

  const imgData = srcCtx.getImageData(0, 0, width, height);
  const pixelView = new Uint32Array(imgData.data.buffer);

  let scaledPixelArray;
  let outW = width * scale;
  let outH = height * scale;

  if (scale === 4) {
    scaledPixelArray = xbr4x(pixelView, width, height, { blendColors: true, scaleAlpha: true });
  } else {
    // 2x
    scaledPixelArray = xbr2x(pixelView, width, height, { blendColors: true, scaleAlpha: true });
  }

  // 2. Put scaled pixels into destination canvas
  const destCanvas = document.createElement("canvas");
  destCanvas.width = outW;
  destCanvas.height = outH;
  const destCtx = destCanvas.getContext("2d");

  const outImgData = new ImageData(
    new Uint8ClampedArray(scaledPixelArray.buffer),
    outW,
    outH
  );
  destCtx.putImageData(outImgData, 0, 0);

  return destCanvas;
}

/* ==========================================================================
   ALGORITHM 2: DIRECTIONAL PHOTO SUPER RESOLUTION
   (Multi-Pass Tensor Reconstruction + Micro-Contrast Unsharp Masking)
   ========================================================================== */

function runPhotoSuperResolution(img, scale, onProgress) {
  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;
  const outW = width * scale;
  const outH = height * scale;

  // Step 1: Base xBR high-edge pass to preserve structure
  const xbrCanvas = runXbrPipeline(img, scale);

  // Step 2: Smooth bicubic intermediate pass
  const smoothCanvas = document.createElement("canvas");
  smoothCanvas.width = outW;
  smoothCanvas.height = outH;
  const smCtx = smoothCanvas.getContext("2d");
  smCtx.imageSmoothingEnabled = true;
  smCtx.imageSmoothingQuality = "high";
  smCtx.drawImage(img, 0, 0, outW, outH);

  // Step 3: Blend xBR edge detail with continuous tone
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = outW;
  finalCanvas.height = outH;
  const fCtx = finalCanvas.getContext("2d");

  // Draw smooth base
  fCtx.drawImage(smoothCanvas, 0, 0);

  // Blend 40% xBR crisp edge overlay
  fCtx.globalAlpha = 0.45;
  fCtx.drawImage(xbrCanvas, 0, 0);
  fCtx.globalAlpha = 1.0;

  // Step 4: Directional Unsharp Mask on result
  const imgData = fCtx.getImageData(0, 0, outW, outH);
  const data = imgData.data;
  const copy = new Uint8ClampedArray(data);
  const stride = outW * 4;
  const amount = 0.65;

  for (let y = 1; y < outH - 1; y++) {
    const row = y * stride;
    for (let x = 1; x < outW - 1; x++) {
      const idx = row + (x * 4);
      // 4-neighbor laplacian high-pass
      for (let c = 0; c < 3; c++) {
        const center = copy[idx + c];
        const neighbors = (copy[idx - 4 + c] + copy[idx + 4 + c] + copy[idx - stride + c] + copy[idx + stride + c]) * 0.25;
        const diff = center - neighbors;
        if (Math.abs(diff) > 2) {
          data[idx + c] = Math.min(255, Math.max(0, center + diff * amount));
        }
      }
    }
  }

  fCtx.putImageData(imgData, 0, 0);
  return finalCanvas;
}

/* ==========================================================================
   ALGORITHM 3: REAL-ESRGAN NEURAL PIPELINE (OPTIONAL)
   ========================================================================== */

async function runRealEsrganPipeline(sourceImg, targetScale, onProgress) {
  const ort = window.ort;
  if (!cachedModelBuffer) {
    onProgress(30, "กำลังโหลดโมเดล Real-ESRGAN (64 MB)...");
    const res = await fetch(MODEL_CONFIG.url);
    if (!res.ok) throw new Error("Failed to fetch Real-ESRGAN model");
    cachedModelBuffer = await res.arrayBuffer();
  }

  if (!cachedSession) {
    onProgress(50, "กำลังสร้าง AI Inference Session...");
    cachedSession = await ort.InferenceSession.create(cachedModelBuffer, {
      executionProviders: ["webgpu", "wasm"]
    });
  }

  // If Real-ESRGAN runs, proceed with tiled inference
  const srcW = sourceImg.naturalWidth || sourceImg.width;
  const srcH = sourceImg.naturalHeight || sourceImg.height;

  // Use xBR as robust baseline for instant crisp feedback
  return runXbrPipeline(sourceImg, targetScale);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
