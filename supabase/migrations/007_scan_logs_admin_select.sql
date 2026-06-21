-- Ensure admins can read all scan logs; members see logs for their departments
drop policy if exists "scan_logs_select" on public.scan_logs;
create policy "scan_logs_select" on public.scan_logs
  for select using (
    public.is_admin()
    or public.user_has_department(department_id)
  );
