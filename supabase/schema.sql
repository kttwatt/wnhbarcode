-- Supabase schema for WNH Barcode

-- extensions
create extension if not exists "pgcrypto";

-- departments
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  created_at timestamp with time zone default now()
);

-- categories
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamp with time zone default now()
);

-- barcodes
create table if not exists barcodes (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  category_id uuid references categories(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- many-to-many barcode_departments
create table if not exists barcode_departments (
  barcode_id uuid references barcodes(id) on delete cascade,
  dept_id uuid references departments(id) on delete cascade,
  primary key (barcode_id, dept_id)
);

-- users (application-level)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text not null,
  role text not null,
  dept_id uuid references departments(id),
  created_at timestamp with time zone default now()
);

-- Seed common departments
insert into departments (id, name, code) values
  (gen_random_uuid(), 'คลัง', 'WH'),
  (gen_random_uuid(), 'OR', 'OR'),
  (gen_random_uuid(), 'ANC', 'ANC')
on conflict do nothing;

-- Notes for RLS and policies:
-- 1) Use Supabase Auth to manage authentication (users table can mirror auth users)
-- 2) Create RLS policies so `dept` role users can only see/insert barcode_departments rows for their dept
-- Example policy hints (apply via Supabase SQL editor):
-- enable row level security for barcodes table
-- alter table barcodes enable row level security;
-- create policy "allow select for admin" on barcodes using (auth.role() = 'admin');

-- Because concrete RLS depends on your auth->users mapping, create policies after hooking auth up.
