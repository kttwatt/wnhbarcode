-- Add stable codes to item groups/subgroups for robust referencing & scaling.
-- Codes decouple data imports/integrations from Thai display names so that
-- renaming a category never breaks references, and bulk inserts can match by
-- a short stable code instead of an exact Thai string.

-- 1) Fix the existing typo (for databases that were seeded before the fix).
update public.item_subgroups
set name = 'วัสดุวิทยาศาสตร์และการแพทย์'
where name = 'วัสดุวิทยศาสตร์และการแพทย์';

-- 2) Add nullable code columns (nullable so existing rows / new ad-hoc rows
--    are allowed to have no code yet).
alter table public.item_groups
  add column if not exists code text;
alter table public.item_subgroups
  add column if not exists code text;

-- 3) Backfill group codes (aligned with the seeded sort_order).
update public.item_groups set code = '1' where name = 'คุรุภัณฑ์' and code is null;
update public.item_groups set code = '2' where name = 'วัสดุ' and code is null;
update public.item_groups set code = '3' where name = 'ที่ดินและสิ่งปลูกสร้าง' and code is null;
update public.item_groups set code = '4' where name = 'ใช้สอย' and code is null;
update public.item_groups set code = '5' where name = 'บุคคลากร' and code is null;

-- 4) Backfill subgroup codes = <group code> + 2-digit sort order.
--    e.g. group "วัสดุ" (2) + "วัสดุการแพทย์" (sort_order 3) => "203".
update public.item_subgroups sg
set code = g.code || lpad(sg.sort_order::text, 2, '0')
from public.item_groups g
where sg.group_id = g.id
  and g.code is not null
  and sg.code is null;

-- 5) Enforce uniqueness while still allowing NULLs (partial unique indexes).
create unique index if not exists item_groups_code_key
  on public.item_groups (code) where code is not null;
create unique index if not exists item_subgroups_group_code_key
  on public.item_subgroups (group_id, code) where code is not null;
