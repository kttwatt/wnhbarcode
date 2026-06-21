"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  ACTIVE_DEPARTMENT_COOKIE,
  canAccessDepartment,
  getCurrentProfile,
} from "@/lib/auth/session";

export async function setActiveDepartmentAction(departmentId: string) {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "ไม่พบผู้ใช้" };

  if (!(await canAccessDepartment(profile, departmentId))) {
    return { error: "ไม่มีสิทธิ์เข้าถึงแผนกนี้" };
  }

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_DEPARTMENT_COOKIE, departmentId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  revalidatePath("/", "layout");
  return { success: true };
}
