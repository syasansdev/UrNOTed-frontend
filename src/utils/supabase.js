import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://oujatuzfeaywcpmfjznu.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_5hYmUlCn6JAXGgK8cau0ww_7gd2TF1n";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
