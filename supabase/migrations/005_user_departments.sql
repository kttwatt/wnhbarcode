-- Multi-department membership per user
create table if not exists public.user_departments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  department_id uuid not null references public.departments(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, department_id)
);

create index if not exists user_departments_user_id_idx
  on public.user_departments (user_id);

-- Backfill from profiles.department_id
insert into public.user_departments (user_id, department_id)
select id, department_id
from public.profiles
where department_id is not null
on conflict (user_id, department_id) do nothing;

create or replace function public.user_has_department(dept uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
    or exists (
      select 1 from public.user_departments ud
      where ud.user_id = auth.uid() and ud.department_id = dept
    )
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.department_id = dept
    );
$$;

-- departments: allow users to see all departments they belong to
drop policy if exists "departments_select_own_or_admin" on public.departments;
create policy "departments_select_own_or_admin" on public.departments
  for select using (public.is_admin() or public.user_has_department(id));

-- department_items
drop policy if exists "dept_items_select" on public.department_items;
create policy "dept_items_select" on public.department_items
  for select using (public.user_has_department(department_id));

drop policy if exists "dept_items_insert" on public.department_items;
create policy "dept_items_insert" on public.department_items
  for insert with check (public.user_has_department(department_id));

drop policy if exists "dept_items_update" on public.department_items;
create policy "dept_items_update" on public.department_items
  for update using (public.user_has_department(department_id))
  with check (public.user_has_department(department_id));

-- scan_logs
drop policy if exists "scan_logs_select" on public.scan_logs;
create policy "scan_logs_select" on public.scan_logs
  for select using (public.user_has_department(department_id));

drop policy if exists "scan_logs_insert" on public.scan_logs;
create policy "scan_logs_insert" on public.scan_logs
  for insert with check (
    user_id = auth.uid()
    and public.user_has_department(department_id)
  );

-- user_departments RLS
alter table public.user_departments enable row level security;

create policy "user_departments_select_own_or_admin" on public.user_departments
  for select using (user_id = auth.uid() or public.is_admin());

create policy "user_departments_admin_all" on public.user_departments
  for all using (public.is_admin()) with check (public.is_admin());
