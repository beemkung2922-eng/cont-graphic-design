import { api, auth } from "./supabase.js";

const errorNode = document.querySelector("#login-error");
const infoNode = document.querySelector("#login-info");
const emailStep = document.querySelector("#email-step");
const otpStep = document.querySelector("#otp-step");
const workEmailInput = document.querySelector("#work-email");
const otpCodeInput = document.querySelector("#otp-code");
const sentEmailDisplay = document.querySelector("#sent-email-display");
const sendOtpBtn = document.querySelector("#send-otp-btn");
const verifyOtpBtn = document.querySelector("#verify-otp-btn");
const resendOtpBtn = document.querySelector("#resend-otp-btn");
const backToEmailBtn = document.querySelector("#back-to-email-btn");
const googleBtn = document.querySelector("#google-login");

let cooldownSeconds = 0;
let cooldownTimer = null;

const showError = (msg) => {
  if (!errorNode) return;
  errorNode.textContent = msg;
  errorNode.classList.remove("hidden");
  infoNode?.classList.add("hidden");
};

const showInfo = (msg) => {
  if (!infoNode) return;
  infoNode.textContent = msg;
  infoNode.classList.remove("hidden");
  errorNode?.classList.add("hidden");
};

const clearMessages = () => {
  errorNode?.classList.add("hidden");
  infoNode?.classList.add("hidden");
};

function startCooldown(seconds = 60) {
  cooldownSeconds = seconds;
  if (cooldownTimer) clearInterval(cooldownTimer);

  const tick = () => {
    if (cooldownSeconds <= 0) {
      clearInterval(cooldownTimer);
      cooldownTimer = null;
      if (resendOtpBtn) {
        resendOtpBtn.disabled = false;
        resendOtpBtn.textContent = "ส่งรหัสใหม่อีกครั้ง";
      }
      if (sendOtpBtn) {
        sendOtpBtn.disabled = false;
        sendOtpBtn.innerHTML = "<span>📩 ส่งลิงก์เข้าสู่ระบบ / รหัส OTP</span>";
      }
      return;
    }

    if (resendOtpBtn) {
      resendOtpBtn.disabled = true;
      resendOtpBtn.textContent = `ส่งรหัสใหม่ได้ใน (${cooldownSeconds}s)`;
    }
    if (sendOtpBtn) {
      sendOtpBtn.disabled = true;
      sendOtpBtn.innerHTML = `<span>⏳ รอส่งใหม่ใน (${cooldownSeconds}s)</span>`;
    }
    cooldownSeconds--;
  };

  tick();
  cooldownTimer = setInterval(tick, 1000);
}

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

function formatAuthError(error) {
  const msg = error?.message || error?.payload?.msg || error?.payload?.error_description || String(error);
  if (msg.includes("company email addresses")) {
    return "ระบบจำกัดเฉพาะอีเมลบริษัท (@kkpfg.com) เท่านั้น หรือกรุณาเข้าสู่ระบบด้วย Google";
  }
  if (msg.includes("otp_expired") || msg.includes("Token has expired") || msg.includes("is invalid")) {
    return "รหัส OTP ไม่ถูกต้องหรือหมดอายุแล้ว กรุณาลองใหม่อีกครั้ง หรือกดปุ่มในอีเมล Outlook ล่าสุด";
  }
  if (msg.includes("Signups not allowed")) {
    return "ไม่อนุญาตให้อีเมลนี้ลงทะเบียน กรุณาติดต่อผู้ดูแลระบบ";
  }
  if (msg.includes("rate limit") || msg.includes("too many") || msg.includes("over_email_send_rate_limit") || msg.includes("60 seconds")) {
    startCooldown(60);
    return "⏳ ส่งคำขอถี่เกินไป กรุณารอสักครู่ (ประมาณ 1 นาที) หรือเปิด Outlook แล้วกดปุ่ม \"Confirm email address\" ในอีเมลล่าสุดได้ทันที";
  }
  return msg || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
}

// 1. Check URL Error parameter (from failed OAuth redirect or email verify error)
const params = new URLSearchParams(window.location.search);
const urlError = params.get("error_description") || params.get("error");
if (urlError) {
  showError(decodeURIComponent(urlError.replace(/\+/g, " ")));
}

// 2. Check Magic Link / OAuth Hash (#access_token=...)
if (window.location.hash.includes("access_token=")) {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = hash.get("access_token");
  const refreshToken = hash.get("refresh_token");
  const jwt = accessToken ? parseJwt(accessToken) : null;
  const session = {
    access_token: accessToken,
    refresh_token: refreshToken,
    user: {
      id: hash.get("user_id") || jwt?.sub || "",
      email: jwt?.email || "",
    },
  };
  localStorage.setItem("cont_session", JSON.stringify(session));
  window.location.hash = "";
  showInfo("เข้าสู่ระบบสำเร็จ กำลังพาไปยังแดชบอร์ด…");
  window.setTimeout(() => {
    window.location.href = "dashboard.html";
  }, 400);
}

