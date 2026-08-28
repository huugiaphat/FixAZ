import Dexie, { type Table } from "dexie";

export interface HangDoiItem {
  id?: number;
  bang: string; // tên bảng Supabase
  thao_tac: "insert" | "update";
  gia_tri: Record<string, unknown>;
  dieu_kien?: Record<string, unknown>; // dùng khi thao_tac = "update" (eq theo từng cặp key/value)
  mo_ta: string; // mô tả ngắn hiển thị cho người dùng, VD "Nghiệm thu đơn SC-260827-001"
  tao_luc: string;
  loi_gan_nhat?: string;
}

class HgpOfflineDB extends Dexie {
  hang_doi!: Table<HangDoiItem, number>;

  constructor() {
    super("hgp_offline");
    this.version(1).stores({
      hang_doi: "++id, bang, tao_luc",
    });
  }
}

export const offlineDb = new HgpOfflineDB();
