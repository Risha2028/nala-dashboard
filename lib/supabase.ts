import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "").trim();

console.log("[supabase] URL:", url ?? "UNDEFINED — check .env.local");
console.log("[supabase] Key:", key ? key.slice(0, 24) + "..." : "UNDEFINED — check .env.local");

if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
if (!key) throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");

export const supabase = createClient(url, key);
