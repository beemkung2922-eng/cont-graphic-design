import { escapeHtml } from "./formatters.js";

/**
 * Compress an image file to a lightweight data URL
 */
export function compressImageFile(file, maxWidth = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    // If SVG or GIF, or already small (< 150 KB), read directly as Data URL
    if (file.type === "image/svg+xml" || file.type === "image/gif" || file.size < 150 * 1024) {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ได้"));
      reader.onload = () => {
        resolve({
          dataUrl: reader.result,
          name: file.name,
          size: file.size,
          type: file.type
        });
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ภาพได้"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("ไฟล์ที่เลือกไม่ใช่รูปภาพที่ถูกต้อง"));
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const outType = file.type === "image/png" ? "image/jpeg" : (file.type || "image/jpeg");
        const dataUrl = canvas.toDataURL(outType, quality);
        resolve({
          dataUrl,
          name: file.name,
          size: Math.round(dataUrl.length * 0.75),
          width,
          height,
          type: outType
        });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Generates HTML for the Dual-Mode Image Uploader
 */
export function renderImageUploaderHtml({
  id = "artwork-uploader",
  label = "รูปภาพตัวอย่างงาน / Reference Artwork (ถ้ามี)",
  hint = "สามารถแนบไฟล์ภาพจากในเครื่อง หรือใส่ลิงก์รูปภาพเว็บ เพื่อแสดงพรีวิวบนระบบ",
  initialUrl = "",
  fieldName = "preview_url"
} = {}) {
  const hasInitial = Boolean(initialUrl && initialUrl.trim());
  const isDataUrl = hasInitial && initialUrl.startsWith("data:");
  const isHttpUrl = hasInitial && !isDataUrl;

  return `
    <div class="image-uploader-widget" id="${id}">
      <label class="form-label" style="font-weight:600; color:var(--ink-900); display:block; margin-bottom:6px;">
        ${escapeHtml(label)}
      </label>
      <div class="image-upload-tabs">
        <button type="button" class="img-tab-btn ${isHttpUrl ? "" : "is-active"}" data-tab="file">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          📁 แนบไฟล์รูปจากในเครื่อง
        </button>
        <button type="button" class="img-tab-btn ${isHttpUrl ? "is-active" : ""}" data-tab="url">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          🌐 ใส่ลิงก์เว็บ (Image URL)
        </button>
      </div>

      <!-- Tab 1: File Upload / Drag & Drop -->
      <div class="upload-pane-file" style="${isHttpUrl ? "display:none;" : ""}">
        <div class="image-dropzone" id="${id}-dropzone" tabindex="0" role="button" aria-label="อัปโหลดไฟล์ภาพ">
          <input type="file" id="${id}-file-input" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" style="display:none">
          <div class="dropzone-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
          <div class="dropzone-text">
            <strong>คลิกเพื่อเลือกไฟล์รูปภาพ</strong> หรือลากไฟล์มาวางในช่องนี้
          </div>
          <div class="dropzone-sub">รองรับ PNG, JPG, WebP, SVG, GIF (ระบบจะปรับขนาดและแสดงพรีวิวทันที)</div>
        </div>
      </div>

      <!-- Tab 2: URL Input -->
      <div class="upload-pane-url" style="${isHttpUrl ? "" : "display:none;"}">
        <div class="url-input-wrap">
          <input type="url" id="${id}-url-input" placeholder="https://example.com/artwork-mockup.png" value="${isHttpUrl ? escapeHtml(initialUrl) : ""}">
          <span class="hint">วาง URL รูปภาพโดยตรง (JPG, PNG, WebP) จากเว็บหรือคลาวด์สตอเรจ</span>
        </div>
      </div>

      <!-- Live Preview Area -->
      <div class="preview-thumbnail-area" id="${id}-preview-area" style="${hasInitial ? "" : "display:none;"}">
        <div class="preview-thumb-box">
          <img id="${id}-preview-img" src="${hasInitial ? escapeHtml(initialUrl) : ""}" alt="Artwork Preview">
        </div>
        <div class="preview-thumb-details">
          <div class="preview-thumb-title" id="${id}-preview-title">${hasInitial ? "รูปภาพพร้อมแสดงผล" : ""}</div>
          <div class="preview-thumb-meta" id="${id}-preview-meta">${hasInitial ? (isDataUrl ? "ไฟล์แนบจากในเครื่อง" : "ลิงก์รูปภาพเว็บ") : ""}</div>
          <button type="button" class="btn-clear-preview" id="${id}-clear-btn">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            ลบรูปภาพนี้
          </button>
        </div>
      </div>

      <!-- Final Value Hidden Input -->
      <input type="hidden" name="${fieldName}" id="${id}-final-value" value="${escapeHtml(initialUrl || "")}">
      ${hint ? `<span class="hint" style="margin-top:6px;display:block;">${escapeHtml(hint)}</span>` : ""}
    </div>
  `;
}

/**
 * Initializes listeners and interactions for the Dual-Mode Image Uploader
 */
export function bindImageUploader(container, {
  id = "artwork-uploader",
  onChange = null,
} = {}) {
  const root = container.querySelector(`#${id}`);
  if (!root) return null;

  const tabBtns = root.querySelectorAll(".img-tab-btn");
  const filePane = root.querySelector(".upload-pane-file");
  const urlPane = root.querySelector(".upload-pane-url");
  const dropzone = root.querySelector(`#${id}-dropzone`);
  const fileInput = root.querySelector(`#${id}-file-input`);
  const urlInput = root.querySelector(`#${id}-url-input`);
  const previewArea = root.querySelector(`#${id}-preview-area`);
  const previewImg = root.querySelector(`#${id}-preview-img`);
  const previewTitle = root.querySelector(`#${id}-preview-title`);
  const previewMeta = root.querySelector(`#${id}-preview-meta`);
  const clearBtn = root.querySelector(`#${id}-clear-btn`);
  const finalInput = root.querySelector(`#${id}-final-value`);

  const setPreview = (url, title = "รูปภาพพร้อมแสดงผล", meta = "") => {
    finalInput.value = url || "";
    if (url) {
      previewImg.src = url;
      previewTitle.textContent = title;
      previewMeta.textContent = meta;
      previewArea.style.display = "flex";
    } else {
      previewImg.src = "";
      previewArea.style.display = "none";
      if (urlInput) urlInput.value = "";
      if (fileInput) fileInput.value = "";
    }
    if (typeof onChange === "function") onChange(url);
  };

  // Switch tabs
  tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      tabBtns.forEach(b => b.classList.remove("is-active"));
      btn.classList.add("is-active");
      const tab = btn.dataset.tab;
      if (tab === "file") {
        filePane.style.display = "";
        urlPane.style.display = "none";
      } else {
        filePane.style.display = "none";
        urlPane.style.display = "";
        if (urlInput) urlInput.focus();
      }
    });
  });

  // Handle file selection via Click
  if (dropzone && fileInput) {
    dropzone.addEventListener("click", () => fileInput.click());
    dropzone.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        fileInput.click();
      }
    });

    // Drag & Drop
    ["dragenter", "dragover"].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.add("drag-over");
      });
    });

    ["dragleave", "drop"].forEach(name => {
      dropzone.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.remove("drag-over");
      });
    });

    const handleFile = async (file) => {
      if (!file || !file.type.startsWith("image/")) {
        alert("กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, WebP, SVG, GIF)");
        return;
      }
      try {
        previewTitle.textContent = "กำลังประมวลผลรูปภาพ...";
        previewArea.style.display = "flex";
        const res = await compressImageFile(file);
        const sizeKb = Math.round(res.size / 1024);
        setPreview(res.dataUrl, res.name || "รูปภาพอัปโหลด", `ไฟล์ในเครื่อง · ${sizeKb} KB`);
      } catch (err) {
        alert(err.message || "ไม่สามารถอ่านไฟล์ภาพได้");
        previewArea.style.display = "none";
      }
    };

    dropzone.addEventListener("drop", (e) => {
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    });

    fileInput.addEventListener("change", () => {
      if (fileInput.files && fileInput.files[0]) {
        handleFile(fileInput.files[0]);
      }
    });
  }

  // Handle URL input
  if (urlInput) {
    const handleUrlChange = () => {
      const val = urlInput.value.trim();
      if (val) {
        setPreview(val, "รูปภาพจากลิงก์เว็บ", "Web URL");
      } else if (!finalInput.value.startsWith("data:")) {
        setPreview("", "", "");
      }
    };
    urlInput.addEventListener("input", handleUrlChange);
    urlInput.addEventListener("change", handleUrlChange);
  }

  // Clear button
  if (clearBtn) {
    clearBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setPreview("", "", "");
    });
  }

  return {
    getValue: () => finalInput.value,
    setValue: (url) => setPreview(url),
  };
}
