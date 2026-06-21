-- WNHBarcode initial schema
create extension if not exists "pgcrypto";

-- departments
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text unique,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- item groups (กลุ่มพัสดุ)
create table if not exists public.item_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- item subgroups (กลุ่มย่อยพัสดุ)
create table if not exists public.item_subgroups (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.item_groups(id),
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(group_id, name)
);

-- profiles (linked to auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text not null,
  full_name text,
  department_id uuid references public.departments(id),
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

-- items (master catalog)
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  unit text not null,
  price numeric(12,2) not null default 0,
  barcode text not null unique,
  subgroup_id uuid not null references public.item_subgroups(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- department_items
create table if not exists public.department_items (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id),
  item_id uuid not null references public.items(id),
  added_by uuid references auth.users(id),
  added_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(department_id, item_id)
);

-- user favorites
create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_id uuid not null references public.items(id),
  department_id uuid not null references public.departments(id),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  unique(user_id, item_id)
);

-- scan logs
create table if not exists public.scan_logs (
  id uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id),
  item_id uuid not null references public.items(id),
  user_id uuid not null references auth.users(id),
  scanned_barcode text not null,
  scanned_at timestamptz not null default now()
);

create index if not exists scan_logs_dept_scanned_at_idx
  on public.scan_logs (department_id, scanned_at desc);

-- helpers
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.user_department_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select department_id from public.profiles where id = auth.uid();
$$;

create or replace function public.get_email_for_password_reset(input text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select email from public.profiles
  where username = input or email = input
  limit 1;
$$;

revoke all on function public.get_email_for_password_reset(text) from public;
grant execute on function public.get_email_for_password_reset(text) to service_role;

-- updated_at trigger for items
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists items_updated_at on public.items;
create trigger items_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- RLS
alter table public.departments enable row level security;
alter table public.item_groups enable row level security;
alter table public.item_subgroups enable row level security;
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.department_items enable row level security;
alter table public.user_favorites enable row level security;
alter table public.scan_logs enable row level security;

-- departments
create policy "departments_select_own_or_admin" on public.departments
  for select using (public.is_admin() or id = public.user_department_id());

create policy "departments_admin_all" on public.departments
  for all using (public.is_admin()) with check (public.is_admin());

-- item_groups
create policy "item_groups_select_authenticated" on public.item_groups
  for select to authenticated using (deleted_at is null or public.is_admin());

create policy "item_groups_admin_all" on public.item_groups
  for all using (public.is_admin()) with check (public.is_admin());

-- item_subgroups
create policy "item_subgroups_select_authenticated" on public.item_subgroups
  for select to authenticated using (deleted_at is null or public.is_admin());

create policy "item_subgroups_admin_all" on public.item_subgroups
  for all using (public.is_admin()) with check (public.is_admin());

-- profiles
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "profiles_insert_admin" on public.profiles
  for insert with check (public.is_admin() or auth.uid() = id);

-- items
create policy "items_select_active" on public.items
  for select to authenticated using (deleted_at is null or public.is_admin());

create policy "items_admin_all" on public.items
  for all using (public.is_admin()) with check (public.is_admin());

-- department_items
create policy "dept_items_select" on public.department_items
  for select using (public.is_admin() or department_id = public.user_department_id());

create policy "dept_items_insert" on public.department_items
  for insert with check (public.is_admin() or department_id = public.user_department_id());

create policy "dept_items_update" on public.department_items
  for update using (public.is_admin() or department_id = public.user_department_id())
  with check (public.is_admin() or department_id = public.user_department_id());

-- user_favorites
create policy "favorites_select_own" on public.user_favorites
  for select using (user_id = auth.uid() or public.is_admin());

create policy "favorites_insert_own" on public.user_favorites
  for insert with check (user_id = auth.uid());

create policy "favorites_delete_own" on public.user_favorites
  for delete using (user_id = auth.uid());

create policy "favorites_update_own" on public.user_favorites
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- scan_logs
create policy "scan_logs_select" on public.scan_logs
  for select using (public.is_admin() or department_id = public.user_department_id());

create policy "scan_logs_insert" on public.scan_logs
  for insert with check (
    user_id = auth.uid()
    and (public.is_admin() or department_id = public.user_department_id())
  );

-- seed departments
insert into public.departments (name, code) values
  ('คลัง', 'WH'),
  ('OR', 'OR'),
  ('ANC', 'ANC')
on conflict (name) do nothing;
