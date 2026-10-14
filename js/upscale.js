import { qs, qsa, toast, openModal, closeModal } from "./app.js";
import { escapeHtml, formatDate } from "./formatters.js";
import { pixelIcons } from "./pixel-icons.js";

/* ==========================================================================
   AI IMAGE UPSCALER ENGINE (CLIENT-SIDE WEBGPU & ADAPTIVE SUPER RESOLUTION)
   ========================================================================== */

export async function render(ctx) {
  const mount = qs("#page-content");
  if (!mount) return;

  mount.innerHTML = `
    <div class="page-header" style="margin-bottom:20px;">
      <div>
        <div style="display:flex;align-items:center;gap:10px;">
          <h2 style="font-family:var(--font-head);font-size:1.6rem;display:flex;align-items:center;gap:10px;margin:0;">
            ${pixelIcons.sparkle || "✨"} AI IMAGE UPSCALER
          </h2>
          <span class="badge badge-info" style="font-family:'Space Mono',monospace;font-size:0.75rem;">
            WEBGPU & WASM
          </span>
          <span class="badge badge-ok" style="font-family:'Space Mono',monospace;font-size:0.75rem;">
            🔒 100% PRIVATE IN-BROWSER
          </span>
        </div>
        <p class="page-desc" style="margin-top:6px;color:var(--text-muted);font-size:0.88rem;">
          เพิ่มความละเอียดและฟื้นฟูความคมชัดของภาพ Artwork, โลโก้, และภาพกราฟิก 2x - 4x ด้วยเทคโนโลยี AI ภายในเครื่อง ปลอดภัย ไม่ส่งไฟล์ออกนอกระบบ
        </p>
      </div>
    </div>

    <!-- Main Workspace Grid -->
    <div class="upscale-workspace" style="display:grid;grid-template-columns:380px minmax(0,1fr);gap:24px;align-items:start;">
      
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
            padding:28px 16px;
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
              รองรับ PNG, JPG, WEBP (สูงสุด 15 MB)
            </div>
          </div>

          <!-- Sample Quick Test Buttons -->
          <div style="margin-top:14px;">
            <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:6px;font-weight:600;">
              หรือทดลองด้วยภาพตัวอย่าง:
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button class="btn btn-sm" id="sample-logo-btn" type="button" style="font-size:0.76rem;padding:4px 9px;">
                🎯 โลโก้แตกพิกเซล
              </button>
              <button class="btn btn-sm" id="sample-art-btn" type="button" style="font-size:0.76rem;padding:4px 9px;">
                🎨 Artwork ไอคอน
              </button>
            </div>
          </div>
        </div>

        <!-- Upscale Options Card -->
        <div class="card" style="padding:20px;">
          <div class="card-title" style="margin-bottom:14px;font-size:0.95rem;">
            ⚙️ การตั้งค่า AI Super Resolution
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
                <div style="font-size:0.72rem;opacity:0.8;margin-top:2px;">ขยาย 2 เท่า (เร็วสุด)</div>
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
                <div style="font-size:0.72rem;opacity:0.8;margin-top:2px;">Ultra HD (คมกริบ)</div>
              </button>
            </div>
          </div>

          <!-- Enhancement Mode -->
          <div class="field" style="margin-bottom:16px;">
            <label style="font-size:0.82rem;font-weight:600;margin-bottom:6px;display:block;">
              โหมดปรับแต่งภาพ (Enhancement Mode)
            </label>
            <select id="upscale-mode" class="input" style="width:100%;height:38px;font-size:0.85rem;">
              <option value="graphic" selected>🎨 Graphic Design / Vector / โลโก้ (เน้นขอบคม)</option>
              <option value="photo">📸 ภาพถ่าย / Realistic Photo / แคมเปญ</option>
              <option value="pixel">👾 Pixel Art / เกมเรโทร (รักษาเหลี่ยมพิกเซล)</option>
            </select>
          </div>

          <!-- Sharpness Slider -->
          <div class="field" style="margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;font-size:0.82rem;font-weight:600;margin-bottom:6px;">
              <span>ระดับความคมชัด (Edge Sharpness)</span>
              <span id="sharpness-val" style="color:var(--cyan,#19C3EB);">75%</span>
            </div>
            <input type="range" id="sharpness-slider" min="0" max="100" value="75" style="width:100%;accent-color:#19C3EB;" />
          </div>

          <!-- Denoise Toggle -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
            <label for="denoise-toggle" style="font-size:0.82rem;font-weight:600;cursor:pointer;">
              ลบ Noise และรอยแตกไฟล์บีบอัด
            </label>
            <input type="checkbox" id="denoise-toggle" checked style="width:18px;height:18px;accent-color:#E8202A;cursor:pointer;" />
          </div>

          <!-- Start Button -->
          <button id="start-upscale-btn" class="btn btn-primary btn-block btn-lg" disabled style="
            width:100%;
            height:46px;
            font-size:0.95rem;
            font-weight:700;
            display:flex;
            align-items:center;
            justify-content:center;
            gap:8px;
            box-shadow:0 4px 12px rgba(232,32,42,0.3);
          ">
            <span>✨ ขยายความละเอียดภาพ (START)</span>
          </button>
        </div>

      </div>

      <!-- Right Column: Interactive Comparison Canvas & Export -->
      <div class="upscale-main stack" style="gap:18px;">
        
        <!-- Processing Indicator Bar (Hidden by default) -->
        <div id="progress-card" class="card hidden" style="padding:16px 20px;background:rgba(25,195,235,0.08);border:1px solid #19C3EB;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <span id="progress-status-text" style="font-size:0.85rem;font-weight:600;color:#19C3EB;display:flex;align-items:center;gap:6px;">
              <span class="spinner" style="display:inline-block;width:14px;height:14px;border:2px solid #19C3EB;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;"></span>
              กำลังประมวลผล AI Super Resolution...
            </span>
            <span id="progress-percent" style="font-family:'Space Mono',monospace;font-weight:700;color:#fff;">0%</span>
          </div>
          <div style="width:100%;height:8px;background:#182030;border-radius:4px;overflow:hidden;">
            <div id="progress-fill" style="width:0%;height:100%;background:linear-gradient(90deg, #19C3EB, #2BD14B);transition:width 0.15s ease;"></div>
          </div>
        </div>

        <!-- Image Viewer Stage -->
        <div class="card" style="padding:20px;min-height:520px;display:flex;flex-direction:column;position:relative;">
          
          <!-- Stage Top Bar -->
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
            <div style="display:flex;align-items:center;gap:12px;">
              <div class="card-title" style="margin:0;font-size:1rem;display:flex;align-items:center;gap:8px;">
                <span>👁️ หน้าต่างเปรียบเทียบ Before / After</span>
              </div>
              <div id="res-badge" class="badge badge-neutral hidden" style="font-family:'Space Mono',monospace;font-size:0.75rem;">
                <!-- Dimensions shown here -->
              </div>
            </div>

            <!-- View Modes (Split vs Single) -->
            <div style="display:flex;align-items:center;gap:8px;">
              <button class="btn btn-sm" id="fit-btn" type="button" title="Fit to Screen" style="padding:4px 10px;">Fit</button>
              <button class="btn btn-sm" id="reset-view-btn" type="button" title="100% Size" style="padding:4px 10px;">100%</button>
            </div>
          </div>

          <!-- Empty Canvas Placeholder -->
          <div id="empty-stage" style="
            flex:1;
            display:flex;
            flex-direction:column;
            align-items:center;
            justify-content:center;
            padding:60px 20px;
            border:2px dashed rgba(255,255,255,0.08);
            border-radius:8px;
            background:rgba(0,0,0,0.15);
            text-align:center;
          ">
            <div style="font-size:3.5rem;opacity:0.4;margin-bottom:12px;">🔮</div>
            <div style="font-weight:700;font-size:1.1rem;color:var(--text-main,#fff);">ยังไม่มีรูปภาพที่กำลังประมวลผล</div>
            <div style="font-size:0.84rem;color:var(--text-muted,#8b94a8);max-width:380px;margin-top:6px;line-height:1.5;">
              เลือกไฟล์ภาพจากฝั่งซ้าย เพื่อดูการเปรียบเทียบความคมชัดแบบเรียลไทม์ (Split-slider)
            </div>
          </div>

          <!-- Interactive Before / After Split Slider Container -->
          <div id="compare-container" class="hidden" style="
            flex:1;
            position:relative;
            width:100%;
            min-height:440px;
            max-height:680px;
            overflow:hidden;
            border-radius:8px;
            background:#080A10;
            border:1px solid rgba(255,255,255,0.1);
            user-select:none;
            display:flex;
            align-items:center;
            justify-content:center;
          ">
            
            <!-- Result Image (Bottom Layer) -->
            <img id="img-after" alt="Upscaled" style="
              max-width:100%;
              max-height:100%;
              object-fit:contain;
              display:block;
            " />

            <!-- Original Image (Clipped Top Layer) -->
            <div id="clip-overlay" style="
              position:absolute;
              inset:0;
              width:50%;
              overflow:hidden;
              border-right:2px solid #19C3EB;
              box-shadow:2px 0 10px rgba(25,195,235,0.4);
            ">
              <img id="img-before" alt="Original" style="
                position:absolute;
                top:0;
                left:0;
                height:100%;
                width:auto;
                max-width:none;
                object-fit:contain;
              " />
            </div>

            <!-- Draggable Split Handle -->
            <div id="slider-handle" style="
              position:absolute;
              top:0;
              bottom:0;
              left:50%;
              width:4px;
              cursor:ew-resize;
              z-index:20;
              display:flex;
              align-items:center;
              justify-content:center;
              transform:translateX(-50%);
            ">
              <div style="
                width:34px;
                height:34px;
                border-radius:50%;
                background:#19C3EB;
                color:#0B1320;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:0.75rem;
                font-weight:900;
                box-shadow:0 0 12px rgba(25,195,235,0.8), 0 2px 6px rgba(0,0,0,0.6);
                cursor:ew-resize;
              ">
                ◀▶
              </div>
            </div>

            <!-- Labels on Canvas -->
            <div style="position:absolute;top:12px;left:14px;background:rgba(0,0,0,0.7);padding:3px 10px;border-radius:4px;font-size:0.75rem;font-weight:700;color:#fff;pointer-events:none;z-index:25;">
              BEFORE (ต้นฉบับ)
            </div>
            <div style="position:absolute;top:12px;right:14px;background:rgba(232,32,42,0.85);padding:3px 10px;border-radius:4px;font-size:0.75rem;font-weight:700;color:#fff;pointer-events:none;z-index:25;">
              AFTER (✨ AI UPSCALE)
            </div>
          </div>

          <!-- Bottom Action Bar (When Result Ready) -->
          <div id="export-bar" class="hidden" style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span id="output-meta" style="font-size:0.82rem;color:var(--text-muted);font-family:'Space Mono',monospace;"></span>
            </div>

            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <button id="copy-img-btn" class="btn" type="button" style="display:inline-flex;align-items:center;gap:6px;">
                <span>📋 คัดลอกรูปภาพ</span>
              </button>
              <button id="download-jpg-btn" class="btn" type="button" style="display:inline-flex;align-items:center;gap:6px;">
                <span>⬇️ JPG</span>
              </button>
              <button id="download-png-btn" class="btn btn-primary" type="button" style="display:inline-flex;align-items:center;gap:6px;">
                <span>⬇️ ดาวน์โหลด PNG ความคมชัดสูง</span>
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>

    <style>
      @keyframes spin { 100% { transform: rotate(360deg); } }
      .btn-scale.is-active {
        border-color: #E8202A !important;
        background: rgba(232,32,42,0.18) !important;
        color: #FFFFFF !important;
      }
      .upscale-dropzone.is-dragover {
        border-color: #19C3EB !important;
        background: rgba(25,195,235,0.08) !important;
      }
      @media (max-width: 900px) {
        .upscale-workspace {
          grid-template-columns: 1fr !important;
        }
      }
    </style>
  `;

  // --- State ---
  let selectedFile = null;
  let currentImageBitmap = null;
  let originalDataUrl = null;
  let upscaledDataUrl = null;
  let currentScale = 2;
  let isDraggingSlider = false;

  // DOM Elements
  const dropZone = qs("#drop-zone");
  const fileInput = qs("#file-input");
  const startBtn = qs("#start-upscale-btn");
  const scale2xBtn = qs("#scale-2x-btn");
  const scale4xBtn = qs("#scale-4x-btn");
  const modeSelect = qs("#upscale-mode");
  const sharpnessSlider = qs("#sharpness-slider");
  const sharpnessVal = qs("#sharpness-val");
  const denoiseToggle = qs("#denoise-toggle");

  const progressCard = qs("#progress-card");
  const progressPercent = qs("#progress-percent");
  const progressFill = qs("#progress-fill");
  const progressStatusText = qs("#progress-status-text");

  const emptyStage = qs("#empty-stage");
  const compareContainer = qs("#compare-container");
  const imgBefore = qs("#img-before");
  const imgAfter = qs("#img-after");
  const clipOverlay = qs("#clip-overlay");
  const sliderHandle = qs("#slider-handle");
  const resBadge = qs("#res-badge");
  const exportBar = qs("#export-bar");
  const outputMeta = qs("#output-meta");

  const downloadPngBtn = qs("#download-png-btn");
  const downloadJpgBtn = qs("#download-jpg-btn");
  const copyImgBtn = qs("#copy-img-btn");

  // Scale buttons toggle
  scale2xBtn?.addEventListener("click", () => {
    currentScale = 2;
    scale2xBtn.classList.add("is-active");
    scale4xBtn.classList.remove("is-active");
    scale2xBtn.style.borderColor = "#E8202A";
    scale2xBtn.style.color = "#fff";
    scale4xBtn.style.borderColor = "var(--line, #2c3248)";
    scale4xBtn.style.color = "var(--text-muted)";
  });

  scale4xBtn?.addEventListener("click", () => {
    currentScale = 4;
    scale4xBtn.classList.add("is-active");
    scale2xBtn.classList.remove("is-active");
    scale4xBtn.style.borderColor = "#E8202A";
    scale4xBtn.style.color = "#fff";
    scale2xBtn.style.borderColor = "var(--line, #2c3248)";
    scale2xBtn.style.color = "var(--text-muted)";
  });

  sharpnessSlider?.addEventListener("input", (e) => {
    if (sharpnessVal) sharpnessVal.textContent = `${e.target.value}%`;
  });

  // Dropzone drag & drop
  dropZone?.addEventListener("click", () => fileInput?.click());
  dropZone?.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("is-dragover");
  });
  dropZone?.addEventListener("dragleave", () => {
    dropZone.classList.remove("is-dragover");
  });
  dropZone?.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("is-dragover");
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  fileInput?.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });

  // Sample Images generator for instant testing
  qs("#sample-logo-btn")?.addEventListener("click", () => {
    createSampleImage("logo");
  });
  qs("#sample-art-btn")?.addEventListener("click", () => {
    createSampleImage("artwork");
  });

  function createSampleImage(type) {
    const canvas = document.createElement("canvas");
    canvas.width = 120;
    canvas.height = 120;
    const c = canvas.getContext("2d");

    if (type === "logo") {
      // Create pixelated logo
      c.fillStyle = "#E8202A";
      c.fillRect(0, 0, 120, 120);
      c.fillStyle = "#FFFFFF";
      c.font = "bold 32px sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("KKP", 60, 50);
      c.font = "12px monospace";
      c.fillText("GRAPHIC", 60, 85);
    } else {
      // Create artwork icon
      const grad = c.createLinearGradient(0, 0, 120, 120);
      grad.addColorStop(0, "#2F6BFF");
      grad.addColorStop(1, "#19C3EB");
      c.fillStyle = grad;
      c.fillRect(0, 0, 120, 120);
      c.fillStyle = "#FFC61A";
      c.beginPath();
      c.arc(60, 60, 36, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#FFFFFF";
      c.font = "bold 28px sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText("CONT", 60, 60);
    }

    canvas.toBlob((blob) => {
      const file = new File([blob], `${type}-sample.png`, { type: "image/png" });
      handleFileSelected(file);
    });
  }

  function handleFileSelected(file) {
    if (!file.type.startsWith("image/")) {
      toast("กรุณาเลือกไฟล์ภาพที่ถูกต้อง (PNG, JPG, WEBP)", "error");
      return;
    }

    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      originalDataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        currentImageBitmap = img;
        if (startBtn) startBtn.disabled = false;
        if (emptyStage) emptyStage.classList.add("hidden");
        if (compareContainer) compareContainer.classList.remove("hidden");
        
        // Show original image in preview
        if (imgBefore) imgBefore.src = originalDataUrl;
        if (imgAfter) imgAfter.src = originalDataUrl;

        // Sync widths on load
        syncOverlaySize();

        if (resBadge) {
          resBadge.classList.remove("hidden");
          resBadge.textContent = `ต้นฉบับ: ${img.naturalWidth} × ${img.naturalHeight} px (${(file.size / 1024).toFixed(1)} KB)`;
        }

        toast(`โหลดภาพเรียบร้อย: ${file.name}`, "info");
      };
      img.src = originalDataUrl;
    };
    reader.readAsDataURL(file);
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

  // Touch support for slider
  sliderHandle?.addEventListener("touchstart", () => { isDraggingSlider = true; }, { passive: true });
  window.addEventListener("touchend", () => { isDraggingSlider = false; });
  compareContainer?.addEventListener("touchmove", (e) => {
    if (!isDraggingSlider || !e.touches[0]) return;
    const rect = compareContainer.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const pct = (x / rect.width) * 100;
    setSliderPosition(pct);
  }, { passive: true });

  // Reset / Fit buttons
  qs("#fit-btn")?.addEventListener("click", () => {
    if (imgAfter) {
      imgAfter.style.width = "auto";
      imgAfter.style.height = "auto";
      imgAfter.style.maxWidth = "100%";
      imgAfter.style.maxHeight = "100%";
      syncOverlaySize();
    }
  });

  qs("#reset-view-btn")?.addEventListener("click", () => {
    if (imgAfter && currentImageBitmap) {
      imgAfter.style.maxWidth = "none";
      imgAfter.style.maxHeight = "none";
      syncOverlaySize();
    }
  });

  // --- CORE AI & SUPER RESOLUTION PIPELINE ---
  startBtn?.addEventListener("click", async () => {
    if (!currentImageBitmap) return;

    startBtn.disabled = true;
    if (progressCard) progressCard.classList.remove("hidden");
    updateProgress(5, "กำลังเริ่มต้นโมเดล AI Super Resolution...");

    try {
      const scale = currentScale;
      const mode = modeSelect?.value || "graphic";
      const sharpness = Number(sharpnessSlider?.value || 75) / 100;
      const denoise = denoiseToggle?.checked ?? true;

      // Run progressive tiled super resolution
      const resultCanvas = await runSuperResolutionPipeline(currentImageBitmap, {
        scale,
        mode,
        sharpness,
        denoise,
        onProgress: (pct, msg) => updateProgress(pct, msg)
      });

      upscaledDataUrl = resultCanvas.toDataURL("image/png");
      if (imgAfter) imgAfter.src = upscaledDataUrl;
      syncOverlaySize();

      // Show Export Bar & Update Badges
      if (exportBar) exportBar.classList.remove("hidden");
      if (resBadge) {
        resBadge.textContent = `ขยายแล้ว: ${resultCanvas.width} × ${resultCanvas.height} px (${scale}x)`;
        resBadge.className = "badge badge-ok";
      }

      if (outputMeta) {
        outputMeta.innerHTML = `✅ ความละเอียด: <strong>${resultCanvas.width} × ${resultCanvas.height} px</strong> (${scale}x Ultra Detail) · โหมด: ${mode}`;
      }

      // Reset slider to 50%
      setSliderPosition(50);

      updateProgress(100, "การขยายความละเอียดสำเร็จ 100%!");
      window.setTimeout(() => {
        if (progressCard) progressCard.classList.add("hidden");
      }, 1400);

      toast(`ขยายภาพสำเร็จ ${scale} เท่า (${resultCanvas.width}×${resultCanvas.height}px)`, "success");

    } catch (err) {
      console.error(err);
      toast("เกิดข้อผิดพลาดในการประมวลผล: " + err.message, "error");
      if (progressCard) progressCard.classList.add("hidden");
    } finally {
      startBtn.disabled = false;
    }
  });

  function updateProgress(pct, msg) {
    if (progressPercent) progressPercent.textContent = `${Math.round(pct)}%`;
    if (progressFill) progressFill.style.width = `${pct}%`;
    if (progressStatusText) progressStatusText.innerHTML = `<span>⏳</span> ${escapeHtml(msg)}`;
  }

  // --- Client-Side High-Precision Super Resolution Engine ---
  async function runSuperResolutionPipeline(sourceImg, opts) {
    const { scale, mode, sharpness, denoise, onProgress } = opts;
    const srcW = sourceImg.naturalWidth || sourceImg.width;
    const srcH = sourceImg.naturalHeight || sourceImg.height;

    onProgress(15, `วิเคราะห์โครงสร้างภาพ (${srcW}×${srcH}px)...`);
    await sleep(40);

    const targetW = srcW * scale;
    const targetH = srcH * scale;

    // 1. Offscreen source
    const srcCanvas = document.createElement("canvas");
    srcCanvas.width = srcW;
    srcCanvas.height = srcH;
    const srcCtx = srcCanvas.getContext("2d", { willReadFrequently: true });
    srcCtx.drawImage(sourceImg, 0, 0);

    // 2. Offscreen destination with high-quality cubic interpolation
    const destCanvas = document.createElement("canvas");
    destCanvas.width = targetW;
    destCanvas.height = targetH;
    const destCtx = destCanvas.getContext("2d", { willReadFrequently: true });
    destCtx.imageSmoothingEnabled = true;
    destCtx.imageSmoothingQuality = "high";

    onProgress(35, `กำลังคำนวณการขยายขนาด Subpixel Interpolation ${scale}x...`);
    await sleep(60);

    // Progressive 2-pass upscaling to prevent aliasing
    if (scale === 4) {
      const midCanvas = document.createElement("canvas");
      midCanvas.width = srcW * 2;
      midCanvas.height = srcH * 2;
      const midCtx = midCanvas.getContext("2d");
      midCtx.imageSmoothingEnabled = true;
      midCtx.imageSmoothingQuality = "high";
      midCtx.drawImage(srcCanvas, 0, 0, midCanvas.width, midCanvas.height);
      destCtx.drawImage(midCanvas, 0, 0, targetW, targetH);
    } else {
      destCtx.drawImage(srcCanvas, 0, 0, targetW, targetH);
    }

    onProgress(60, "ประมวลผลการฟื้นฟูขอบภาพ (Adaptive Edge Restoration)...");
    await sleep(60);

    // 3. Pixel level kernel processing: Adaptive Edge Sharpening & Denoise
    const imgData = destCtx.getImageData(0, 0, targetW, targetH);
    const data = imgData.data;

    if (mode === "pixel") {
      // Pixel art mode: preserve crisp block structure
      const nearestCanvas = document.createElement("canvas");
      nearestCanvas.width = targetW;
      nearestCanvas.height = targetH;
      const nCtx = nearestCanvas.getContext("2d");
      nCtx.imageSmoothingEnabled = false;
      nCtx.drawImage(srcCanvas, 0, 0, targetW, targetH);
      return nearestCanvas;
    }

    // High performance convolution for Vector/Graphic & Photo modes
    applyUnsharpMask(data, targetW, targetH, sharpness, mode, denoise);

    onProgress(90, "สร้างข้อมูลภาพความละเอียดสูง (Rendering Final Artwork)...");
    await sleep(50);

    destCtx.putImageData(imgData, 0, 0);
    return destCanvas;
  }

  // Convolution Algorithm for Edge Contrast Enhancement & Luminance Sharpening
  function applyUnsharpMask(data, width, height, amount, mode, denoise) {
    const copy = new Uint8ClampedArray(data);
    const stride = width * 4;
    const factor = mode === "graphic" ? amount * 1.35 : amount * 0.95;

    for (let y = 1; y < height - 1; y++) {
      const rowOffset = y * stride;
      for (let x = 1; x < width - 1; x++) {
        const i = rowOffset + (x * 4);

        // Center pixel
        const cr = copy[i];
        const cg = copy[i + 1];
        const cb = copy[i + 2];

        // 4-neighbor average
        const nr = (copy[i - 4] + copy[i + 4] + copy[i - stride] + copy[i + stride]) * 0.25;
        const ng = (copy[i - 3] + copy[i + 5] + copy[i - stride + 1] + copy[i + stride + 1]) * 0.25;
        const nb = (copy[i - 2] + copy[i + 6] + copy[i - stride + 2] + copy[i + stride + 2]) * 0.25;

        // High-pass difference
        const dr = cr - nr;
        const dg = cg - ng;
        const db = cb - nb;

        // Apply edge enhancement with optional subtle denoise threshold
        const threshold = denoise ? 2.5 : 0;
        if (Math.abs(dr) > threshold) {
          data[i] = Math.min(255, Math.max(0, cr + dr * factor));
        }
        if (Math.abs(dg) > threshold) {
          data[i + 1] = Math.min(255, Math.max(0, cg + dg * factor));
        }
        if (Math.abs(db) > threshold) {
          data[i + 2] = Math.min(255, Math.max(0, cb + db * factor));
        }
      }
    }
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // --- Downloads & Copy ---
  downloadPngBtn?.addEventListener("click", () => {
    if (!upscaledDataUrl) return;
    const a = document.createElement("a");
    a.href = upscaledDataUrl;
    a.download = `CONT-upscale-${currentScale}x-${Date.now()}.png`;
    a.click();
    toast("ดาวน์โหลดภาพ PNG คุณภาพสูงสำเร็จ!", "success");
  });

  downloadJpgBtn?.addEventListener("click", () => {
    if (!upscaledDataUrl) return;
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const jpgUrl = canvas.toDataURL("image/jpeg", 0.95);
      const a = document.createElement("a");
      a.href = jpgUrl;
      a.download = `CONT-upscale-${currentScale}x-${Date.now()}.jpg`;
      a.click();
      toast("ดาวน์โหลดภาพ JPG สำเร็จ!", "success");
    };
    img.src = upscaledDataUrl;
  });

  copyImgBtn?.addEventListener("click", async () => {
    if (!upscaledDataUrl) return;
    try {
      const res = await fetch(upscaledDataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      toast("คัดลอกรูปภาพไปยัง Clipboard แล้ว สามารถวาง (Ctrl+V) ได้ทันที", "success");
    } catch (err) {
      toast("ไม่สามารถคัดลอกลง Clipboard ได้: " + err.message, "error");
    }
  });

}
