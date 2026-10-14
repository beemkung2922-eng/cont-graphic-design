import { qs, qsa, toast, openModal } from "./app.js";
import { escapeHtml } from "./formatters.js";
import { pixelIcons } from "./pixel-icons.js";

/* ─────────────────────────────────────────────────────────────────────────
   DATA: SOCIAL LISTENING, NETWORK GRAPHS & VISUAL INTELLIGENCE
───────────────────────────────────────────────────────────────────────── */

// 1. Comparison Mode Mock Data (Volume vs Network Graph)
const VOLUME_DATA = {
  totalMentions: 148500,
  brands: [
    { name: "CONT Sunscreen", count: 38400, pct: 25.8, color: "#19c3eb" },
    { name: "Brand A (Derma Pro)", count: 42100, pct: 28.3, color: "#ffc61a" },
    { name: "Brand B (Aqua Sun)", count: 35200, pct: 23.7, color: "#22c55e" },
    { name: "Brand C (Pure Glow)", count: 32800, pct: 22.2, color: "#a855f7" }
  ],
  sentiment: { positive: 64, neutral: 24, negative: 12 }
};

// 2. The 6 Strategic Marketing Pillars Data (Sunscreen Case Study)
const PILLARS_DATA = {
  standard: {
    title: "1. Market Standard (เข้าใจมาตรฐานก่อนลงแข่ง)",
    subtitle: "ประเมิน 'เกณฑ์ขั้นต่ำ' ที่ผู้บริโภคมองเป็นเรื่องปกติ เพื่อไม่ให้เสียเวลาเคลมสิ่งพื้นฐานเป็นจุดขายหลัก",
    items: [
      { label: "SPF50+ & PA++++", expectedPct: 98, status: "Must-Have Baseline", desc: "ผู้บริโภค 98% ถือเป็นเกณฑ์ขั้นต่ำที่ต้องมี หากต่ำกว่านี้จะไม่ถูกพิจารณา" },
      { label: "ไม่วอก / ไม่ลอยบนผิวสองสี", expectedPct: 94, status: "Must-Have Baseline", desc: "เนื้อกันแดดต้องกลืนกับผิวคนไทย ไม่ทิ้งคราบขาว" },
      { label: "คุมมัน ไม่เยิ้มระหว่างวัน", expectedPct: 89, status: "Must-Have Baseline", desc: "สภาพอากาศร้อนชื้นทำให้การคุมมันกลายเป็นมาตรฐานพื้นฐาน" },
      { label: "Reef-Safe / เป็นมิตรต่อปะการัง", expectedPct: 52, status: "Value Differentiator", desc: "โอกาสสร้างจุดขายเฉพาะกลุ่ม (Ecological Niche) ที่ยังไม่มีใครครองตลาดเด็ดขาด" },
      { label: "Blue Light & Anti-Pollution PM2.5", expectedPct: 61, status: "Value Differentiator", desc: "จุดขายเพิ่มมูลค่าสำหรับคนทำงานออฟฟิศและคนเมือง" }
    ]
  },
  needs: {
    title: "2. Consumer Needs (ฟังเสียงลูกค้าเพื่อหาจุดขายเชื่อมโยง)",
    subtitle: "วิเคราะห์ความต้องการที่เชื่อมโยงกัน เพื่อดึง Pain Point ลึกๆ มาทำเป็นชิ้นงานครีเอทีฟที่ตรงใจ",
    clusters: [
      {
        core: "ผิวมัน & สิวผด",
        connected: ["เนื้อเซรั่มน้ำนม", "ไม่อุดตันรูขุมขน", "ลดอุณหภูมิผิว (-3°C)"],
        insight: "คนเป็นสิวไม่ได้มองหาแค่ 'ไม่มัน' แต่มองหาความรู้สึก 'เย็นสบายผิว' ไม่กระตุ้นสิวผดตอนเหงื่อออก",
        creativeHook: "กันแดดสลายร้อน -3°C คุมมัน 12 ชม. สิวผดไม่กวนใจ"
      },
      {
        core: "แต่งหน้าติดทน & เร่งรีบ",
        connected: ["เป็นเมคอัพเบสในตัว", "ไม่เป็นขุย (Pilling)", "เซ็ตตัวใน 30 วินาที"],
        insight: "ผู้หญิงทำงานเร่งรีบช่วงเช้า ต้องการกันแดดที่แทนไพรเมอร์ได้โดยรองพื้นไม่หลุดเป็นคราบ",
        creativeHook: "30 วินาทีเซ็ตตัว รองพื้นแนบสนิท ไม่หลุดเป็นขุยตลอดวัน"
      },
      {
        core: "ทาทับเมคอัพนอกสถานที่",
        connected: ["Sun Stick แบบแท่ง", "กันแดดสเปรย์ละอองหมอก", "ไม่เลอะมือ"],
        insight: "ผู้บริโภคตระหนักเรื่องการเติมกันแดดทุก 2 ชม. แต่ติดปัญหาเรื่องมือสกปรกและหน้าเยิ้ม",
        creativeHook: "เติมได้ตลอดวัน ไม่เลอะมือ ปาดทับเมคอัพเดิมได้ทันที"
      }
    ]
  },
  competitor: {
    title: "3. Real Competitor (หาคู่แข่งตัวจริงจากสายตาผู้บริโภค)",
    subtitle: "ผู้บริโภคไม่ได้เทียบเรากับแบรนด์ราคาเดียวกันเสมอไป แต่เทียบใน 'บริบทการใช้งาน' จริง",
    matrix: [
      {
        ourBrand: "CONT Sun Hydro",
        realCompetitor: "Brand X (นำเข้าจากญี่ปุ่น)",
        context: "กระทู้ 'คนผิวมันเป็นสิวใช้ตัวไหนดีกว่ากัน?'",
        overlapPct: 78,
        ourAdvantage: "เนื้อบางเบากว่า คุมมันในอากาศเมืองไทยได้ดีกว่า ไม่เหนียวเหนอะ",
        actionPlan: "ทำกราฟิกทดสอบความมันด้วยกระดาษซับหน้ามันเทียบผลลัพธ์ใน 8 ชั่วโมง"
      },
      {
        ourBrand: "CONT Tone-Up SPF",
        realCompetitor: "Brand Y (แบรนด์เคาน์เตอร์เกาหลี)",
        context: "TikTok รีวิว 'กันแดดโทนอัพผิวผ่องแบบไม่โป๊ะ'",
        overlapPct: 65,
        ourAdvantage: "เฉดสีเข้ากับโทนเหลืองของคนไทย ไม่วอกเทา ราคาเข้าถึงง่ายกว่า 2 เท่า",
        actionPlan: "ทำคลิปสวอชเปรียบเทียบเทียบผิว 3 เฉดสี (ขาวเหลือง / สองสี / แทน)"
      }
    ]
  },
  influencer: {
    title: "4. Influencer Role (เลือกอินฟลูเอนเซอร์จากบทบาท & ความน่าเชื่อถือ)",
    subtitle: "เลิกดูแค่ยอด Followers เปลี่ยนมาดู 'Trust Score' และ 'Engagement Fit' ตามเป้าหมายแคมเปญ",
    roles: [
      {
        roleName: "The Skin Educator (หมอผิวหนัง / เภสัชกร)",
        followers: "25k - 80k (Micro/Nano)",
        engagementRate: "8.6%",
        trustScore: 96,
        bestFor: "สร้างความน่าเชื่อถือด้านส่วนผสม (Science-backed Claims) อธิบายค่า SPF และงานวิจัย",
        recommended: true
      },
      {
        roleName: "The Lifestyle Daily Vlogger",
        followers: "120k - 400k (Mid-Tier)",
        engagementRate: "5.2%",
        trustScore: 84,
        bestFor: "แสดงการใช้จริงในชีวิตประจำวัน (GRWM, ทาก่อนออกกำลังกายกลางแจ้ง)",
        recommended: true
      },
      {
        roleName: "The Mega Celebrity",
        followers: "1.5M+",
        engagementRate: "1.1%",
        trustScore: 58,
        bestFor: "สร้างการรับรู้ในวงกว้าง (Mass Awareness) แต่คอนเวอร์ชันต่ำกว่าเนื่องจากความคุ้นชินของผู้บริโภคที่มองว่าเป็นการจ้างโฆษณา",
        recommended: false
      }
    ]
  },
  protection: {
    title: "5. Brand Protection (ปกป้องความเชื่อมั่นและรายได้จากของปลอม)",
    subtitle: "เฝ้าระวังร้านค้าปลอมและตัวแทนจำหน่ายที่ขายต่ำกว่าราคามาตรฐานบน TikTok Shop & Shopee",
    alerts: [
      {
        id: "alert-01",
        platform: "TikTok Shop",
        shopName: "BeautySuperDeal_Official_Fake",
        priceDetected: "149 ฿ (ราคาปกติ 690 ฿)",
        riskLevel: "CRITICAL RISK",
        riskColor: "#ef4444",
        issue: "ราคาต่ำผิดปกติ 78% และมีคอมเมนต์ 'เนื้อครีมเหลวเป็นน้ำ แสบตา มีกลิ่นสารเคมี'",
        status: "ส่งดำเนินคดี & แจ้ง Take-down ทันที"
      },
      {
        id: "alert-02",
        platform: "Shopee Affiliate",
        shopName: "CosmeDirect_TH",
        priceDetected: "390 ฿",
        riskLevel: "WARNING",
        riskColor: "#f59e0b",
        issue: "นำภาพอาร์ตเวิร์กเก่าปีที่แล้วไปดัดแปลง และเคลมสรรพคุณเกินจริง (รักษาฝ้าหายขาดใน 3 วัน)",
        status: "แจ้งปรับปรุงคอนเทนต์และระงับค่าคอมมิชชันชั่วคราว"
      }
    ]
  },
  posting: {
    title: "6. Posting Window (หาช่องว่างเวลาโพสต์ด้วย Heatmap)",
    subtitle: "หลีกเลี่ยงช่วงเวลา 'แย่งกันยิงแอด' หาช่วงเวลาทองที่ผู้ชมพร้อมมีส่วนร่วมแต่คู่แข่งโพสต์น้อย",
    goldenWindows: [
      { time: "07:00 - 08:30 น. (จันทร์ - ศุกร์)", intent: "เช็กโทรศัพท์ขณะเดินทาง / เตรียมแต่งหน้าก่อนออกแดด", competition: "ต่ำ - ปานกลาง", efficiency: "+42% Engagement" },
      { time: "12:15 - 13:00 น. (พักกลางวัน)", intent: "พักเที่ยง แดดจัดที่สุด คนนึกถึงปัญหาความมันและกันแดดหลุด", competition: "สูง", efficiency: "+18% Engagement" },
      { time: "21:30 - 23:00 น. (ช่วง Skincare Routine)", intent: "ผ่อนคลายบนเตียง อ่านรีวิวสกินแคร์ พร้อมกดใส่ตะกร้าสั่งซื้อ", competition: "ต่ำ", efficiency: "+64% Conversion Rate" }
    ]
  }
};

