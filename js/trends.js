import { qs, qsa, toast, openModal, closeModal } from "./app.js";
import { escapeHtml } from "./formatters.js";
import { pixelIcons } from "./pixel-icons.js";

/**
 * Curated Pinterest Visual Design Trends & Aesthetics
 * Matches the layout from the reference UI:
 * 1. Top-Left Hero Swatch Card (Light)
 * 2. Top-Right 1 Pill Category Switcher (Dark with orange active pill)
 * 3. Top-Right 2 Minimal Concept Card (Dark)
 * 4. Bottom-Left "A signal appears" Mockup Card (Light)
 * 5. Bottom-Right 3D Cover Carousel Gallery (Dark, 7 upright 3D covers)
 */
export const PINTEREST_COVERS = [
  {
    id: "cover-the-fall-off",
    title: "THE FALL OFF",
    subtitle: "Streetwear Lookbook & High Editorial",
    category: "fashion",
    categoryLabel: "Fashion & Editorial",
    author: "@visual_archive",
    saves: "48.2k",
    badge: "🔥 TRENDING",
    coverColor: "#EAB308",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80",
    description: "การผสานสตรีทแวร์ดิบเท่เข้ากับเลย์เอาต์นิตยสารแฟชั่นชั้นสูง โทนสีเข้มหม่นตัดกับฟอนต์ Display สีเหลืองสดดึงดูดสายตา",
    swatches: [
      { hex: "#0E1015", name: "Heavy Asphalt" },
      { hex: "#EAB308", name: "Amber Voltage" },
      { hex: "#3F3F46", name: "Worn Concrete" },
      { hex: "#FAFAFA", name: "Ghost White" }
    ],
    tags: ["#Streetwear", "#EditorialPoster", "#Lookbook", "#UrbanAesthetic"],
    aiPrompt: "Editorial magazine cover 'THE FALL OFF', bold yellow condensed typography, moody dramatic fashion portrait in textured dark jacket, cinematic film grain, 35mm photography"
  },
  {
    id: "cover-monochrome",
    title: "MONOCHROME ESSENCE",
    subtitle: "Swiss Architecture & Sketch Print",
    category: "art",
    categoryLabel: "Visual Art & Print",
    author: "@minimal_studios",
    saves: "36.8k",
    badge: "✦ MINIMAL",
    coverColor: "#71717A",
    image: "https://images.unsplash.com/photo-1515260268569-9271009adfdb?auto=format&fit=crop&w=600&q=80",
    description: "เสน่ห์ของขาว-ดำสไตล์สวิส เส้นสายการสเก็ตช์ภาพคน และการจัดวางช่องไฟแบบมินิมอลที่ไม่เคยตกยุค",
    swatches: [
      { hex: "#000000", name: "True Black" },
      { hex: "#52525B", name: "Architectural Zinc" },
      { hex: "#A1A1AA", name: "Silver Ash" },
      { hex: "#FFFFFF", name: "Pure Canvas" }
    ],
    tags: ["#Monochrome", "#SwissGrid", "#SketchArt", "#MinimalArchitecture"],
    aiPrompt: "Minimalist black and white art poster, charcoal portrait sketch, clean Swiss typography, raw textured paper grain, high-end gallery edition"
  },
  {
    id: "cover-red-star",
    title: "RED STAR GLOW",
    subtitle: "90s Cyber Y2K & Acid Poster Art",
    category: "graphics",
    categoryLabel: "Acid Graphics",
    author: "@cyber_acid",
    saves: "54.1k",
    badge: "⚡ VIRAL",
    coverColor: "#EF4444",
    image: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80",
    description: "พื้นหลังสีแดงสดสะกดสายตา ผสานสัญลักษณ์ดวงดาว Y2K สปาร์คเคิล และฟอนต์เรโทรย้อนยุค 90s ที่กำลังครองใจคนรุ่นใหม่",
    swatches: [
      { hex: "#DC2626", name: "Crimson Spark" },
      { hex: "#18181B", name: "Nightcore" },
      { hex: "#FFFFFF", name: "Starlight" },
      { hex: "#F87171", name: "Blush Neon" }
    ],
    tags: ["#AcidPoster", "#RedAesthetic", "#Y2KStars", "#CyberRetro"],
    aiPrompt: "Intense red cyber acid poster, bold white typographic layout, glowing starlight sparkles, 90s techno club flyer aesthetic, screenprint texture"
  },
  {
    id: "cover-jesus-boy",
    title: "JESUS BOY",
    subtitle: "Retro Pop Culture & Vintage Screenprint",
    category: "art",
    categoryLabel: "Pop Art & Vintage",
    author: "@vintage_revival",
    saves: "41.9k",
    badge: "🔥 POPULAR",
    coverColor: "#F59E0B",
    image: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80",
    description: "งานคอลลาจและภาพพิมพ์สไตล์ป๊อปคัลเจอร์ยุคเซเว่นตี้ส์ ใช้คู่สีตัดกันรุนแรงอย่างเหลืองและแดงเพื่อสร้างความน่าจดจำ",
    swatches: [
      { hex: "#F59E0B", name: "Solar Amber" },
      { hex: "#B91C1C", name: "Oxblood" },
      { hex: "#FEF3C7", name: "Parchment Cream" },
      { hex: "#1C1917", name: "Charred Wood" }
    ],
    tags: ["#VintagePop", "#Screenprint", "#CollageArt", "#RetroTypography"],
    aiPrompt: "Vintage 1970s pop art poster 'JESUS BOY', bold distressed yellow typography, dramatic portrait artwork, warm nostalgic halftone textures"
  },
  {
    id: "cover-anba",
    title: "ANBA EDITORIAL",
    subtitle: "French Chic & High Fashion Lookbook",
    category: "fashion",
    categoryLabel: "Fashion & Editorial",
    author: "@paris_archive",
    saves: "62.4k",
    badge: "✦ ICONIC",
    coverColor: "#E11D48",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
    description: "ภาพถ่ายแฟชั่นปกหมวกเบเร่ต์สีแดงสด โดดเด่นด้วยโทนสีผิวธรรมชาติและการจัดวางตัวอักษร ANBA ขนาดใหญ่พาดบนหน้าปก",
    swatches: [
      { hex: "#E11D48", name: "Parisian Rose" },
      { hex: "#27272A", name: "Bespoke Charcoal" },
      { hex: "#F4F4F5", name: "Studio Softbox" },
      { hex: "#71717A", name: "Neutral Tint" }
    ],
    tags: ["#HighFashion", "#EditorialCover", "#RedBeret", "#FrenchChic"],
    aiPrompt: "Vogue magazine cover 'ANBA', striking fashion portrait wearing bold red beret, elegant typography, warm cinema lighting, 8k editorial look"
  },
  {
    id: "cover-hop-club",
    title: "HOP CLUB",
    subtitle: "Neo-Psychedelic & Acid Club Culture",
    category: "graphics",
    categoryLabel: "Acid Graphics",
    author: "@rave_visuals",
    saves: "39.1k",
    badge: "⚡ FRESH",
    coverColor: "#10B981",
    image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80",
    description: "คลื่นความนิยมของงานโปสเตอร์ปาร์ตี้และเทศกาลดนตรียุคใหม่ ใช้สีนีออนเขียวม่วงสะท้อนแสงและการจัดวางข้อความแบบไหลเวียน",
    swatches: [
      { hex: "#10B981", name: "Acid Emerald" },
      { hex: "#8B5CF6", name: "Psychedelic Violet" },
      { hex: "#FBBF24", name: "Electric Citron" },
      { hex: "#09090B", name: "Club Void" }
    ],
    tags: ["#ClubPoster", "#NeoPsychedelic", "#NeonPalette", "#AcidType"],
    aiPrompt: "Neo-psychedelic music poster 'HOP CLUB', vivid emerald green and purple fluid gradients, distorted experimental typography, rave flyer art"
  },
  {
    id: "cover-cyber-blue",
    title: "CYBER BLUE HORIZON",
    subtitle: "Digital Surrealism & 3D Character Art",
    category: "3d",
    categoryLabel: "3D & Digital Surrealism",
    author: "@spatial_future",
    saves: "58.7k",
    badge: "🔥 TOP PICK",
    coverColor: "#2563EB",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    description: "โลกดิจิทัลสามมิติในโทนสีโคบอลต์บลู เสื้อฮู้ดเรืองแสงและวัตถุโครเมียมสะท้อนแสง สไตล์ที่ครองฟีด Pinterest สาย Sci-Fi",
    swatches: [
      { hex: "#2563EB", name: "Cobalt Future" },
      { hex: "#38BDF8", name: "Hologram Sky" },
      { hex: "#030712", name: "Deep Space" },
      { hex: "#E0E7FF", name: "Cyber Chrome" }
    ],
    tags: ["#DigitalSurrealism", "#CobaltBlue", "#3DCharacter", "#ChromeArt"],
    aiPrompt: "Futuristic digital character in cobalt blue hoodie, chrome metallic reflective surfaces, dark ambient neon glow, sleek 3D render art"
  }
];

