import { createClient } from "@supabase/supabase-js";

// ⚠️ VARIABLES DE ENTORNO
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error("❌ SUPABASE_URL o SUPABASE_KEY no están definidas");
}

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
