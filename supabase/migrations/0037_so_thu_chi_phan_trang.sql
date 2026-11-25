-- Sổ thu chi: tìm kiếm/phân trang trên toàn bộ dữ liệu và tính tổng theo bộ lọc.
-- Chạy sau 0036 trên database hiện có. Phiếu nhập tay chờ duyệt không hạch toán;
-- dòng đồng bộ từ thu_tien vẫn hạch toán ngay.

begin;

-- Toàn bộ phiếu nhập tay đang tồn tại tại thời điểm chạy migration là dữ liệu
-- lịch sử đã được chấp nhận. Ghi rõ nguồn chuyển đổi, không gán việc duyệt
-- cho một Admin cụ thể. Phiếu được lập sau migration vẫn chờ duyệt như thường.
alter table thu_chi add column duyet_du_lieu_cu boolean not null default false;
alter table thu_chi drop constraint chk_thu_chi_duyet_hop_le;
alter table thu_chi add constraint chk_thu_chi_duyet_hop_le check (
  (not da_duyet and nguoi_duyet is null and duyet_luc is null and not duyet_du_lieu_cu)
  or (da_duyet and duyet_luc is not null and ma_thu is null and
    ((duyet_du_lieu_cu and nguoi_duyet is null) or
     (not duyet_du_lieu_cu and nguoi_duyet is not null)))
);

create or replace function f_bi_thu_chi() returns trigger language plpgsql as $$
begin
  if new.ma_tc is null then new.ma_tc := f_ma_generic_moi('TC'); end if;
  if new.nguoi_tao is null then new.nguoi_tao := f_ma_nv_hien_tai(); end if;
  if auth.uid() is not null then new.nguoi_lap := f_ma_nv_hien_tai(); end if;
  new.da_duyet := false;
  new.nguoi_duyet := null;
  new.duyet_luc := null;
  new.duyet_du_lieu_cu := false;
  return new;
end; $$;

create or replace function f_chan_sua_thu_chi_dong_bo() returns trigger language plpgsql as $$
declare
  v_nguoi_hien_tai text := f_ma_nv_hien_tai();
  v_la_admin boolean := coalesce(f_vai_tro_hien_tai() = 'Admin', false);
begin
  if tg_op = 'DELETE' then
    if old.ma_thu is not null then raise exception 'Dòng tự đồng bộ từ Thu tiền không thể xóa trực tiếp.'; end if;
    if not v_la_admin then raise exception 'Chỉ Admin được xóa phiếu thu chi.'; end if;
    return old;
  end if;
  if old.ma_thu is not null then raise exception 'Dòng tự đồng bộ từ Thu tiền không thể sửa/duyệt trực tiếp.'; end if;
  if new.ma_tc is distinct from old.ma_tc or new.created_at is distinct from old.created_at then
    raise exception 'Không thể đổi mã phiếu hoặc thời điểm tạo phiếu.';
  end if;
  if new.nguoi_lap is distinct from old.nguoi_lap then raise exception 'Không thể đổi người lập phiếu.'; end if;
  if new.duyet_du_lieu_cu is distinct from old.duyet_du_lieu_cu then
    raise exception 'Không thể đổi nguồn duyệt phiếu.';
  end if;
  if old.da_duyet then
    if not v_la_admin then raise exception 'Chỉ Admin được sửa phiếu đã duyệt.'; end if;
    if not new.da_duyet or new.nguoi_duyet is distinct from old.nguoi_duyet or
       new.duyet_luc is distinct from old.duyet_luc then
      raise exception 'Không thể hủy duyệt hoặc thay đổi dấu vết duyệt phiếu.';
    end if;
    return new;
  end if;
  if new.da_duyet then
    if not v_la_admin then raise exception 'Chỉ Admin được duyệt phiếu thu chi.'; end if;
    if (to_jsonb(new) - array['da_duyet', 'nguoi_duyet', 'duyet_luc']) is distinct from
       (to_jsonb(old) - array['da_duyet', 'nguoi_duyet', 'duyet_luc']) then
      raise exception 'Không thể sửa nội dung phiếu trong lần duyệt.';
    end if;
    new.nguoi_duyet := v_nguoi_hien_tai;
    new.duyet_luc := now();
    return new;
  end if;
  if not v_la_admin and
     (f_vai_tro_hien_tai() not in ('Quản lý', 'Kế toán') or
      v_nguoi_hien_tai is null or old.nguoi_lap is distinct from v_nguoi_hien_tai) then
    raise exception 'Chỉ người lập phiếu hoặc Admin được sửa khi chưa duyệt.';
  end if;
  if new.nguoi_duyet is not null or new.duyet_luc is not null then
    raise exception 'Không thể tự điền thông tin duyệt phiếu.';
  end if;
  return new;
end; $$;