let activeCover = PINTEREST_COVERS[0];
let currentCategoryPill = "trending";

/**
 * Copy HEX code to clipboard with toast notification
 */
function copyHex(hex, name) {
  navigator.clipboard.writeText(hex).then(() => {
    toast(`คัดลอกรหัสสี ${hex} (${name || ""}) สำเร็จ`, "success", "Color Copied");
  }).catch(() => {
    const input = document.createElement("input");
    input.value = hex;
    document.body.appendChild(input);
    input.select();
    document.execCommand("copy");
    document.body.removeChild(input);
    toast(`คัดลอกรหัสสี ${hex} สำเร็จ`, "success", "Color Copied");
  });
}

/**
 * Open Pin Inspection Modal
 */
function openPinModal(cover) {
  openModal({
    size: "lg",
    title: `
      <div style="display:flex;align-items:center;gap:12px;">
        <span style="font-size:1.4rem;">📌</span>
        <div>
          <div style="font-weight:700;font-size:1.15rem;color:#ffffff;">${escapeHtml(cover.title)}</div>
          <div style="font-size:0.8rem;color:#8f95ae;">${escapeHtml(cover.subtitle)} · ${escapeHtml(cover.author)}</div>
        </div>
      </div>
    `,
    body: `
      <div style="display:flex;flex-direction:column;gap:18px;">
        <!-- Artwork Hero -->
        <div style="position:relative;border-radius:12px;overflow:hidden;background:#000;border:1px solid #27272a;max-height:420px;display:flex;justify-content:center;">
          <img src="${escapeHtml(cover.image)}" alt="${escapeHtml(cover.title)}" style="max-height:420px;width:auto;object-fit:contain;display:block;" />
          <div style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);border:1px solid rgba(255,255,255,0.15);padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:700;color:#fff;">
            📌 ${cover.saves} Saves on Pinterest
          </div>
        </div>

        <!-- Description & Tags -->
        <div style="background:#111218;border:1px solid #232530;border-radius:10px;padding:16px;">
          <div style="font-weight:700;font-size:0.92rem;color:#ffffff;margin-bottom:6px;">✨ รายละเอียดและสุนทรียศาสตร์ของชิ้นงาน:</div>
          <p style="font-size:0.86rem;color:#c5cadc;line-height:1.6;margin:0 0 14px;">${escapeHtml(cover.description)}</p>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${cover.tags.map((t) => `<span style="font-size:0.72rem;background:#1e202d;color:#94a3b8;padding:3px 8px;border-radius:4px;border:1px solid #2c3042;">${escapeHtml(t)}</span>`).join("")}
          </div>
        </div>

        <!-- Color Palette Swatches -->
        <div style="background:#111218;border:1px solid #232530;border-radius:10px;padding:16px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <span style="font-weight:700;font-size:0.88rem;color:#ffffff;">🎨 จานสีเด่น (Color Palette) — คลิกเพื่อคัดลอก:</span>
            <span style="font-size:0.72rem;color:#8f95ae;">Click to copy HEX</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(130px, 1fr));gap:10px;">
            ${cover.swatches.map((s) => `
              <div class="modal-swatch-box" data-modal-hex="${s.hex}" data-modal-name="${s.name}" style="background:#181a24;border:1px solid #2b2e40;border-radius:8px;padding:10px;cursor:pointer;transition:transform 0.15s, border-color 0.15s;" title="คลิกเพื่อคัดลอก ${s.hex}">
                <div style="width:100%;height:32px;border-radius:4px;background:${s.hex};border:1px solid rgba(255,255,255,0.1);margin-bottom:8px;"></div>
                <div style="font-weight:700;font-size:0.82rem;color:#ffffff;font-family:'Space Mono',monospace;">${s.hex}</div>
                <div style="font-size:0.72rem;color:#8f95ae;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(s.name)}</div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- AI Prompt -->
        <div style="background:#0c0d12;border:1px dashed #2c3042;border-radius:8px;padding:14px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
            <span style="font-size:0.78rem;font-weight:700;color:#9ca2bb;">💡 AI Prompt Inspiration สำหรับจำลองสไตล์นี้:</span>
            <button type="button" class="btn btn-ghost btn-xs" id="btn-copy-pin-prompt" style="font-size:0.72rem;padding:2px 8px;">คัดลอก Prompt 📋</button>
          </div>
          <pre style="margin:0;font-family:'Space Mono',monospace;font-size:0.76rem;color:#a6acc3;white-space:pre-wrap;background:#14151f;padding:10px;border-radius:4px;border:1px solid #232636;">${escapeHtml(cover.aiPrompt)}</pre>
        </div>
      </div>
    `,
    footer: `
      <div style="display:flex;align-items:center;justify-content:space-between;width:100%;gap:12px;flex-wrap:wrap;">
        <span style="font-size:0.78rem;color:#8f95ae;">บันทึกจาก Pinterest Visual Curator</span>
        <div style="display:flex;gap:10px;">
          <button type="button" class="btn btn-ghost" data-close-modal>ปิด</button>
          <button type="button" class="btn-pixel btn-pixel-cyan" id="btn-use-pin-create" style="padding:7px 16px;">
            ${pixelIcons.plus}
            <span>นำเทรนด์นี้ไปสร้าง Task</span>
          </button>
        </div>
      </div>
    `
  });

  // Bind swatch clicks inside modal
  qsa(".modal-swatch-box").forEach((box) => {
    box.addEventListener("click", () => {
      copyHex(box.dataset.modalHex, box.dataset.modalName);
    });
  });

  // Bind copy prompt
  qs("#btn-copy-pin-prompt")?.addEventListener("click", () => {
    navigator.clipboard.writeText(cover.aiPrompt).then(() => {
      toast("คัดลอก AI Prompt เรียบร้อยแล้ว", "success");
    });
  });

  // Bind create task
  qs("#btn-use-pin-create")?.addEventListener("click", () => {
    closeModal();
    if (typeof window.openCreateTask === "function") {
      window.openCreateTask({
        title: `งานดีไซน์สไตล์ ${cover.title}`,
        description: `บรีฟชิ้นงานอ้างอิงแรงบันดาลใจจาก Pinterest Trend: ${cover.title} (${cover.subtitle})\n\nแท็กสไตล์: ${cover.tags.join(" ")}\nจานสีเด่น: ${cover.swatches.map((s) => `${s.name} (${s.hex})`).join(", ")}\n\nรายละเอียดงาน: \n`,
        preview_url: cover.image,
        channel: "Social Media / Key Visual"
      });
    }
  });
}

/**
 * Main Render Function
 */
export async function render(context = {}) {
  const mount = qs("#page-content");
  if (!mount) return;

  // Build the Bento Frame matching the uploaded image exactly
  mount.innerHTML = `
    <div class="pinterest-curator-root">
      <!-- Title & Subtitle Bar -->
      <div class="pinterest-header-row">
        <div>
          <div class="pinterest-top-badge">
            <span class="p-dot-pulse"></span>
            <span>PINTEREST VISUAL DESIGN CURATOR</span>
            <span class="p-badge-sub">LIVE MOODBOARD FEED</span>
          </div>
          <h1 class="pinterest-header-title">
            เทรนด์งานออกแบบ & สุนทรียศาสตร์ร่วมสมัยจาก Pinterest
          </h1>
          <p class="pinterest-header-desc">
            รวบรวมเทรนด์ภาพถ่าย แฟชั่น โปสเตอร์ สิ่งพิมพ์ งานศิลปะ และงานดีไซน์หลากมิติที่กำลังไวรัลบน Pinterest เพื่อจุดประกายไอเดียใหม่ ๆ ให้กับทีม
          </p>
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <button type="button" class="btn-pixel btn-pixel-cyan" id="btn-sync-pinterest" title="Refresh Pinterest Pins">
            <span>🔄 ซิงค์พินล่าสุด</span>
          </button>
        </div>
      </div>

      <!-- Bento Canvas Container (Matching the reference screenshot!) -->
      <div class="bento-black-canvas" id="bento-canvas">
        
        <!-- TOP ROW -->
        <div class="bento-top-row">
          
          <!-- TOP-LEFT: HERO WHITE SWATCH CARD (~65% width) -->
          <div class="bento-card bento-hero-white-card" id="bento-hero-card">
            <div class="hero-white-inner">
              <!-- Swatches Grid (2 rows x 4 items) -->
              <div class="hero-swatches-grid" id="hero-swatches-grid">
                <!-- Populated dynamically based on activeCover -->
              </div>

              <!-- Cart / Pin Metric Bar -->
              <div class="hero-metric-bar">
                <div class="hero-metric-left">
                  <span class="hero-cart-icon">🛍️</span>
                </div>
                <div class="hero-metric-right">
                  <span class="hero-metric-price" id="hero-metric-saves">$1,863.00</span>
                </div>
              </div>
            </div>
          </div>

          <!-- TOP-RIGHT STACK (~35% width) -->
          <div class="bento-top-right-stack">
            
            <!-- TOP-RIGHT 1: PILL FILTER CARD -->
            <div class="bento-card bento-dark-pill-card">
              <div class="pill-buttons-row" id="pill-buttons-row">
                <button type="button" class="capsule-icon-pill" data-pill-cat="all" title="All Aesthetics">✦</button>
                <button type="button" class="capsule-icon-pill" data-pill-cat="fashion" title="Fashion & Editorial">👗</button>
                <button type="button" class="capsule-icon-pill" data-pill-cat="graphics" title="Acid Graphics">⚡</button>
                <button type="button" class="capsule-text-pill is-active-orange" data-pill-cat="trending">Trending</button>
                <button type="button" class="capsule-icon-pill" data-pill-cat="3d" title="3D & Digital">🔮</button>
              </div>
            </div>

            <!-- TOP-RIGHT 2: MINIMAL CONCEPT CARD -->
            <div class="bento-card bento-dark-concept-card">
              <div class="concept-center-text">
                <span class="concept-wordmark">✦ concept</span>
                <span class="concept-sub-caption">PINTEREST AESTHETIC DIRECTORY</span>
              </div>
            </div>

          </div>

        </div>

        <!-- BOTTOM ROW -->
        <div class="bento-bottom-row">

          <!-- BOTTOM-LEFT: A SIGNAL APPEARS (WHITE CARD, ~30% width) -->
          <div class="bento-card bento-signal-white-card" id="bento-signal-card">
            <div class="signal-card-content">
              <div class="signal-thumb-wrap">
                <img id="signal-thumb-img" src="${activeCover.image}" alt="Signal preview" />
              </div>
              <div class="signal-text-wrap">
                <h3 class="signal-title">A signal appears.</h3>
                <p class="signal-desc" id="signal-desc-text">
                  Visual narrative tracking aesthetic shifts across photography, poster art & lifestyle.
                </p>
              </div>
            </div>
          </div>

          <!-- BOTTOM-RIGHT: 3D COVER CAROUSEL SHOWCASE (~70% width) -->
          <div class="bento-card bento-covers-carousel-card">
            <div class="covers-track" id="covers-track">
              <!-- Populated dynamically with 7 upright 3D covers -->
            </div>
          </div>

        </div>

      </div>

      <!-- Quick Action Bar -->
      <div class="pinterest-quick-meta-bar">
        <div style="font-size:0.8rem;color:#8f95ae;">
          💡 <strong>เคล็ดลับ:</strong> คลิกที่ปกหนังสือ/โปสเตอร์ด้านล่างเพื่อสลับดูจานสี หรือคลิกเพื่อดูรายละเอียดบรีฟและนำไปสร้างงานใน CONT
        </div>
        <div style="display:flex;gap:8px;">
          <button type="button" class="btn btn-ghost btn-sm" id="btn-open-active-detail">
            🔍 ดูรายละเอียดชิ้นงานที่เลือก (<span id="active-title-label">${activeCover.title}</span>)
          </button>
        </div>
      </div>
    </div>
  `;

  // Update Hero Swatches Grid
  const updateHeroSwatches = (cover) => {
    const grid = mount.querySelector("#hero-swatches-grid");
    const metric = mount.querySelector("#hero-metric-saves");
    const signalImg = mount.querySelector("#signal-thumb-img");
    const signalDesc = mount.querySelector("#signal-desc-text");
    const activeLabel = mount.querySelector("#active-title-label");

    if (signalImg) signalImg.src = cover.image;
    if (signalDesc) signalDesc.textContent = `${cover.title} — ${cover.description}`;
    if (activeLabel) activeLabel.textContent = cover.title;
    if (metric) metric.textContent = `$1,863.00`; // Preserving the iconic metric aesthetic from reference screenshot

    if (grid) {
      // 8 swatches / chips arranged nicely (2 rows x 4)
      const chips = [
        { hex: cover.swatches[0]?.hex || "#EAB308", label: "01" },
        { hex: cover.swatches[1]?.hex || "#0E1015", label: "02" },
        { hex: cover.swatches[2]?.hex || "#3F3F46", label: "03" },
        { hex: cover.swatches[3]?.hex || "#FAFAFA", label: "04" },
        { hex: cover.coverColor || "#EF4444", label: "05" },
        { hex: "#22D3EE", label: "06" },
        { hex: "#C084FC", label: "07" },
        { hex: "#F472B6", label: "08" },
      ];

      grid.innerHTML = chips.map((c) => `
        <div class="swatch-tile" data-tile-hex="${c.hex}" style="background:${c.hex};" title="คลิกเพื่อคัดลอก ${c.hex}">
          <span class="swatch-tile-badge">✓</span>
        </div>
      `).join("");

      grid.querySelectorAll("[data-tile-hex]").forEach((tile) => {
        tile.addEventListener("click", (e) => {
          e.stopPropagation();
          copyHex(tile.dataset.tileHex, "Palette Chip");
        });
      });
    }
  };

  // Render 3D Covers Track
  const renderCovers = (covers) => {
    const track = mount.querySelector("#covers-track");
    if (!track) return;

    track.innerHTML = covers.map((c) => `
      <div class="cover-3d-item ${c.id === activeCover.id ? "is-selected-cover" : ""}" data-cover-id="${c.id}" title="${escapeHtml(c.title)} — ${escapeHtml(c.subtitle)}">
        <div class="cover-3d-spine"></div>
        <div class="cover-3d-face">
          <img src="${escapeHtml(c.image)}" alt="${escapeHtml(c.title)}" loading="lazy" />
          <div class="cover-3d-overlay">
            <span class="cover-mini-title">${escapeHtml(c.title)}</span>
          </div>
        </div>
      </div>
    `).join("");

    track.querySelectorAll("[data-cover-id]").forEach((el) => {
      el.addEventListener("click", () => {
        const found = PINTEREST_COVERS.find((x) => x.id === el.dataset.coverId);
        if (found) {
          activeCover = found;
          track.querySelectorAll(".cover-3d-item").forEach((b) => b.classList.toggle("is-selected-cover", b.dataset.coverId === activeCover.id));
          updateHeroSwatches(activeCover);
          openPinModal(activeCover);
        }
      });
    });
  };

  // Initial State Render
  updateHeroSwatches(activeCover);
  renderCovers(PINTEREST_COVERS);

  // Bind Category Pills
  const pillButtons = mount.querySelectorAll("[data-pill-cat]");
  pillButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      pillButtons.forEach((b) => {
        b.classList.remove("is-active-orange");
        b.classList.remove("is-active-cyan");
      });

      btn.classList.add("is-active-orange");
      currentCategoryPill = btn.dataset.pillCat;

      let filtered = PINTEREST_COVERS;
      if (currentCategoryPill !== "all" && currentCategoryPill !== "trending") {
        filtered = PINTEREST_COVERS.filter((c) => c.category === currentCategoryPill);
      }
      if (filtered.length === 0) filtered = PINTEREST_COVERS;

      activeCover = filtered[0];
      updateHeroSwatches(activeCover);
      renderCovers(filtered);
      toast(`แสดงพินหมวดหมู่: ${currentCategoryPill.toUpperCase()}`, "info");
    });
  });

  // Bind Active Detail Button
  mount.querySelector("#btn-open-active-detail")?.addEventListener("click", () => {
    openPinModal(activeCover);
  });

  // Bind Hero Card click
  mount.querySelector("#bento-hero-card")?.addEventListener("click", () => {
    openPinModal(activeCover);
  });

  // Bind Signal Card click
  mount.querySelector("#bento-signal-card")?.addEventListener("click", () => {
    openPinModal(activeCover);
  });

  // Bind Sync Button
  mount.querySelector("#btn-sync-pinterest")?.addEventListener("click", () => {
    toast("ซิงค์ฟีดพิน Pinterest และจานสีล่าสุดเรียบร้อยแล้ว!", "success", "Pinterest Live Sync");
    updateHeroSwatches(activeCover);
    renderCovers(PINTEREST_COVERS);
  });
}
