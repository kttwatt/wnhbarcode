-- Performance: targeted indexes + DB-side aggregation for scan history.
-- All changes are additive (indexes + new functions) and preserve existing
-- behaviour and RLS — they only reduce work done per request.

-- =========================================================
-- Indexes for hot query paths
-- =========================================================

-- Recent / frequent scans filter by (department_id, user_id) then sort by
-- scanned_at. The existing (department_id, scanned_at) index can't serve the
-- per-user filter efficiently once a department has many scans.
create index if not exists scan_logs_dept_user_scanned_at_idx
  on public.scan_logs (department_id, user_id, scanned_at desc);

-- Department item lists/counts always filter deleted_at is null and sort by
-- added_at desc. A partial index keeps it small and ordered.
create index if not exists department_items_dept_added_at_active_idx
  on public.department_items (department_id, added_at desc)
  where deleted_at is null;

-- Favorites are read per (user_id, department_id) ordered by sort_order.
create index if not exists user_favorites_user_dept_sort_idx
  on public.user_favorites (user_id, department_id, sort_order);

-- =========================================================
-- DB-side aggregation for scan history
-- Replaces fetching up to thousands of scan_logs rows and aggregating in JS.
-- security invoker => existing RLS on scan_logs / items still applies.
-- =========================================================

-- Most-frequently scanned items for the current user in a department,
-- within the last p_days, ranked by scan count.
create or replace function public.frequent_scanned_items(
  p_department_id uuid,
  p_days int default 30,
  p_limit int default 8
)
returns setof public.items
language sql
stable
security invoker
set search_path = public
as $$
  select i.*
  from public.scan_logs sl
  join public.items i on i.id = sl.item_id
  where sl.department_id = p_department_id
    and sl.user_id = auth.uid()
    and sl.scanned_at >= now() - make_interval(days => greatest(1, p_days))
    and i.deleted_at is null
  group by i.id
  order by count(*) desc, max(sl.scanned_at) desc
  limit greatest(1, p_limit);
$$;

-- Most-recently scanned distinct items for the current user in a department.
create or replace function public.recent_scanned_items(
  p_department_id uuid,
  p_limit int default 8
)
returns setof public.items
language sql
stable
security invoker
set search_path = public
as $$
  select i.*
  from public.items i
  join (
    select sl.item_id, max(sl.scanned_at) as last_scanned
    from public.scan_logs sl
    where sl.department_id = p_department_id
      and sl.user_id = auth.uid()
    group by sl.item_id
  ) recent on recent.item_id = i.id
  where i.deleted_at is null
  order by recent.last_scanned desc
  limit greatest(1, p_limit);
$$;

revoke all on function public.frequent_scanned_items(uuid, int, int) from public;
revoke all on function public.recent_scanned_items(uuid, int) from public;
grant execute on function public.frequent_scanned_items(uuid, int, int) to authenticated;
grant execute on function public.recent_scanned_items(uuid, int) to authenticated;
