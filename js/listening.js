import { qs, qsa, toast, openModal } from "./app.js";
import { escapeHtml } from "./formatters.js";
import { pixelIcons } from "./pixel-icons.js";

/* ─────────────────────────────────────────────────────────────────────────
   DATA: KKP GRAPHIC DESIGN & FINANCIAL MARKETING INTELLIGENCE
   Social Listening 2.0 & AInsight Connected Network Graph Engine
───────────────────────────────────────────────────────────────────────── */

// 1. Comparison Mode Mock Data (Volume-Only vs AI Connected Network Graph)
const VOLUME_DATA = {
  totalMentions: 182400,
  brands: [
    { name: "KKP Auto & รถเรียกเงิน (RRN)", count: 46200, pct: 25.3, color: "#5B2D90" },
    { name: "KKP Dime! (Digital Savings & Stocks)", count: 44800, pct: 24.6, color: "#19C3EB" },
    { name: "คู่แข่งสินเชื่อรถยนต์ A (Non-Bank)", count: 52100, pct: 28.6, color: "#FFC61A" },
    { name: "คู่แข่งแอปการเงินดิจิทัล B", count: 39300, pct: 21.5, color: "#22C55E" }
  ],
  sentiment: { positive: 68, neutral: 22, negative: 10 }
};

