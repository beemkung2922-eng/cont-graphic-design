// CONT public client configuration loader.
// Only the Supabase project URL and publishable/anon key belong here.
// Never put a service_role key, password, OAuth secret, or private token in either file.
const external = window.__CONT_CONFIG__ || {};
export const SUPABASE_URL = external.SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = external.SUPABASE_ANON_KEY || "";
export const SUPABASE_PROJECT_REF = external.SUPABASE_PROJECT_REF || "";
export const APP_NAME = "CONT";
export const APP_TIMEZONE = "Asia/Bangkok";
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
