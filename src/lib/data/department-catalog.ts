import { createClient } from "@/lib/supabase/server";

export type CatalogItem = {
  id: string;
  code: string;
  name: string;
  unit: string;
  barcode: string;
  updated_at: string;
  subgroup_id: string;
  groupName: string | null;
  groupSort: number;
  subgroupName: string | null;
  subgroupSort: number;
};

export type CatalogSection = {
  key: string;
  groupName: string | null;
  subgroupName: string | null;
  items: CatalogItem[];
};

type RawCatalogRow = {
  items:
    | {
        id: string;
        code: string;
        name: string;
        unit: string;
        barcode: string;
        updated_at: string;
        subgroup_id: string;
        deleted_at: string | null;
        item_subgroups: {
          name: string;
          sort_order: number;
          group_id: string;
          item_groups: { name: string; sort_order: number } | null;
        } | null;
      }
    | null;
};

const CATALOG_SELECT =
  "items(id, code, name, unit, barcode, updated_at, subgroup_id, deleted_at, item_subgroups(name, sort_order, group_id, item_groups(name, sort_order)))" as const;

export async function getDepartmentCatalog(departmentId: string): Promise<{
  items: CatalogItem[];
  sections: CatalogSection[];
  revisedAt: string | null;
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("department_items")
    .select(CATALOG_SELECT)
    .eq("department_id", departmentId)
    .is("deleted_at", null);

  if (error) {
    return { items: [], sections: [], revisedAt: null, error: error.message };
  }

  const items: CatalogItem[] = ((data || []) as unknown as RawCatalogRow[])
    .map((row) => {
      const item = row.items;
      if (!item || item.deleted_at) return null;
      const subgroup = item.item_subgroups;
      const group = subgroup?.item_groups ?? null;
      return {
        id: item.id,
        code: item.code,
        name: item.name,
        unit: item.unit,
        barcode: item.barcode,
        updated_at: item.updated_at,
        subgroup_id: item.subgroup_id,
        groupName: group?.name ?? null,
        groupSort: group?.sort_order ?? Number.MAX_SAFE_INTEGER,
        subgroupName: subgroup?.name ?? null,
        subgroupSort: subgroup?.sort_order ?? Number.MAX_SAFE_INTEGER,
      } satisfies CatalogItem;
    })
    .filter((item): item is CatalogItem => item !== null);

  items.sort(
    (a, b) =>
      a.groupSort - b.groupSort ||
      (a.groupName ?? "").localeCompare(b.groupName ?? "", "th") ||
      a.subgroupSort - b.subgroupSort ||
      (a.subgroupName ?? "").localeCompare(b.subgroupName ?? "", "th") ||
      a.code.localeCompare(b.code, "th")
  );

  const sections: CatalogSection[] = [];
  for (const item of items) {
    const key = `${item.subgroup_id}`;
    const last = sections[sections.length - 1];
    if (last && last.key === key) {
      last.items.push(item);
    } else {
      sections.push({
        key,
        groupName: item.groupName,
        subgroupName: item.subgroupName,
        items: [item],
      });
    }
  }

  const revisedAt =
    items.length > 0
      ? items.reduce(
          (latest, item) =>
            item.updated_at > latest ? item.updated_at : latest,
          items[0].updated_at
        )
      : null;

  return { items, sections, revisedAt, error: null };
}
