"use server";

import { revalidatePath } from "next/cache";
import { getRealProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type AccountState = { error?: string; success?: string };

export async function updateProfileAction(
  _prev: AccountState,
  formData: FormData
): Promise<AccountState> {
  const profile = await getRealProfile();
  if (!profile) return { error: "ไม่พบผู้ใช้" };

  const fullName = String(formData.get("full_name") || "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", profile.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/account");
  revalidatePath("/dashboard");
  revalidatePath("/admin");
  return { success: "บันทึกโปรไฟล์เรียบร้อยแล้ว" };
}
