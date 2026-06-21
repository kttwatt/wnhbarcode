-- Point scan_logs.user_id at profiles so PostgREST can embed profiles(...)
alter table public.scan_logs
  drop constraint if exists scan_logs_user_id_fkey;

alter table public.scan_logs
  add constraint scan_logs_user_id_fkey
  foreign key (user_id) references public.profiles(id);
