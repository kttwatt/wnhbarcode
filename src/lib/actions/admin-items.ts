"use server";

import { revalidatePath } from "next/cache";
import { generateBarcodeValue, isCode128Compatible } from "@/lib/barcode";
import { getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type ItemFormState = { error?: string; success?: string };

function parseDepartmentIds(formData: FormData): string[] {
  return formData
    .getAll("department_ids")
    .map((v) => String(v))
    .filter(Boolean);
}

async function syncItemDepartments(
  itemId: string,
  departmentIds: string[],
  addedBy: string | null
) {
  const supabase = await createClient();
  const selected = new Set(departmentIds);

  const { data: existing } = await supabase
    .from("department_items")
    .select("id, department_id, deleted_at")
    .eq("item_id", itemId);

  for (const row of existing || []) {
    if (selected.has(row.department_id)) {
      if (row.deleted_at) {
        const { error } = await supabase
          .from("department_items")
          .update({
            deleted_at: null,
            added_by: addedBy,
            added_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        if (error) return error.message;
      }
      selected.delete(row.department_id);
    } else if (!row.deleted_at) {
      const { error } = await supabase
        .from("department_items")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", row.id);
      if (error) return error.message;
    }
  }

  for (const departmentId of selected) {
    const { error } = await supabase.from("department_items").insert({
      department_id: departmentId,
      item_id: itemId,
      added_by: addedBy,
    });
    if (error) return error.message;
  }
}

export async function createItemAction(
  _prev: ItemFormState,
  formData: FormData
): Promise<ItemFormState> {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") return { error: "ไม่มีสิทธิ์" };

  const code = String(formData.get("code") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const unit = String(formData.get("unit") || "").trim();
  const price = Number(formData.get("price") || 0);
  const subgroupId = String(formData.get("subgroup_id") || "");
  const departmentIds = parseDepartmentIds(formData);

  if (!code || !name || !unit || !subgroupId) {
    return { error: "กรุณากรอกข้อมูลให้ครบ" };
  }
  if (!isCode128Compatible(code)) {
    return { error: "รหัสต้องเป็นตัวอักษร ASCII ที่รองรับ Code 128" };
  }

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("items")
    .insert({
      code,
      name,
      unit,
      price,
      barcode: generateBarcodeValue(code),
      subgroup_id: subgroupId,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (departmentIds.length > 0) {
    const syncError = await syncItemDepartments(created.id, departmentIds, profile.id);
    if (syncError) return { error: syncError };
  }

  revalidatePath("/admin/items");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { success: "บันทึกรายการแล้ว" };
}

export async function updateItemAction(
  id: string,
  _prev: ItemFormState,
  formData: FormData
): Promise<ItemFormState> {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") return { error: "ไม่มีสิทธิ์" };

  const code = String(formData.get("code") || "").trim();
  const name = String(formData.get("name") || "").trim();
  const unit = String(formData.get("unit") || "").trim();
  const price = Number(formData.get("price") || 0);
  const subgroupId = String(formData.get("subgroup_id") || "");
  const departmentIds = parseDepartmentIds(formData);

  if (!code || !name || !unit || !subgroupId) {
    return { error: "กรุณากรอกข้อมูลให้ครบ" };
  }
  if (!isCode128Compatible(code)) {
    return { error: "รหัสต้องเป็นตัวอักษร ASCII ที่รองรับ Code 128" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .update({
      code,
      name,
      unit,
      price,
      barcode: generateBarcodeValue(code),
      subgroup_id: subgroupId,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  const syncError = await syncItemDepartments(id, departmentIds, profile.id);
  if (syncError) return { error: syncError };

  revalidatePath("/admin/items");
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { success: "อัปเดตแล้ว" };
}

export async function softDeleteItem(id: string) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") return { error: "ไม่มีสิทธิ์" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/items");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/items");
  revalidatePath("/dashboard/scan");
  return { success: true };
}

export async function restoreItem(id: string) {
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") return { error: "ไม่มีสิทธิ์" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .update({ deleted_at: null })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/items");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/items");
  revalidatePath("/dashboard/scan");
  return { success: true };
}
