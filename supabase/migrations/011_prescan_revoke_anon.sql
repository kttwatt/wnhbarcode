-- Harden the prescan/audit SECURITY DEFINER functions so only signed-in
-- (authenticated) users can call them. They already validate access internally,
-- this removes the anon role from the exposed RPC surface (Supabase advisor 0028).
revoke execute on function public.add_prescan_item(uuid, uuid, int) from anon;
revoke execute on function public.cancel_prescan_item(uuid) from anon;
revoke execute on function public.complete_prescan_scan(uuid[]) from anon;
revoke execute on function public.log_audit(text, text, uuid, uuid, jsonb) from anon;
