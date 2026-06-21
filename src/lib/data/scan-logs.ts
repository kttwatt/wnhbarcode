import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Department, ScanLog } from "@/lib/types";

const SCAN_LOG_SELECT =
  "*, items(code, name), departments(name)" as const;

async function attachProfiles(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: Omit<ScanLog, "profiles">[]
) {
  const userIds = [...new Set(rows.map((row) => row.user_id))];

  let profileMap = new Map<
    string,
    { username: string; full_name: string | null }
  >();

  if (userIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, username, full_name")
      .in("id", userIds);

    if (profileError) {
      return { logs: [] as ScanLog[], error: profileError.message };
    }

    profileMap = new Map(
      (profiles || []).map((profile) => [profile.id, profile])
    );
  }

  const logs = rows.map((row) => ({
    ...row,
    profiles: profileMap.get(row.user_id) ?? null,
  })) as ScanLog[];

  return { logs, error: null };
}

export async function getDepartmentScanLogs(
  departmentId: string,
  options?: {
    since?: string;
    limit?: number;
  }
) {
  const supabase = await createClient();
  const limit = options?.limit ?? 200;

  let query = supabase
    .from("scan_logs")
    .select(SCAN_LOG_SELECT)
    .eq("department_id", departmentId)
    .order("scanned_at", { ascending: false })
    .limit(limit);

  if (options?.since) {
    query = query.gte("scanned_at", options.since);
  }

  const { data, error } = await query;
  if (error) {
    return { logs: [] as ScanLog[], error: error.message };
  }

  return attachProfiles(supabase, (data || []) as Omit<ScanLog, "profiles">[]);
}

export async function getAdminScanLogs(options?: {
  departmentId?: string;
  search?: string;
  source?: string;
  since?: string;
  until?: string;
  page?: number;
  pageSize?: number;
}) {
  const supabase = await createServiceClient();
  const page = Math.max(0, options?.page ?? 0);
  const pageSize = options?.pageSize ?? 50;
  const from = page * pageSize;

  const term = options?.search?.trim();
  const select = term
    ? "*, items!inner(code, name, barcode), departments(name)"
    : SCAN_LOG_SELECT;

  let query = supabase
    .from("scan_logs")
    .select(select)
    .order("scanned_at", { ascending: false })
    .range(from, from + pageSize);

  if (options?.departmentId) query = query.eq("department_id", options.departmentId);
  if (options?.source) query = query.eq("scan_source", options.source);
  if (options?.since) query = query.gte("scanned_at", options.since);
  if (options?.until) query = query.lte("scanned_at", options.until);
  if (term) {
    const esc = term.replace(/[%_]/g, (m) => `\\${m}`);
    query = query.or(
      `code.ilike.%${esc}%,name.ilike.%${esc}%,barcode.ilike.%${esc}%`,
      { foreignTable: "items" }
    );
  }

  const { data, error } = await query;
  if (error) {
    return { logs: [] as ScanLog[], error: error.message, page, hasMore: false };
  }

  const rows = (data || []) as Omit<ScanLog, "profiles">[];
  const hasMore = rows.length > pageSize;
  const pageRows = hasMore ? rows.slice(0, pageSize) : rows;
  const { logs, error: profileError } = await attachProfiles(supabase, pageRows);

  return { logs, error: profileError, page, hasMore };
}

export async function getAdminDepartmentsForFilter() {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("departments")
    .select("id, name, code")
    .is("deleted_at", null)
    .order("name");

  return {
    departments: (data || []) as Department[],
    error: error?.message ?? null,
  };
}
