-- =====================================================================
-- 0003: Vòng đời đơn hàng — Đơn hàng (bảng trung tâm), Chi tiết đơn,
-- Báo giá, Phát sinh, Điều phối, Nghiệm thu, Thu tiền
-- Lưu ý: TongTien/DaThu/CongNo/ThanhTien KHÔNG có ở đây — sẽ là VIEW
-- tính toán động trong migration 0008.
-- =====================================================================

-- A3. Đơn hàng (02_DON_HANG) — BẢNG TRUNG TÂM
create table don_hang (
  ma_don text primary key,                          -- SC-YYMMDD-XXX, số thứ tự reset theo ngày
  ma_kh text not null references khach_hang (ma_kh),
  ngay_tiep_nhan timestamptz not null default now(),
  nguoi_tiep_nhan text not null references nhan_vien (ma_nv),
  dich_vu dich_vu_enum not null,
  mo_ta_su_co text not null,
  uu_tien uu_tien_enum not null,
  khung_gio_mong_muon text,
  anh_hien_trang text[] not null default '{}',       -- đường dẫn Supabase Storage
  hien_trang_khao_sat text,
  nguyen_nhan_khao_sat text,
  hang_muc_de_xuat text,
  trang_thai trang_thai_don_enum not null default 'Mới tiếp nhận',
  tho_phu_trach text references nhan_vien (ma_nv),
  ly_do_tu_choi_huy text,
  ngay_dong_don date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_ly_do_huy check (trang_thai <> 'Đã hủy' or ly_do_tu_choi_huy is not null)
);

comment on table don_hang is 'A3_DON_HANG — thực thể trung tâm, hầu hết các bảng khác tham chiếu tới.';
comment on column don_hang.anh_hien_trang is 'Ảnh chụp hiện trạng sự cố lúc tiếp nhận, có thể nhiều ảnh.';

create index idx_don_hang_ma_kh on don_hang (ma_kh);
create index idx_don_hang_tho on don_hang (tho_phu_trach);
create index idx_don_hang_trang_thai on don_hang (trang_thai);
create index idx_don_hang_ngay on don_hang (ngay_tiep_nhan);

-- A4. Chi tiết đơn (03_CHI_TIET_DON) — các dòng dịch vụ/vật tư chốt
-- trong báo giá cuối cùng
create table chi_tiet_don (
  ma_dong text primary key,
  ma_don text not null references don_hang (ma_don) on delete cascade,
  loai loai_hang_muc_enum not null,
  ma_dv_vt text,                                     -- tham chiếu mềm tới Bảng giá dịch vụ hoặc Vật tư
  ten_hang_muc text not null,
  so_luong numeric not null check (so_luong > 0),
  don_vi_tinh text,
  gia_von numeric,                                   -- nội bộ — ẩn với vai trò Thợ ở tầng API/view, không trả field này cho Thợ
  gia_ban numeric not null check (gia_ban >= 0),
  created_at timestamptz not null default now()
  -- ThanhTien = SoLuong * GiaBan -> xem view v_chi_tiet_don
);

comment on table chi_tiet_don is 'A4_CHI_TIET_DON.';
create index idx_chi_tiet_don_ma_don on chi_tiet_don (ma_don);

-- A5. Báo giá (04_BAO_GIA) — nhiều phiên bản cho 1 đơn
create table bao_gia (
  ma_bg text primary key,                            -- BG-YYMMDD-XXX
  ma_don text not null references don_hang (ma_don) on delete cascade,
  phien_ban integer not null default 1,
  tong_truoc_giam numeric not null check (tong_truoc_giam >= 0),
  giam_gia numeric not null default 0 check (giam_gia >= 0),
  tong_sau_giam numeric not null check (tong_sau_giam >= 0),
  nguoi_lap text not null references nhan_vien (ma_nv),
  nguoi_duyet text references nhan_vien (ma_nv),      -- bắt buộc nếu GiamGia vượt hạn mức — enforce ở 0009 (trigger)
  khach_xac_nhan boolean not null default false,      -- bắt buộc = true trước khi đơn chuyển "Đang thi công"
  ngay_xac_nhan timestamptz,
  pham_vi_bao_gom text,
  pham_vi_khong_bao_gom text,
  created_at timestamptz not null default now(),
  unique (ma_don, phien_ban)
);

