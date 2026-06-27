import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL before running this script.");
}

if (!supabaseAnonKey) {
  throw new Error("Set NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY before running this script.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

for (const table of ["cctv_locations", "police_stations", "chokepoints_parking"]) {
  const { data, error } = await supabase.from(table).select("*").limit(1);
  if (error) {
    console.log(`${table}: ERROR - ${error.message}`);
  } else {
    console.log(`${table} columns:`, Object.keys(data?.[0] ?? {}));
  }
}