// 3. Visual Trend & Design Listening Platforms Mock Data
const DESIGN_LISTENING_DATA = {
  elements: [
    { id: "e1", category: "Color", name: "Cyber Cyan & Slate Dark", freq: 88, lift: "+34.5%" },
    { id: "e2", category: "Typography", name: "Bold Loopless Thai (ฟอนต์ไม่มีหัว)", freq: 92, lift: "+28.2%" },
    { id: "e3", category: "Layout", name: "Split Screen Packshot + Texture Zoom", freq: 79, lift: "+41.0%" },
    { id: "e4", category: "Visual Cue", name: "Droplet Water Ripple (ระลอกน้ำใส)", freq: 84, lift: "+36.8%" },
    { id: "e5", category: "Badge", name: "SPF50+ Holographic Pill Badge", freq: 95, lift: "+22.4%" }
  ],
  moodboardKeywords: [
    { query: "ดูน่าเชื่อถือ (Trust) + วัยรุ่น (Gen Z)", palette: ["#19C3EB", "#0F172A", "#F8FAFC", "#38BDF8"], font: "Display Geometric + Clean Thai", composition: "Asymmetric Bento with clean white space" },
    { query: "สปอร์ตแอคทีฟ (Active) + กันน้ำกันเหงื่อ", palette: ["#FF5E1E", "#0A0A0A", "#E2E8F0", "#FFE600"], font: "Italic Bold Sans + Dynamic Angle", composition: "Motion blur splash & High contrast badges" },
    { query: "คลีนบิวตี้ (Clean Beauty) + ออร์แกนิก", palette: ["#2BD14B", "#F5ECD2", "#1E293B", "#86EFAC"], font: "Serif Minimal + Elegant Spacing", composition: "Natural sunlight shadows & Macro botanical textures" }
  ],
  fatigueData: [
    { template: "Template A (Hero Model Pointing at Sunscreen)", exposureDays: 19, impressions: "1.4M", fatigueStatus: "SEVERE FATIGUE (-52% CTR)", color: "#ef4444", action: "เปลี่ยนอาร์ตเวิร์กด่วน!" },
    { template: "Template B (Macro Texture Swatch + Droplet)", exposureDays: 8, impressions: "620K", fatigueStatus: "HEALTHY (+14% CTR)", color: "#22c55e", action: "ประสิทธิภาพยังดี ขยายสเกลต่อได้" },
    { template: "Template C (Comparison 8-Hour Oil Blotting Sheet)", exposureDays: 14, impressions: "980K", fatigueStatus: "MODERATE FATIGUE (-18% CTR)", color: "#f59e0b", action: "แนะนำสลับคู่สีใหม่เพื่อยืดอายุแอด" }
  ]
};

/* ─────────────────────────────────────────────────────────────────────────
   STATE MANAGEMENT
───────────────────────────────────────────────────────────────────────── */
let currentViewMode = "network"; // "volume" or "network"
let activePillarKey = "standard";
let activeDesignModule = "visual-trend";
let searchKeywordPrompt = "ดูน่าเชื่อถือ (Trust) + วัยรุ่น (Gen Z)";

