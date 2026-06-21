import { redirect } from "next/navigation";
import { getActiveDepartmentId, getCurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { DepartmentItem, Item } from "@/lib/types";
import { ItemsClient } from "./items-client";

export default async function ItemsPage() {
  const profile = await getCurrentProfile();
  const departmentId = await getActiveDepartmentId();
  if (!profile) redirect("/login");
  if (!departmentId) return null;

  const supabase = await createClient();

  const [{ data: deptRows }, { data: masterItems }, { data: favRows }] =
    await Promise.all([
      supabase
        .from("department_items")
        .select("*, items(*, item_subgroups(id, name, group_id, item_groups(name)))")
        .eq("department_id", departmentId)
        .is("deleted_at", null)
        .order("added_at", { ascending: false }),
      supabase
        .from("items")
        .select("*, item_subgroups(id, name, group_id, item_groups(name))")
        .is("deleted_at", null)
        .order("code"),
      supabase
        .from("user_favorites")
        .select("item_id")
        .eq("user_id", profile.id)
        .eq("department_id", departmentId),
    ]);

  const deptItems = (deptRows || []) as (DepartmentItem & { items: Item })[];
  const favoriteIds = new Set((favRows || []).map((f) => f.item_id));

  return (
    <ItemsClient
      deptItems={deptItems}
      masterItems={(masterItems || []) as Item[]}
      favoriteIds={favoriteIds}
    />
  );
}
