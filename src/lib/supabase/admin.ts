import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// CHỈ dùng trong Route Handler/script server-side đáng tin cậy (cron
// kiểm tra thông báo, script seed tài khoản demo). Service role BYPASS
// toàn bộ RLS — không bao giờ import file này vào Client Component.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
