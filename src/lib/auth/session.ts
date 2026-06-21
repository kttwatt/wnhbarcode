import { cache } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  getAccessibleDepartments,
  getUserDepartments,
} from "@/lib/data/user-departments";
import type { Department, Profile } from "@/lib/types";

export const ACTIVE_DEPARTMENT_COOKIE = "active_department_id";
export const IMPERSONATE_USER_COOKIE = "impersonate_user_id";

// Memoized per request so the (often repeated) auth.getUser() + profiles
// lookup runs once across the layout, page, and any server action.
const getAuthProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return data as Profile | null;
});

export const getRealProfile = cache(async (): Promise<Profile | null> => {
  return getAuthProfile();
});

export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const real = await getAuthProfile();
  if (!real) return null;

  const cookieStore = await cookies();
  const impersonateId = cookieStore.get(IMPERSONATE_USER_COOKIE)?.value;

  if (
    impersonateId &&
    real.role === "admin" &&
    impersonateId !== real.id
  ) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", impersonateId)
      .single();

    if (data) return data as Profile;
  }

  return real;
});

export const isImpersonating = cache(async (): Promise<boolean> => {
  const real = await getRealProfile();
  const current = await getCurrentProfile();
  return Boolean(real && current && real.id !== current.id);
});

export { getUserDepartments, getAccessibleDepartments };

export const getActiveDepartmentId = cache(async (): Promise<string | null> => {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const departments = await getAccessibleDepartments(profile);
  if (departments.length === 0) {
    return profile.department_id;
  }

  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(ACTIVE_DEPARTMENT_COOKIE)?.value;
  if (fromCookie && departments.some((d) => d.id === fromCookie)) {
    return fromCookie;
  }

  if (
    profile.department_id &&
    departments.some((d) => d.id === profile.department_id)
  ) {
    return profile.department_id;
  }

  return departments[0]?.id ?? null;
});

export const getActiveDepartment = cache(async (): Promise<Department | null> => {
  const departmentId = await getActiveDepartmentId();
  if (!departmentId) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("departments")
    .select("*")
    .eq("id", departmentId)
    .single();

  return data as Department | null;
});

export async function getCurrentDepartment() {
  return getActiveDepartment();
}

export async function canAccessDepartment(
  profile: Profile,
  departmentId: string
): Promise<boolean> {
  const departments = await getAccessibleDepartments(profile);
  return departments.some((d) => d.id === departmentId);
}