// 3. Send OTP / Magic Link
sendOtpBtn?.addEventListener("click", async () => {
  if (cooldownSeconds > 0) return;
  const email = workEmailInput?.value.trim().toLowerCase();
  if (!email) {
    showError("กรุณากรอกอีเมลบริษัทของคุณ");
    workEmailInput?.focus();
    return;
  }
  if (!email.includes("@")) {
    showError("รูปแบบอีเมลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง");
    workEmailInput?.focus();
    return;
  }

  clearMessages();
  sendOtpBtn.disabled = true;
  const originalText = sendOtpBtn.innerHTML;
  sendOtpBtn.innerHTML = "<span>⏳ กำลังส่งลิงก์ / รหัส OTP…</span>";

  try {
    await auth.signInWithOtp(email);
    if (sentEmailDisplay) sentEmailDisplay.textContent = email;
    emailStep?.classList.add("hidden");
    otpStep?.classList.remove("hidden");
    startCooldown(60);
    showInfo(`ระบบส่งอีเมลไปที่ ${email} เรียบร้อยแล้ว เปิด Outlook แล้วกดยืนยันได้ทันที`);
    if (otpCodeInput) {
      otpCodeInput.value = "";
      otpCodeInput.focus();
    }
  } catch (error) {
    showError(formatAuthError(error));
    if (cooldownSeconds <= 0) {
      sendOtpBtn.disabled = false;
      sendOtpBtn.innerHTML = originalText;
    }
  }
});

workEmailInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    sendOtpBtn?.click();
  }
});

// 4. Verify OTP (if user inputs 6-digit code)
const handleVerify = async () => {
  const email = workEmailInput?.value.trim().toLowerCase();
  const token = otpCodeInput?.value.trim();
  if (!token || token.length < 6) {
    showError("กรุณากรอกรหัส OTP 6 หลักให้ครบถ้วน หรือกดปุ่ม Confirm ในอีเมล Outlook");
    otpCodeInput?.focus();
    return;
  }

  clearMessages();
  verifyOtpBtn.disabled = true;
  const originalText = verifyOtpBtn.innerHTML;
  verifyOtpBtn.innerHTML = "<span>⏳ กำลังตรวจสอบรหัส…</span>";

  try {
    const session = await auth.verifyOtp(email, token);
    showInfo("ยืนยันรหัสถูกต้อง! กำลังเข้าสู่ระบบ…");
    window.setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 400);
  } catch (error) {
    showError(formatAuthError(error));
    verifyOtpBtn.disabled = false;
    verifyOtpBtn.innerHTML = originalText;
    otpCodeInput?.focus();
  }
};

verifyOtpBtn?.addEventListener("click", handleVerify);
otpCodeInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleVerify();
  }
});

// 5. Resend OTP / Magic Link
resendOtpBtn?.addEventListener("click", async () => {
  if (cooldownSeconds > 0) return;
  const email = workEmailInput?.value.trim().toLowerCase();
  if (!email) return;
  clearMessages();
  resendOtpBtn.disabled = true;
  resendOtpBtn.textContent = "กำลังส่งใหม่…";

  try {
    await auth.signInWithOtp(email);
    startCooldown(60);
    showInfo(`ส่งอีเมลยืนยันชุดใหม่ไปที่ ${email} เรียบร้อยแล้ว`);
  } catch (error) {
    showError(formatAuthError(error));
  }
});

// 6. Back to Email Step
backToEmailBtn?.addEventListener("click", () => {
  otpStep?.classList.add("hidden");
  emailStep?.classList.remove("hidden");
  if (sendOtpBtn && cooldownSeconds <= 0) {
    sendOtpBtn.disabled = false;
    sendOtpBtn.innerHTML = "<span>📩 ส่งลิงก์เข้าสู่ระบบ / รหัส OTP</span>";
  }
  clearMessages();
  workEmailInput?.focus();
});

// 7. Google OAuth Sign-in
googleBtn?.addEventListener("click", async () => {
  googleBtn.disabled = true;
  googleBtn.innerHTML = "<span>กำลังเชื่อมต่อ Google…</span>";
  clearMessages();
  try {
    await auth.signInWithGoogle();
  } catch (error) {
    showError(error.message || "ไม่สามารถเริ่ม Google Login ได้");
    googleBtn.disabled = false;
    googleBtn.innerHTML = `
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
      </svg>
      <span>เข้าสู่ระบบด้วย Google</span>
    `;
  }
});

// 8. Check Supabase Configuration
if (!api.isConfigured) {
  showError("ระบบยังไม่ได้เชื่อมต่อ Supabase กรุณาตรวจสอบค่าการเชื่อมต่อ");
}
