import { createClient } from "@/lib/supabase/client";

const KICH_THUOC_TOI_DA = 1600; // px cạnh dài nhất
const CHAT_LUONG_JPEG = 0.75;

// Nén ảnh bằng Canvas API trước khi upload — tiết kiệm dung
// lượng/băng thông cho khu vực sóng yếu (Mục 10), không cần thư viện
// ngoài.
async function nenAnh(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") return file;

  const bitmap = await createImageBitmap(file);
  const tiLe = Math.min(1, KICH_THUOC_TOI_DA / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * tiLe);
  const h = Math.round(bitmap.height * tiLe);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), "image/jpeg", CHAT_LUONG_JPEG);
  });
}

export async function taiAnhLen(file: File, thuMuc: string): Promise<string> {
  const supabase = createClient();
  const blob = await nenAnh(file);
  const tenFile = `${thuMuc}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;

  const { error } = await supabase.storage.from("anh-don-hang").upload(tenFile, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from("anh-don-hang").getPublicUrl(tenFile);
  return data.publicUrl;
}
