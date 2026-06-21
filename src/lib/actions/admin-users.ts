"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { syncUserDepartments } from "@/lib/data/user-departments";

export type SimpleState = { error?: string; success?: string };

function parseDepartmentIds(formData: FormData) {
  return formData
    .getAll("department_ids")
    .map((value) => String(value))
    .filter(Boolean);
}

export async function createUserAction(
  _prev: SimpleState,
  formData: FormData
): Promise<SimpleState> {
  const email = String(formData.get("email") || "").trim();
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("full_name") || "").trim() || null;
  const departmentIds = parseDepartmentIds(formData);
  const departmentId = departmentIds[0] || null;
  const role = String(formData.get("role") || "user");

  if (!email || !username || !password) {
    return { error: "กรุณากรอก email, username และ password" };
  }

  const supabase = await createServiceClient();
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError || !authData.user) {
    return { error: authError?.message || "สร้าง user ไม่สำเร็จ" };
  }

  const { error: profileError } = await supabase.from("profiles").insert({
    id: authData.user.id,
    email,
    username,
    full_name: fullName,
    department_id: departmentId,
    role,
  });

  if (profileError) {
    return { error: profileError.message };
  }

  await syncUserDepartments(authData.user.id, departmentIds, departmentId);

  revalidatePath("/admin/users");
  return { success: "สร้างผู้ใช้แล้ว" };
}

export async function updateUserAction(
  id: string,
  data: {
    full_name: string | null;
    department_id: string | null;
    department_ids?: string[];
    role: string;
    username: string;
  }
) {
  const supabase = await createServiceClient();
  const departmentIds = data.department_ids?.length
    ? data.department_ids
    : data.department_id
      ? [data.department_id]
      : [];

  await supabase
    .from("profiles")
    .update({
      username: data.username,
      full_name: data.full_name,
      department_id: data.department_id,
      role: data.role,
    })
    .eq("id", id);

  await syncUserDepartments(id, departmentIds, data.department_id);

  revalidatePath("/admin/users");
}
