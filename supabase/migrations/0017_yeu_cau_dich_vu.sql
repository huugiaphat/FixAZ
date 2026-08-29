-- =====================================================================
-- 0017: Yêu cầu dịch vụ công khai (quét mã QR, không cần đăng nhập) —
-- khách điền form -> ghi vào bảng này qua Server Action dùng service
-- role (không cấp INSERT cho anon, đúng nguyên tắc "không grant quyền
-- không cần dùng" ở đầu 0012) -> CSKH nhận thông báo + xử lý qua màn
-- hình quản trị nội bộ.
-- =====================================================================

alter type loai_thong_bao_enum add value 'Yêu cầu dịch vụ mới';

create type trang_thai_yeu_cau_enum as enum ('Mới', 'Đã liên hệ', 'Đã tạo đơn', 'Đã hủy');

create table yeu_cau_dich_vu (
  ma_yc text primary key,
  ho_ten text not null,
  dia_chi text not null,
  sdt text not null,
  dich_vu dich_vu_enum not null,
  yeu_cau text not null,
  trang_thai trang_thai_yeu_cau_enum not null default 'Mới',
  ma_don text references don_hang (ma_don),
  created_at timestamptz not null default now()
);

comment on table yeu_cau_dich_vu is 'Yêu cầu dịch vụ gửi từ trang công khai /yeu-cau (khách quét QR, không cần tài khoản).';
create index idx_yeu_cau_dich_vu_trang_thai on yeu_cau_dich_vu (trang_thai);

create function f_bi_yeu_cau_dich_vu() returns trigger language plpgsql as $$
begin
  if new.ma_yc is null then new.ma_yc := f_ma_generic_moi('YC'); end if;
  return new;
end; $$;
create trigger trg_bi_yeu_cau_dich_vu before insert on yeu_cau_dich_vu
  for each row execute function f_bi_yeu_cau_dich_vu();

alter table thong_bao add column ma_yc text references yeu_cau_dich_vu (ma_yc);

-- Chỉ select/update cho authenticated (CSKH/Quản lý xử lý) — KHÔNG
-- grant insert cho ai, kể cả authenticated: việc tạo luôn đi qua
-- Server Action bằng service role (khách chưa đăng nhập lúc gửi).
alter table yeu_cau_dich_vu enable row level security;
grant select, update on yeu_cau_dich_vu to authenticated;

create policy p_ycdv_select on yeu_cau_dich_vu for select to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
);
create policy p_ycdv_update on yeu_cau_dich_vu for update to authenticated using (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
) with check (
  f_vai_tro_hien_tai() in ('Quản lý', 'CSKH-Điều phối')
);