// 2. The 6 Strategic Marketing Pillars Data (KKP Financial Group Case Study)
const PILLARS_DATA = {
  standard: {
    title: "1. Market Standard (เข้าใจมาตรฐานก่อนลงแข่ง)",
    subtitle: "ประเมิน 'เกณฑ์ขั้นต่ำ' ที่ผู้บริโภคและธนาคารแห่งประเทศไทย (ธปท.) กำหนด เพื่อไม่ให้เสียเวลาเคลมสิ่งพื้นฐานเป็นจุดขายหลัก",
    items: [
      { label: "คำเตือน ธปท. 'กู้เท่าที่จำเป็นและชำระคืนไหว'", expectedPct: 100, status: "Must-Have Compliance", desc: "ข้อกำหนดกฎหมาย ธปท. 100% ต้องแสดงในทุกชิ้นงานโฆษณาสินเชื่ออย่างชัดเจนและอ่านออก" },
      { label: "แสดงอัตราดอกเบี้ยจริง (Effective Rate / APR)", expectedPct: 98, status: "Must-Have Baseline", desc: "ผู้บริโภค 98% คาดหวังให้ระบุดอกเบี้ยต่อปีและตัวอย่างตารางผ่อนชำระอย่างโปร่งใส" },
      { label: "ตรารับรองสถาบันการเงิน & ความปลอดภัยข้อมูล", expectedPct: 95, status: "Must-Have Baseline", desc: "ความน่าเชื่อถือของใบอนุญาตธนาคารพาณิชย์เป็นเกณฑ์พื้นฐานที่ลูกค้าตรวจสอบก่อนกรอกข้อมูล" },
      { label: "ดอกเบี้ยคงที่พิเศษเริ่มต้น 0.59% (สถาบันการเงินพาณิชย์)", expectedPct: 62, status: "Value Differentiator", desc: "จุดขายชูโรงของ KKP รถเรียกเงิน ที่ดอกเบี้ยต่ำกว่า Non-bank ในตลาดอย่างมีนัยสำคัญ" },
      { label: "ไม่ต้องโอนเล่มทะเบียน & ไม่เช็กคนค้ำประกัน", expectedPct: 74, status: "Value Differentiator", desc: "จุดขายคลายความกังวลสูงสุดของลูกค้าที่ต้องการเงินหมุนไปต่อยอดธุรกิจ" }
    ]
  },
  needs: {
    title: "2. Consumer Needs (ฟังเสียงลูกค้าเพื่อหาจุดขายเชื่อมโยง)",
    subtitle: "วิเคราะห์ความต้องการที่เชื่อมโยงกันของลูกค้ากลุ่มสินเชื่อและแอปการเงิน KKP เพื่อบรีฟงานออกแบบที่ตอบโจทย์ Pain Point จริง",
    clusters: [
      {
        core: "หมุนเงินด่วน & รีไฟแนนซ์รถ (KKP รถเรียกเงิน RRN)",
        connected: ["ผ่อนอยู่ก็กู้ได้", "ไม่ต้องจอดรถทิ้งไว้", "ไม่เช็กคนค้ำ", "วงเงินเต็ม 100%", "ดอกเบี้ยเริ่มต้น 0.59%"],
        insight: "ลูกค้าไม่ได้แค่อยากได้เงินกู้ แต่ต้องการความอุ่นใจว่า 'ยังมีรถขับไปทำมาหากิน' และไม่อยากให้คนรอบตัวรู้ว่าต้องมีคนมาเซ็นค้ำประกัน",
        creativeHook: "รถยังมีขับ ธุรกิจไปต่อได้ ไม่ต้องโอนเล่ม ไม่เช็กคนค้ำ รับเงินก้อนเข้าบัญชีในวันเดียว"
      },
      {
        core: "คนรุ่นใหม่ & ออมเงิน-ลงทุนระดับโลก (KKP Dime!)",
        connected: ["ดอกเบี้ยเงินฝากสูงสุด 3% ต่อปี", "ซื้อหุ้นสหรัฐฯ เริ่ม 50 บาท", "ไม่มีค่าคอมฯ ขั้นต่ำ", "UX เล่นง่ายสไตล์เกม"],
        insight: "Gen Z และ First Jobber รู้สึกว่าการเปิดพอร์ตหุ้นกับธนาคารแบบเดิมยุ่งยากและเงินไม่พอ อยากได้แอปที่เริ่มด้วยเงินหลักสิบและฝากเงินได้ผลตอบแทนสูง",
        creativeHook: "สตาร์ทพอร์ตระดับโลกด้วยเงิน 50 บาท ช้อปหุ้น Apple, Tesla พร้อมรับดอกเบี้ยเงินฝากสูงถึง 3% ต่อปี"
      },
      {
        core: "รวมหนี้ก้อนเดียว ดอกเบี้ยเบาลง (KKP Personal Loan)",
        connected: ["รวมหนี้บัตรเครดิตหลายใบ", "ผ่อนทางเดียว", "ลดค่างวดต่อเดือน 50%", "ดอกเบี้ยลดต้นลดดอก"],
        insight: "พนักงานประจำจ่ายขั้นต่ำหลายใบจนเงินเดือนไม่พอใช้ ต้องการรวมหนี้เป็นก้อนเดียวเพื่อลดภาระค่างวดต่อเดือนให้มีเงินเหลือเก็บ",
        creativeHook: "จบปัญหาจ่ายหนี้หลายทาง รวมหนี้เป็นก้อนเดียวกับ KKP ปรับค่างวดเบาลงครึ่งหนึ่ง สบายใจผ่อนทางเดียว"
      }
    ]
  },
  competitor: {
    title: "3. Real Competitor (หาคู่แข่งตัวจริงจากสายตาผู้บริโภค)",
    subtitle: "ผู้บริโภคไม่ได้เทียบ KKP กับธนาคารใหญ่เสมอไป แต่เทียบกับ Non-Bank และ FinTech App ในบริบทการใช้งานจริง",
    matrix: [
      {
        ourBrand: "KKP รถเรียกเงิน (RRN)",
        realCompetitor: "เงินติดล้อ / สมหวัง เงินสั่งได้ (Non-Bank)",
        context: "กระทู้และคอมเมนต์: 'มีรถผ่อนอยู่ จำนำทะเบียนที่ไหนไม่เอาเปรียบ ดอกเบี้ยถูกสุดและอนุมัติไว?'",
        overlapPct: 82,
        ourAdvantage: "อัตราดอกเบี้ยระบบธนาคารพาณิชย์ (APR เริ่ม 0.59% ต่อเดือน) ต่ำกว่า Non-bank ชัดเจน วงเงินประเมินให้สูงกว่า",
        actionPlan: "ดีไซน์ตารางเปรียบเทียบ (Comparison Chart) ชี้ให้เห็นส่วนต่างดอกเบี้ยที่ประหยัดได้หลายหมื่นบาทต่อสัญญา"
      },
      {
        ourBrand: "KKP Dime! App",
        realCompetitor: "Make by KBank / InnovestX",
        context: "โพสต์ X & Lemon8: 'แอปเก็บเงินดอกเบี้ยสูง 2026 Dime vs Make ตัวไหนคุ้มกว่ากัน?'",
        overlapPct: 74,
        ourAdvantage: "Dime! รวมทั้งบัญชีเงินฝากดอกเบี้ยสูง 3% และการซื้อเศษหุ้นอเมริกา (Fractional Shares) เริ่ม 50 บ. ในแอปเดียว",
        actionPlan: "ทำ Motion Card และ Infographic สไตล์ Dark Neo-FinTech โชว์ฟังก์ชัน Multi-Asset หนึ่งเดียวจบ"
      },
      {
        ourBrand: "KKP Phatra Wealth Management",
        realCompetitor: "SCB Julius Baer / Citi Private Bank",
        context: "การจัดสรรพอร์ตความมั่งคั่ง High-Net-Worth ในสภาวะตลาดโลกผันผวน",
        overlapPct: 61,
        ourAdvantage: "ทีมวิจัยเศรษฐกิจและการลงทุน KKP Research ชั้นนำระดับประเทศ พร้อมรางวัล Best Private Bank ในไทย",
        actionPlan: "สร้างสรรค์ Key Visual อัตลักษณ์หรูหรา สง่างาม สไตล์ Minimal Gold Foil ถ่ายทอดความเชี่ยวชาญระดับสากล"
      }
    ]
  },
  influencer: {
    title: "4. Influencer Role (เลือกอินฟลูเอนเซอร์การเงินจากความน่าเชื่อถือ)",
    subtitle: "ผลิตภัณฑ์การเงินต้องอาศัย 'ความไว้วางใจ' สูงสุด เลิกดูแค่ยอดวิว เปลี่ยนมาคัดเลือกจาก Trust Score และใบอนุญาตผู้ให้คำแนะนำ",
    roles: [
      {
        roleName: "The Certified Financial Planner (CFP / เพจภาษีและการเงิน เช่น TaxBugnoms)",
        followers: "40k - 180k (Micro/Mid Financial)",
        engagementRate: "8.4%",
        trustScore: 98,
        bestFor: "อธิบายวิธีคำนวณดอกเบี้ย วางแผนภาษี และสอนจัดพอร์ต KKP Dime! ลูกค้าเชื่อถือสูง นำไปสู่ยอดเปิดบัญชีจริง",
        recommended: true
      },
      {
        roleName: "The Automotive & Garage Creator (เพจคนรักรถ / ซ่อมบำรุง / วงการเต็นท์รถ)",
        followers: "90k - 320k (Mid-Tier Community)",
        engagementRate: "6.1%",
        trustScore: 91,
        bestFor: "รีวิวขั้นตอนขอสินเชื่อ KKP รถเรียกเงิน ตอนเตรียมเงินหมุนขยายอู่หรือรีไฟแนนซ์ เข้าถึงกลุ่มคนมีรถจริง",
        recommended: true
      },
      {
        roleName: "The Mega Celebrity / Superstar (ดาราแถวหน้า)",
        followers: "2.5M+",
        engagementRate: "1.0%",
        trustScore: 54,
        bestFor: "สร้างการรับรู้ในวงกว้าง (Mass Awareness) แต่คอนเวอร์ชันสินเชื่อต่ำเพราะผู้บริโภครู้สึกว่าดาราไม่ได้กู้เงินจริง",
        recommended: false
      }
    ]
  },
  protection: {
    title: "5. Brand Protection (ปกป้องแบรนด์ KKP จากเพจสินเชื่อปลอม & มิจฉาชีพ)",
    subtitle: "เฝ้าระวังเพจเงินกู้ปลอม บัญชี LINE แอบอ้าง และเว็บไซต์ Phishing ที่ใช้ชื่อหรือโลโก้ KKP หลอกลวงประชาชน",
    alerts: [
      {
        id: "alert-kkp-01",
        platform: "Facebook Sponsored Ads",
        shopName: "สินเชื่อ เกียรตินาคินภัทร KKP รถเรียกเงิน ออนไลน์ 24 ชม. (เพจปลอม)",
        priceDetected: "หลอกโอนเงินมัดจำสัญญา 2,000 ฿",
        riskLevel: "CRITICAL SCAM",
        riskColor: "#ef4444",
        issue: "นำโลโก้ KKP ไปดัดแปลง ยิงแอดหลอกว่าอนุมัติใน 5 นาที แล้วส่งลิงก์แอด LINE ให้เหยื่อโอนค่าปลดล็อกสัญญา",
        status: "ยิง API แจ้ง Meta Cyber Crime ทันที + ออก Warning Artwork เพจจริงมีติ๊กฟ้า"
      },
      {
        id: "alert-kkp-02",
        platform: "TikTok & LINE Official",
        shopName: "@dime_invest_vip_th",
        priceDetected: "การันตีกำไรวันละ 15%",
        riskLevel: "HIGH FRAUD RISK",
        riskColor: "#f59e0b",
        issue: "แอบอ้างภาพหน้าจอแอป KKP Dime! ไปชวนลงทุนคริปโตและเทรดหุ้นนอกแบบหลอกลวง",
        status: "ส่งทีม Compliance ประสานงานปิดบัญชี LINE และนำคลิป TikTok ออก"
      },
      {
        id: "alert-kkp-03",
        platform: "Phishing Website",
        shopName: "kkp-loan-apply-urgent.online",
        priceDetected: "ดักจับเลขบัตร ปชช. / OTP",
        riskLevel: "CRITICAL SECURITY",
        riskColor: "#ef4444",
        issue: "เว็บไซต์ปลอมลอกเลียนแบบหน้าเว็บ KKP Auto เพื่อดักขโมยข้อมูลส่วนบุคคลของลูกค้า",
        status: "ประสานงาน CERT และผู้ให้บริการโดเมนบล็อกการเข้าถึงทันที"
      }
    ]
  },
  posting: {
    title: "6. Posting Window (หาช่องว่างเวลาโพสต์ด้วย Financial Intent Heatmap)",
    subtitle: "วิเคราะห์พฤติกรรมการตัดสินใจทางการเงินของคนไทย เพื่อยิงแอดในช่วงที่ผู้ชมพร้อมกรอกฟอร์มหรือเปิดแอปที่สุด",
    goldenWindows: [
      { time: "วันที่ 25 - 5 ของทุกเดือน เวลา 11:30 - 13:30 น.", intent: "ช่วงเงินเดือนออก ตรวจสลิปภาระหนี้ คิดเรื่องรีไฟแนนซ์หรือแบ่งเงินออม", competition: "สูงมาก (Prime Financial Time)", efficiency: "+62% Lead Application Rate" },
      { time: "วันอาทิตย์ เวลา 20:00 - 22:30 น. (Sunday Planning)", intent: "วางแผนการเงินประจำสัปดาห์ในบ้าน มีเวลาศึกษาแอป Dime! และตัดสินใจเปิดพอร์ต", competition: "ต่ำ - ปานกลาง", efficiency: "+78% App Install & Account Open" },
      { time: "วันธรรมดา เวลา 06:45 - 08:15 น. (Morning Commute)", intent: "ช่วงรถติดบนท้องถนน คนขับรถเห็นบิลบอร์ด KKP รถเรียกเงิน สอดคล้องกับแอดบนฟีดมือถือ", competition: "ต่ำ", efficiency: "+41% CTR & Brand Recall" }
    ]
  }
};

