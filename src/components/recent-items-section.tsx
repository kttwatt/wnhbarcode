"use client";

import type { Item } from "@/lib/types";

export function RecentItemsSection({
  recentItems,
  frequentItems,
  onSelect,
}: {
  recentItems: Item[];
  frequentItems: Item[];
  onSelect: (item: Item) => void;
}) {
  if (recentItems.length === 0 && frequentItems.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {recentItems.length > 0 && (
        <ItemChipGroup
          title="รายการล่าสุด"
          items={recentItems}
          onSelect={onSelect}
        />
      )}
      {frequentItems.length > 0 && (
        <ItemChipGroup
          title="ใช้บ่อย"
          items={frequentItems}
          onSelect={onSelect}
        />
      )}
    </div>
  );
}

function ItemChipGroup({
  title,
  items,
  onSelect,
}: {
  title: string;
  items: Item[];
  onSelect: (item: Item) => void;
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-slate-700">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item)}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-800 hover:bg-teal-50 hover:border-teal-200"
          >
            {item.code} — {item.name}
          </button>
        ))}
      </div>
    </div>
  );
}