-- Chỉ tạm bỏ trigger bảo vệ trong chính transaction migration; audit vẫn ghi
-- lại các dòng được chuyển đổi với thuc_hien_boi = null.
alter table thu_chi disable trigger trg_chan_sua_thu_chi_dong_bo;
update thu_chi
set da_duyet = true, duyet_luc = now(), duyet_du_lieu_cu = true
where ma_thu is null and not da_duyet;
alter table thu_chi enable trigger trg_chan_sua_thu_chi_dong_bo;

create view v_thu_chi_danh_sach with (security_invoker = true) as
select tc.*,
       coalesce(d.mo_ta_su_co, tc.ten_cong_trinh) as ten_cong_trinh_hien_thi,
       nv.ho_ten as ho_ten_nguoi_thu_chi
from thu_chi tc
left join don_hang d on d.ma_don = tc.ma_don
left join nhan_vien nv on nv.ma_nv = tc.nguoi_tao;

grant select on v_thu_chi_danh_sach to authenticated;

create function f_tong_hop_thu_chi_loc(
  p_tu timestamptz,
  p_den timestamptz,
  p_loai text default null,
  p_noi_dung text default null,
  p_cong_trinh text default null,
  p_trang_thai text default null
)
returns table (
  tong_thu numeric,
  tong_chi numeric,
  thu_tien_mat numeric,
  chi_tien_mat numeric,
  cho_duyet_thu numeric,
  cho_duyet_chi numeric,
  so_phieu_cho_duyet bigint
)
language sql stable security invoker set search_path = public as $$
  with phieu as (
    select tc.*
    from thu_chi tc
    left join don_hang d on d.ma_don = tc.ma_don
    where tc.ngay >= p_tu and tc.ngay < p_den
      and (p_loai is null or tc.loai::text = p_loai)
      and (p_noi_dung is null or coalesce(tc.noi_dung_thu::text, tc.noi_dung_chi::text) = p_noi_dung)
      and (p_cong_trinh is null or coalesce(d.mo_ta_su_co, tc.ten_cong_trinh, '') ilike '%' || p_cong_trinh || '%')
      and (p_trang_thai is null or
        (p_trang_thai = 'cho-duyet' and tc.ma_thu is null and not tc.da_duyet) or
        (p_trang_thai = 'da-duyet' and tc.ma_thu is null and tc.da_duyet) or
        (p_trang_thai = 'tu-dong-bo' and tc.ma_thu is not null))
  )
  select
    coalesce(sum(so_tien) filter (where loai = 'Thu' and (da_duyet or ma_thu is not null)), 0),
    coalesce(sum(so_tien) filter (where loai = 'Chi' and (da_duyet or ma_thu is not null)), 0),
    coalesce(sum(so_tien) filter (where loai = 'Thu' and phuong_thuc = 'Tiền mặt' and (da_duyet or ma_thu is not null)), 0),
    coalesce(sum(so_tien) filter (where loai = 'Chi' and phuong_thuc = 'Tiền mặt' and (da_duyet or ma_thu is not null)), 0),
    coalesce(sum(so_tien) filter (where loai = 'Thu' and ma_thu is null and not da_duyet), 0),
    coalesce(sum(so_tien) filter (where loai = 'Chi' and ma_thu is null and not da_duyet), 0),
    count(*) filter (where ma_thu is null and not da_duyet)
  from phieu;
$$;

revoke all on function f_tong_hop_thu_chi_loc(timestamptz, timestamptz, text, text, text, text) from public;
grant execute on function f_tong_hop_thu_chi_loc(timestamptz, timestamptz, text, text, text, text) to authenticated;

-- Dashboard chỉ dùng phiếu đã duyệt hoặc dòng đồng bộ từ Thu tiền.
create or replace view v_thu_chi_tong_hop as
with hop_le as (
  select * from thu_chi where da_duyet or ma_thu is not null
)
select
  1 as id,
  coalesce(sum(so_tien) filter (where loai = 'Thu' and ngay::date = current_date), 0) as thu_hom_nay,
  coalesce(sum(so_tien) filter (where loai = 'Chi' and ngay::date = current_date), 0) as chi_hom_nay,
  coalesce(sum(so_tien) filter (where loai = 'Thu' and ngay >= date_trunc('month', now())), 0) as thu_thang_nay,
  coalesce(sum(so_tien) filter (where loai = 'Chi' and ngay >= date_trunc('month', now())), 0) as chi_thang_nay,
  coalesce(sum(so_tien) filter (where loai = 'Thu' and ngay >= date_trunc('year', now())), 0) as thu_nam_nay,
  coalesce(sum(so_tien) filter (where loai = 'Chi' and ngay >= date_trunc('year', now())), 0) as chi_nam_nay
from hop_le;

alter view v_thu_chi_tong_hop set (security_invoker = true);

commit;
