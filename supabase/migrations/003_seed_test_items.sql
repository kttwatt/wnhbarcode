-- Test items: Surgical Blade
insert into public.items (code, name, unit, price, barcode, subgroup_id)
select v.code, v.name, 'ชุด', 7.00, v.code, sg.id
from (values
  ('10000438', 'Surgical Blad No.10'),
  ('10000439', 'Surgical Blad No.11'),
  ('10000441', 'Surgical Blad No.15'),
  ('10000442', 'Surgical Blad No.20'),
  ('10000443', 'Surgical Blad No.23')
) as v(code, name)
cross join (
  select id from public.item_subgroups where name = 'วัสดุการแพทย์' limit 1
) sg
on conflict (code) do nothing;

insert into public.department_items (department_id, item_id)
select d.id, i.id
from public.departments d
cross join public.items i
where d.code in ('WH', 'OR')
  and i.code in ('10000438','10000439','10000441','10000442','10000443')
on conflict (department_id, item_id) do nothing;