// 3. Visual Trend & Design Listening Platforms Mock Data for KKP Graphic Design
const DESIGN_LISTENING_DATA = {
  elements: [
    { id: "e1", category: "Color Identity", name: "KKP Corporate Purple (#5B2D90) & Cyber Gold (#E59324)", freq: 92, lift: "+41.5%" },
    { id: "e2", category: "Typography", name: "Modern Loopless Thai (IBM Plex Sans Thai) & Space Mono Rates", freq: 96, lift: "+38.2%" },
    { id: "e3", category: "Imagery Cue", name: "Real Vehicle Photography (ภาพรถจริงบนถนน แสงธรรมชาติ แทน 3D Render)", freq: 88, lift: "+48.0%" },
    { id: "e4", category: "Badge System", name: "Transparent Effective APR Pill Badge (ดอกเบี้ยโปร่งใส เริ่ม 0.59%)", freq: 94, lift: "+36.5%" },
    { id: "e5", category: "Layout & Legal", name: "Clean FinTech Bento Box with BOT Compliance Footer", freq: 100, lift: "+25.4%" }
  ],
  moodboardKeywords: [
    {
      query: "KKP รถเรียกเงิน (RRN) — มั่นคง เข้าถึงง่าย อนุมัติไว ได้เงินจริง",
      product: "KKP Auto / รถเรียกเงิน",
      palette: ["#5B2D90", "#E59324", "#1E293B", "#FFFFFF"],
      font: "IBM Plex Sans Thai Bold + Space Mono Numerals",
      composition: "Real Pickup/SUV Hero Shot + Golden Amber APR Badge (0.59%) + Fast Online Form Mockup"
    },
    {
      query: "KKP Dime! — วัยรุ่น Gen Z ดอกเบี้ยสูง 3% ลงทุนหุ้นสหรัฐฯ เริ่ม 50 บ.",
      product: "KKP Dime! FinTech App",
      palette: ["#19C3EB", "#5B2D90", "#2BD14B", "#0D0E12"],
      font: "Clean Neo-Grotesk Thai + High-Tech Sans",
      composition: "Dark Mode FinTech UI + 3D Floating Global Stock Icons (Apple, Tesla) + Holographic Dime Card"
    },
    {
      query: "KKP Phatra Wealth — บริหารความมั่งคั่งระดับสูง พรีเมียม สง่างาม เหนือกาลเวลา",
      product: "Phatra Private Wealth Management",
      palette: ["#2D1445", "#D4AF37", "#334155", "#F8FAFC"],
      font: "Refined Editorial Serif + Prestigious Sans Thai",
      composition: "Architectural Minimalist Framing + Subtle Foil Gold Accents + Global Investment Trend Lines"
    }
  ],
  fatigueData: [
    {
      template: "Template A: KKP รถเรียกเงิน (ป้ายแบนเนอร์รูปรถกระบะ + ป้ายแดงดอกเบี้ยด่วน)",
      product: "KKP Auto RRN",
      exposureDays: 24,
      impressions: "2.1M",
      fatigueStatus: "SEVERE FATIGUE (-54% CTR)",
      color: "#ef4444",
      action: "รีเฟรชอาร์ตเวิร์กด่วน! แนะนำเปลี่ยนเป็นรูปรถ SUV ครอบครัว และปรับคู่สีตาม KKP Purple-Gold Guideline"
    },
    {
      template: "Template B: KKP Dime! (Dark Mode FinTech + 3D US Stocks Apple/Tesla)",
      product: "KKP Dime!",
      exposureDays: 10,
      impressions: "820K",
      fatigueStatus: "HEALTHY (+22% CTR)",
      color: "#22c55e",
      action: "ประสิทธิภาพสูงมาก อัตราการเปิดบัญชีเพิ่มขึ้น แนะนำขยายงบและสเกลแคมเปญต่อได้"
    },
    {
      template: "Template C: KKP Personal Loan (รวมหนี้บัตรเครดิต ลดค่างวด 50%)",
      product: "KKP Loan Sure",
      exposureDays: 18,
      impressions: "1.3M",
      fatigueStatus: "MODERATE FATIGUE (-21% CTR)",
      color: "#f59e0b",
      action: "เริ่มเกิดอาการมองข้าม แนะนำทำ A/B Testing สลับ Headline และเปลี่ยนชาร์จคำนวณค่างวดรายเดือนใหม่"
    }
  ]
};

