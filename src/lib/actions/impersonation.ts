"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  ACTIVE_DEPARTMENT_COOKIE,
  IMPERSONATE_USER_COOKIE,
  getRealProfile,
} from "@/lib/auth/session";
import { createServiceClient } from "@/lib/supabase/server";

export async function startImpersonationAction(userId: string) {
  const admin = await getRealProfile();
  if (!admin || admin.role !== "admin") {
    return { error: "ไม่มีสิทธิ์" };
  }

  if (userId === admin.id) {
    return { error: "ไม่สามารถดูมุมมองของตัวเองได้" };
  }

  const supabase = await createServiceClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!target) return { error: "ไม่พบผู้ใช้" };

  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATE_USER_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  const departmentId = target.department_id;
  if (departmentId) {
    cookieStore.set(ACTIVE_DEPARTMENT_COOKIE, departmentId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
  } else {
    cookieStore.delete(ACTIVE_DEPARTMENT_COOKIE);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function stopImpersonationAction() {
  const admin = await getRealProfile();
  if (!admin || admin.role !== "admin") {
    return { error: "ไม่มีสิทธิ์" };
  }

  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATE_USER_COOKIE);
  cookieStore.delete(ACTIVE_DEPARTMENT_COOKIE);

  revalidatePath("/", "layout");
  redirect("/admin/users");
}
