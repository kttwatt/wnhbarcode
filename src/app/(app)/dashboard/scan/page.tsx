import { redirect } from "next/navigation";
import {
  getActiveDepartmentId,
  getCurrentProfile,
  getRealProfile,
} from "@/lib/auth/session";
import {
  getFrequentScannedItems,
  getRecentScannedItems,
} from "@/lib/data/scan-items";
import { getPrescanPendingCount } from "@/lib/data/prescan";
import { ITEM_EMBED } from "@/lib/data/item-fields";
import { createClient } from "@/lib/supabase/server";
import type { Item } from "@/lib/types";
import { ScanClient } from "./scan-client";

export default async function ScanPage() {
  const profile = await getCurrentProfile();
  const realProfile = await getRealProfile();
  const departmentId = await getActiveDepartmentId();
  if (!profile) redirect("/login");
  if (!departmentId || !realProfile) return null;

  const supabase = await createClient();

  const [
    { data: deptRows },
    { data: favRows },
    recentItems,
    frequentItems,
    prescanCount,
  ] = await Promise.all([
    supabase
      .from("department_items")
      .select(`item_id, ${ITEM_EMBED}`)
      .eq("department_id", departmentId)
      .is("deleted_at", null)
      .order("added_at", { ascending: false }),
    supabase
      .from("user_favorites")
      .select(`item_id, ${ITEM_EMBED}`)
      .eq("user_id", profile.id)
      .eq("department_id", departmentId)
      .order("sort_order"),
    getRecentScannedItems(departmentId),
    getFrequentScannedItems(departmentId),
    getPrescanPendingCount(departmentId),
  ]);

  const deptItems = (deptRows || [])
    .map((r) => {
      const item = r.items;
      return item && !Array.isArray(item) ? (item as Item) : null;
    })
    .filter(Boolean) as Item[];
  const visibleItemIds = new Set(deptItems.map((item) => item.id));

  const favorites = (favRows || [])
    .map((r) => {
      const item = r.items;
      return item && !Array.isArray(item) ? (item as Item) : null;
    })
    .filter((item): item is Item => Boolean(item && visibleItemIds.has(item.id)));

  const favoriteIds = new Set(favorites.map((i) => i.id));

  const filterVisible = (items: Item[]) =>
    items.filter((item) => visibleItemIds.has(item.id));

  return (
    <ScanClient
      key={departmentId}
      departmentId={departmentId}
      deptItems={deptItems}
      favorites={favorites}
      favoriteIds={favoriteIds}
      recentItems={filterVisible(recentItems)}
      frequentItems={filterVisible(frequentItems)}
      prescanCount={prescanCount}
    />
  );
}
