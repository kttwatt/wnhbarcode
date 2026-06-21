import { cache } from "react";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Department, Profile } from "@/lib/types";

export const getAllDepartments = cache(async (): Promise<Department[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("departments")
    .select("*")
    .is("deleted_at", null)
    .order("name");

  return (data || []) as Department[];
});

export const getAccessibleDepartments = cache(async (
  profile: Profile
): Promise<Department[]> => {
  if (profile.role === "admin") {
    return getAllDepartments();
  }
  return getUserDepartments(profile.id);
});

export const getUserDepartments = cache(async (userId: string): Promise<Department[]> => {
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("user_departments")
    .select("department_id, departments(*)")
    .eq("user_id", userId);

  const fromJoin = (rows || [])
    .map((row) => {
      const dept = row.departments;
      return dept && !Array.isArray(dept) ? (dept as Department) : null;
    })
    .filter(Boolean) as Department[];

  if (fromJoin.length > 0) {
    return fromJoin.sort((a, b) => a.name.localeCompare(b.name));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("department_id, departments(*)")
    .eq("id", userId)
    .single();

  const fallback = profile?.departments;
  if (fallback && !Array.isArray(fallback)) {
    return [fallback as Department];
  }

  return [];
});

export async function getUserDepartmentMap(
  userIds: string[]
): Promise<Record<string, string[]>> {
  if (userIds.length === 0) return {};

  const supabase = await createServiceClient();
  const { data: rows } = await supabase
    .from("user_departments")
    .select("user_id, department_id")
    .in("user_id", userIds);

  const map: Record<string, string[]> = {};
  for (const row of rows || []) {
    if (!map[row.user_id]) map[row.user_id] = [];
    map[row.user_id].push(row.department_id);
  }

  return map;
}

export async function syncUserDepartments(
  userId: string,
  departmentIds: string[],
  primaryDepartmentId: string | null
) {
  const supabase = await createServiceClient();
  const selected = new Set(departmentIds);

  if (primaryDepartmentId) {
    selected.add(primaryDepartmentId);
  }

  const { data: existing } = await supabase
    .from("user_departments")
    .select("id, department_id")
    .eq("user_id", userId);

  for (const row of existing || []) {
    if (!selected.has(row.department_id)) {
      await supabase.from("user_departments").delete().eq("id", row.id);
    } else {
      selected.delete(row.department_id);
    }
  }

  for (const departmentId of selected) {
    await supabase.from("user_departments").insert({
      user_id: userId,
      department_id: departmentId,
    });
  }
}
