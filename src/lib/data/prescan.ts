import { cache } from "react";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { ITEM_EMBED } from "@/lib/data/item-fields";
import type { Item, PrescanItem } from "@/lib/types";

/** Items older than this (pending) are flagged as "stuck/aging". */
export const PRESCAN_STALE_HOURS = 24;

const PRESCAN_SELECT = `*, ${ITEM_EMBED}` as const;

type RawPrescanRow = Omit<PrescanItem, "item"> & {
  items?: Item | Item[] | null;
};

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

function normalizeItem(items: Item | Item[] | null | undefined): Item | null {
  if (!items) return null;
  return Array.isArray(items) ? items[0] ?? null : items;
}

async function attachProfiles(
  supabase: SupabaseServer,
  rows: RawPrescanRow[]
): Promise<PrescanItem[]> {
  const ids = [
    ...new Set(
      rows.flatMap((r) => [r.created_by, r.scanned_by]).filter(Boolean) as string[]
    ),
  ];

  let profileMap = new Map<
    string,
    { username: string; full_name: string | null }
  >();

  if (ids.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, full_name")
      .in("id", ids);
    profileMap = new Map((profiles || []).map((p) => [p.id, p]));
  }

  return rows.map((row) => {
    const { items, ...rest } = row;
    return {
      ...rest,
      item: normalizeItem(items),
      created_by_profile: row.created_by
        ? profileMap.get(row.created_by) ?? null
        : null,
      scanned_by_profile: row.scanned_by
        ? profileMap.get(row.scanned_by) ?? null
        : null,
    } as PrescanItem;
  });
}

export function isPrescanStale(createdAt: string): boolean {
  const ageMs = Date.now() - new Date(createdAt).getTime();
  return ageMs > PRESCAN_STALE_HOURS * 60 * 60 * 1000;
}

/** Pending prescan list for a department (shared by all department members). */
export async function getPrescanItems(
  departmentId: string
): Promise<PrescanItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("prescan_items")
    .select(PRESCAN_SELECT)
    .eq("department_id", departmentId)
    .eq("status", "pending")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  return attachProfiles(supabase, (data || []) as RawPrescanRow[]);
}

// Memoized per request: the sidebar (layout) and the scan page both ask for
// this count in the same render, so dedupe it to a single query.
export const getPrescanPendingCount = cache(async (
  departmentId: string
): Promise<number> => {
  const supabase = await createClient();
  const { count } = await supabase
    .from("prescan_items")
    .select("*", { count: "exact", head: true })
    .eq("department_id", departmentId)
    .eq("status", "pending")
    .is("deleted_at", null);

  return count ?? 0;
});

/** Recently scanned prescan rows for the department history view. */
export async function getPrescanHistory(
  departmentId: string,
  limit = 50
): Promise<PrescanItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("prescan_items")
    .select(PRESCAN_SELECT)
    .eq("department_id", departmentId)
    .eq("status", "scanned")
    .order("scanned_at", { ascending: false })
    .limit(limit);

  return attachProfiles(supabase, (data || []) as RawPrescanRow[]);
}

/** Server-side search within a department's items (scales past client filtering). */
export async function searchDepartmentItems(
  departmentId: string,
  query: string,
  page = 0,
  pageSize = 50
): Promise<{ items: Item[]; hasMore: boolean }> {
  const supabase = await createClient();
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("department_items")
    .select(`item_id, ${ITEM_EMBED}`)
    .eq("department_id", departmentId)
    .is("deleted_at", null);

  const term = query.trim();
  if (term) {
    const escaped = term.replace(/[%_]/g, (m) => `\\${m}`);
    q = q.or(
      `code.ilike.%${escaped}%,name.ilike.%${escaped}%,barcode.ilike.%${escaped}%`,
      { foreignTable: "items" }
    );
  }

  const { data } = await q.order("added_at", { ascending: false }).range(from, to + 1);

  const rows = (data || [])
    .map((r) => normalizeItem(r.items as Item | Item[] | null))
    .filter((i): i is Item => Boolean(i && !i.deleted_at));

  const hasMore = rows.length > pageSize;
  return { items: rows.slice(0, pageSize), hasMore };
}

// ----------------------- Admin (cross-department) -----------------------

export async function getAdminPrescanItems(options?: {
  departmentId?: string;
  status?: "pending" | "scanned" | "cancelled";
}): Promise<{ items: PrescanItem[]; error: string | null }> {
  const supabase = await createServiceClient();
  let query = supabase
    .from("prescan_items")
    .select(`${PRESCAN_SELECT}, departments(name)`)
    .order("created_at", { ascending: false })
    .limit(500);

  const status = options?.status ?? "pending";
  query = query.eq("status", status);
  if (status === "pending") query = query.is("deleted_at", null);
  if (options?.departmentId) query = query.eq("department_id", options.departmentId);

  const { data, error } = await query;
  if (error) return { items: [], error: error.message };

  const items = await attachProfiles(
    supabase,
    (data || []) as RawPrescanRow[]
  );
  return { items, error: null };
}

export async function getAdminPrescanStats(): Promise<{
  pending: number;
  stale: number;
}> {
  const supabase = await createServiceClient();
  const staleBefore = new Date(
    Date.now() - PRESCAN_STALE_HOURS * 60 * 60 * 1000
  ).toISOString();

  const [{ count: pending }, { count: stale }] = await Promise.all([
    supabase
      .from("prescan_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .is("deleted_at", null),
    supabase
      .from("prescan_items")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .is("deleted_at", null)
      .lt("created_at", staleBefore),
  ]);

  return { pending: pending ?? 0, stale: stale ?? 0 };
}
