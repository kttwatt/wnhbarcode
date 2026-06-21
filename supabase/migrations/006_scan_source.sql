-- Track how a scan was recorded
alter table public.scan_logs
  add column if not exists scan_source text not null default 'scanner'
  check (scan_source in ('scanner', 'manual_confirm'));