/* ─────────────────────────────────────────────────────────────────────────
   STATE MANAGEMENT
───────────────────────────────────────────────────────────────────────── */
let currentViewMode = "network"; // "volume" or "network"
let activePillarKey = "standard";
let activeDesignModule = "visual-trend";
let searchKeywordPrompt = "KKP รถเรียกเงิน (RRN) — มั่นคง เข้าถึงง่าย อนุมัติไว ได้เงินจริง";

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
          <span>KKP GRAPHIC DESIGN & FINANCIAL MARKETING INTELLIGENCE</span>
          <span class="badge-tag">AINSIGHT CONNECTED ENGINE</span>
        </div>
        <h1 class="listening-hero-title">
          เปลี่ยนจากดูแค่ "ปริมาณ Mentions" สู่การค้นหา "ความเชื่อมโยง" ด้วย AI Network Graph
        </h1>
        <p class="listening-hero-sub">
          ปัญหาเดิมของ Social Listening คือเห็นเพียงแค่ Volume กราฟแท่งหรือกราฟวงกลม ซึ่งตอบไม่ได้ว่าข้อมูลเชื่อมโยงกันอย่างไร
          เมื่อนำ AI มาสร้าง <strong>Network Graph สำหรับกลุ่มธุรกิจการเงินเกียรตินาคินภัทร (KKP)</strong> จะเผยให้เห็นความเชื่อมโยงระหว่าง
          <em>พฤติกรรมลูกค้า ↔ ข้อกำหนด ธปท. ↔ คู่แข่ง Non-bank ↔ องค์ประกอบภาพกราฟิกดีไซน์</em> ที่สร้างผลลัพธ์ได้จริง
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

      <!-- 2. Section A: The 6 Strategic Marketing Pillars (KKP Financial Group) -->
      <section class="listening-section">
        <div class="section-title-wrap">
          <div class="section-pill-tag">KKP FINANCIAL GROUP STRATEGY</div>
          <h2 class="section-main-heading">6 มุมมองสำคัญในการทำการตลาดและสื่อสารด้วย Connected Data</h2>
          <p class="section-sub-heading">คลิกเลือกแต่ละมุมมองเพื่อดูผลการวิเคราะห์ความเชื่อมโยงและกลยุทธ์ที่ทีมกราฟิกและทีมการตลาด KKP นำไปใช้จริง</p>
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

      <!-- 3. Section B: The 3 Visual & Design Intelligence Systems for KKP Designers -->
      <section class="listening-section design-intelligence-section">
        <div class="section-title-wrap">
          <div class="section-pill-tag" style="background:rgba(91,45,144,0.2);color:#c084fc;border-color:rgba(147,51,234,0.4);">
            FOR KKP GRAPHIC DESIGN & CREATIVE TEAMS
          </div>
          <h2 class="section-main-heading">3 ระบบ Visual Intelligence ยกระดับงานออกแบบ KKP ด้วย Data</h2>
          <p class="section-sub-heading">
            เปลี่ยนการฟังเสียงโซเชียลจากการจับข้อความ มาจับ "องค์ประกอบภาพทางการเงิน" ค้นหา Moodboard เชื่อมโยงแบรนด์ KKP และวัดผลชิ้นงานกราฟิกในระดับไมโคร
          </p>
        </div>

        <!-- 3-Tab Navigator -->
        <div class="design-modules-tabs">
          <button type="button" class="btn-design-tab ${activeDesignModule === "visual-trend" ? "is-active" : ""}" data-module="visual-trend">
            <span class="design-tab-icon">👁️</span>
            <div>
              <span class="design-tab-title">1. Visual Trend & Design Listening</span>
              <span class="design-tab-sub">วิเคราะห์องค์ประกอบภาพ (คู่สี KKP ↔ ฟอนต์ ↔ ภาพรถจริง)</span>
            </div>
          </button>
          <button type="button" class="btn-design-tab ${activeDesignModule === "moodboard-graph" ? "is-active" : ""}" data-module="moodboard-graph">
            <span class="design-tab-icon">💡</span>
            <div>
              <span class="design-tab-title">2. Intelligent Moodboard & Concept</span>
              <span class="design-tab-sub">แปลงคีย์เวิร์ด KKP เป็นกราฟภาพ & หา White Space หลบสีคู่แข่ง</span>
            </div>
          </button>
          <button type="button" class="btn-design-tab ${activeDesignModule === "asset-tracker" ? "is-active" : ""}" data-module="asset-tracker">
            <span class="design-tab-icon">🎯</span>
            <div>
              <span class="design-tab-title">3. Creative Asset Impact Tracker</span>
              <span class="design-tab-sub">วัดผลองค์ประกอบแอด KKP & ดักจับ Ad Fatigue ก่อนค่าแอดพุ่ง</span>
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
              <div class="demo-card-title">Share of Voice ในตลาดสินเชื่อ & การเงินดิจิทัล</div>
              <div class="demo-card-sub">กราฟปริมาณแบบดั้งเดิม แสดงแค่ยอด Mentions โดยรวม</div>
            </div>
            <span class="badge badge-warn">Total Mentions: 182,400</span>
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
          <h4>รู้แค่ "ใครถูกพูดถึงเยอะกว่า" แต่ไม่รู้ "ทำไมถึงถูกเลือก หรือติดปัญหาอะไร"</h4>
          <p>
            กราฟแท่งบอกว่าแบรนด์คู่แข่ง Non-Bank มียอด Mentions สูงกว่าที่ 52,100 ครั้ง แต่ <strong>บอกไม่ได้เลย</strong> ว่าคนที่พูดถึงกำลังร้องเรียนเรื่องดอกเบี้ยแอบแฝง,
            กังวลเรื่องการเช็กประวัติเครดิตบูโร, หรือต้องการเงินกู้ด่วนแบบไม่ต้องจอดรถทิ้งไว้
            ผลลัพธ์คือทีมการตลาดอาจทุ่มงบโฆษณาซื้อ Media แบบหว่านแห และดีไซเนอร์ KKP ก็ออกแบบแบนเนอร์ที่ไม่ตรงกับ Pain Point แท้จริง!
          </p>
          <div class="callout-action-hint">
            💡 กดสลับไปที่ <strong>"วิเคราะห์ความเชื่อมโยง (AI Network Graph)"</strong> ด้านบน เพื่อดูว่าเมื่อข้อมูลเชื่อมโยงกันแล้วจะเห็น Insight ใด
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
            <div class="demo-card-title">KKP AI Network Graph (Connected Financial Dimensions)</div>
            <div class="demo-card-sub">แสดงความเชื่อมโยงระหว่าง ผลิตภัณฑ์ KKP ↔ Pain Point ผู้กู้ ↔ ข้อกำหนด ธปท. ↔ ช่องทางสื่อสาร</div>
          </div>
          <div class="demo-badges-group">
            <span class="badge" style="background:#5B2D9033;color:#c084fc;border:1px solid #5B2D9088;">● แบรนด์ KKP</span>
            <span class="badge" style="background:#22c55e22;color:#22c55e;border:1px solid #22c55e44;">● ความต้องการลูกค้า</span>
            <span class="badge" style="background:#ef444422;color:#ef4444;border:1px solid #ef444444;">● Pain Points</span>
            <span class="badge" style="background:#ffc61a22;color:#ffc61a;border:1px solid #ffc61a44;">● อินฟลูฯ & สื่อ</span>
          </div>
        </div>
        <div class="network-canvas-container">
          <canvas id="main-network-canvas" width="800" height="380"></canvas>
          <div class="canvas-interactive-hint">
            <span>🖱️ ลากโหนด (Drag Node) เพื่อปรับมุมมอง หรือชี้โหนดเพื่อดูมิติความเชื่อมโยงทางการเงิน</span>
          </div>
        </div>
      </div>

      <div class="demo-insight-callout">
        <div class="callout-badge-success">✨ คุณค่าของ Connected Data (AInsight Paradigm)</div>
        <h4>เห็นโอกาสทางการตลาดและข้อได้เปรียบที่ซ่อนอยู่ใต้ตัวเลข</h4>
        <div class="insight-pill-list">
          <div class="insight-pill-item">
            <span class="pill-dot" style="background:#c084fc;"></span>
            <span><strong>จุดเชื่อมที่ชัดเจน:</strong> 82% ของลูกค้าที่ค้นหา <em>"รีไฟแนนซ์รถยนต์ ดอกเบี้ยถูก"</em> จะนำ KKP รถเรียกเงิน ไปเทียบกับเงินติดล้อทันที</span>
          </div>
          <div class="insight-pill-item">
            <span class="pill-dot bg-green"></span>
            <span><strong>ข้อได้เปรียบเชิงโครงสร้าง:</strong> KKP เป็นธนาคารพาณิชย์ จึงมีจุดเด่นเรื่อง <em>"ดอกเบี้ยถูกกว่า Non-bank อย่างโปร่งใส"</em> ซึ่งเป็น Unmet Need สำคัญ</span>
          </div>
          <div class="insight-pill-item">
            <span class="pill-dot bg-cyan"></span>
            <span><strong>โอกาสครีเอทีฟ KKP Dime!:</strong> คนรุ่นใหม่มองหา <em>"หุ้นอเมริกาเริ่มต้น 50 บาท ควบคู่ดอกเบี้ยเงินฝาก 3%"</em> นำไปสร้าง Key Visual สไตล์ FinTech ได้โดดเด่น</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/* ─────────────────────────────────────────────────────────────────────────
   SECTION A: 6 PILLARS DETAIL RENDERER (KKP FINANCIAL GROUP)
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
            <div class="standard-item-card ${item.status.includes('Must-Have') ? 'is-baseline' : 'is-differentiator'}">
              <div class="std-head">
                <span class="std-name">${escapeHtml(item.label)}</span>
                <span class="std-badge ${item.status.includes('Must-Have') ? 'badge-warn' : 'badge-ok'}">${item.status}</span>
              </div>
              <div class="std-progress-wrap">
                <div class="std-progress-bar" style="width:${item.expectedPct}%;"></div>
              </div>
              <div class="std-pct-row">
                <span>ความคาดหวัง / กฎเกณฑ์ที่ต้องมี:</span>
                <strong>${item.expectedPct}%</strong>
              </div>
              <p class="std-desc">${escapeHtml(item.desc)}</p>
            </div>
          `).join("")}
        </div>
        <div class="strategic-takeaway-bar">
          <strong>💡 กลยุทธ์ทีมกราฟิก KKP:</strong> คำเตือน ธปท. "กู้เท่าที่จำเป็นและชำระคืนไหว" เป็นข้อกำหนดกฎหมาย 100% ที่ต้องวางท้ายอาร์ตเวิร์กให้อ่านง่ายเป็นระเบียบตาม Bento System แต่ห้ามใช้เป็นจุดขายหลัก ให้ชู <em>Value Differentiator</em> เช่น "ดอกเบี้ยต่ำระบบธนาคารเริ่มต้น 0.59% & ไม่ต้องโอนเล่มทะเบียน" ขึ้นเป็นข้อความพาดหัวหลักแทน
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
              <div class="needs-core-tag">🔥 ผลิตภัณฑ์ & ความต้องการหลัก: ${escapeHtml(cluster.core)}</div>
              <div class="needs-connected-list">
                <span class="needs-conn-label">คุณสมบัติเชื่อมโยงที่ลูกค้ามองหา:</span>
                <div class="needs-pills">
                  ${cluster.connected.map(c => `<span class="chip chip-cyan">${escapeHtml(c)}</span>`).join("")}
                </div>
              </div>
              <div class="needs-insight-text">
                <strong>Insight ลึก:</strong> ${escapeHtml(cluster.insight)}
              </div>
              <div class="needs-creative-hook">
                <span class="hook-label">🎯 ข้อความพาดหัวโฆษณาแนะนำ (Creative Ad Hook):</span>
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
                  <span class="our-brand-badge" style="background:#5B2D90;color:#fff;">${escapeHtml(m.ourBrand)}</span>
                  <span class="vs-text">VS</span>
                  <span class="their-brand-badge">${escapeHtml(m.realCompetitor)}</span>
                </div>
                <span class="badge badge-info">ความถี่การถูกนำมาเปรียบเทียบ: ${m.overlapPct}%</span>
              </div>
              <div class="comp-context">
                <strong>บริบทที่ลูกค้าเปรียบเทียบในโซเชียล:</strong> "${escapeHtml(m.context)}"
              </div>
              <div class="comp-diff-grid">
                <div class="diff-box advantage">
                  <span class="diff-title">✅ ข้อได้เปรียบของ KKP:</span>
                  <p>${escapeHtml(m.ourAdvantage)}</p>
                </div>
                <div class="diff-box action">
                  <span class="diff-title">🎨 แผนการออกแบบคอนเทนต์และกราฟิกตั้งรับ:</span>
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
                พฤติกรรมหลอกลวงที่ตรวจจับ: <strong>${escapeHtml(a.priceDetected)}</strong>
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
                <strong>พฤติกรรมและความต้องการทางการเงิน:</strong> ${escapeHtml(w.intent)}
              </div>
              <div class="win-meta-row">
                <div class="win-meta">
                  <span class="lbl">สภาพการแข่งขันในตลาด:</span>
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
   SECTION B: 3 DESIGN INTELLIGENCE MODULES FOR KKP GRAPHIC DESIGN
───────────────────────────────────────────────────────────────────────── */
function renderDesignModule(moduleKey) {
  if (moduleKey === "visual-trend") {
    return `
      <div class="design-module-container">
        <div class="module-intro-banner">
          <h3>1. Visual Trend & Design Listening Platform สำหรับ KKP</h3>
          <p>
            ใช้ <strong>AI Image Recognition</strong> ดักจับองค์ประกอบภาพของสถาบันการเงินและสินเชื่อในตลาด เชื่อมโยงความสัมพันธ์ของคู่สี KKP สไตล์ฟอนต์ และภาพยานพาหนะจริง เพื่อดูว่าสไตล์แบบใดดึงดูด Lead และ Engagement ได้สูงสุด
          </p>
        </div>

        <div class="visual-trend-layout">
          <!-- Left: Design Element Network Table & Metrics -->
          <div class="design-elements-table-card">
            <div class="table-card-head">
              <span class="card-title">องค์ประกอบภาพยอดนิยมของ KKP & ประสิทธิภาพ CTR Lift</span>
              <span class="badge badge-info">วิเคราะห์จาก 6,800 ชิ้นงานการเงิน</span>
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
                    <span class="elem-lift">${e.lift} Lift</span>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <!-- Right: Visual Relationship Graph Canvas -->
          <div class="design-graph-card">
            <div class="table-card-head">
              <span class="card-title">KKP Design Element Network Graph (โครงข่ายอัตลักษณ์)</span>
              <span class="badge badge-ok">AI Live Analysis</span>
            </div>
            <div class="design-canvas-wrap">
              <canvas id="design-element-canvas" width="480" height="300"></canvas>
            </div>
            <div class="design-canvas-footer">
              <span>เชื่อมโยง: [ม่วง KKP + ทองอำพัน] ↔ [ฟอนต์ไม่มีหัว IBM Plex] ↔ [ภาพถ่ายรถจริง] ↔ [ป้ายดอกเบี้ย APR]</span>
            </div>
          </div>
        </div>

        <div class="strategic-takeaway-bar">
          <strong>🎨 ประโยชน์สำหรับดีไซเนอร์ KKP:</strong> ไม่ต้องเถียงกันด้วยความรู้สึก (Gut Feeling) อีกต่อไป ดีไซเนอร์สามารถแจ้งทีมการตลาดหรือผู้บริหารได้ทันทีว่า <em>"งานแคมเปญรถเรียกเงินชิ้นนี้ เราเลือกใช้ภาพถ่ายรถกระบะจริงคู่กับป้ายดอกเบี้ยสีทองอำพันบนพื้นม่วง KKP เพราะสถิติ Data listening ชี้ชัดว่าสร้าง Trust Score และยอด Lead สูงกว่าภาพ 3D Render ถึง +48.0%"</em>
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
            เปลี่ยนวิธีการหา Reference ของทีมกราฟิก KKP ให้กลายเป็นการค้นหาด้วย <strong>ความสัมพันธ์ของข้อมูล (Keyword-to-Visual Graph)</strong> และตรวจจับ White Space เพื่อสร้างอัตลักษณ์เฉพาะตัวของ KKP ไม่ให้ซ้ำกับธนาคารคู่แข่ง
          </p>
        </div>

        <!-- Keyword Prompt Input Box -->
        <div class="concept-explorer-input-box">
          <label class="explorer-label">ลองคลิกเลือกโจทย์แคมเปญของ KKP:</label>
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
          <h3>3. Creative Asset Impact Tracker สำหรับชิ้นงานโฆษณา KKP</h3>
          <p>
            ย่อยชิ้นงานกราฟิกออกเป็น <strong>Micro-elements</strong> เพื่อดูว่าองค์ประกอบย่อยใดในภาพโฆษณาส่งผลต่อ CTR และยอดสมัครสินเชื่อจริง พร้อม <strong>Fatigue Heatmap</strong> ดักจับเมื่อผู้บริโภคเริ่มเกิดอาการตาบอดต่อโฆษณา (Ad Fatigue)
          </p>
        </div>

        <div class="asset-tracker-layout">
          <!-- Left: Micro-Element Breakdown Simulator -->
          <div class="micro-element-card">
            <div class="table-card-head">
              <span class="card-title">การย่อยองค์ประกอบในภาพแอด KKP (Micro-level Breakdown)</span>
              <span class="badge badge-info">A/B Testing Impact</span>
            </div>
            
            <div class="micro-artwork-preview">
              <div class="artwork-bbox box-headline" title="Headline: สั้น กระชับ มีตัวเลขอัตราดอกเบี้ย (+34% CTR)">
                <span>Headline: 'ผ่อนรถอยู่ กู้ได้ทันที ดอกเบี้ย 0.59%'</span>
              </div>
              <div class="artwork-bbox box-packshot" title="Hero Real Vehicle: ภาพรถกระบะ/SUV จริง ทะเบียนชัดเจน (+48% CTR)">
                <span>Hero Imagery: Real Vehicle in Daily Life</span>
              </div>
              <div class="artwork-bbox box-cta" title="ปุ่ม CTA ชัดเจน: 'ประเมินวงเงินฟรีใน 1 นาที' (+28% Conversion)">
                <span>CTA Button: 'ประเมินวงเงินฟรี'</span>
              </div>
              <div class="artwork-bbox box-badge" title="Badge APR: เริ่ม 0.59% ต่อเดือน (+42% Lead Form Submit)">
                <span>APR 0.59% Badge</span>
              </div>
            </div>

            <div class="impact-breakdown-list">
              <div class="impact-item">
                <span class="impact-name">ภาพรถจริงบนถนนแสงธรรมชาติ (แทน 3D Render)</span>
                <span class="impact-val text-green">+48% CTR & Trust</span>
              </div>
              <div class="impact-item">
                <span class="impact-name">ป้ายดอกเบี้ย APR สีทองอำพันตัวเลข Space Mono</span>
                <span class="impact-val text-green">+42% Lead Form</span>
              </div>
              <div class="impact-item">
                <span class="impact-name">พาดหัวระบุชัดเจนว่า 'ผ่อนอยู่ก็กู้ได้'</span>
                <span class="impact-val text-green">+34% CTR</span>
              </div>
              <div class="impact-item">
                <span class="impact-name">ปุ่ม Call-To-Action เน้นประเมินวงเงินฟรี</span>
                <span class="impact-val text-green">+28% Conversion</span>
              </div>
            </div>
          </div>

          <!-- Right: Ad Fatigue & Wear-Out Heatmap -->
          <div class="ad-fatigue-card">
            <div class="table-card-head">
              <span class="card-title">Creative Fatigue Heatmap (ดักจับอาการเบื่อโฆษณา KKP)</span>
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
          <strong>📊 ประโยชน์ต่อธุรกิจ KKP:</strong> ทีมการตลาดและทีมออกแบบรู้ทันทีว่าป้ายโฆษณาได้ผลตอบรับดีเพราะ <em>"ภาพรถจริงที่สร้างความน่าเชื่อถือ"</em> หรือเพราะ <em>"ตัวเลขดอกเบี้ยโปรโมชัน"</em> และเมื่อถึงวันที่ผู้บริโภคเริ่มเกิดอาการตาบอดต่อโฆษณา (Ad Fatigue) ระบบจะแจ้งเตือนให้ดีไซเนอร์รีเฟรชอาร์ตเวิร์กใหม่ทันทีก่อนที่ต้นทุนค่า Lead ของ KKP จะสูงเกินเพดาน!
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
      <div class="concept-card-title">🎨 Color Palette: ${escapeHtml(match.product)}</div>
      <div class="concept-swatches-grid">
        ${match.palette.map(hex => `
          <div class="concept-swatch-box" style="background:${hex};" data-hex="${hex}" title="คลิกเพื่อคัดลอก ${hex}">
            <span class="swatch-hex-lbl">${hex}</span>
          </div>
        `).join("")}
      </div>
      <div class="concept-card-sub">คลิกที่ช่องสีเพื่อคัดลอกรหัส Hex ไปใช้ใน Figma หรือ Photoshop</div>
    </div>

    <div class="concept-card concept-typography-card">
      <div class="concept-card-title">🔤 สไตล์ตัวอักษร & อารมณ์ภาพที่ตรงโจทย์</div>
      <div class="concept-font-preview">
        <h3 style="color:#5B2D90;font-size:1.15rem;margin-bottom:6px;">${escapeHtml(match.font)}</h3>
        <p style="color:#cbd5e1;font-size:0.84rem;line-height:1.5;">${escapeHtml(match.composition)}</p>
      </div>
    </div>

    <div class="concept-card concept-whitespace-card">
      <div class="concept-card-title">🗺️ แผนที่ White Space (หลีกเลี่ยงสีซ้ำคู่แข่ง)</div>
      <div class="whitespace-radar-box">
        <div class="competitor-dot dot-a" style="background:#00a950;color:#fff;" title="KBANK จองสีเขียว">KBANK (เขียว)</div>
        <div class="competitor-dot dot-b" style="background:#fecb00;color:#000;" title="BAY จองสีเหลือง">BAY (เหลือง)</div>
        <div class="competitor-dot" style="position:absolute;top:20px;left:35px;background:#00a3e0;color:#fff;font-size:0.68rem;padding:3px 8px;border-radius:99px;" title="KTB จองสีฟ้า">KTB (ฟ้า)</div>
        <div class="whitespace-sweetspot" style="border-color:#5B2D90;background:rgba(91,45,144,0.3);color:#e2d9f3;" title="White Space ของ KKP: Corporate Purple + Cyber Gold">
          ★ White Space ของ KKP: Deep Purple + Amber Gold
        </div>
      </div>
      <div class="concept-card-sub">หลีกเลี่ยงโทนสีที่ธนาคารคู่แข่งครอบครอง เพื่อสร้างเอกลักษณ์เฉพาะตัวที่ผู้บริโภคจดจำได้ทันที</div>
    </div>

    <div class="concept-card concept-export-card">
      <div class="concept-card-title">🚀 นำคอนเซปต์ไปใช้งานใน CONT</div>
      <p style="font-size:0.82rem;color:#8c92ad;margin-bottom:14px;line-height:1.5;">
        ส่งข้อมูล Color Palette, Typography และ Layout ทั้งหมดนี้เป็น Task บรีฟงานให้นักออกแบบในทีมกราฟิก KKP ได้ทันที
      </p>
      <button type="button" class="btn-pixel btn-pixel-cyan" id="btn-export-concept-task" style="width:100%;justify-content:center;background:#5B2D90;border-color:#7c3aed;">
        ${pixelIcons.plus}
        <span>ส่งข้อมูลเป็น Task บรีฟงานทีม KKP</span>
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
        toast(`คัดลอกรหัสสี KKP ${hex} เรียบร้อยแล้ว`, "success");
      }
    });
  });
}

function bindExportTask() {
  qs("#btn-export-concept-task")?.addEventListener("click", () => {
    const match = DESIGN_LISTENING_DATA.moodboardKeywords.find(k => k.query === searchKeywordPrompt) || DESIGN_LISTENING_DATA.moodboardKeywords[0];
    if (typeof window.openCreateTask === "function") {
      window.openCreateTask({
        title: `งานออกแบบแคมเปญ KKP: ${match.product}`,
        description: `บรีฟอาร์ตเวิร์กอ้างอิง Insight จากระบบ Social & Visual Listening KKP:\nผลิตภัณฑ์: ${match.product}\nโจทย์: ${match.query}\nColor Palette: ${match.palette.join(", ")}\nTypography: ${match.font}\nComposition: ${match.composition}\n\nวัตถุประสงค์: ขยายสัดส่วน White Space ทางการตลาดเพื่อความแตกต่างจากคู่แข่งตามเกณฑ์ ธปท.`,
        channel: "Social Media / Performance Ads"
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
   CANVAS NETWORK GRAPH ENGINE (INTERACTIVE KKP FINANCIAL ECOSYSTEM)
───────────────────────────────────────────────────────────────────────── */
function initNetworkCanvas() {
  const canvas = qs("#main-network-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Nodes definition for KKP Financial & Creative Marketing Ecosystem
  const nodes = [
    { id: "brand_rrn", label: "KKP รถเรียกเงิน (RRN)", type: "brand", x: width * 0.44, y: height * 0.46, r: 24, color: "#5B2D90", vx: 0, vy: 0 },
    { id: "brand_dime", label: "KKP Dime! App", type: "brand", x: width * 0.28, y: height * 0.32, r: 20, color: "#19C3EB", vx: 0, vy: 0 },
    { id: "comp_tidlor", label: "เงินติดล้อ / Non-Bank", type: "competitor", x: width * 0.68, y: height * 0.35, r: 18, color: "#ff5252", vx: 0, vy: 0 },
    { id: "comp_make", label: "Make by KBank", type: "competitor", x: width * 0.16, y: height * 0.68, r: 16, color: "#ff5252", vx: 0, vy: 0 },
    { id: "need_apr", label: "ดอกเบี้ยต่ำ เริ่ม 0.59%", type: "attribute", x: width * 0.38, y: height * 0.76, r: 16, color: "#22c55e", vx: 0, vy: 0 },
    { id: "need_nocheck", label: "ไม่ต้องโอนเล่ม / ไม่เช็กคนค้ำ", type: "attribute", x: width * 0.62, y: height * 0.72, r: 16, color: "#22c55e", vx: 0, vy: 0 },
    { id: "need_bureau", label: "ความกังวลบูโร & เงินหมุน", type: "painpoint", x: width * 0.55, y: height * 0.18, r: 16, color: "#ef4444", vx: 0, vy: 0 },
    { id: "need_stocks", label: "หุ้นสหรัฐฯ เริ่ม 50 บ.", type: "attribute", x: width * 0.18, y: height * 0.18, r: 15, color: "#22c55e", vx: 0, vy: 0 },
    { id: "inf_taxbug", label: "กูรูการเงิน CFP (Trust 98)", type: "influencer", x: width * 0.78, y: height * 0.62, r: 16, color: "#ffc61a", vx: 0, vy: 0 },
    { id: "chan_leadads", label: "Facebook Lead Ads", type: "channel", x: width * 0.84, y: height * 0.24, r: 15, color: "#a855f7", vx: 0, vy: 0 }
  ];

  // Links definition
  const links = [
    { source: "brand_rrn", target: "need_apr", strength: 3.5, label: "ดอกเบี้ยต่ำจริงแบบธนาคาร" },
    { source: "brand_rrn", target: "need_nocheck", strength: 3.2, label: "ไม่ต้องโอนเล่ม" },
    { source: "brand_rrn", target: "comp_tidlor", strength: 3.5, label: "ถูกเทียบกัน 82%" },
    { source: "comp_tidlor", target: "need_bureau", strength: 2.2 },
    { source: "brand_rrn", target: "need_bureau", strength: 2.8, label: "คลายความกังวล" },
    { source: "brand_dime", target: "need_stocks", strength: 3.0, label: "US Stocks 50฿" },
    { source: "brand_dime", target: "comp_make", strength: 2.5, label: "เทียบกัน 74%" },
    { source: "brand_rrn", target: "inf_taxbug", strength: 2.8, label: "Trust Score 98" },
    { source: "brand_rrn", target: "chan_leadads", strength: 3.0, label: "ช่องทางหลัก Lead" },
    { source: "comp_tidlor", target: "chan_leadads", strength: 2.4 }
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
      ctx.strokeStyle = isHighlighted ? "#5B2D90" : "rgba(100, 116, 139, 0.35)";
      ctx.lineWidth = isHighlighted ? 3.5 : Math.max(1, link.strength);
      ctx.stroke();

      // Pulsing energy dot along line
      if (isHighlighted || link.strength > 2.8) {
        const time = Date.now() * 0.0015;
        const progress = (time % 1);
        const px = s.x + (t.x - s.x) * progress;
        const py = s.y + (t.y - s.y) * progress;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isHighlighted ? "#E59324" : "#19C3EB";
        ctx.fill();
      }
    });

    // Draw Nodes
    nodes.forEach(node => {
      const isHovered = hoveredNode && hoveredNode.id === node.id;

      // Glow halo
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r + (isHovered ? 8 : 4), 0, Math.PI * 2);
      ctx.fillStyle = `${node.color}28`;
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
    { label: "KKP Purple (#5B2D90)", color: "#5B2D90", x: w * 0.22, y: h * 0.35, r: 18 },
    { label: "Cyber Gold (#E59324)", color: "#E59324", x: w * 0.32, y: h * 0.72, r: 16 },
    { label: "ฟอนต์ไม่มีหัว (IBM Plex)", color: "#ffc61a", x: w * 0.65, y: h * 0.28, r: 15 },
    { label: "ภาพรถจริง (Real Vehicle)", color: "#22c55e", x: w * 0.78, y: h * 0.65, r: 18 },
    { label: "ป้าย APR 0.59% เริ่มต้น", color: "#19c3eb", x: w * 0.5, y: h * 0.5, r: 17 }
  ];

  const dLinks = [
    { s: 0, t: 1 },
    { s: 0, t: 4 },
    { s: 1, t: 4 },
    { s: 4, t: 2 },
    { s: 4, t: 3 },
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
