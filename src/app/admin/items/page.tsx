import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Department, Item, ItemGroup, ItemSubgroup } from "@/lib/types";
import { getItemDepartmentMap } from "@/lib/data/item-departments";
import { AdminItemsClient } from "./admin-items-client";

export default async function AdminItemsPage() {
  const supabase = await createClient();

  const [
    { data: items },
    { data: groups },
    { data: subgroups },
    { data: allGroups },
    { data: allSubgroups },
    { data: departments },
    deptMap,
  ] = await Promise.all([
    supabase
      .from("items")
      .select("*, item_subgroups(id, name, group_id, item_groups(name))")
      .order("code"),
    supabase
      .from("item_groups")
      .select("*")
      .is("deleted_at", null)
      .order("sort_order"),
    supabase
      .from("item_subgroups")
      .select("*")
      .is("deleted_at", null)
      .order("sort_order"),
    supabase.from("item_groups").select("*").order("sort_order"),
    supabase.from("item_subgroups").select("*").order("sort_order"),
    supabase
      .from("departments")
      .select("*")
      .is("deleted_at", null)
      .order("name"),
    getItemDepartmentMap(),
  ]);

  return (
    <Suspense fallback={<p className="text-sm text-slate-500">กำลังโหลด...</p>}>
      <AdminItemsClient
        items={(items || []) as Item[]}
        groups={(groups || []) as ItemGroup[]}
        subgroups={(subgroups || []) as ItemSubgroup[]}
        allGroups={(allGroups || []) as ItemGroup[]}
        allSubgroups={(allSubgroups || []) as ItemSubgroup[]}
        departments={(departments || []) as Department[]}
        itemDepartmentMap={deptMap}
      />
    </Suspense>
  );
}
