-- =====================================================================
-- 0011: Hàm hỗ trợ Row-Level Security
-- f_ma_nv_hien_tai() / f_vai_tro_hien_tai() đã có ở 0007.
-- =====================================================================

-- Thợ có đang được điều phối/phụ trách đơn p_ma_don hay không — đây
-- là ràng buộc bắt buộc ở tầng dữ liệu theo Mục 2 ("chống nhận khách
-- riêng", nguyên tắc 6 tại Mục 5).
create function f_la_tho_cua_don(p_ma_don text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from don_hang where ma_don = p_ma_don and tho_phu_trach = f_ma_nv_hien_tai()
  ) or exists (
    select 1 from dieu_phoi where ma_don = p_ma_don and tho = f_ma_nv_hien_tai()
  );
$$;

create function f_la_tho_cua_kh(p_ma_kh text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from don_hang d
    where d.ma_kh = p_ma_kh and f_la_tho_cua_don(d.ma_don)
  );
$$;
