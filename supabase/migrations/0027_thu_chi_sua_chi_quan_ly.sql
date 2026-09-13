-- =====================================================================
-- 0027: Cho phép SỬA phiếu thu chi đã tạo — trước đây thu_chi có quyền
-- UPDATE (0019) nhưng UI chưa có nút sửa nào cả. Theo yêu cầu: việc TẠO
-- phiếu vẫn giữ nguyên cho cả Quản lý/Kế toán (không đổi p_thu_chi_insert),
-- nhưng việc SỬA lại 1 phiếu đã tồn tại chỉ dành riêng cho Quản lý — Kế
-- toán nhập liệu, Quản lý mới được điều chỉnh khi có sai sót.
--
-- Đồng thời chặn CỨNG (ở tầng trigger, không chỉ UI) việc sửa các dòng
-- được tự động đồng bộ từ thu_tien (ma_thu not null, xem 0020) — sửa
-- trực tiếp dòng này trong Sổ thu chi sẽ làm lệch với bản ghi thu_tien
-- gốc của đơn hàng mà không có cách nào đồng bộ ngược lại.
-- =====================================================================

drop policy p_thu_chi_update on thu_chi;
create policy p_thu_chi_update on thu_chi for update to authenticated using (
  f_vai_tro_hien_tai() = 'Quản lý'
) with check (
  f_vai_tro_hien_tai() = 'Quản lý'
);

create function f_chan_sua_thu_chi_dong_bo() returns trigger language plpgsql as $$
begin
  if old.ma_thu is not null then
    raise exception 'Dòng này tự động đồng bộ từ Thu tiền của đơn hàng — không thể sửa trực tiếp tại Sổ thu chi.';
  end if;
  return new;
end; $$;

create trigger trg_chan_sua_thu_chi_dong_bo before update on thu_chi
  for each row execute function f_chan_sua_thu_chi_dong_bo();
