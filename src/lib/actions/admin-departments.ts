"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export type SimpleState = { error?: string; success?: string };

export async function createDepartmentAction(
  _prev: SimpleState,
  formData: FormData
): Promise<SimpleState> {
  const name = String(formData.get("name") || "").trim();
  const code = String(formData.get("code") || "").trim() || null;
  if (!name) return { error: "กรุณากรอกชื่อแผนก" };

  const supabase = await createServiceClient();
  const { error } = await supabase.from("departments").insert({ name, code });
  if (error) return { error: error.message };

  revalidatePath("/admin/departments");
  return { success: "เพิ่มแผนกแล้ว" };
}

export async function updateDepartmentAction(
  id: string,
  name: string,
  code: string | null
) {
  const supabase = await createServiceClient();
  await supabase.from("departments").update({ name, code }).eq("id", id);
  revalidatePath("/admin/departments");
}

export async function softDeleteDepartment(id: string) {
  const supabase = await createServiceClient();
  await supabase
    .from("departments")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/admin/departments");
}
