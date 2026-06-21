"use server";

import { revalidatePath } from "next/cache";
import { getActiveDepartmentId, getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function addItemsToDepartment(itemIds: string[]) {
  const profile = await getCurrentProfile();
  const departmentId = await getActiveDepartmentId();
  if (!profile || !departmentId) return { error: "ไม่พบแผนก" };

  const supabase = await createClient();

  for (const itemId of itemIds) {
    const { data: existing } = await supabase
      .from("department_items")
      .select("id, deleted_at")
      .eq("department_id", departmentId)
      .eq("item_id", itemId)
      .maybeSingle();

    if (existing?.id && existing.deleted_at) {
      const { error } = await supabase
        .from("department_items")
        .update({
          deleted_at: null,
          added_by: profile.id,
          added_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      if (error) return { error: error.message };
    } else if (!existing) {
      const { error } = await supabase.from("department_items").insert({
        department_id: departmentId,
        item_id: itemId,
        added_by: profile.id,
      });
      if (error) return { error: error.message };
    }
  }

  revalidatePath("/dashboard/items");
  revalidatePath("/dashboard/scan");
  return { success: true };
}

export async function removeItemFromDepartment(deptItemId: string) {
  const profile = await getCurrentProfile();
  const departmentId = await getActiveDepartmentId();
  if (!profile || !departmentId) return { error: "ไม่พบแผนก" };

  const supabase = await createClient();
  const { data: deptItem } = await supabase
    .from("department_items")
    .select("item_id")
    .eq("id", deptItemId)
    .eq("department_id", departmentId)
    .maybeSingle();

  const { error } = await supabase
    .from("department_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", deptItemId)
    .eq("department_id", departmentId);

  if (error) return { error: error.message };

  if (deptItem?.item_id) {
    await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", profile.id)
      .eq("item_id", deptItem.item_id);
  }

  revalidatePath("/dashboard/items");
  revalidatePath("/dashboard/scan");
  return { success: true };
}
