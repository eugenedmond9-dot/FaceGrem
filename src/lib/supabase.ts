import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fljowhgpfaijpvvlclun.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZsam93aGdwZmFpanB2dmxjbHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyNjQyODYsImV4cCI6MjA5MTg0MDI4Nn0.fuuxueHknkR9r6ddhA_y1HRrwYzMfNGx3oQCmOcU8qs";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
