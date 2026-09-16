-- =====================================================================
-- 0032: Sửa lỗi trigger chặn XÓA mọi dòng thu_chi, kể cả Admin.
--
-- 0030 gắn thêm "or delete" vào trigger trg_chan_sua_thu_chi_dong_bo,
-- nhưng hàm f_chan_sua_thu_chi_dong_bo() (viết từ 0027, chỉ cho UPDATE)
-- luôn "return new;" ở cuối. Trong trigger DELETE, NEW luôn là NULL —
-- return NULL từ 1 trigger BEFORE DELETE khiến Postgres NGẦM BỎ QUA
-- việc xóa dòng đó (không lỗi, không cảnh báo). Kết quả: xóa 1 phiếu
-- thu_chi bất kỳ (kể cả Admin, kể cả dòng không đồng bộ từ thu_tien)
-- luôn trả về 0 dòng bị xóa, y hệt như không có quyền — dù RLS/GRANT
-- đều đã đúng.
--
-- Sửa: chỉ raise exception khi có ma_thu (giữ nguyên hành vi chặn sync
-- cho cả update lẫn delete), rồi return theo đúng TG_OP — OLD cho
-- DELETE (cho phép xóa tiếp tục), NEW cho UPDATE (giữ nguyên như cũ).
-- =====================================================================

create or replace function f_chan_sua_thu_chi_dong_bo() returns trigger language plpgsql as $$
begin
  if old.ma_thu is not null then
    raise exception 'Dòng này tự động đồng bộ từ Thu tiền của đơn hàng — không thể sửa/xóa trực tiếp tại Sổ thu chi.';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end; $$;
