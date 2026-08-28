import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Dùng trong Server Component / Server Action / Route Handler. Áp
// dụng RLS theo phiên đăng nhập của người dùng (anon key + cookie),
// KHÔNG bypass phân quyền.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Gọi từ Server Component (không thể set cookie) — middleware
            // sẽ đảm nhiệm việc refresh session, bỏ qua an toàn ở đây.
          }
        },
      },
    },
  );
}
