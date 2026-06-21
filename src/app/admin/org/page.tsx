import { createServiceClient } from "@/lib/supabase/server";
import { getUserDepartmentMap } from "@/lib/data/user-departments";
import { getRealProfile } from "@/lib/auth/session";
import type { Department, Profile } from "@/lib/types";
import { OrgClient } from "./org-client";

export default async function AdminOrgPage() {
  const supabase = await createServiceClient();
  const admin = await getRealProfile();

  const [{ data: users }, { data: departments }] = await Promise.all([
    supabase.from("profiles").select("*").order("username"),
    supabase.from("departments").select("*").order("name"),
  ]);

  const userList = (users || []) as Profile[];
  const userDepartmentMap = await getUserDepartmentMap(userList.map((u) => u.id));

  return (
    <OrgClient
      departments={(departments || []) as Department[]}
      users={userList}
      userDepartmentMap={userDepartmentMap}
      currentAdminId={admin?.id ?? null}
    />
  );
}