comment on table bao_gia is 'A5_BAO_GIA.';
create index idx_bao_gia_ma_don on bao_gia (ma_don);

-- A6. Phát sinh (05_PHAT_SINH)
create table phat_sinh (
  ma_ps text primary key,                            -- PS-YYMMDD-XXX
  ma_don text not null references don_hang (ma_don) on delete cascade,
  nguyen_nhan text not null,
  anh_phat_sinh text[] not null default '{}',
  hang_muc text not null,
  gia numeric not null check (gia >= 0),
  khach_xac_nhan boolean not null default false,      -- bắt buộc trước khi làm, trừ khẩn cấp
  truong_hop_khan_cap boolean not null default false, -- ngoại lệ an toàn cấp thiết (nguyên tắc 2/3)
  ngay_xac_nhan timestamptz,
  created_at timestamptz not null default now()
);

comment on table phat_sinh is 'A6_PHAT_SINH.';
create index idx_phat_sinh_ma_don on phat_sinh (ma_don);
create index idx_phat_sinh_cho_xac_nhan on phat_sinh (khach_xac_nhan) where khach_xac_nhan = false;

-- A7. Điều phối (06_DIEU_PHOI)
create table dieu_phoi (
  ma_dp text primary key,
  ma_don text not null references don_hang (ma_don) on delete cascade,
  tho text not null references nhan_vien (ma_nv),
  gio_nhan timestamptz,
  gio_xuat_phat timestamptz,
  eta timestamptz,                                    -- có thể cập nhật lại nếu trễ
  check_in timestamptz,
  check_out timestamptz,
  trang_thai trang_thai_dieu_phoi_enum not null default 'Đã nhận',
  created_at timestamptz not null default now()
);

comment on table dieu_phoi is 'A7_DIEU_PHOI.';
create index idx_dieu_phoi_ma_don on dieu_phoi (ma_don);
create index idx_dieu_phoi_tho on dieu_phoi (tho);

-- A8. Nghiệm thu (07_NGHIEM_THU)
create table nghiem_thu (
  ma_nt text primary key,
  ma_don text not null references don_hang (ma_don) on delete cascade,
  cl_dung_pham_vi boolean not null default false,
  cl_dung_vat_tu boolean not null default false,
  cl_thiet_bi_van_hanh boolean not null default false,
  cl_khong_ro_ri boolean not null default false,
  cl_ve_sinh boolean not null default false,
  cl_huong_dan_khach boolean not null default false,
  anh_sau_sua text[] not null default '{}',
  y_kien_khach text,
  khach_xac_nhan boolean not null default false,       -- bắt buộc trước khi cho phép Thu tiền
  diem_danh_gia smallint check (diem_danh_gia between 1 and 5),
  ngay_nghiem_thu timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint chk_anh_sau_sua check (array_length(anh_sau_sua, 1) is not null and array_length(anh_sau_sua, 1) > 0)
);

comment on table nghiem_thu is 'A8_NGHIEM_THU — checklist 6 mục bắt buộc, ảnh sau sửa bắt buộc.';
create index idx_nghiem_thu_ma_don on nghiem_thu (ma_don);

-- A9. Thu tiền (08_THU_TIEN)
create table thu_tien (
  ma_thu text primary key,
  ma_don text not null references don_hang (ma_don) on delete cascade,
  so_tien numeric not null check (so_tien > 0),
  phuong_thuc phuong_thuc_thu_enum not null,
  ma_giao_dich text,                                   -- bắt buộc nếu Chuyển khoản/QR
  nguoi_thu text not null references nhan_vien (ma_nv),
  ngay_thu timestamptz not null default now(),
  da_nop_ve_cong_ty boolean not null default false,     -- áp dụng khi Tiền mặt
  created_at timestamptz not null default now(),
  constraint chk_ma_giao_dich check (
    phuong_thuc = 'Tiền mặt' or (ma_giao_dich is not null and length(trim(ma_giao_dich)) > 0)
  )
);

comment on table thu_tien is 'A9_THU_TIEN.';
create index idx_thu_tien_ma_don on thu_tien (ma_don);
create index idx_thu_tien_chua_nop on thu_tien (da_nop_ve_cong_ty) where phuong_thuc = 'Tiền mặt' and da_nop_ve_cong_ty = false;
