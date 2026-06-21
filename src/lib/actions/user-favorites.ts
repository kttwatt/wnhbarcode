"use server";

import { revalidatePath } from "next/cache";
import { getActiveDepartmentId, getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function toggleFavorite(itemId: string) {
  const profile = await getCurrentProfile();
  const departmentId = await getActiveDepartmentId();
  if (!profile || !departmentId) return { error: "ไม่พบแผนก" };

  const supabase = await createClient();
  const { data: deptItem } = await supabase
    .from("department_items")
    .select("id")
    .eq("department_id", departmentId)
    .eq("item_id", itemId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!deptItem) return { error: "รายการนี้ไม่ได้อยู่ในแผนก" };

  const { data: existing } = await supabase
    .from("user_favorites")
    .select("id")
    .eq("user_id", profile.id)
    .eq("item_id", itemId)
    .maybeSingle();

  if (existing?.id) {
    await supabase.from("user_favorites").delete().eq("id", existing.id);
  } else {
    await supabase.from("user_favorites").insert({
      user_id: profile.id,
      item_id: itemId,
      department_id: departmentId,
    });
  }

  revalidatePath("/dashboard/scan");
  revalidatePath("/dashboard/items");
  return { success: true };
}
