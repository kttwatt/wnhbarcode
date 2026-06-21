import { createServiceClient } from "@/lib/supabase/server";
import type { AuditLog } from "@/lib/types";

type SupabaseServer = Awaited<ReturnType<typeof createServiceClient>>;

async function attachActors(
  supabase: SupabaseServer,
  rows: Omit<AuditLog, "actor_profile">[]
): Promise<AuditLog[]> {
  const ids = [...new Set(rows.map((r) => r.actor_id).filter(Boolean) as string[])];

  let map = new Map<string, { username: string; full_name: string | null }>();
  if (ids.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id, username, full_name")
      .in("id", ids);
    map = new Map((data || []).map((p) => [p.id, p]));
  }

  return rows.map((row) => ({
    ...row,
    actor_profile: row.actor_id ? map.get(row.actor_id) ?? null : null,
  })) as AuditLog[];
}

export async function getAuditLogs(options?: {
  departmentId?: string;
  action?: string;
  since?: string;
  limit?: number;
}): Promise<{ logs: AuditLog[]; error: string | null }> {
  const supabase = await createServiceClient();
  let query = supabase
    .from("audit_logs")
    .select("*, departments(name)")
    .order("created_at", { ascending: false })
    .limit(options?.limit ?? 300);

  if (options?.departmentId) query = query.eq("department_id", options.departmentId);
  if (options?.action) query = query.eq("action", options.action);
  if (options?.since) query = query.gte("created_at", options.since);

  const { data, error } = await query;
  if (error) return { logs: [], error: error.message };

  const logs = await attachActors(
    supabase,
    (data || []) as Omit<AuditLog, "actor_profile">[]
  );
  return { logs, error: null };
}

export async function getDistinctAuditActions(): Promise<string[]> {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("action")
    .order("action")
    .limit(1000);

  return [...new Set((data || []).map((r) => r.action as string))];
}
