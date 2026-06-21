/** Fields loaded for scan/list views from public.items */
export const ITEM_LIST_FIELDS =
  "id, code, name, barcode, unit, price, subgroup_id, deleted_at" as const;

export const ITEM_EMBED = `items(${ITEM_LIST_FIELDS})` as const;
