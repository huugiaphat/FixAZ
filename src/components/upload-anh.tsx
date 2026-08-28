"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, Loader2, X } from "lucide-react";
import { taiAnhLen } from "@/lib/upload-anh";
import { toast } from "sonner";

// Chụp ảnh trực tiếp từ camera hoặc chọn từ thư viện — nút bấm lớn,
// tối ưu cho Thợ ngoài hiện trường (Mục 9). `thuMuc` phân theo loại
// (hien-trang / phat-sinh / nghiem-thu) để dễ tra soát trên Storage.
export function UploadAnh({
  urls,
  onChange,
  thuMuc,
  batBuoc,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  thuMuc: string;
  batBuoc?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dangTai, setDangTai] = useState(false);

  async function xuLyChonFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setDangTai(true);
    try {
      const urlsMoi = await Promise.all(files.map((f) => taiAnhLen(f, thuMuc)));
      onChange([...urls, ...urlsMoi]);
    } catch (err) {
      toast.error(`Tải ảnh lên thất bại: ${(err as { message?: string })?.message ?? "lỗi không xác định"}`);
    } finally {
      setDangTai(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {urls.map((url, i) => (
          <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border">
            <Image src={url} alt={`Ảnh ${i + 1}`} fill className="object-cover" unoptimized />
            <button
              type="button"
              onClick={() => onChange(urls.filter((u) => u !== url))}
              className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white"
              aria-label="Xóa ảnh"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={dangTai}
          className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {dangTai ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
          <span className="text-[11px]">{dangTai ? "Đang tải…" : "Chụp ảnh"}</span>
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={xuLyChonFile}
      />
      {batBuoc && urls.length === 0 ? <p className="text-xs text-destructive">Bắt buộc phải có ít nhất 1 ảnh.</p> : null}
    </div>
  );
}