/* ─────────────────────────────────────────────────────────────────────────
   MAIN RENDER
───────────────────────────────────────────────────────────────────────── */
export async function render(ctx = {}) {
  const mount = qs("#page-content");
  if (!mount) return;

  mount.innerHTML = `
    <div class="listening-hub-shell">
      <!-- 1. Header Banner: Philosophy & Interactive Paradigm Switcher -->
      <section class="listening-header-hero">
        <div class="listening-hero-badge">
          <span class="pulse-indicator"></span>
          <span>DATA-DRIVEN MARKETING & SOCIAL LISTENING 2.0</span>
          <span class="badge-tag">AINSIGHT NETWORK SYSTEM</span>
        </div>
        <h1 class="listening-hero-title">
          เปลี่ยนจากดูแค่ "ปริมาณ" สู่การค้นหา "ความเชื่อมโยง" ด้วย AI Network Graph
        </h1>
        <p class="listening-hero-sub">
          ปัญหาเดิมของ Social Listening คือการเห็นเพียงแค่ Volume ผ่านกราฟแท่งหรือกราฟวงกลม ซึ่งตอบไม่ได้ว่าข้อมูลเชื่อมโยงกันอย่างไร
          เมื่อนำ AI มาสร้าง <strong>Network Graph</strong> จะเผยให้เห็นมิติเชิงลึก นำไปสู่ 6 มุมมองการตลาด และ 3 ระบบ Visual Intelligence สำหรับงานออกแบบ
        </p>

        <!-- Toggle Paradigm Switcher -->
        <div class="paradigm-switcher-box">
          <div class="paradigm-switch-buttons">
            <button type="button" class="btn-paradigm ${currentViewMode === "volume" ? "is-active" : ""}" id="btn-toggle-volume">
              <span>📊 ปัญหาเดิม: ดูแค่ปริมาณ (Volume-Only)</span>
            </button>
            <button type="button" class="btn-paradigm ${currentViewMode === "network" ? "is-active" : ""}" id="btn-toggle-network">
              <span>🕸️ รูปแบบใหม่: วิเคราะห์ความเชื่อมโยง (AI Network Graph)</span>
              <span class="paradigm-chip-sparkle">RECOMMENDED</span>
            </button>
          </div>

          <!-- Dynamic Demonstration Container -->
          <div class="paradigm-demo-viewport" id="paradigm-demo-viewport">
            ${renderParadigmDemo()}
          </div>
        </div>
      </section>

      <!-- 2. Section A: The 6 Strategic Marketing Pillars (Sunscreen Case Study) -->
      <section class="listening-section">
        <div class="section-title-wrap">
          <div class="section-pill-tag">CASE STUDY: ตลาดครีมกันแดด</div>
          <h2 class="section-main-heading">6 มุมมองสำคัญในการทำการตลาดด้วย Connected Data</h2>
          <p class="section-sub-heading">คลิกเลือกแต่ละมุมมองเพื่อดูผลการวิเคราะห์ความเชื่อมโยงและกลยุทธ์ที่นำไปใช้งานได้จริง</p>
        </div>

        <div class="pillars-nav-bar">
          ${Object.keys(PILLARS_DATA).map(key => {
            const p = PILLARS_DATA[key];
            const parts = p.title.split("(");
            const shortName = parts[0].trim();
            const engName = (parts[1] || "").replace(")", "").trim();
            return `
              <button type="button" class="btn-pillar-tab ${activePillarKey === key ? "is-active" : ""}" data-pillar="${key}">
                <span class="pillar-num">${shortName.split(".")[0]}</span>
                <div class="pillar-label-group">
                  <span class="pillar-th">${shortName.split(".")[1] || shortName}</span>
                  <span class="pillar-en">${engName}</span>
                </div>
              </button>
            `;
          }).join("")}
        </div>

        <div class="pillar-detail-card" id="pillar-detail-card">
          ${renderPillarDetail(activePillarKey)}
        </div>
      </section>

      <!-- 3. Section B: The 3 Visual & Design Intelligence Systems for Designers & Teams -->
      <section class="listening-section design-intelligence-section">
        <div class="section-title-wrap">
          <div class="section-pill-tag" style="background:rgba(168,85,247,0.15);color:#c084fc;border-color:rgba(168,85,247,0.3);">
            FOR DESIGNERS & CREATIVE TEAMS
          </div>
          <h2 class="section-main-heading">3 ระบบ Visual Intelligence ยกระดับงานดีไซน์ด้วย Data</h2>
          <p class="section-sub-heading">
            เปลี่ยน Social Listening จากการจับข้อความ มาจับ "องค์ประกอบภาพ" ค้นหา Moodboard ด้วยกราฟความสัมพันธ์ และวัดผลงานกราฟิกในระดับไมโคร
          </p>
        </div>

        <!-- 3-Tab Navigator -->
        <div class="design-modules-tabs">
          <button type="button" class="btn-design-tab ${activeDesignModule === "visual-trend" ? "is-active" : ""}" data-module="visual-trend">
            <span class="design-tab-icon">👁️</span>
            <div>
              <span class="design-tab-title">1. Visual Trend & Design Listening</span>
              <span class="design-tab-sub">วิเคราะห์องค์ประกอบภาพ (คู่สี ↔ ฟอนต์ ↔ เลย์เอาต์)</span>
            </div>
          </button>
          <button type="button" class="btn-design-tab ${activeDesignModule === "moodboard-graph" ? "is-active" : ""}" data-module="moodboard-graph">
            <span class="design-tab-icon">💡</span>
            <div>
              <span class="design-tab-title">2. Intelligent Moodboard & Concept</span>
              <span class="design-tab-sub">แปลงคีย์เวิร์ดเป็นกราฟภาพ & หาช่องว่างไม่ซ้ำคู่แข่ง</span>
            </div>
          </button>
          <button type="button" class="btn-design-tab ${activeDesignModule === "asset-tracker" ? "is-active" : ""}" data-module="asset-tracker">
            <span class="design-tab-icon">🎯</span>
            <div>
              <span class="design-tab-title">3. Creative Asset Impact Tracker</span>
              <span class="design-tab-sub">วัดผลองค์ประกอบย่อยในภาพ & ดักจับ Ad Fatigue</span>
            </div>
          </button>
        </div>

        <!-- Active Design Module View -->
        <div class="design-module-viewport" id="design-module-viewport">
          ${renderDesignModule(activeDesignModule)}
        </div>
      </section>
    </div>
  `;

  // Attach event listeners
  bindEvents();
  initNetworkCanvas();
}

