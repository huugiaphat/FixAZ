import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });

  const { data: nv } = await supabase.from("nhan_vien").select("ma_nv").eq("auth_user_id", user.id).single();
  if (!nv) return NextResponse.json({ error: "Tài khoản chưa liên kết nhân viên" }, { status: 403 });

  const sub = (await request.json()) as { endpoint: string; keys: { p256dh: string; auth: string } };
  if (!sub?.endpoint || !sub?.keys) {
    return NextResponse.json({ error: "Dữ liệu subscription không hợp lệ" }, { status: 400 });
  }

  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      ma_nv: nv.ma_nv,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
    { onConflict: "endpoint" },
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
