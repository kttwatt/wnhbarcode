"use server";

import { revalidatePath } from "next/cache";
import { getActiveDepartmentId, getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { searchDepartmentItems } from "@/lib/data/prescan";
import type { Item } from "@/lib/types";

function revalidatePrescan() {
  revalidatePath("/dashboard/prescan");
  revalidatePath("/dashboard/scan");
  revalidatePath("/dashboard");
}

/** Note an item into the department-shared prescan list (atomic upsert via RPC). */
export async function addPrescanItem(itemId: string, qty = 1) {
  const profile = await getCurrentProfile();
  const departmentId = await getActiveDepartmentId();
  if (!profile || !departmentId) return { error: "ไม่พบแผนก" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("add_prescan_item", {
    p_department_id: departmentId,
    p_item_id: itemId,
    p_qty: Math.max(1, Math.floor(qty) || 1),
  });

  if (error) return { error: error.message };

  revalidatePrescan();
  return { success: true };
}

/** Increment / decrement quantity by a delta (stays >= 1 in the DB). */
export async function changePrescanQty(itemId: string, delta: number) {
  const profile = await getCurrentProfile();
  const departmentId = await getActiveDepartmentId();
  if (!profile || !departmentId) return { error: "ไม่พบแผนก" };

  const step = Math.trunc(delta) || 0;
  if (step === 0) return { success: true };

  const supabase = await createClient();
  const { error } = await supabase.rpc("add_prescan_item", {
    p_department_id: departmentId,
    p_item_id: itemId,
    p_qty: step,
  });

  if (error) return { error: error.message };

  revalidatePrescan();
  return { success: true };
}

/** Cancel (soft delete) a prescan row. */
export async function removePrescanItem(id: string) {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "ไม่พบผู้ใช้" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_prescan_item", { p_id: id });

  if (error) return { error: error.message };

  revalidatePrescan();
  revalidatePath("/admin/prescan");
  return { success: true };
}

/** Run the scanned-into-IPISS step: insert scan_logs + mark rows scanned (one tx). */
export async function completePrescanScan(ids: string[]) {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "ไม่พบผู้ใช้" };
  if (!ids.length) return { error: "ไม่มีรายการให้สแกน" };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("complete_prescan_scan", {
    p_ids: ids,
  });

  if (error) return { error: error.message };

  revalidatePrescan();
  return { success: true, scanned: (data as number) ?? 0 };
}

/** Server-side, paginated item search within the active department. */
export async function searchDeptItems(
  query: string,
  page = 0
): Promise<{ items: Item[]; hasMore: boolean }> {
  const departmentId = await getActiveDepartmentId();
  if (!departmentId) return { items: [], hasMore: false };
  return searchDepartmentItems(departmentId, query, page);
}
