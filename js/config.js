// CONT public client configuration loader.
// Keep project URL and publishable/anon key in js/config.local.js for local Preview.
// Never put a service_role key, password, OAuth secret, or private token in either file.
const external = window.__CONT_CONFIG__ || {};
export const SUPABASE_URL = external.SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = external.SUPABASE_ANON_KEY || "";
export const SUPABASE_PROJECT_REF = external.SUPABASE_PROJECT_REF || "";
export const USE_DEMO_BY_DEFAULT = false;
export const APP_NAME = "CONT";
export const APP_TIMEZONE = "Asia/Bangkok";
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const isDemoRequested = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("demo") === "1" || localStorage.getItem("cont_demo") === "1" || USE_DEMO_BY_DEFAULT;
};
