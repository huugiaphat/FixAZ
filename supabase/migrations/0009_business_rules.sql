-- =====================================================================
-- 0009: 8 nguyên tắc nghiệp vụ bắt buộc (Mục 5) — ràng buộc cứng ở
-- tầng CSDL/backend, không chỉ cảnh báo giao diện.
--
-- Nguyên tắc 1 (mọi bản ghi phải gắn Mã đơn hợp lệ)  -> NOT NULL FK, đã có ở 0003-0005.
-- Nguyên tắc 3 (phát sinh cần xác nhận trước khi làm) -> nhắc tự động (Mục 7 / phase thông báo), không chặn cứng vì bản thân tài liệu mô tả đây là cơ chế "cảnh báo/nhắc nhở", trừ khẩn cấp.
-- Nguyên tắc 4 (mọi đơn phải có dấu vết)              -> audit_log generic trigger, xem 0010.
-- Nguyên tắc 5 (tiền thu phải ghi nhận & đối soát)    -> bảng thu_tien + cờ da_nop_ve_cong_ty, đã có ở 0003.
-- Nguyên tắc 6 (chỉ Quản lý/CSKH-Điều phối tạo KH/Đơn) -> RLS INSERT policy, xem 0012.
-- Nguyên tắc 2, 7, 8                                   -> enforce ở migration này.
-- =====================================================================

-- Nguyên tắc 7: giảm giá vượt hạn mức % (cau_hinh_he_thong) bắt buộc
-- có NguoiDuyet; đồng thời luôn tính lại TongSauGiam từ 2 số nhập vào
-- để tránh sai lệch dữ liệu client gửi lên.
create function f_bi_bao_gia_kiem_tra() returns trigger language plpgsql as $$
declare
  v_han_muc numeric;
  v_phan_tram numeric;
begin
  select gia_tri::numeric into v_han_muc from cau_hinh_he_thong where khoa = 'HAN_MUC_GIAM_GIA_PHAN_TRAM';
  if new.tong_truoc_giam > 0 then
    v_phan_tram := (new.giam_gia / new.tong_truoc_giam) * 100;
  else
    v_phan_tram := 0;
  end if;

  if v_phan_tram > coalesce(v_han_muc, 0) and new.nguoi_duyet is null then
    raise exception 'Giảm giá %% (%.1f%%) vượt hạn mức %.1f%% — bắt buộc phải có người phê duyệt (nguyên tắc 7).', v_phan_tram, v_han_muc;
  end if;

  new.tong_sau_giam := new.tong_truoc_giam - new.giam_gia;
  return new;
end; $$;

create trigger trg_bao_gia_kiem_tra before insert or update on bao_gia
  for each row execute function f_bi_bao_gia_kiem_tra();

-- Chuyển trạng thái Đơn hàng qua RPC duy nhất — client KHÔNG được
-- UPDATE trực tiếp cột trang_thai (chặn ở RLS UPDATE policy, xem 0012),
-- bắt buộc gọi hàm này để đảm bảo đi qua toàn bộ kiểm tra nguyên tắc.
create function f_chuyen_trang_thai_don(
  p_ma_don text,
  p_trang_thai_moi trang_thai_don_enum,
  p_ly_do_huy text default null,
  p_xac_nhan_khan_cap boolean default false
) returns don_hang language plpgsql security definer set search_path = public as $$
declare
  v_don don_hang;
  v_co_bao_gia_xac_nhan boolean;
  v_co_nghiem_thu_xac_nhan boolean;
  v_cong_no numeric;
  v_vai_tro vai_tro_enum;
