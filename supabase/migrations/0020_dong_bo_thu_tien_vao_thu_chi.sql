-- =====================================================================
-- 0020: Đồng bộ tiền thu từ đơn hàng (thu_tien) vào Sổ thu chi (thu_chi)
-- Trước migration này, "Thu tiền" (thu nợ khách theo đơn) và "Sổ thu chi"
-- (thu/chi toàn công ty) là 2 sổ tách biệt — tiền thu từ khách KHÔNG
-- được hạch toán vào sổ thu chi tổng, khiến báo cáo "Thu chi" trên
-- Dashboard thiếu nguồn thu lớn nhất của công ty. Migration này thêm
-- trigger: mỗi lần có khoản thu mới ở thu_tien, tự tạo 1 dòng "Thu -
-- Thanh toán" tương ứng trong thu_chi, không cần nhập tay 2 lần.
-- =====================================================================

alter table thu_chi add column ma_thu text references thu_tien (ma_thu);
create unique index idx_thu_chi_ma_thu on thu_chi (ma_thu) where ma_thu is not null;

-- SECURITY DEFINER: bắt buộc, vì Thợ được phép tự thu tiền tại chỗ
-- (p_thu_insert cho phép Thợ) nhưng KHÔNG có quyền insert trực tiếp vào
-- thu_chi (p_thu_chi_insert chỉ cho Quản lý/Kế toán) — nếu không có
-- security definer, việc Thợ thu tiền sẽ bị RLS chặn khi trigger cố
-- ghi vào thu_chi.
create function f_dong_bo_thu_tien_vao_thu_chi() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into thu_chi (loai, ma_don, noi_dung_thu, so_tien, phuong_thuc, nguoi_tao, ngay, ma_thu)
  values ('Thu', new.ma_don, 'Thanh toán', new.so_tien, new.phuong_thuc, new.nguoi_thu, new.ngay_thu, new.ma_thu);
  return new;
end; $$;

create trigger trg_dong_bo_thu_tien_vao_thu_chi
  after insert on thu_tien
  for each row execute function f_dong_bo_thu_tien_vao_thu_chi();
