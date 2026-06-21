-- "จดไว้ก่อน" (prescan) — department-shared list persisted in DB,
-- plus a system-wide audit log. Replaces the previous localStorage-only flow.

-- =========================================================
-- prescan_items
-- =========================================================
create table if not exists public.prescan_items (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id),
  item_id uuid not null references public.items(id),
  qty int not null default 1 check (qty >= 1),
  status text not null default 'pending' check (status in ('pending', 'scanned', 'cancelled')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  scanned_by uuid references auth.users(id),
  scanned_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid references auth.users(id)
);

-- One active (pending, not soft-deleted) row per item per department.
-- scanned / cancelled / soft-deleted rows do not collide so the item can be noted again.
create unique index if not exists prescan_items_dept_item_pending_key
  on public.prescan_items (department_id, item_id)
  where status = 'pending' and deleted_at is null;

create index if not exists prescan_items_dept_status_idx
  on public.prescan_items (department_id, status, created_at desc)
  where deleted_at is null;

alter table public.prescan_items enable row level security;

create policy "prescan_select" on public.prescan_items
  for select using (public.is_admin() or department_id = public.user_department_id());
create policy "prescan_insert" on public.prescan_items
  for insert with check (public.is_admin() or department_id = public.user_department_id());
create policy "prescan_update" on public.prescan_items
  for update using (public.is_admin() or department_id = public.user_department_id())
  with check (public.is_admin() or department_id = public.user_department_id());
create policy "prescan_delete" on public.prescan_items
  for delete using (public.is_admin() or department_id = public.user_department_id());

-- keep updated_at fresh on any update
drop trigger if exists prescan_items_updated_at on public.prescan_items;
create trigger prescan_items_updated_at
  before update on public.prescan_items
  for each row execute function public.set_updated_at();

-- =========================================================
-- audit_logs (append-only, admin-readable)
-- =========================================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  department_id uuid references public.departments(id),
  action text not null,
  entity text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_dept_created_idx
  on public.audit_logs (department_id, created_at desc);
create index if not exists audit_logs_action_created_idx
  on public.audit_logs (action, created_at desc);

alter table public.audit_logs enable row level security;

-- only admins may read; inserts happen via SECURITY DEFINER functions below.
create policy "audit_select_admin" on public.audit_logs
  for select using (public.is_admin());

-- =========================================================
-- audit helper (append-only; bypasses RLS via security definer)
-- =========================================================
create or replace function public.log_audit(
  p_action text,
  p_entity text,
  p_entity_id uuid,
  p_department_id uuid,
  p_metadata jsonb default '{}'::jsonb
)
returns void language sql security definer set search_path = public as $$
  insert into public.audit_logs (actor_id, department_id, action, entity, entity_id, metadata)
  values (auth.uid(), p_department_id, p_action, p_entity, p_entity_id, coalesce(p_metadata, '{}'::jsonb));
$$;

revoke all on function public.log_audit(text, text, uuid, uuid, jsonb) from public;
grant execute on function public.log_audit(text, text, uuid, uuid, jsonb) to authenticated;

-- =========================================================
-- add_prescan_item — atomic upsert/increment + self-contained auth checks
-- (security definer bypasses RLS so it must validate access itself)
-- =========================================================
create or replace function public.add_prescan_item(
  p_department_id uuid,
  p_item_id uuid,
  p_qty int default 1
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_id uuid;
begin
  if not (public.is_admin() or p_department_id = public.user_department_id()) then
    raise exception 'forbidden: not your department';
  end if;

  if not exists (
    select 1 from public.department_items
    where department_id = p_department_id and item_id = p_item_id and deleted_at is null
  ) then
    raise exception 'item not in department';
  end if;

  insert into public.prescan_items (department_id, item_id, qty, created_by)
  values (p_department_id, p_item_id, greatest(1, p_qty), auth.uid())
  on conflict (department_id, item_id) where status = 'pending' and deleted_at is null
  do update set qty = greatest(1, public.prescan_items.qty + p_qty),
                updated_at = now()
  returning id into v_id;

  perform public.log_audit(
    case when p_qty < 0 then 'prescan.decrement' else 'prescan.add' end,
    'prescan_items', v_id, p_department_id,
    jsonb_build_object('item_id', p_item_id, 'qty_delta', p_qty)
  );

  return v_id;
end;
$$;

revoke all on function public.add_prescan_item(uuid, uuid, int) from public;
grant execute on function public.add_prescan_item(uuid, uuid, int) to authenticated;

-- =========================================================
-- cancel_prescan_item — soft delete (status=cancelled) + audit
-- =========================================================
create or replace function public.cancel_prescan_item(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_dept uuid;
  v_item uuid;
begin
  select department_id, item_id into v_dept, v_item
  from public.prescan_items
  where id = p_id and status = 'pending' and deleted_at is null
  for update;

  if v_dept is null then
    raise exception 'prescan item not found';
  end if;

  if not (public.is_admin() or v_dept = public.user_department_id()) then
    raise exception 'forbidden: not your department';
  end if;

  update public.prescan_items
    set status = 'cancelled', deleted_at = now(), deleted_by = auth.uid(), updated_at = now()
    where id = p_id;

  perform public.log_audit('prescan.cancel', 'prescan_items', p_id, v_dept,
    jsonb_build_object('item_id', v_item));
end;
$$;

revoke all on function public.cancel_prescan_item(uuid) from public;
grant execute on function public.cancel_prescan_item(uuid) to authenticated;

-- =========================================================
-- complete_prescan_scan — insert scan_logs + mark scanned, all in one tx
-- Only touches the ids passed in (does not clear rows others just added).
-- =========================================================
create or replace function public.complete_prescan_scan(p_ids uuid[])
returns int language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_count int := 0;
begin
  for r in
    select id, department_id, item_id, qty
    from public.prescan_items
    where id = any(p_ids) and status = 'pending' and deleted_at is null
      and (public.is_admin() or department_id = public.user_department_id())
    for update
  loop
    insert into public.scan_logs (department_id, item_id, user_id, scanned_barcode, scan_source)
    select r.department_id, r.item_id, auth.uid(), i.barcode, 'manual_confirm'
    from public.items i, generate_series(1, r.qty)
    where i.id = r.item_id;

    update public.prescan_items
      set status = 'scanned', scanned_by = auth.uid(), scanned_at = now(), updated_at = now()
      where id = r.id;

    perform public.log_audit('prescan.scan', 'prescan_items', r.id, r.department_id,
      jsonb_build_object('item_id', r.item_id, 'qty', r.qty));

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function public.complete_prescan_scan(uuid[]) from public;
grant execute on function public.complete_prescan_scan(uuid[]) to authenticated;

-- =========================================================
-- Realtime: broadcast prescan changes to department members
-- =========================================================
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.prescan_items;
    exception when duplicate_object then null;
    end;
  end if;
end $$;

-- =========================================================
-- Search performance for large item catalogs (server-side ilike/trigram)
-- =========================================================
create extension if not exists pg_trgm;
create index if not exists items_search_trgm_idx
  on public.items using gin ((code || ' ' || name || ' ' || barcode) gin_trgm_ops);
