import { createClient } from "@/lib/supabase/server";

export async function getItemDepartmentMap(): Promise<Record<string, string[]>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("department_items")
    .select("item_id, department_id")
    .is("deleted_at", null);

  const map: Record<string, string[]> = {};
  for (const row of data || []) {
    if (!map[row.item_id]) map[row.item_id] = [];
    map[row.item_id].push(row.department_id);
  }
  return map;
}
