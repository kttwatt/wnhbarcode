import { createClient } from "@/lib/supabase/server";
import type { Item } from "@/lib/types";

/**
 * Recent / frequent scan history is aggregated in Postgres (see migration 012)
 * instead of pulling every matching scan_logs row and reducing in JS. The RPCs
 * are `security invoker` and scope to the calling user via auth.uid(), which is
 * always the real authenticated user (matching the previous realProfile.id).
 */

export async function getRecentScannedItems(
  departmentId: string,
  limit = 8
): Promise<Item[]> {
  const supabase = await createClient();

  const { data } = await supabase.rpc("recent_scanned_items", {
    p_department_id: departmentId,
    p_limit: limit,
  });

  return (data || []) as Item[];
}

export async function getFrequentScannedItems(
  departmentId: string,
  limit = 8
): Promise<Item[]> {
  const supabase = await createClient();

  const { data } = await supabase.rpc("frequent_scanned_items", {
    p_department_id: departmentId,
    p_days: 30,
    p_limit: limit,
  });

  return (data || []) as Item[];
}
