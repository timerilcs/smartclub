import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL || "https://imxkbglxawydfojuyfjt.supabase.co";
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_t35zMxi1ynTxwjfLxQUiHw_rF5EMmZn";

export const supabase = createClient(url, key, { auth: { persistSession: false } });