/* ─────────────────────────────────────────────────────────────────────────
   PARADIGM DEMO RENDERER (VOLUME VS NETWORK GRAPH)
───────────────────────────────────────────────────────────────────────── */
function renderParadigmDemo() {
  if (currentViewMode === "volume") {
    return `
      <div class="demo-volume-layout">
        <div class="demo-volume-card">
          <div class="demo-card-head">
            <div>
              <div class="demo-card-title">Share of Voice (จำนวนการพูดถึง)</div>
              <div class="demo-card-sub">กราฟปริมาณแบบดั้งเดิม แสดงแค่ยอด Mentions โดยรวม</div>
            </div>
            <span class="badge badge-warn">Total Mentions: 148,500</span>
          </div>
          <div class="volume-bars-list">
            ${VOLUME_DATA.brands.map(b => `
              <div class="volume-bar-row">
                <div class="vol-label-wrap">
                  <span class="vol-name">${escapeHtml(b.name)}</span>
                  <span class="vol-count">${b.count.toLocaleString()} ครั้ง (${b.pct}%)</span>
                </div>
                <div class="vol-track">
                  <div class="vol-fill" style="width:${b.pct * 3}%;background:${b.color};"></div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="demo-limitation-callout">
          <div class="callout-badge-danger">❌ จุดบอดของกราฟปริมาณ (Volume Flaw)</div>
          <h4>รู้แค่ "ใครถูกพูดถึงเยอะกว่า" แต่ไม่รู้ "ทำไมถึงถูกเลือก"</h4>
          <p>
            กราฟแท่งบอกว่าแบรนด์คู่แข่งมียอด Mentions สูงกว่า 42,100 ครั้ง แต่ <strong>บอกไม่ได้เลย</strong> ว่าคนที่พูดถึงกำลังชมหรือบ่น,
            มีปัญหาเรื่องสิวผดหรือความมัน, หรือผู้บริโภคกำลังเอาแบรนด์เราไปเทียบกับใครในสถานการณ์ใด
            ทำให้ทีมการตลาดตัดสินใจเพิ่มงบโฆษณาแบบหว่านแหโดยไม่ตรงจุด!
          </p>
          <div class="callout-action-hint">
            💡 กดสลับไปที่ <strong>"วิเคราะห์ความเชื่อมโยง (AI Network Graph)"</strong> ด้านบน เพื่อดูว่าข้อมูลเดียวกันเมื่อเชื่อมโยงกันจะเห็นอะไร
          </div>
        </div>
      </div>
    `;
  }

  // Network Graph View
  return `
    <div class="demo-network-layout">
      <div class="demo-canvas-card">
        <div class="demo-card-head">
          <div>
            <div class="demo-card-title">AI Network Graph (Connected Marketing Dimensions)</div>
            <div class="demo-card-sub">แสดงความเชื่อมโยงระหว่าง แบรนด์ ↔ คุณสมบัติ ↔ Pain Point ↔ ช่องทางจำหน่าย</div>
          </div>
          <div class="demo-badges-group">
            <span class="badge" style="background:#19c3eb22;color:#19c3eb;border:1px solid #19c3eb44;">● แบรนด์</span>
            <span class="badge" style="background:#22c55e22;color:#22c55e;border:1px solid #22c55e44;">● ความต้องการลูกค้า</span>
            <span class="badge" style="background:#ef444422;color:#ef4444;border:1px solid #ef444444;">● Pain Points</span>
            <span class="badge" style="background:#ffc61a22;color:#ffc61a;border:1px solid #ffc61a44;">● อินฟลูเอนเซอร์</span>
          </div>
        </div>
        <div class="network-canvas-container">
          <canvas id="main-network-canvas" width="800" height="380"></canvas>
          <div class="canvas-interactive-hint">
            <span>🖱️ ลากโหนด (Drag Node) เพื่อปรับมุมมอง หรือชี้โหนดเพื่อดูมิติความเชื่อมโยง</span>
          </div>
        </div>
      </div>

      <div class="demo-insight-callout">
        <div class="callout-badge-success">✨ คุณค่าของ Connected Data (AInsight Paradigm)</div>
        <h4>เห็นโอกาสทางการตลาดที่ซ่อนอยู่ใต้ตัวเลข</h4>
        <div class="insight-pill-list">
          <div class="insight-pill-item">
            <span class="pill-dot bg-cyan"></span>
            <span><strong>จุดเชื่อมที่ชัดเจน:</strong> 78% ของผู้บริโภคที่บ่นเรื่อง <em>"สิวผด & แดดเมืองไทย"</em> จะนำ CONT ไปเทียบกับ Brand X โดยตรง</span>
          </div>
          <div class="insight-pill-item">
            <span class="pill-dot bg-green"></span>
            <span><strong>โอกาสสร้างจุดขาย:</strong> คนต้องการกันแดดที่ <em>"เซ็ตตัวเร็ว < 30 วินาที"</em> เพื่อแต่งหน้าต่อทันที ซึ่งคู่แข่งยังไม่มีใครเคลม</span>
          </div>
          <div class="insight-pill-item">
            <span class="pill-dot bg-yellow"></span>
            <span><strong>ความคุ้มค่าอินฟลูฯ:</strong> Micro-Doctor มีค่า Trust เชื่อมโยงกับยอดสั่งซื้อสูงกว่าดาราดัง 3.2 เท่า</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────────────────────────────────────
   SECTION A: 6 PILLARS DETAIL RENDERER
───────────────────────────────────────────────────────────────────────── */
function renderPillarDetail(key) {
  const data = PILLARS_DATA[key];
  if (!data) return "";

  if (key === "standard") {
    return `
      <div class="pillar-content-box">
        <div class="pillar-box-header">
          <h3>${escapeHtml(data.title)}</h3>
          <p>${escapeHtml(data.subtitle)}</p>
        </div>
        <div class="standard-matrix-grid">
          ${data.items.map(item => `
            <div class="standard-item-card ${item.status === 'Must-Have Baseline' ? 'is-baseline' : 'is-differentiator'}">
              <div class="std-head">
                <span class="std-name">${escapeHtml(item.label)}</span>
                <span class="std-badge ${item.status === 'Must-Have Baseline' ? 'badge-warn' : 'badge-ok'}">${item.status}</span>
              </div>
              <div class="std-progress-wrap">
                <div class="std-progress-bar" style="width:${item.expectedPct}%;"></div>
              </div>
              <div class="std-pct-row">
                <span>ความคาดหวังของผู้บริโภค:</span>
                <strong>${item.expectedPct}%</strong>
              </div>
              <p class="std-desc">${escapeHtml(item.desc)}</p>
            </div>
          `).join("")}
        </div>
        <div class="strategic-takeaway-bar">
          <strong>💡 กลยุทธ์ที่นำไปใช้:</strong> ครีมกันแดดทุกตัวต้องใส่ SPF50+ & PA++++ เป็นพื้นฐาน แต่ห้ามใช้เป็นคำพาดหัวโฆษณาหลักเด็ดขาด ให้ดึงคุณสมบัติกลุ่ม <em>Value Differentiator</em> เช่น ไม่ทำลายปะการัง หรือกันฝุ่น PM2.5 มาเป็นจุดขายแทน
        </div>
      </div>
    `;
  }

  if (key === "needs") {
    return `
      <div class="pillar-content-box">
        <div class="pillar-box-header">
          <h3>${escapeHtml(data.title)}</h3>
          <p>${escapeHtml(data.subtitle)}</p>
        </div>
        <div class="needs-cluster-grid">
          ${data.clusters.map(cluster => `
            <div class="needs-cluster-card">
              <div class="needs-core-tag">🔥 ความต้องการหลัก: ${escapeHtml(cluster.core)}</div>
              <div class="needs-connected-list">
                <span class="needs-conn-label">คุณสมบัติเชื่อมโยงที่ผู้บริโภคมองหา:</span>
                <div class="needs-pills">
                  ${cluster.connected.map(c => `<span class="chip chip-cyan">${escapeHtml(c)}</span>`).join("")}
                </div>
              </div>
              <div class="needs-insight-text">
                <strong>Insight ลึก:</strong> ${escapeHtml(cluster.insight)}
              </div>
              <div class="needs-creative-hook">
                <span class="hook-label">🎯 ข้อความพาดหัวโฆษณาแนะนำ (Ad Hook):</span>
                <div class="hook-quote">"${escapeHtml(cluster.creativeHook)}"</div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  if (key === "competitor") {
    return `
      <div class="pillar-content-box">
        <div class="pillar-box-header">
          <h3>${escapeHtml(data.title)}</h3>
          <p>${escapeHtml(data.subtitle)}</p>
        </div>
        <div class="competitor-compare-list">
          ${data.matrix.map(m => `
            <div class="competitor-compare-card">
              <div class="comp-head-row">
                <div class="comp-vs">
                  <span class="our-brand-badge">${escapeHtml(m.ourBrand)}</span>
                  <span class="vs-text">VS</span>
                  <span class="their-brand-badge">${escapeHtml(m.realCompetitor)}</span>
                </div>
                <span class="badge badge-info">ความถี่การถูกนำมาเปรียบเทียบ: ${m.overlapPct}%</span>
              </div>
              <div class="comp-context">
                <strong>บริบทที่ถูกพูดถึง:</strong> "${escapeHtml(m.context)}"
              </div>
              <div class="comp-diff-grid">
                <div class="diff-box advantage">
                  <span class="diff-title">✅ จุดที่เราได้เปรียบ:</span>
                  <p>${escapeHtml(m.ourAdvantage)}</p>
                </div>
                <div class="diff-box action">
                  <span class="diff-title">🎨 แผนการออกแบบคอนเทนต์ตั้งรับ:</span>
                  <p>${escapeHtml(m.actionPlan)}</p>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  if (key === "influencer") {
    return `
      <div class="pillar-content-box">
        <div class="pillar-box-header">
          <h3>${escapeHtml(data.title)}</h3>
          <p>${escapeHtml(data.subtitle)}</p>
        </div>
        <div class="influencer-roles-grid">
          ${data.roles.map(r => `
            <div class="influencer-card ${r.recommended ? 'is-recommended' : 'is-caution'}">
              <div class="inf-head">
                <span class="inf-role-name">${escapeHtml(r.roleName)}</span>
                ${r.recommended ? '<span class="badge badge-ok">✓ แนะนำสูง</span>' : '<span class="badge badge-neutral">ประเมินตามงบ</span>'}
              </div>
              <div class="inf-metrics-row">
                <div class="inf-metric">
                  <span class="lbl">ผู้ติดตาม:</span>
                  <span class="val">${r.followers}</span>
                </div>
                <div class="inf-metric">
                  <span class="lbl">Engagement:</span>
                  <span class="val text-cyan">${r.engagementRate}</span>
                </div>
                <div class="inf-metric">
                  <span class="lbl">Trust Score:</span>
                  <span class="val text-yellow">${r.trustScore} / 100</span>
                </div>
              </div>
              <div class="inf-desc">${escapeHtml(r.bestFor)}</div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  if (key === "protection") {
    return `
      <div class="pillar-content-box">
        <div class="pillar-box-header">
          <h3>${escapeHtml(data.title)}</h3>
          <p>${escapeHtml(data.subtitle)}</p>
        </div>
        <div class="protection-alerts-list">
          ${data.alerts.map(a => `
            <div class="protection-alert-card" style="border-left: 4px solid ${a.riskColor};">
              <div class="alert-head">
                <div class="alert-shop-meta">
                  <span class="shop-plat">${escapeHtml(a.platform)}</span>
                  <strong class="shop-name">${escapeHtml(a.shopName)}</strong>
                </div>
                <span class="badge" style="background:${a.riskColor}22;color:${a.riskColor};border:1px solid ${a.riskColor}66;">${a.riskLevel}</span>
              </div>
              <div class="alert-price-anomaly">
                ราคาที่ตรวจจับ: <strong>${escapeHtml(a.priceDetected)}</strong>
              </div>
              <p class="alert-issue">${escapeHtml(a.issue)}</p>
              <div class="alert-status-action">
                <span>🛡️ การดำเนินการของระบบ:</span>
                <span class="action-tag">${escapeHtml(a.status)}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  if (key === "posting") {
    return `
      <div class="pillar-content-box">
        <div class="pillar-box-header">
          <h3>${escapeHtml(data.title)}</h3>
          <p>${escapeHtml(data.subtitle)}</p>
        </div>
        <div class="posting-windows-grid">
          ${data.goldenWindows.map(w => `
            <div class="posting-window-card">
              <div class="win-time-badge">${escapeHtml(w.time)}</div>
              <div class="win-intent">
                <strong>พฤติกรรมผู้ชม:</strong> ${escapeHtml(w.intent)}
              </div>
              <div class="win-meta-row">
                <div class="win-meta">
                  <span class="lbl">การแข่งขันของคู่แข่ง:</span>
                  <span class="val">${escapeHtml(w.competition)}</span>
                </div>
                <div class="win-meta">
                  <span class="lbl">ประสิทธิภาพคาดการณ์:</span>
                  <span class="val text-green">${escapeHtml(w.efficiency)}</span>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  return "";
}

/* ─────────────────────────────────────────────────────────────────────────
   SECTION B: 3 DESIGN INTELLIGENCE MODULES RENDERER
───────────────────────────────────────────────────────────────────────── */
function renderDesignModule(moduleKey) {
  if (moduleKey === "visual-trend") {
    return `
      <div class="design-module-container">
        <div class="module-intro-banner">
          <h3>1. Visual Trend & Design Listening Platform</h3>
          <p>
            ใช้ <strong>AI Image Recognition</strong> ดักจับองค์ประกอบภาพของคู่แข่งในตลาด เชื่อมโยงความสัมพันธ์ของคู่สี สไตล์ฟอนต์ และการจัดวางภาพ เพื่อดูว่าสไตล์แบบใดดึงดูด Engagement ได้สูงสุด
          </p>
        </div>

        <div class="visual-trend-layout">
          <!-- Left: Design Element Network Table & Metrics -->
          <div class="design-elements-table-card">
            <div class="table-card-head">
              <span class="card-title">องค์ประกอบภาพยอดนิยม & Engagement Lift</span>
              <span class="badge badge-info">วิเคราะห์จาก 4,200 ชิ้นงาน</span>
            </div>
            <div class="element-network-list">
              ${DESIGN_LISTENING_DATA.elements.map(e => `
                <div class="element-network-item">
                  <div class="elem-meta">
                    <span class="elem-cat">${escapeHtml(e.category)}</span>
                    <strong class="elem-name">${escapeHtml(e.name)}</strong>
                  </div>
                  <div class="elem-stats">
                    <div class="elem-freq-bar-wrap">
                      <div class="elem-freq-bar" style="width:${e.freq}%;"></div>
                    </div>
                    <span class="elem-lift">${e.lift} Engagement</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- Right: Visual Relationship Graph Canvas -->
          <div class="design-graph-card">
            <div class="table-card-head">
              <span class="card-title">Design Element Network Graph (โครงข่ายองค์ประกอบ)</span>
              <span class="badge badge-ok">AI Real-time</span>
            </div>
            <div class="design-canvas-wrap">
              <canvas id="design-element-canvas" width="480" height="300"></canvas>
            </div>
            <div class="design-canvas-footer">
              <span>เชื่อมโยง: [คู่สีฟ้า-ดำ] ↔ [ฟอนต์ไม่มีหัวสไตล์โมเดิร์น] ↔ [ภาพซูมเนื้อครีม]</span>
            </div>
          </div>
        </div>

        <div class="strategic-takeaway-bar">
          <strong>🎨 ประโยชน์สำหรับดีไซเนอร์:</strong> ไม่ต้องเถียงกันด้วยความรู้สึก (Gut Feeling) อีกต่อไป ดีไซเนอร์สามารถบอกลูกค้าหรือผู้บริหารได้ว่า <em>"งานแคมเปญนี้เราเลือกใช้คู่สีฟ้าน้ำทะเลตัดดำและฟอนต์ไม่มีหัว เพราะสถิติย้อนหลัง 90 วัน ชี้ชัดว่าสร้าง Engagement สูงขึ้น +34.5% ในกลุ่มเป้าหมาย"</em>
        </div>
      </div>
    `;
  }

  if (moduleKey === "moodboard-graph") {
    return `
      <div class="design-module-container">
        <div class="module-intro-banner">
          <h3>2. Intelligent Moodboard & Visual Concept Explorer</h3>
          <p>
            เปลี่ยนวิธีการหา Reference ที่ต้องนั่งไถ Pinterest เป็นการค้นหาด้วย <strong>ความสัมพันธ์ของข้อมูล (Keyword-to-Visual Graph)</strong> และตรวจจับ White Space เพื่อไม่ให้แบรนด์เราดีไซน์ซ้ำกับคู่แข่ง
          </p>
        </div>

        <!-- Keyword Prompt Input Box -->
        <div class="concept-explorer-input-box">
          <label class="explorer-label">ลองคลิกเลือกโจทย์นามธรรม หรือพิมพ์คีย์เวิร์ดของแบรนด์:</label>
          <div class="concept-preset-chips">
            ${DESIGN_LISTENING_DATA.moodboardKeywords.map((k, i) => `
              <button type="button" class="chip-preset-keyword ${searchKeywordPrompt === k.query ? 'is-active' : ''}" data-query-index="${i}">
                ${escapeHtml(k.query)}
              </button>
            `).join("")}
          </div>
        </div>

        <!-- Dynamic Moodboard Generated View -->
        <div class="concept-result-grid" id="concept-result-grid">
          ${renderMoodboardResult(searchKeywordPrompt)}
        </div>
      </div>
    `;
  }

  if (moduleKey === "asset-tracker") {
    return `
      <div class="design-module-container">
        <div class="module-intro-banner">
          <h3>3. Creative Asset Impact Tracker</h3>
          <p>
            ย่อยชิ้นงานกราฟิกออกเป็น <strong>Micro-elements</strong> เพื่อดูว่าองค์ประกอบย่อยใดส่งผลต่อ CTR จริงๆ พร้อม <strong>Fatigue Heatmap</strong> แจ้งเตือนเมื่อภาพโฆษณาเริ่มถูกมองข้าม (Ad Fatigue)
          </p>
        </div>

        <div class="asset-tracker-layout">
          <!-- Left: Micro-Element Breakdown Simulator -->
          <div class="micro-element-card">
            <div class="table-card-head">
              <span class="card-title">การย่อยองค์ประกอบในภาพ (Micro-level Breakdown)</span>
              <span class="badge badge-info">A/B Testing Correlation</span>
            </div>
            
            <div class="micro-artwork-preview">
              <div class="artwork-bbox box-headline" title="Headline: 2 บรรทัด + ขนาดใหญ่ (+19% CTR)">
                <span>Headline (Font: Space Mono Bold)</span>
              </div>
              <div class="artwork-bbox box-packshot" title="Hero Packshot เดี่ยว มีแสงสะท้อน (+28% CTR)">
                <span>Packshot: 3D Studio Lighting</span>
              </div>
              <div class="artwork-bbox box-cta" title="ปุ่ม CTA สีเหลืองตัดชัด (+22% Conversion)">
                <span>CTA Pill Button</span>
              </div>
              <div class="artwork-bbox box-badge" title="Badge SPF50+ มุมขวาบน (+14% CTR)">
                <span>SPF50+ Badge</span>
              </div>
            </div>

            <div class="impact-breakdown-list">
              <div class="impact-item">
                <span class="impact-name">Hero Packshot เดี่ยว (แทนรูปนางแบบ)</span>
                <span class="impact-val text-green">+28% CTR</span>
              </div>
              <div class="impact-item">
                <span class="impact-name">ข้อความสั้นกระชับ $\le$ 2 บรรทัด</span>
                <span class="impact-val text-green">+19% CTR</span>
              </div>
              <div class="impact-item">
                <span class="impact-name">ปุ่ม CTA สีเหลืองตัดกับพื้นหลัง</span>
                <span class="impact-val text-green">+22% Conversion</span>
              </div>
            </div>
          </div>

          <!-- Right: Ad Fatigue & Wear-Out Heatmap -->
          <div class="ad-fatigue-card">
            <div class="table-card-head">
              <span class="card-title">Creative Fatigue Heatmap (ดักจับอาการตาบอดต่อโฆษณา)</span>
              <span class="badge badge-warn">Real-time Decay</span>
            </div>

            <div class="fatigue-list">
              ${DESIGN_LISTENING_DATA.fatigueData.map(f => `
                <div class="fatigue-item" style="border-left: 3px solid ${f.color};">
                  <div class="fatigue-head">
                    <strong class="fatigue-name">${escapeHtml(f.template)}</strong>
                    <span class="fatigue-badge" style="background:${f.color}22;color:${f.color};border:1px solid ${f.color}55;">
                      ${f.fatigueStatus}
                    </span>
                  </div>
                  <div class="fatigue-meta">
                    <span>ยิงโฆษณาไปแล้ว: <strong>${f.exposureDays} วัน</strong></span>
                    <span>Impressions สะสม: <strong>${f.impressions}</strong></span>
                  </div>
                  <div class="fatigue-action-box">
                    <span>คำแนะนำของ AI:</span>
                    <strong>${f.action}</strong>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <div class="strategic-takeaway-bar">
          <strong>📊 ประโยชน์ต่อธุรกิจ:</strong> รู้ทันทีว่าป้ายโฆษณาขายดีเพราะ <em>"รูปขวดสินค้าที่ดูพรีเมียม"</em> หรือเพราะ <em>"ตัวเลขโปรโมชัน"</em> และเมื่อถึงวันที่คนเริ่มเบื่อแอด ระบบจะส่งสัญญาณแจ้งเตือนให้ดีไซเนอร์รีเฟรชอาร์ตเวิร์กใหม่ทันทีก่อนที่ต้นทุนค่าแอดจะพุ่งสูง!
        </div>
      </div>
    `;
  }

  return "";
}

function renderMoodboardResult(query) {
  const match = DESIGN_LISTENING_DATA.moodboardKeywords.find(k => k.query === query) || DESIGN_LISTENING_DATA.moodboardKeywords[0];

  return `
    <div class="concept-card concept-palette-card">
      <div class="concept-card-title">🎨 แนะนำ Color Palette ตามความรู้สึก</div>
      <div class="concept-swatches-grid">
        ${match.palette.map(hex => `
          <div class="concept-swatch-box" style="background:${hex};" data-hex="${hex}" title="คลิกเพื่อคัดลอก ${hex}">
            <span class="swatch-hex-lbl">${hex}</span>
          </div>
        `).join("")}
      </div>
      <div class="concept-card-sub">คลิกที่ช่องสีเพื่อคัดลอกรหัส Hex</div>
    </div>

    <div class="concept-card concept-typography-card">
      <div class="concept-card-title">🔤 สไตล์ตัวอักษรที่ตรงโจทย์</div>
      <div class="concept-font-preview">
        <h3>${escapeHtml(match.font)}</h3>
        <p>ให้ความรู้สึกพรีเมียม หนักแน่น และเข้าถึงง่ายในเวลาเดียวกัน</p>
      </div>
    </div>

    <div class="concept-card concept-whitespace-card">
      <div class="concept-card-title">🗺️ แผนที่ White Space (หลีกเลี่ยงคู่แข่ง)</div>
      <div class="whitespace-radar-box">
        <div class="competitor-dot dot-a" title="Brand A จองสีส้ม-ขาว">Brand A (ส้ม)</div>
        <div class="competitor-dot dot-b" title="Brand B จองสีฟ้า-ขาว">Brand B (ฟ้า)</div>
        <div class="whitespace-sweetspot" title="White Space ของเรา: Cyber Cyan + Deep Obsidian">
          ★ แนะนำ White Space ของเรา
        </div>
      </div>
      <div class="concept-card-sub">หลีกเลี่ยงโทนสีที่คู่แข่งครอบครอง เพื่อสร้างเอกลักษณ์เฉพาะตัว</div>
    </div>

    <div class="concept-card concept-export-card">
      <div class="concept-card-title">🚀 นำคอนเซปต์ไปใช้งาน</div>
      <p style="font-size:0.82rem;color:#8c92ad;margin-bottom:14px;line-height:1.5;">
        ส่งข้อมูล Color Palette, Typography และ Layout ทั้งหมดนี้เป็น Task บรีฟงานให้นักออกแบบในทีม CONT ได้ทันที
      </p>
      <button type="button" class="btn-pixel btn-pixel-cyan" id="btn-export-concept-task" style="width:100%;justify-content:center;">
        ${pixelIcons.plus}
        <span>ส่งข้อมูลเป็น Task บรีฟงานดีไซน์</span>
      </button>
    </div>
  `;
}

/* ─────────────────────────────────────────────────────────────────────────
   EVENT BINDINGS
───────────────────────────────────────────────────────────────────────── */
function bindEvents() {
  // Paradigm switcher
  qs("#btn-toggle-volume")?.addEventListener("click", () => {
    currentViewMode = "volume";
    updateParadigmView();
  });

  qs("#btn-toggle-network")?.addEventListener("click", () => {
    currentViewMode = "network";
    updateParadigmView();
  });

  // Pillars tabs
  qsa(".btn-pillar-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      activePillarKey = btn.dataset.pillar;
      qsa(".btn-pillar-tab").forEach(b => b.classList.toggle("is-active", b.dataset.pillar === activePillarKey));
      const detailCard = qs("#pillar-detail-card");
      if (detailCard) detailCard.innerHTML = renderPillarDetail(activePillarKey);
    });
  });

  // Design modules tabs
  qsa(".btn-design-tab").forEach(btn => {
    btn.addEventListener("click", () => {
      activeDesignModule = btn.dataset.module;
      qsa(".btn-design-tab").forEach(b => b.classList.toggle("is-active", b.dataset.module === activeDesignModule));
      const viewport = qs("#design-module-viewport");
      if (viewport) {
        viewport.innerHTML = renderDesignModule(activeDesignModule);
        bindDesignModuleEvents();
        if (activeDesignModule === "visual-trend") {
          initDesignCanvas();
        }
      }
    });
  });

  bindDesignModuleEvents();
}

function bindDesignModuleEvents() {
  // Preset keyword chips
  qsa(".chip-preset-keyword").forEach(chip => {
    chip.addEventListener("click", () => {
      const idx = parseInt(chip.dataset.queryIndex, 10);
      const found = DESIGN_LISTENING_DATA.moodboardKeywords[idx];
      if (found) {
        searchKeywordPrompt = found.query;
        qsa(".chip-preset-keyword").forEach(c => c.classList.toggle("is-active", c.dataset.queryIndex === String(idx)));
        const grid = qs("#concept-result-grid");
        if (grid) {
          grid.innerHTML = renderMoodboardResult(searchKeywordPrompt);
          bindSwatchCopy();
          bindExportTask();
        }
      }
    });
  });

  bindSwatchCopy();
  bindExportTask();
}

function bindSwatchCopy() {
  qsa(".concept-swatch-box").forEach(box => {
    box.addEventListener("click", () => {
      const hex = box.dataset.hex;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(hex);
        toast(`คัดลอกรหัสสี ${hex} เรียบร้อยแล้ว`, "success");
      }
    });
  });
}

function bindExportTask() {
  qs("#btn-export-concept-task")?.addEventListener("click", () => {
    const match = DESIGN_LISTENING_DATA.moodboardKeywords.find(k => k.query === searchKeywordPrompt) || DESIGN_LISTENING_DATA.moodboardKeywords[0];
    if (typeof window.openCreateTask === "function") {
      window.openCreateTask({
        title: `งานออกแบบแคมเปญ: ${match.query}`,
        description: `บรีฟอาร์ตเวิร์กอ้างอิง Insight จากระบบ Social & Visual Listening:\nโจทย์: ${match.query}\nColor Palette: ${match.palette.join(", ")}\nTypography: ${match.font}\nComposition: ${match.composition}\n\nวัตถุประสงค์: ขยายสัดส่วน White Space ทางการตลาดเพื่อความแตกต่างจากคู่แข่ง`,
        channel: "Social Media / Digital Ads"
      });
    } else {
      toast("กรุณาเปิดเมนูสร้าง Task ในระบบ CONT", "info");
    }
  });
}

function updateParadigmView() {
  qs("#btn-toggle-volume")?.classList.toggle("is-active", currentViewMode === "volume");
  qs("#btn-toggle-network")?.classList.toggle("is-active", currentViewMode === "network");
  const viewport = qs("#paradigm-demo-viewport");
  if (viewport) {
    viewport.innerHTML = renderParadigmDemo();
    if (currentViewMode === "network") {
      initNetworkCanvas();
    }
  }
}

/* ─────────────────────────────────────────────────────────────────────────
   CANVAS NETWORK GRAPH ENGINE (INTERACTIVE PHYSICS SIMULATION)
───────────────────────────────────────────────────────────────────────── */
function initNetworkCanvas() {
  const canvas = qs("#main-network-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Nodes definition
  const nodes = [
    { id: "brand_cont", label: "CONT Sun Hydro", type: "brand", x: width * 0.45, y: height * 0.5, r: 24, color: "#19c3eb", vx: 0, vy: 0 },
    { id: "brand_x", label: "Brand X (คู่แข่งจริง)", type: "competitor", x: width * 0.65, y: height * 0.35, r: 18, color: "#ff5252", vx: 0, vy: 0 },
    { id: "brand_y", label: "Brand Y (โทนอัพ)", type: "competitor", x: width * 0.72, y: height * 0.68, r: 16, color: "#ff5252", vx: 0, vy: 0 },
    { id: "need_oil", label: "คุมมัน 12h", type: "attribute", x: width * 0.3, y: height * 0.3, r: 16, color: "#22c55e", vx: 0, vy: 0 },
    { id: "need_acne", label: "สิวผด & แดดร้อน", type: "painpoint", x: width * 0.48, y: height * 0.18, r: 16, color: "#ef4444", vx: 0, vy: 0 },
    { id: "need_fast", label: "เซ็ตตัว <30s", type: "attribute", x: width * 0.22, y: height * 0.55, r: 15, color: "#22c55e", vx: 0, vy: 0 },
    { id: "need_makeup", label: "รองพื้นไม่เป็นคราบ", type: "attribute", x: width * 0.32, y: height * 0.75, r: 15, color: "#22c55e", vx: 0, vy: 0 },
    { id: "inf_doc", label: "Dr. Skin (Micro-Trust)", type: "influencer", x: width * 0.52, y: height * 0.82, r: 16, color: "#ffc61a", vx: 0, vy: 0 },
    { id: "plat_tiktok", label: "TikTok Shop", type: "channel", x: width * 0.82, y: height * 0.45, r: 15, color: "#a855f7", vx: 0, vy: 0 }
  ];

  // Links definition
  const links = [
    { source: "brand_cont", target: "need_oil", strength: 3, label: "จุดแข็งหลัก" },
    { source: "brand_cont", target: "need_acne", strength: 2.5, label: "คนเป็นสิวเลือก" },
    { source: "brand_cont", target: "brand_x", strength: 3.5, label: "ถูกเทียบกัน 78%" },
    { source: "brand_x", target: "need_acne", strength: 2 },
    { source: "brand_cont", target: "need_fast", strength: 2.2, label: "Unmet Need" },
    { source: "need_fast", target: "need_makeup", strength: 2 },
    { source: "brand_cont", target: "need_makeup", strength: 1.8 },
    { source: "brand_cont", target: "inf_doc", strength: 2.8, label: "Trust Score 96" },
    { source: "brand_cont", target: "brand_y", strength: 1.5 },
    { source: "brand_y", target: "plat_tiktok", strength: 2.5, label: "ยอดขายหลัก" },
    { source: "brand_cont", target: "plat_tiktok", strength: 2.8 }
  ];

  let draggedNode = null;
  let hoveredNode = null;

  function getNode(id) {
    return nodes.find(n => n.id === id);
  }

  // Animation Loop
  let animFrameId;
  function draw() {
    ctx.clearRect(0, 0, width, height);

    // Draw background subtle grid
    ctx.strokeStyle = "rgba(42, 46, 68, 0.4)";
    ctx.lineWidth = 1;
    const step = 30;
    for (let x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Links
    links.forEach(link => {
      const s = getNode(link.source);
      const t = getNode(link.target);
      if (!s || !t) return;

      const isHighlighted = hoveredNode && (hoveredNode.id === s.id || hoveredNode.id === t.id);

      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.strokeStyle = isHighlighted ? "#19c3eb" : "rgba(100, 116, 139, 0.35)";
      ctx.lineWidth = isHighlighted ? 3 : Math.max(1, link.strength);
      ctx.stroke();

      // Pulsing energy dot along line
      if (isHighlighted || link.strength > 2.5) {
        const time = Date.now() * 0.0015;
        const progress = (time % 1);
        const px = s.x + (t.x - s.x) * progress;
        const py = s.y + (t.y - s.y) * progress;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = "#19c3eb";
        ctx.fill();
      }
    });

    // Draw Nodes
    nodes.forEach(node => {
      const isHovered = hoveredNode && hoveredNode.id === node.id;

      // Glow halo
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r + (isHovered ? 8 : 4), 0, Math.PI * 2);
      ctx.fillStyle = `${node.color}22`;
      ctx.fill();

      // Core circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();
      ctx.strokeStyle = isHovered ? "#ffffff" : "#0f172a";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Node Label
      ctx.fillStyle = isHovered ? "#ffffff" : "#cbd5e1";
      ctx.font = `${isHovered ? 'bold 11px' : '10px'} "IBM Plex Sans Thai", sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(node.label, node.x, node.y + node.r + 14);
    });

    animFrameId = requestAnimationFrame(draw);
  }

  draw();

  // Mouse interactivity
  canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (width / rect.width);
    const my = (e.clientY - rect.top) * (height / rect.height);

    if (draggedNode) {
      draggedNode.x = mx;
      draggedNode.y = my;
      return;
    }

    hoveredNode = nodes.find(n => {
      const dx = n.x - mx;
      const dy = n.y - my;
      return Math.sqrt(dx * dx + dy * dy) <= n.r + 5;
    }) || null;

    canvas.style.cursor = hoveredNode ? "pointer" : "default";
  });

  canvas.addEventListener("mousedown", () => {
    if (hoveredNode) {
      draggedNode = hoveredNode;
    }
  });

  window.addEventListener("mouseup", () => {
    draggedNode = null;
  });
}

function initDesignCanvas() {
  const canvas = qs("#design-element-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;

  const dNodes = [
    { label: "Cyber Cyan (#19C3EB)", color: "#19c3eb", x: w * 0.25, y: h * 0.35, r: 16 },
    { label: "Deep Obsidian (#0F172A)", color: "#94a3b8", x: w * 0.35, y: h * 0.72, r: 14 },
    { label: "ฟอนต์ไม่มีหัว (Loopless)", color: "#ffc61a", x: w * 0.65, y: h * 0.3, r: 15 },
    { label: "Split Screen Packshot", color: "#a855f7", x: w * 0.75, y: h * 0.68, r: 15 },
    { label: "Macro Droplet (หยดน้ำ)", color: "#22c55e", x: w * 0.5, y: h * 0.5, r: 18 }
  ];

  const dLinks = [
    { s: 0, t: 1 },
    { s: 0, t: 4 },
    { s: 1, t: 3 },
    { s: 4, t: 2 },
    { s: 2, t: 3 },
    { s: 0, t: 2 }
  ];

  ctx.clearRect(0, 0, w, h);

  // Links
  ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
  ctx.lineWidth = 1.5;
  dLinks.forEach(l => {
    ctx.beginPath();
    ctx.moveTo(dNodes[l.s].x, dNodes[l.s].y);
    ctx.lineTo(dNodes[l.t].x, dNodes[l.t].y);
    ctx.stroke();
  });

  // Nodes
  dNodes.forEach(n => {
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r + 3, 0, Math.PI * 2);
    ctx.fillStyle = `${n.color}33`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
    ctx.fillStyle = n.color;
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = '10px "IBM Plex Sans Thai", sans-serif';
    ctx.textAlign = "center";
    ctx.fillText(n.label, n.x, n.y + n.r + 13);
  });
}