begin
  -- Cho phép UPDATE cột trang_thai đi qua trong transaction này — xem
  -- trigger chặn f_bi_don_hang_chan_doi_thang bên dưới. Đây là CÁCH
  -- DUY NHẤT hợp lệ để đổi trạng thái, kể cả với vai trò Quản lý.
  perform set_config('app.bypass_state_guard', 'true', true);

  select * into v_don from don_hang where ma_don = p_ma_don for update;
  if not found then
    raise exception 'Không tìm thấy đơn hàng %', p_ma_don;
  end if;

  v_vai_tro := f_vai_tro_hien_tai();

  -- Đồ thị chuyển trạng thái hợp lệ (rút gọn từ quy trình 17 bước, Mục 4)
  if p_trang_thai_moi <> 'Đã hủy' then
    if not (
      (v_don.trang_thai = 'Mới tiếp nhận' and p_trang_thai_moi = 'Đã điều phối') or
      (v_don.trang_thai = 'Đã điều phối' and p_trang_thai_moi = 'Đang khảo sát') or
      (v_don.trang_thai = 'Đang khảo sát' and p_trang_thai_moi = 'Chờ duyệt báo giá') or
      (v_don.trang_thai = 'Chờ duyệt báo giá' and p_trang_thai_moi = 'Đang thi công') or
      (v_don.trang_thai = 'Đang thi công' and p_trang_thai_moi = 'Chờ nghiệm thu') or
      (v_don.trang_thai = 'Chờ nghiệm thu' and p_trang_thai_moi = 'Đã nghiệm thu - chờ thu tiền') or
      (v_don.trang_thai = 'Đã nghiệm thu - chờ thu tiền' and p_trang_thai_moi = 'Đã đóng')
    ) then
      raise exception 'Không được chuyển trạng thái từ "%" sang "%"', v_don.trang_thai, p_trang_thai_moi;
    end if;
  else
    if v_don.trang_thai in ('Đã đóng', 'Đã hủy') then
      raise exception 'Đơn đã "%" không thể hủy', v_don.trang_thai;
    end if;
    if p_ly_do_huy is null or length(trim(p_ly_do_huy)) = 0 then
      raise exception 'Bắt buộc nhập lý do khi hủy đơn (nguyên tắc bắt buộc tại Mục 6.2)';
    end if;
  end if;

  -- Nguyên tắc 2: không thi công nếu chưa có báo giá được khách xác
  -- nhận, trừ khi Quản lý xác nhận xử lý an toàn khẩn cấp.
  if p_trang_thai_moi = 'Đang thi công' then
    select exists (select 1 from bao_gia where ma_don = p_ma_don and khach_xac_nhan = true)
      into v_co_bao_gia_xac_nhan;
    if not v_co_bao_gia_xac_nhan and not (p_xac_nhan_khan_cap and v_vai_tro = 'Quản lý') then
      raise exception 'Chưa có báo giá được khách xác nhận — không thể chuyển "Đang thi công" (nguyên tắc 2), trừ khi Quản lý xác nhận xử lý an toàn khẩn cấp.';
    end if;
  end if;

  -- Nguyên tắc 8: đóng đơn cần đủ báo giá xác nhận + nghiệm thu xác
  -- nhận + công nợ = 0.
  if p_trang_thai_moi = 'Đã đóng' then
    select exists (select 1 from bao_gia where ma_don = p_ma_don and khach_xac_nhan = true)
      into v_co_bao_gia_xac_nhan;
    select exists (select 1 from nghiem_thu where ma_don = p_ma_don and khach_xac_nhan = true)
      into v_co_nghiem_thu_xac_nhan;
    select cong_no into v_cong_no from v_don_hang where ma_don = p_ma_don;

    if not v_co_bao_gia_xac_nhan then
      raise exception 'Chưa có báo giá được khách xác nhận — không thể đóng đơn (nguyên tắc 8).';
    end if;
    if not v_co_nghiem_thu_xac_nhan then
      raise exception 'Chưa có nghiệm thu được khách xác nhận — không thể đóng đơn (nguyên tắc 8).';
    end if;
    if coalesce(v_cong_no, 0) <> 0 then
      raise exception 'Công nợ còn %, chưa thu đủ tiền — không thể đóng đơn (nguyên tắc 8).', v_cong_no;
    end if;
  end if;

  update don_hang
    set trang_thai = p_trang_thai_moi,
        ly_do_tu_choi_huy = case when p_trang_thai_moi = 'Đã hủy' then p_ly_do_huy else ly_do_tu_choi_huy end,
        ngay_dong_don = case when p_trang_thai_moi = 'Đã đóng' then current_date else ngay_dong_don end
    where ma_don = p_ma_don
    returning * into v_don;

  return v_don;
end; $$;

comment on function f_chuyen_trang_thai_don is 'Cổng chuyển trạng thái Đơn hàng duy nhất — enforce nguyên tắc 2 và 8 (Mục 5). Nghiệm thu chỉ được phép ghi Thu tiền khi nghiem_thu.khach_xac_nhan = true, xem check ở f_bi_thu_tien_kiem_tra bên dưới.';

-- Nghiệm thu: bắt buộc khách xác nhận trước khi được phép Thu tiền
-- (Mục 6.6 "Cờ xác nhận của khách - bắt buộc trước khi được phép thu tiền").
create function f_bi_thu_tien_kiem_tra() returns trigger language plpgsql as $$
declare
  v_co_nghiem_thu_xac_nhan boolean;
begin
  select exists (select 1 from nghiem_thu where ma_don = new.ma_don and khach_xac_nhan = true)
    into v_co_nghiem_thu_xac_nhan;
  if not v_co_nghiem_thu_xac_nhan then
    raise exception 'Đơn % chưa có nghiệm thu được khách xác nhận — chưa được phép thu tiền (Mục 6.6).', new.ma_don;
  end if;
  return new;
end; $$;

create trigger trg_thu_tien_kiem_tra before insert on thu_tien
  for each row execute function f_bi_thu_tien_kiem_tra();

-- Chặn UPDATE trực tiếp vào trang_thai/ly_do_tu_choi_huy/ngay_dong_don
-- của don_hang từ bất kỳ ai — bắt buộc phải qua f_chuyen_trang_thai_don
-- (đảm bảo state machine + nguyên tắc 2/8 luôn được kiểm tra đầy đủ,
-- không có đường tắt nào khác kể cả từ vai trò Quản lý).
create function f_bi_don_hang_chan_doi_thang() returns trigger language plpgsql as $$
begin
  if (new.trang_thai is distinct from old.trang_thai
      or new.ly_do_tu_choi_huy is distinct from old.ly_do_tu_choi_huy
      or new.ngay_dong_don is distinct from old.ngay_dong_don)
     and coalesce(current_setting('app.bypass_state_guard', true), 'false') <> 'true'
  then
    raise exception 'Phải dùng hàm f_chuyen_trang_thai_don() để đổi trạng thái đơn hàng, không được UPDATE trực tiếp cột trang_thai.';
  end if;
  return new;
end; $$;

create trigger trg_don_hang_chan_doi_thang before update on don_hang
  for each row execute function f_bi_don_hang_chan_doi_thang();
