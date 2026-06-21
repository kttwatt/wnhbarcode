"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SimpleState = { error?: string; success?: string };

export type CategoryFields = {
  name?: string;
  code?: string | null;
};

function normalizeCode(raw: FormDataEntryValue | null): string | null {
  const code = String(raw || "").trim();
  return code === "" ? null : code;
}

export async function createGroupAction(
  _prev: SimpleState,
  formData: FormData
): Promise<SimpleState> {
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "กรุณากรอกชื่อกลุ่มพัสดุ" };
  const code = normalizeCode(formData.get("code"));

  const supabase = await createClient();
  const { error } = await supabase.from("item_groups").insert({ name, code });
  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  return { success: "เพิ่มกลุ่มพัสดุแล้ว" };
}

export async function updateGroupAction(
  id: string,
  fields: CategoryFields
): Promise<SimpleState> {
  const payload: Record<string, unknown> = {};
  if (fields.name !== undefined) payload.name = fields.name;
  if (fields.code !== undefined) payload.code = fields.code || null;
  if (Object.keys(payload).length === 0) return {};

  const supabase = await createClient();
  const { error } = await supabase
    .from("item_groups")
    .update(payload)
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  return { success: "บันทึกแล้ว" };
}

export async function softDeleteGroup(id: string) {
  const supabase = await createClient();
  await supabase
    .from("item_groups")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/admin/categories");
}

export async function createSubgroupAction(
  groupId: string,
  _prev: SimpleState,
  formData: FormData
): Promise<SimpleState> {
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "กรุณากรอกชื่อกลุ่มย่อย" };
  const code = normalizeCode(formData.get("code"));

  const supabase = await createClient();
  const { error } = await supabase
    .from("item_subgroups")
    .insert({ group_id: groupId, name, code });
  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  return { success: "เพิ่มกลุ่มย่อยแล้ว" };
}

export async function updateSubgroupAction(
  id: string,
  fields: CategoryFields
): Promise<SimpleState> {
  const payload: Record<string, unknown> = {};
  if (fields.name !== undefined) payload.name = fields.name;
  if (fields.code !== undefined) payload.code = fields.code || null;
  if (Object.keys(payload).length === 0) return {};

  const supabase = await createClient();
  const { error } = await supabase
    .from("item_subgroups")
    .update(payload)
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  return { success: "บันทึกแล้ว" };
}

export async function softDeleteSubgroup(id: string) {
  const supabase = await createClient();
  await supabase
    .from("item_subgroups")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/admin/categories");
}
