import { api, auth } from "./supabase.js";

const errorNode = document.querySelector("#login-error");
const params = new URLSearchParams(window.location.search);
const message = params.get("error");
if (message) { errorNode.textContent = message; errorNode.classList.remove("hidden"); }

document.querySelector("#google-login")?.addEventListener("click", async (event) => {
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = "กำลังเชื่อมต่อ Google…";
  try { await auth.signInWithGoogle(); }
  catch (error) { errorNode.textContent = error.message || "ไม่สามารถเริ่ม Google Login ได้"; errorNode.classList.remove("hidden"); button.disabled = false; button.innerHTML = "<span style=\"font-size:1.2rem\">G</span> เข้าสู่ระบบด้วย Google"; }
});

document.querySelectorAll("[data-demo-user]").forEach((button) => button.addEventListener("click", () => auth.enterDemo(button.dataset.demoUser)));

// Supabase may redirect back with access_token in the URL hash after OAuth.
if (window.location.hash.includes("access_token=")) {
  const hash = new URLSearchParams(window.location.hash.slice(1));
  const session = { access_token: hash.get("access_token"), refresh_token: hash.get("refresh_token"), user: { id: hash.get("user_id") || "" } };
  localStorage.setItem("cont_session", JSON.stringify(session));
  window.location.hash = "";
  window.location.href = "dashboard.html";
}

if (api.isDemo()) window.location.href = "dashboard.html?demo=1";
