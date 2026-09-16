-- 0028: Qui mô đơn hàng và luồng thu tiền trực tiếp cho Công trình.
begin;

alter table don_hang add column qui_mo text not null default 'Sửa nhanh'
  constraint chk_don_hang_qui_mo check (qui_mo in ('Sửa nhanh', 'Công trình'));

-- Chốt qui mô khi tạo, tránh đổi qui mô để vượt các bước của đơn sửa nhanh.
create function f_don_hang_qui_mo() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    if new.qui_mo = 'Công trình' then
      new.trang_thai := 'Đã nghiệm thu - chờ thu tiền';
    end if;
  elsif new.qui_mo is distinct from old.qui_mo then
    raise exception 'Không thể thay đổi qui mô sau khi tạo đơn hàng.';
  end if;
  return new;
end; $$;

create trigger trg_don_hang_qui_mo before insert or update on don_hang
  for each row execute function f_don_hang_qui_mo();

-- Giữ thứ tự cột cũ để không ảnh hưởng các view phụ thuộc; thêm qui_mo cuối.
create or replace view v_don_hang with (security_invoker = true) as
select
  d.ma_don, d.ma_kh, d.ngay_tiep_nhan, d.nguoi_tiep_nhan, d.dich_vu, d.mo_ta_su_co, d.uu_tien, d.khung_gio_mong_muon, d.anh_hien_trang, d.hien_trang_khao_sat, d.nguyen_nhan_khao_sat, d.hang_muc_de_xuat, d.trang_thai, d.tho_phu_trach, d.ly_do_tu_choi_huy, d.ngay_dong_don, d.created_at, d.updated_at,
  coalesce(ct.tong_chi_tiet, 0) + coalesce(ps.tong_phat_sinh, 0) as tong_tien,
  coalesce(t.tong_da_thu, 0) as da_thu,
  (coalesce(ct.tong_chi_tiet, 0) + coalesce(ps.tong_phat_sinh, 0)) - coalesce(t.tong_da_thu, 0) as cong_no,
  d.qui_mo
from don_hang d
left join (
  select ma_don, sum(so_luong * gia_ban) as tong_chi_tiet
  from chi_tiet_don group by ma_don
) ct on ct.ma_don = d.ma_don
left join (
  select ma_don, sum(gia) as tong_phat_sinh
  from phat_sinh where khach_xac_nhan = true group by ma_don
) ps on ps.ma_don = d.ma_don
left join (
  select ma_don, sum(so_tien) as tong_da_thu
  from thu_tien group by ma_don
) t on t.ma_don = d.ma_don;

-- Giữ nguyên phân quyền, đồ thị trạng thái và kiểm tra công nợ.
-- Chỉ Sửa nhanh cần xác nhận báo giá/nghiệm thu khi đóng đơn.
create or replace function f_chuyen_trang_thai_don(
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
  perform set_config('app.bypass_state_guard', 'true', true);

  select * into v_don from don_hang where ma_don = p_ma_don for update;
  if not found then
    raise exception 'Không tìm thấy đơn hàng %', p_ma_don;
  end if;

  v_vai_tro := f_vai_tro_hien_tai();

  if not (
    v_vai_tro in ('Quản lý', 'CSKH-Điều phối')
    or (v_vai_tro = 'Thợ' and f_la_tho_cua_don(p_ma_don))
  ) then
    raise exception 'Vai trò % không có quyền chuyển trạng thái đơn hàng.', v_vai_tro;
  end if;

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

    if v_don.qui_mo = 'Sửa nhanh' and not v_co_bao_gia_xac_nhan then
      raise exception 'Chưa có báo giá được khách xác nhận — không thể đóng đơn (nguyên tắc 8).';
    end if;
    if v_don.qui_mo = 'Sửa nhanh' and not v_co_nghiem_thu_xac_nhan then
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

create or replace function f_bi_thu_tien_kiem_tra() returns trigger language plpgsql as $$
begin
  if exists (select 1 from don_hang where ma_don = new.ma_don and qui_mo = 'Công trình') then
    return new;
  end if;
  if not exists (select 1 from nghiem_thu where ma_don = new.ma_don and khach_xac_nhan = true) then
    raise exception 'Đơn % chưa có nghiệm thu được khách xác nhận — chưa được phép thu tiền (Mục 6.6).', new.ma_don;
  end if;
  return new;
end; $$;

comment on function f_chuyen_trang_thai_don is 'Chuyển trạng thái có phân quyền; Sửa nhanh cần báo giá và nghiệm thu xác nhận, Công trình bỏ qua; đóng đơn luôn cần công nợ bằng 0.';
comment on column don_hang.qui_mo is 'Qui mô: Sửa nhanh giữ quy trình cũ; Công trình thu tiền trực tiếp.';

commit;
