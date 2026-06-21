"use server";

import { revalidatePath } from "next/cache";
import {
  getActiveDepartmentId,
  getCurrentProfile,
  getRealProfile,
} from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type ScanSource = "scanner" | "manual_confirm";

async function insertScanLogRecord(
  itemId: string,
  scannedBarcode: string,
  scanSource: ScanSource,
  qty = 1
) {
  const profile = await getCurrentProfile();
  const realProfile = await getRealProfile();
  const departmentId = await getActiveDepartmentId();
  if (!profile || !realProfile || !departmentId) {
    return { error: "ไม่พบแผนกของผู้ใช้" };
  }

  const count = Math.max(1, Math.floor(qty) || 1);
  const rows = Array.from({ length: count }, () => ({
    department_id: departmentId,
    item_id: itemId,
    user_id: realProfile.id,
    scanned_barcode: scannedBarcode.trim(),
    scan_source: scanSource,
  }));

  const supabase = await createClient();
  const { error } = await supabase.from("scan_logs").insert(rows);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/scan");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function insertScanLog(itemId: string, scannedBarcode: string) {
  return insertScanLogRecord(itemId, scannedBarcode, "scanner");
}

export async function confirmScanSuccess(itemId: string, barcode: string) {
  return insertScanLogRecord(itemId, barcode, "manual_confirm");
}

export async function confirmMultipleScanSuccess(
  items: { id: string; barcode: string; qty?: number }[]
) {
  for (const item of items) {
    const result = await insertScanLogRecord(
      item.id,
      item.barcode,
      "manual_confirm",
      item.qty ?? 1
    );
    if (result.error) return result;
  }
  return { success: true };
}
